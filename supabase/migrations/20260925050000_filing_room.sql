-- Filing Room: files can contain notes and decks. Existing note content is
-- preserved while the old one-row-per-user notes table becomes a note list.

alter table public.profiles
  add column plan text not null default 'free'
    check (plan in ('free', 'pro', 'classroom_pro'));

create table public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 32 and title ~ '[^[:space:]]'),
  created_at timestamptz not null default now()
);

alter table public.notes
  add column id uuid not null default gen_random_uuid(),
  add column title text not null default 'My Notes',
  add column file_id uuid references public.files (id) on delete set null;

-- A user's existing notes row becomes their first note; its content and
-- updated_at value are retained.
alter table public.notes drop constraint notes_pkey;
alter table public.notes add constraint notes_pkey primary key (id);
alter table public.notes
  add constraint notes_title_length_check
  check (char_length(title) between 1 and 80 and title ~ '[^[:space:]]');

alter table public.decks
  add column file_id uuid references public.files (id) on delete set null;

create index files_user_created_idx on public.files (user_id, created_at desc);
create index notes_file_updated_idx on public.notes (file_id, updated_at desc);
create index decks_file_created_idx on public.decks (file_id, created_at desc);

-- This is the one source of truth for Free and paid filing limits.
create or replace function public.filing_limit_for_plan(target_plan text, limit_kind text)
returns integer
language plpgsql
immutable
set search_path = public
as $$
begin
  if target_plan in ('pro', 'classroom_pro') then
    return null; -- NULL means unlimited.
  end if;

  if target_plan <> 'free' then
    raise exception 'Unknown plan';
  end if;

  case limit_kind
    when 'files' then return 3;
    when 'items_per_file' then return 10;
    else raise exception 'Unknown filing limit';
  end case;
end;
$$;

create or replace function public.get_my_filing_limits()
returns table(max_files integer, max_items_per_file integer)
language sql
stable
security definer
set search_path = public
as $$
  select public.filing_limit_for_plan(p.plan, 'files'),
         public.filing_limit_for_plan(p.plan, 'items_per_file')
  from public.profiles p
  where p.id = (select auth.uid());
$$;
revoke all on function public.filing_limit_for_plan(text, text) from public, anon, authenticated;
revoke all on function public.get_my_filing_limits() from public, anon;
grant execute on function public.get_my_filing_limits() to authenticated;

-- Protect file ownership and item limits even when rows are written through
-- Supabase's Data API instead of the app's forms.
create or replace function public.enforce_user_file_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_plan text;
  max_files integer;
begin
  if tg_op <> 'INSERT' then
    return new;
  end if;

  -- Serialize this user's concurrent file creations so the Free cap cannot be
  -- exceeded by two simultaneous requests.
  select p.plan into owner_plan
  from public.profiles p
  where p.id = new.user_id
  for update;

  max_files := public.filing_limit_for_plan(owner_plan, 'files');
  if max_files is not null and (
    select count(*) from public.files f where f.user_id = new.user_id
  ) >= max_files then
    raise exception 'The Free plan allows up to % files.', max_files
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;
create trigger files_enforce_user_limit
  before insert on public.files
  for each row execute function public.enforce_user_file_limit();

create or replace function public.enforce_file_item_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_plan text;
  max_items integer;
  item_count integer;
begin
  if new.file_id is null then
    return new;
  end if;

  -- The file must belong to the same account. Locking the profile row also
  -- serializes simultaneous assignments when a file is near its item cap.
  select p.plan into owner_plan
  from public.profiles p
  join public.files f on f.user_id = p.id
  where p.id = new.user_id and f.id = new.file_id
  for update of p;
  if not found then
    raise exception 'That file does not belong to this account.'
      using errcode = 'check_violation';
  end if;

  max_items := public.filing_limit_for_plan(owner_plan, 'items_per_file');
  if max_items is null then
    return new;
  end if;

  select
    (select count(*) from public.notes n
      where n.file_id = new.file_id
        and (tg_table_name <> 'notes' or n.id <> new.id))
    +
    (select count(*) from public.decks d
      where d.file_id = new.file_id
        and (tg_table_name <> 'decks' or d.id <> new.id))
  into item_count;

  if item_count >= max_items then
    raise exception 'The Free plan allows up to % notes and decks in each file.', max_items
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;
create trigger notes_enforce_file_item_limit
  before insert or update of file_id on public.notes
  for each row execute function public.enforce_file_item_limit();
create trigger decks_enforce_file_item_limit
  before insert or update of file_id on public.decks
  for each row execute function public.enforce_file_item_limit();

alter table public.files enable row level security;
grant select, insert, update, delete on public.files to authenticated;

create policy "files_select_own" on public.files
  for select to authenticated using (user_id = (select auth.uid()));
create policy "files_insert_own" on public.files
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "files_update_own" on public.files
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "files_delete_own" on public.files
  for delete to authenticated using (user_id = (select auth.uid()));
