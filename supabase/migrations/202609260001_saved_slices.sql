-- Only the authenticated owner can read or change their saved work IDs.
begin;
create table public.saved_slices (
  user_id uuid not null references auth.users(id) on delete cascade,
  slice_id text not null check (char_length(slice_id) between 1 and 100 and slice_id ~ '^[a-z0-9-]+$' and slice_id not like 'local-%'),
  created_at timestamptz not null default now(),
  primary key (user_id, slice_id)
);
alter table public.saved_slices enable row level security;
revoke all on public.saved_slices from anon, authenticated;
grant select, insert, delete on public.saved_slices to authenticated;
create policy saved_slices_select_own on public.saved_slices for select to authenticated using ((select auth.uid()) = user_id);
create policy saved_slices_insert_own on public.saved_slices for insert to authenticated with check ((select auth.uid()) = user_id);
create policy saved_slices_delete_own on public.saved_slices for delete to authenticated using ((select auth.uid()) = user_id);
commit;
