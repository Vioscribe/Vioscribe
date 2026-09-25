-- Profile achievements and cosmetic Classroom Pro tick preview.
-- The developer flag can only be assigned by trusted database code.

alter table public.profiles
  add column if not exists longest_streak integer not null default 0
    check (longest_streak >= 0),
  add column if not exists is_developer boolean not null default false,
  add column if not exists classroom_badge_color text not null default '#f97316'
    check (classroom_badge_color ~ '^#[0-9A-Fa-F]{6}$');

-- Seed the best streak known at rollout. Historical daily-goal completions are
-- not stored separately, so future record streaks are tracked from this point.
update public.profiles
set longest_streak = greatest(longest_streak, current_streak);

-- The founder account is identified by its existing immutable display name.
-- No other profile fields or account data are changed.
update public.profiles set is_developer = true where display_name = '/';

create or replace function public.keep_longest_streak()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.longest_streak := greatest(old.longest_streak, new.current_streak);
  return new;
end;
$$;

drop trigger if exists profiles_keep_longest_streak on public.profiles;
create trigger profiles_keep_longest_streak
  before update of current_streak on public.profiles
  for each row execute function public.keep_longest_streak();

-- Keep the first-100 cohort on the server: the client can only ask for its own
-- profile summary, never choose its own badge or inspect the whole cohort.
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
         exists (
           select 1
           from (
             select id, row_number() over (order by created_at, id) as signup_rank
             from public.profiles
           ) first_accounts
           where first_accounts.id = p.id and first_accounts.signup_rank <= 100
         ),
         p.classroom_badge_color
  from public.profiles p
  where p.id = auth.uid();
$$;
revoke all on function public.my_profile_badges() from public, anon;
grant execute on function public.my_profile_badges() to authenticated;

-- Existing profile grants are restricted to study-goal fields. Add only the
-- signed-in user's cosmetic color preference; never grant developer/badge edits.
grant update (classroom_badge_color) on public.profiles to authenticated;
