-- Use a compact four-character alphanumeric suffix for new generated names.
-- Retry if a name already exists; do not alter any existing profile names.

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
  suffix_alphabet constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  new_friend_code text;
  generated_name text;
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
  values (new.id, generated_name, new_friend_code);

  insert into public.notes (user_id, content)
  values (new.id, '');

  return new;
end;
$$;
