create table public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.user_blocks enable row level security;
grant select, insert, delete on public.user_blocks to authenticated;
create policy "users_manage_own_blocks" on public.user_blocks
  for all to authenticated
  using (blocker_id = (select auth.uid()))
  with check (blocker_id = (select auth.uid()));

create table public.safety_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  deck_id uuid references public.decks(id) on delete set null,
  reported_user_id uuid references public.profiles(id) on delete set null,
  reason text not null check (reason in ('inappropriate', 'bullying', 'personal_information', 'other')),
  created_at timestamptz not null default now(),
  check (num_nonnulls(deck_id, reported_user_id) = 1)
);
alter table public.safety_reports enable row level security;
grant select, insert on public.safety_reports to authenticated;
create policy "users_create_safety_reports" on public.safety_reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "users_read_own_safety_reports" on public.safety_reports
  for select to authenticated using (reporter_id = (select auth.uid()));

create or replace function public.reject_friend_request_to_blocked_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = new.sender_id and b.blocked_id = new.recipient_id)
       or (b.blocker_id = new.recipient_id and b.blocked_id = new.sender_id)
  ) then
    raise exception 'This friend request is unavailable';
  end if;
  return new;
end;
$$;
create trigger friend_requests_reject_blocked
  before insert or update of sender_id, recipient_id on public.friend_requests
  for each row execute function public.reject_friend_request_to_blocked_user();

create or replace function public.list_friends()
returns table(friend_id uuid, display_name text)
language sql stable security definer set search_path = public
as $$
  select p.id, p.display_name
  from public.friend_requests f
  join public.profiles p on p.id = case when f.sender_id = auth.uid() then f.recipient_id else f.sender_id end
  where f.accepted_at is not null
    and (f.sender_id = auth.uid() or f.recipient_id = auth.uid())
    and not exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid())
    )
  order by p.display_name;
$$;
revoke all on function public.list_friends() from public, anon;
grant execute on function public.list_friends() to authenticated;
