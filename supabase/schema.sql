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

create policy "profiles: own row"
  on public.profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "decks: own rows"
  on public.decks for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "cards: via own decks"
  on public.cards for all
  using (
    exists (
      select 1 from public.decks d
      where d.id = cards.deck_id and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.decks d
      where d.id = cards.deck_id and d.user_id = auth.uid()
    )
  );

create policy "notes: own row"
  on public.notes for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
