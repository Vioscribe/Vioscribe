-- Room membership is announced with Realtime Presence, not Postgres Changes.
-- Keep table changes enabled only for the timer and activity streams the app subscribes to.
do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rooms'
  ) then
    alter publication supabase_realtime drop table public.rooms;
  end if;
end;
$$;
