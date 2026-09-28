-- Keep daily review goals within the range supported by the Streak editor.
-- Normalize older values before enforcing the constraint.
update public.profiles
set daily_goal = greatest(2, least(30, daily_goal))
where daily_goal < 2 or daily_goal > 30;

alter table public.profiles
  add constraint profiles_daily_goal_range_check
  check (daily_goal between 2 and 30);
