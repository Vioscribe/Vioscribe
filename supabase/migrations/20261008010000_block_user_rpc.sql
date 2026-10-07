revoke insert, delete on public.user_blocks from authenticated;
drop policy if exists "users_manage_own_blocks" on public.user_blocks;
create policy "users_read_own_blocks" on public.user_blocks
  for select to authenticated using (blocker_id = (select auth.uid()));

create or replace function public.block_user(target_user_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare actor_id uuid := auth.uid();
begin
  if actor_id is null then raise exception 'Sign in to block an account'; end if;
  if target_user_id is null or target_user_id = actor_id then raise exception 'Choose another account to block'; end if;
  insert into public.user_blocks (blocker_id, blocked_id)
  values (actor_id, target_user_id)
  on conflict (blocker_id, blocked_id) do nothing;
  delete from public.friend_requests
  where (sender_id = actor_id and recipient_id = target_user_id)
     or (sender_id = target_user_id and recipient_id = actor_id);
end;
$$;
revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.block_user(uuid) to authenticated;
