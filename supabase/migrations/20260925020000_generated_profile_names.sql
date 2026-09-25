-- Generate safe display names for new accounts and prevent users from
-- inserting, deleting, or changing profile names through the client API.
-- Existing profile names are deliberately left as they are.

alter table public.profiles alter column display_name drop default;

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
begin
  -- The unique friend code suffix ensures generated display names are unique.
  new_friend_code := public.random_friend_code();
  generated_name := adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
    || '-' || nouns[1 + floor(random() * array_length(nouns, 1))::int]
    || '-' || new_friend_code;

  insert into public.profiles (id, display_name, friend_code)
  values (new.id, generated_name, new_friend_code);

  insert into public.notes (user_id, content)
  values (new.id, '');

  return new;
end;
$$;

-- Existing broad table grants allowed clients to set arbitrary names or
-- delete/recreate their profile. Daily goal and streak fields remain writable.
revoke insert, update, delete on public.profiles from authenticated;
grant update (daily_goal, reviews_today, reviews_date, current_streak, last_goal_date)
  on public.profiles to authenticated;

drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
