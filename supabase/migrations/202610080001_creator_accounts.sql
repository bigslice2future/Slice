begin;
create table public.creator_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(char_length(trim(display_name)) between 1 and 40),
 avatar text not null default '' check(octet_length(avatar)<=100000 and (avatar='' or avatar ~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$')),
 updated_at timestamptz not null default now()
);
alter table public.creator_profiles enable row level security;
revoke all on public.creator_profiles from anon,authenticated;
grant select on public.creator_profiles to anon,authenticated;
create policy creator_profiles_read on public.creator_profiles for select to anon,authenticated using(true);
-- Writes go through bounded RPCs. Auth metadata never grants ownership.
create function public.save_creator_profile(p_name text,p_avatar text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if char_length(trim(p_name)) not between 1 and 40 then raise exception 'Name must be 1 to 40 characters'; end if;
 insert into public.creator_profiles(id,display_name,avatar) values(auth.uid(),trim(p_name),p_avatar)
 on conflict(id) do update set display_name=excluded.display_name,avatar=excluded.avatar,updated_at=now();
end $$;
revoke all on function public.save_creator_profile(text,text) from public,anon;
grant execute on function public.save_creator_profile(text,text) to authenticated;
alter table public.slices add column deleted_at timestamptz;
-- Preserve old view columns, appending public creator fields for stable links.
create or replace view public.public_slices with (security_invoker=true) as
select s.id,s.title,s.description,coalesce(p.display_name,s.author) as author,s.created_at,s.current_version_id,
 v.html,v.content_hash,v.runtime_metadata,s.creator_id,p.avatar as author_avatar
from public.slices s join public.slice_versions v on v.id=s.current_version_id
left join public.creator_profiles p on p.id=s.creator_id
where s.status='published' and s.deleted_at is null;
drop policy slices_public_read on public.slices;
create policy slices_public_read on public.slices for select to anon,authenticated using(status='published' and deleted_at is null);
drop policy versions_public_read on public.slice_versions;
create policy versions_public_read on public.slice_versions for select to anon,authenticated using(exists(select 1 from public.slices s where s.id=slice_id and s.status='published' and s.deleted_at is null));
create function public.set_slice_deleted(p_slice uuid,p_deleted boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 update public.slices set deleted_at=case when p_deleted then now() else null end where id=p_slice and creator_id=auth.uid() and status='published';
 if not found then raise exception 'Slice not found or not owned'; end if;
end $$;
revoke all on function public.set_slice_deleted(uuid,boolean) from public,anon;
grant execute on function public.set_slice_deleted(uuid,boolean) to authenticated;
create table public.slice_updates (
 id uuid primary key default gen_random_uuid(),slice_id uuid not null references public.slices(id) on delete cascade,
 kind text not null check(kind in ('Release notes','Event','Announcement')),
 title text not null check(char_length(trim(title)) between 1 and 80),
 body text not null check(char_length(trim(body)) between 1 and 4000),
 event_date date,created_at timestamptz not null default now(),edited boolean not null default false,deleted_at timestamptz
);
create index slice_updates_timeline on public.slice_updates(slice_id,created_at desc);
alter table public.slice_updates enable row level security;
revoke all on public.slice_updates from anon,authenticated;
grant select on public.slice_updates to anon,authenticated;
create policy slice_updates_read on public.slice_updates for select to anon,authenticated using(
 exists(select 1 from public.slices s where s.id=slice_id and
 (s.creator_id=auth.uid() or (s.status='published' and s.deleted_at is null and slice_updates.deleted_at is null)))
);
create function public.save_slice_update(p_slice uuid,p_id uuid,p_kind text,p_title text,p_body text,p_event_date date)
returns uuid language plpgsql security definer set search_path=public as $$
declare uid uuid;
begin
 if auth.uid() is null or not exists(select 1 from public.slices where id=p_slice and creator_id=auth.uid() and status='published' and deleted_at is null) then raise exception 'Slice not found or not owned'; end if;
 if p_id is null then
  insert into public.slice_updates(slice_id,kind,title,body,event_date) values(p_slice,p_kind,trim(p_title),trim(p_body),case when p_kind='Event' then p_event_date else null end) returning id into uid;
 else
  update public.slice_updates set kind=p_kind,title=trim(p_title),body=trim(p_body),event_date=case when p_kind='Event' then p_event_date else null end,edited=true
  where id=p_id and slice_id=p_slice and deleted_at is null returning id into uid;
  if uid is null then raise exception 'Update not found'; end if;
 end if;
 return uid;
end $$;
revoke all on function public.save_slice_update(uuid,uuid,text,text,text,date) from public,anon;
grant execute on function public.save_slice_update(uuid,uuid,text,text,text,date) to authenticated;
create function public.set_slice_update_deleted(p_slice uuid,p_id uuid,p_deleted boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not exists(select 1 from public.slices where id=p_slice and creator_id=auth.uid() and deleted_at is null) then raise exception 'Slice not found or not owned'; end if;
 update public.slice_updates set deleted_at=case when p_deleted then now() else null end where id=p_id and slice_id=p_slice;
 if not found then raise exception 'Update not found'; end if;
end $$;
revoke all on function public.set_slice_update_deleted(uuid,uuid,boolean) from public,anon;
grant execute on function public.set_slice_update_deleted(uuid,uuid,boolean) to authenticated;
-- Trophy definitions/awards will be server-controlled later; no client-writable awards.
commit;
