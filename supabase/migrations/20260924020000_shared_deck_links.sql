-- Add public read-only deck previews and atomic copying of shared decks.
alter table public.decks
  add column if not exists is_shareable boolean not null default false;
alter table public.decks
  add column if not exists share_slug text;

create unique index if not exists decks_share_slug_key
  on public.decks (share_slug)
  where share_slug is not null;

drop policy if exists "decks_select_shared" on public.decks;
create policy "decks_select_shared" on public.decks
  for select to anon, authenticated
  using (is_shareable and share_slug is not null);

drop policy if exists "cards_select_in_shared_decks" on public.cards;
create policy "cards_select_in_shared_decks" on public.cards
  for select to anon, authenticated using (
    exists (
      select 1 from public.decks d
      where d.id = cards.deck_id and d.is_shareable and d.share_slug is not null
    )
  );

grant select (id, title, is_shareable, share_slug) on public.decks to anon;
grant select on public.cards to anon;

create or replace function public.copy_shared_deck(source_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  source_deck public.decks%rowtype;
  copied_deck_id uuid;
begin
  if actor_id is null then
    raise exception 'Sign in to save a copy of this deck';
  end if;

  select * into source_deck
  from public.decks d
  where d.share_slug = source_slug and d.is_shareable;

  if not found then
    raise exception 'This shared deck is unavailable';
  end if;

  insert into public.decks (user_id, title)
  values (actor_id, source_deck.title || ' (copy)')
  returning id into copied_deck_id;

  insert into public.cards (deck_id, front, back)
  select copied_deck_id, c.front, c.back
  from public.cards c
  where c.deck_id = source_deck.id
  order by c.created_at;

  return copied_deck_id;
end;
$$;

revoke all on function public.copy_shared_deck(text) from public, anon;
grant execute on function public.copy_shared_deck(text) to authenticated;
