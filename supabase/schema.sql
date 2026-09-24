-- Vioscribe Phase 1 schema
-- Paste this into the Supabase SQL Editor (Dashboard → SQL Editor → New query) and run it once.
-- It creates tables, Row Level Security, and a trigger that makes a profile + notes row on signup.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Student',
  friend_code text not null unique,
  -- Daily study goal (number of card reviews) and streak tracking
  daily_goal int not null default 10,
  reviews_today int not null default 0,
  reviews_date date,
  current_streak int not null default 0,
  last_goal_date date,
  created_at timestamptz not null default now()
);

create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  is_shareable boolean not null default false,
  share_slug text unique,
  created_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  front text not null default '',
  back text not null default '',
  -- Simple spaced repetition: minutes until the next review
  interval_minutes int not null default 0,
  next_review_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- A friend-code submission is pending until the recipient accepts it.
create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (sender_id, recipient_id),
  check (sender_id <> recipient_id)
);
create index friend_requests_recipient_pending_idx
  on public.friend_requests (recipient_id, created_at desc)
  where accepted_at is null;

-- One row per submitted card review; weekly totals are computed from timestamps.
create table public.study_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  reviewed_at timestamptz not null default now()
);
create index study_reviews_user_week_idx on public.study_reviews (user_id, reviewed_at desc);

-- One notes document per user (HTML from the editor)
create table public.notes (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Friend codes (8 uppercase hex characters)
-- ---------------------------------------------------------------------------

create or replace function public.random_friend_code()
returns text
language plpgsql
as $$
declare
  code text;
  taken boolean;
begin
  loop
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    select exists(select 1 from public.profiles where friend_code = code) into taken;
    exit when not taken;
  end loop;
  return code;
end;
$$;

-- Runs after a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, friend_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Student'),
    public.random_friend_code()
  );

  insert into public.notes (user_id, content)
  values (new.id, '');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security — each user only sees their own rows
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.notes enable row level security;
alter table public.friend_requests enable row level security;
alter table public.study_reviews enable row level security;

-- Table grants let signed-in clients issue queries; RLS below limits which rows
-- those queries can read or change.
grant select, insert, update, delete on public.profiles, public.decks, public.cards, public.notes to authenticated;
grant select on public.friend_requests to authenticated;
grant select, insert on public.study_reviews to authenticated;

-- Profiles: each signed-in user can only access their own profile row.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (id = (select auth.uid()));

-- Decks: the owner id must match the authenticated user for every operation.
create policy "decks_select_own" on public.decks
  for select to authenticated using (user_id = (select auth.uid()));
create policy "decks_insert_own" on public.decks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "decks_update_own" on public.decks
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "decks_delete_own" on public.decks
  for delete to authenticated using (user_id = (select auth.uid()));
create policy "decks_select_shared" on public.decks
  for select to anon, authenticated
  using (is_shareable and share_slug is not null);

-- Cards: all operations require ownership of the card's parent deck.
create policy "cards_select_via_own_decks" on public.cards
  for select to authenticated using (
    exists (select 1 from public.decks d where d.id = cards.deck_id and d.user_id = (select auth.uid()))
  );
create policy "cards_insert_via_own_decks" on public.cards
  for insert to authenticated with check (
    exists (select 1 from public.decks d where d.id = cards.deck_id and d.user_id = (select auth.uid()))
  );
create policy "cards_update_via_own_decks" on public.cards
  for update to authenticated using (
    exists (select 1 from public.decks d where d.id = cards.deck_id and d.user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.decks d where d.id = cards.deck_id and d.user_id = (select auth.uid()))
  );
create policy "cards_delete_via_own_decks" on public.cards
  for delete to authenticated using (
    exists (select 1 from public.decks d where d.id = cards.deck_id and d.user_id = (select auth.uid()))
  );
create policy "cards_select_in_shared_decks" on public.cards
  for select to anon, authenticated using (
    exists (
      select 1 from public.decks d
      where d.id = cards.deck_id and d.is_shareable and d.share_slug is not null
    )
  );

-- Notes: each user has one notes row, keyed by their auth id.
create policy "notes_select_own" on public.notes
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notes_insert_own" on public.notes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "notes_update_own" on public.notes
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "notes_delete_own" on public.notes
  for delete to authenticated using (user_id = (select auth.uid()));

-- Requests are visible only to their sender and recipient. Writes go through
-- security-definer functions that enforce the request state transitions.
create policy "friend_requests_select_participant" on public.friend_requests
  for select to authenticated using (
    sender_id = (select auth.uid()) or recipient_id = (select auth.uid())
  );

-- Reviews are private to the reviewer and their friends. Users may only add
-- reviews for cards in their own decks; there are no update/delete grants.
create policy "study_reviews_select_self_or_friend" on public.study_reviews
  for select to authenticated using (
    user_id = (select auth.uid()) or exists (
      select 1 from public.friend_requests f
      where f.accepted_at is not null and
        ((f.sender_id = (select auth.uid()) and f.recipient_id = study_reviews.user_id)
         or (f.recipient_id = (select auth.uid()) and f.sender_id = study_reviews.user_id))
    )
  );
create policy "study_reviews_insert_own_card" on public.study_reviews
  for insert to authenticated with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.cards c
      join public.decks d on d.id = c.deck_id
      where c.id = study_reviews.card_id and d.user_id = (select auth.uid())
    )
  );

-- Submitting a valid code creates a pending request. The recipient accepts or
-- declines it through respond_to_friend_request below.
create or replace function public.add_friend_by_code(target_code text)
returns table(request_id uuid, friend_id uuid, friend_display_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_id uuid;
  target_name text;
  new_request_id uuid;
begin
  if actor_id is null then
    raise exception 'Sign in to add a friend';
  end if;

  select p.id, p.display_name into target_id, target_name
  from public.profiles p
  where p.friend_code = upper(trim(target_code));

  if target_id is null then
    raise exception 'Friend code not found';
  end if;
  if target_id = actor_id then
    raise exception 'You cannot add your own friend code';
  end if;

  if exists (
    select 1 from public.friend_requests f
    where f.accepted_at is not null
      and ((f.sender_id = actor_id and f.recipient_id = target_id)
        or (f.recipient_id = actor_id and f.sender_id = target_id))
  ) then
    raise exception 'You are already friends';
  end if;

  if exists (
    select 1 from public.friend_requests f
    where f.accepted_at is null
      and ((f.sender_id = actor_id and f.recipient_id = target_id)
        or (f.sender_id = target_id and f.recipient_id = actor_id))
  ) then
    raise exception 'A friend request is already pending';
  end if;

  insert into public.friend_requests (sender_id, recipient_id)
  values (actor_id, target_id)
  returning id into new_request_id;

  return query select new_request_id, target_id, target_name;
end;
$$;
revoke all on function public.add_friend_by_code(text) from public, anon;
grant execute on function public.add_friend_by_code(text) to authenticated;

create or replace function public.respond_to_friend_request(request_id uuid, accept_request boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to respond to a friend request';
  end if;

  if accept_request then
    update public.friend_requests f
    set accepted_at = now()
    where f.id = request_id
      and f.recipient_id = auth.uid()
      and f.accepted_at is null;
  else
    delete from public.friend_requests f
    where f.id = request_id
      and f.recipient_id = auth.uid()
      and f.accepted_at is null;
  end if;

  if not found then
    raise exception 'This request is unavailable';
  end if;
end;
$$;
revoke all on function public.respond_to_friend_request(uuid, boolean) from public, anon;
grant execute on function public.respond_to_friend_request(uuid, boolean) to authenticated;

create or replace function public.list_friends()
returns table(friend_id uuid, display_name text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.display_name
  from public.friend_requests f
  join public.profiles p
    on p.id = case when f.sender_id = auth.uid() then f.recipient_id else f.sender_id end
  where f.accepted_at is not null
    and (f.sender_id = auth.uid() or f.recipient_id = auth.uid())
  order by p.display_name;
$$;
revoke all on function public.list_friends() from public, anon;
grant execute on function public.list_friends() to authenticated;

create or replace function public.list_friend_requests()
returns table(request_id uuid, direction text, friend_id uuid, display_name text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select f.id, 'incoming'::text, p.id, p.display_name, f.created_at
  from public.friend_requests f
  join public.profiles p on p.id = f.sender_id
  where f.recipient_id = auth.uid() and f.accepted_at is null
  union all
  select f.id, 'outgoing'::text, p.id, p.display_name, f.created_at
  from public.friend_requests f
  join public.profiles p on p.id = f.recipient_id
  where f.sender_id = auth.uid() and f.accepted_at is null
  order by created_at desc;
$$;
revoke all on function public.list_friend_requests() from public, anon;
grant execute on function public.list_friend_requests() to authenticated;

-- Return only the signed-in user and their friends, ranked by UTC week reviews.
create or replace function public.weekly_friends_leaderboard()
returns table(user_id uuid, display_name text, cards_reviewed bigint)
language sql
stable
security definer
set search_path = public
as $$
  with visible_users as (
    select auth.uid() as id
    union
    select case when f.sender_id = auth.uid() then f.recipient_id else f.sender_id end
    from public.friend_requests f
    where f.accepted_at is not null
      and (f.sender_id = auth.uid() or f.recipient_id = auth.uid())
  )
  select p.id, p.display_name, count(r.id) as cards_reviewed
  from visible_users v
  join public.profiles p on p.id = v.id
  left join public.study_reviews r
    on r.user_id = p.id
   and r.reviewed_at >= date_trunc('week', now() at time zone 'utc') at time zone 'utc'
  group by p.id, p.display_name
  order by count(r.id) desc, p.display_name asc;
$$;
revoke all on function public.weekly_friends_leaderboard() from public, anon;
grant execute on function public.weekly_friends_leaderboard() to authenticated;


-- Anonymous users can read only public deck fields and cards allowed by RLS.
grant select (id, title, is_shareable, share_slug) on public.decks to anon;
grant select on public.cards to anon;

-- Copy a public deck and its cards atomically for the authenticated visitor.
create or replace function public.copy_shared_deck(source_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  source_deck public.decks%rowtype;
  copied_deck_id uuid;
begin
  if actor_id is null then
    raise exception 'Sign in to save a copy of this deck';
  end if;

  select * into source_deck
  from public.decks d
  where d.share_slug = source_slug and d.is_shareable;

  if not found then
    raise exception 'This shared deck is unavailable';
  end if;

  insert into public.decks (user_id, title)
  values (actor_id, source_deck.title || ' (copy)')
  returning id into copied_deck_id;

  insert into public.cards (deck_id, front, back)
  select copied_deck_id, c.front, c.back
  from public.cards c
  where c.deck_id = source_deck.id
  order by c.created_at;

  return copied_deck_id;
end;
$$;

revoke all on function public.copy_shared_deck(text) from public, anon;
grant execute on function public.copy_shared_deck(text) to authenticated;
