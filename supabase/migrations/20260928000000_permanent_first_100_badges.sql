-- Freeze the First 100 cohort and award future slots once at profile creation.
-- A transactional counter avoids changing recipients when profiles are deleted.

alter table public.profiles
  add column if not exists is_first_100 boolean not null default false;

with ranked_profiles as (
  select id, row_number() over (order by created_at, id) as signup_rank
  from public.profiles
)
update public.profiles p
set is_first_100 = ranked_profiles.signup_rank <= 100
from ranked_profiles
where p.id = ranked_profiles.id;

-- This private counter records how many profiles existed at rollout and then
-- advances transactionally for each new profile. It never decreases on delete.
create table public.profile_signup_badge_counter (
  singleton boolean primary key default true check (singleton),
  signup_count bigint not null check (signup_count >= 0)
);

insert into public.profile_signup_badge_counter (singleton, signup_count)
select true, count(*) from public.profiles;

revoke all on public.profile_signup_badge_counter from public, anon, authenticated;

create or replace function public.set_first_100_badge()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  signup_order bigint;
begin
  update public.profile_signup_badge_counter
  set signup_count = signup_count + 1
  where singleton = true
  returning signup_count into signup_order;

  new.is_first_100 := signup_order <= 100;
  return new;
end;
$$;

revoke all on function public.set_first_100_badge() from public, anon, authenticated;

drop trigger if exists profiles_set_first_100_badge on public.profiles;
create trigger profiles_set_first_100_badge
  before insert on public.profiles
  for each row execute function public.set_first_100_badge();

-- Keep badge eligibility server-side and return only the signed-in user's flag.
create or replace function public.my_profile_badges()
returns table (
  display_name text,
  friend_code text,
  current_streak integer,
  longest_streak integer,
  is_developer boolean,
  is_first_100 boolean,
  classroom_badge_color text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.display_name,
         p.friend_code,
         p.current_streak,
         p.longest_streak,
         p.is_developer,
         p.is_first_100,
         p.classroom_badge_color
  from public.profiles p
  where p.id = auth.uid();
$$;
revoke all on function public.my_profile_badges() from public, anon;
grant execute on function public.my_profile_badges() to authenticated;
