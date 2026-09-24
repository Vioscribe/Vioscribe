-- Repair table privileges and owner-only RLS policies on an existing Vioscribe DB.
-- Run this once in the Supabase SQL Editor, or apply it with the Supabase CLI.

grant select, insert, update, delete on public.profiles, public.decks, public.cards, public.notes to authenticated;

-- Remove the original broad command policies and allow this migration to be rerun.
drop policy if exists "profiles: own row" on public.profiles;
drop policy if exists "decks: own rows" on public.decks;
drop policy if exists "cards: via own decks" on public.cards;
drop policy if exists "notes: own row" on public.notes;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
drop policy if exists "decks_select_own" on public.decks;
drop policy if exists "decks_insert_own" on public.decks;
drop policy if exists "decks_update_own" on public.decks;
drop policy if exists "decks_delete_own" on public.decks;
drop policy if exists "cards_select_via_own_decks" on public.cards;
drop policy if exists "cards_insert_via_own_decks" on public.cards;
drop policy if exists "cards_update_via_own_decks" on public.cards;
drop policy if exists "cards_delete_via_own_decks" on public.cards;
drop policy if exists "notes_select_own" on public.notes;
drop policy if exists "notes_insert_own" on public.notes;
drop policy if exists "notes_update_own" on public.notes;
drop policy if exists "notes_delete_own" on public.notes;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (id = (select auth.uid()));

create policy "decks_select_own" on public.decks
  for select to authenticated using (user_id = (select auth.uid()));
create policy "decks_insert_own" on public.decks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "decks_update_own" on public.decks
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "decks_delete_own" on public.decks
  for delete to authenticated using (user_id = (select auth.uid()));

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

create policy "notes_select_own" on public.notes
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notes_insert_own" on public.notes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "notes_update_own" on public.notes
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "notes_delete_own" on public.notes
  for delete to authenticated using (user_id = (select auth.uid()));
