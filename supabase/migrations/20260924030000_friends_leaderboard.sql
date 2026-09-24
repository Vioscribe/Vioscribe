-- Friend requests, private review history, and a friend-only weekly leaderboard.

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (sender_id, recipient_id),
  check (sender_id <> recipient_id)
);
create index if not exists friend_requests_recipient_pending_idx
  on public.friend_requests (recipient_id, created_at desc)
  where accepted_at is null;

create table if not exists public.study_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  reviewed_at timestamptz not null default now()
);
create index if not exists study_reviews_user_week_idx
  on public.study_reviews (user_id, reviewed_at desc);

alter table public.friend_requests enable row level security;
alter table public.study_reviews enable row level security;
grant select on public.friend_requests to authenticated;
grant select, insert on public.study_reviews to authenticated;

drop policy if exists "friend_requests_select_participant" on public.friend_requests;
create policy "friend_requests_select_participant" on public.friend_requests
  for select to authenticated using (
    sender_id = (select auth.uid()) or recipient_id = (select auth.uid())
  );

drop policy if exists "study_reviews_select_self_or_friend" on public.study_reviews;
create policy "study_reviews_select_self_or_friend" on public.study_reviews
  for select to authenticated using (
    user_id = (select auth.uid()) or exists (
      select 1 from public.friend_requests f
      where f.accepted_at is not null and
        ((f.sender_id = (select auth.uid()) and f.recipient_id = study_reviews.user_id)
         or (f.recipient_id = (select auth.uid()) and f.sender_id = study_reviews.user_id))
    )
  );

drop policy if exists "study_reviews_insert_own_card" on public.study_reviews;
create policy "study_reviews_insert_own_card" on public.study_reviews
  for insert to authenticated with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.cards c
      join public.decks d on d.id = c.deck_id
      where c.id = study_reviews.card_id and d.user_id = (select auth.uid())
    )
  );

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
  order by 5 desc;
$$;
revoke all on function public.list_friend_requests() from public, anon;
grant execute on function public.list_friend_requests() to authenticated;

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
