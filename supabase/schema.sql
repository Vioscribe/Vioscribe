-- Complete Vioscribe schema for a fresh Supabase project.
-- For an existing project, apply the ordered files in supabase/migrations instead.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
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
declare
  adjectives text[] := array[
    'Amber', 'Bright', 'Calm', 'Clever', 'Cozy', 'Daring', 'Golden', 'Kind',
    'Lucky', 'Mellow', 'Misty', 'Quiet', 'Swift', 'Toasty', 'Warm', 'Witty'
  ];
  nouns text[] := array[
    'Badger', 'Cedar', 'Comet', 'Cricket', 'Ember', 'Falcon', 'Fern', 'Fox',
    'Heron', 'Lynx', 'Maple', 'Moth', 'Otter', 'Pine', 'Robin', 'Sparrow'
  ];
  new_friend_code text;
  generated_name text;
  suffix_alphabet constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  suffix_position int;
begin
  new_friend_code := public.random_friend_code();
  loop
    generated_name := adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
      || '-' || nouns[1 + floor(random() * array_length(nouns, 1))::int] || '-';
    for suffix_position in 1..4 loop
      generated_name := generated_name || substr(
        suffix_alphabet,
        1 + floor(random() * length(suffix_alphabet))::int,
        1
      );
    end loop;
    exit when not exists (
      select 1 from public.profiles where display_name = generated_name
    );
  end loop;

  insert into public.profiles (id, display_name, friend_code)
  values (
    new.id,
    generated_name,
    new_friend_code
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
grant select on public.profiles to authenticated;
grant update (daily_goal, reviews_today, reviews_date, current_streak, last_goal_date)
  on public.profiles to authenticated;
grant select, insert, update, delete on public.decks, public.cards, public.notes to authenticated;
grant select on public.friend_requests to authenticated;
grant select, insert on public.study_reviews to authenticated;

-- Profiles: each signed-in user can only access their own profile row.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

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
-- Personal Pomodoro timers, room presence/leaderboards, and study activity.

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  timer_state text not null default 'paused' check (timer_state in ('paused', 'running', 'on_break')),
  classroom_size_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz
);
create unique index if not exists room_members_one_active_membership
  on public.room_members (room_id, user_id) where left_at is null;
create index if not exists room_members_room_active_idx
  on public.room_members (room_id, joined_at) where left_at is null;

create table if not exists public.personal_timers (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete set null,
  timer_state text not null default 'paused' check (timer_state in ('paused', 'running', 'on_break')),
  timer_phase text not null default 'study' check (timer_phase in ('study', 'break')),
  ends_at timestamptz,
  seconds_left integer not null default 1500 check (seconds_left between 0 and 1500),
  phase_started_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  created_at timestamptz not null default now()
);
create index if not exists study_sessions_user_started_idx on public.study_sessions (user_id, started_at desc);
create index if not exists study_sessions_room_started_idx on public.study_sessions (room_id, started_at desc);

alter table public.study_reviews add column if not exists room_id uuid
  references public.rooms (id) on delete set null;

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.personal_timers enable row level security;
alter table public.study_sessions enable row level security;
grant select on public.rooms, public.room_members, public.personal_timers, public.study_sessions to authenticated;
revoke insert, update, delete on public.rooms, public.room_members, public.personal_timers, public.study_sessions from anon, authenticated;

create or replace function public.can_access_room(target_room_id uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select target_room_id is not null and (
    exists (select 1 from public.rooms r where r.id = target_room_id and r.owner_id = auth.uid())
    or exists (select 1 from public.room_members m where m.room_id = target_room_id and m.user_id = auth.uid() and m.left_at is null)
  );
$$;
revoke all on function public.can_access_room(uuid) from public, anon;
grant execute on function public.can_access_room(uuid) to authenticated;

drop policy if exists "rooms_select_members" on public.rooms;
create policy "rooms_select_members" on public.rooms
  for select to authenticated using (public.can_access_room(id));
drop policy if exists "room_members_select_room_participants" on public.room_members;
create policy "room_members_select_room_participants" on public.room_members
  for select to authenticated using (user_id = (select auth.uid()) or public.can_access_room(room_id));
drop policy if exists "personal_timers_select_own" on public.personal_timers;
create policy "personal_timers_select_own" on public.personal_timers
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "study_sessions_select_owner_or_room" on public.study_sessions;
create policy "study_sessions_select_owner_or_room" on public.study_sessions
  for select to authenticated using (user_id = (select auth.uid()) or (room_id is not null and public.can_access_room(room_id)));

drop policy if exists "study_reviews_insert_own_card" on public.study_reviews;
create policy "study_reviews_insert_own_card" on public.study_reviews
  for insert to authenticated with check (
    user_id = (select auth.uid()) and (room_id is null or public.can_access_room(room_id))
    and exists (
      select 1 from public.cards c join public.decks d on d.id = c.deck_id
      where c.id = study_reviews.card_id and d.user_id = (select auth.uid())
    )
  );
drop policy if exists "study_reviews_select_room_members" on public.study_reviews;
create policy "study_reviews_select_room_members" on public.study_reviews
  for select to authenticated using (room_id is not null and public.can_access_room(room_id));

-- Private Realtime Presence is allowed only for current room participants and the owner.
drop policy if exists "room_presence_read_members" on realtime.messages;
create policy "room_presence_read_members" on realtime.messages
  for select to authenticated using (
    extension = 'presence' and exists (
      select 1 from public.rooms r where (select realtime.topic()) = 'room:' || r.id::text
        and public.can_access_room(r.id)
    )
  );
drop policy if exists "room_presence_write_members" on realtime.messages;
create policy "room_presence_write_members" on realtime.messages
  for insert to authenticated with check (
    extension = 'presence' and exists (
      select 1 from public.rooms r where (select realtime.topic()) = 'room:' || r.id::text
        and public.can_access_room(r.id)
    )
  );

create or replace function public.create_study_room()
returns table(room_id uuid, code text)
language plpgsql security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  new_room_id uuid;
  new_code text;
begin
  if actor_id is null then raise exception 'Sign in to create a room'; end if;
  loop
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      insert into public.rooms (code, owner_id) values (new_code, actor_id)
      returning id into new_room_id;
      exit;
    exception when unique_violation then
      null; -- Retry if a short code is already in use.
    end;
  end loop;
  insert into public.room_members (room_id, user_id) values (new_room_id, actor_id);
  return query select new_room_id, new_code;
end;
$$;
revoke all on function public.create_study_room() from public, anon;
grant execute on function public.create_study_room() to authenticated;

create or replace function public.join_study_room(room_code text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_id uuid;
  member_count integer;
begin
  if actor_id is null then raise exception 'Sign in to join a room'; end if;
  select r.id into target_id from public.rooms r
  where r.code = upper(trim($1)) for update;
  if target_id is null then raise exception 'Room code not found'; end if;

  if exists (select 1 from public.room_members m where m.room_id = target_id and m.user_id = actor_id and m.left_at is null) then
    return target_id;
  end if;
  select count(*) into member_count from public.room_members m
  where m.room_id = target_id and m.left_at is null;
  if member_count >= 4 then raise exception 'This room is full (4 people maximum)'; end if;
  insert into public.room_members (room_id, user_id) values (target_id, actor_id);
  return target_id;
end;
$$;
revoke all on function public.join_study_room(text) from public, anon;
grant execute on function public.join_study_room(text) to authenticated;

create or replace function public.leave_study_room(target_room_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Sign in to leave a room'; end if;
  update public.room_members set left_at = now()
  where room_id = target_room_id and user_id = auth.uid() and left_at is null;
  if not found then raise exception 'You are not currently in this room'; end if;
end;
$$;
revoke all on function public.leave_study_room(uuid) from public, anon;
grant execute on function public.leave_study_room(uuid) to authenticated;

create or replace function public.start_personal_timer(target_room_id uuid default null)
returns public.personal_timers
language plpgsql security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  timer public.personal_timers%rowtype;
  next_state text;
begin
  if actor_id is null then raise exception 'Sign in to use the study timer'; end if;
  if target_room_id is not null and not public.can_access_room(target_room_id) then
    raise exception 'Join this room before logging room study time';
  end if;
  insert into public.personal_timers (user_id) values (actor_id) on conflict (user_id) do nothing;
  select * into timer from public.personal_timers where user_id = actor_id for update;
  if timer.timer_state <> 'paused' then return timer; end if;

  next_state := case when timer.timer_phase = 'break' then 'on_break' else 'running' end;
  update public.personal_timers
  set room_id = target_room_id,
      timer_state = next_state,
      ends_at = now() + make_interval(secs => seconds_left),
      phase_started_at = now(),
      updated_at = now()
  where user_id = actor_id
  returning * into timer;
  return timer;
end;
$$;
revoke all on function public.start_personal_timer(uuid) from public, anon;
grant execute on function public.start_personal_timer(uuid) to authenticated;

create or replace function public.pause_personal_timer()
returns public.personal_timers
language plpgsql security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  timer public.personal_timers%rowtype;
  end_time timestamptz;
  seconds_run integer;
begin
  if actor_id is null then raise exception 'Sign in to use the study timer'; end if;
  insert into public.personal_timers (user_id) values (actor_id) on conflict (user_id) do nothing;
  select * into timer from public.personal_timers where user_id = actor_id for update;
  if timer.timer_state = 'paused' then return timer; end if;

  if timer.ends_at <= now() then
    if timer.timer_phase = 'study' then
      seconds_run := greatest(0, floor(extract(epoch from (timer.ends_at - timer.phase_started_at)))::integer);
      if seconds_run > 0 then
        insert into public.study_sessions (user_id, room_id, started_at, ended_at, duration_seconds)
        values (actor_id, timer.room_id, timer.phase_started_at, timer.ends_at, seconds_run);
      end if;
      update public.personal_timers
      set timer_phase = 'break', timer_state = 'paused', seconds_left = 300,
          ends_at = null, phase_started_at = null, updated_at = now()
      where user_id = actor_id returning * into timer;
    else
      update public.personal_timers
      set timer_phase = 'study', timer_state = 'paused', seconds_left = 1500,
          ends_at = null, phase_started_at = null, updated_at = now()
      where user_id = actor_id returning * into timer;
    end if;
    return timer;
  end if;

  end_time := least(now(), timer.ends_at);
  seconds_run := greatest(0, floor(extract(epoch from (end_time - timer.phase_started_at)))::integer);
  if timer.timer_phase = 'study' and seconds_run > 0 then
    insert into public.study_sessions (user_id, room_id, started_at, ended_at, duration_seconds)
    values (actor_id, timer.room_id, timer.phase_started_at, end_time, seconds_run);
  end if;
  update public.personal_timers
  set timer_state = 'paused',
      seconds_left = greatest(0, ceil(extract(epoch from (timer.ends_at - now())))::integer),
      ends_at = null, phase_started_at = null, updated_at = now()
  where user_id = actor_id returning * into timer;
  return timer;
end;
$$;
revoke all on function public.pause_personal_timer() from public, anon;
grant execute on function public.pause_personal_timer() to authenticated;

create or replace function public.advance_personal_timer()
returns public.personal_timers
language plpgsql security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  timer public.personal_timers%rowtype;
  seconds_run integer;
begin
  if actor_id is null then raise exception 'Sign in to use the study timer'; end if;
  insert into public.personal_timers (user_id) values (actor_id) on conflict (user_id) do nothing;
  select * into timer from public.personal_timers where user_id = actor_id for update;
  if timer.timer_state = 'paused' or timer.ends_at is null or timer.ends_at > now() then return timer; end if;

  if timer.timer_phase = 'study' then
    seconds_run := greatest(0, floor(extract(epoch from (timer.ends_at - timer.phase_started_at)))::integer);
    if seconds_run > 0 then
      insert into public.study_sessions (user_id, room_id, started_at, ended_at, duration_seconds)
      values (actor_id, timer.room_id, timer.phase_started_at, timer.ends_at, seconds_run);
    end if;
    update public.personal_timers
    set timer_phase = 'break', timer_state = 'paused', seconds_left = 300,
        ends_at = null, phase_started_at = null, updated_at = now()
    where user_id = actor_id returning * into timer;
  else
    update public.personal_timers
    set timer_phase = 'study', timer_state = 'paused', seconds_left = 1500,
        ends_at = null, phase_started_at = null, updated_at = now()
    where user_id = actor_id returning * into timer;
  end if;
  return timer;
end;
$$;
revoke all on function public.advance_personal_timer() from public, anon;
grant execute on function public.advance_personal_timer() to authenticated;

create or replace function public.room_leaderboard(target_room_id uuid)
returns table(user_id uuid, display_name text, minutes_studied bigint, cards_reviewed bigint)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.can_access_room(target_room_id) then
    raise exception 'Join this room to view its leaderboard';
  end if;
  return query
  with members as (
    select distinct m.user_id from public.room_members m where m.room_id = target_room_id
  ), minutes as (
    select s.user_id, floor(sum(s.duration_seconds)::numeric / 60)::bigint as value
    from public.study_sessions s
    where s.room_id = target_room_id
      and s.started_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
    group by s.user_id
  ), cards as (
    select r.user_id, count(*)::bigint as value
    from public.study_reviews r
    where r.room_id = target_room_id
      and r.reviewed_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
    group by r.user_id
  )
  select m.user_id, p.display_name, coalesce(mi.value, 0), coalesce(ca.value, 0)
  from members m join public.profiles p on p.id = m.user_id
  left join minutes mi on mi.user_id = m.user_id
  left join cards ca on ca.user_id = m.user_id
  order by coalesce(mi.value, 0) desc, coalesce(ca.value, 0) desc, p.display_name;
end;
$$;
revoke all on function public.room_leaderboard(uuid) from public, anon;
grant execute on function public.room_leaderboard(uuid) to authenticated;

-- Friends compare both recorded timer minutes and card reviews for the UTC week.
drop function if exists public.weekly_friends_leaderboard();
create function public.weekly_friends_leaderboard()
returns table(user_id uuid, display_name text, minutes_studied bigint, cards_reviewed bigint)
language sql stable security definer
set search_path = public
as $$
  with visible_users as (
    select auth.uid() as id
    union
    select case when f.sender_id = auth.uid() then f.recipient_id else f.sender_id end
    from public.friend_requests f
    where f.accepted_at is not null and (f.sender_id = auth.uid() or f.recipient_id = auth.uid())
  ), minutes as (
    select s.user_id, floor(sum(s.duration_seconds)::numeric / 60)::bigint as value
    from public.study_sessions s
    where s.started_at >= date_trunc('week', now() at time zone 'utc') at time zone 'utc'
    group by s.user_id
  ), cards as (
    select r.user_id, count(*)::bigint as value
    from public.study_reviews r
    where r.reviewed_at >= date_trunc('week', now() at time zone 'utc') at time zone 'utc'
    group by r.user_id
  )
  select p.id, p.display_name, coalesce(mi.value, 0), coalesce(ca.value, 0)
  from visible_users v join public.profiles p on p.id = v.id
  left join minutes mi on mi.user_id = p.id
  left join cards ca on ca.user_id = p.id
  order by coalesce(mi.value, 0) desc, coalesce(ca.value, 0) desc, p.display_name;
$$;
revoke all on function public.weekly_friends_leaderboard() from public, anon;
grant execute on function public.weekly_friends_leaderboard() to authenticated;

-- Realtime is used for presence and leaderboard changes; row visibility is still checked by RLS.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms') then
      execute 'alter publication supabase_realtime drop table public.rooms';
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'personal_timers') then
      execute 'alter publication supabase_realtime add table public.personal_timers';
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'study_sessions') then
      execute 'alter publication supabase_realtime add table public.study_sessions';
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'study_reviews') then
      execute 'alter publication supabase_realtime add table public.study_reviews';
    end if;
  end if;
end;
$$;
