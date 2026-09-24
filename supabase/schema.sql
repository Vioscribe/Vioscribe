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

-- Table grants let signed-in clients issue queries; RLS below limits which rows
-- those queries can read or change.
grant select, insert, update, delete on public.profiles, public.decks, public.cards, public.notes to authenticated;

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
