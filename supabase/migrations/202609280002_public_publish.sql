-- Public reads, immutable versions, server-only publication. Existing account tables unchanged.
alter table public.slices add column if not exists request_id uuid;
alter table public.slices add column if not exists author text not null default 'Curious Slicer';
create unique index if not exists slices_publish_request on public.slices(creator_id, request_id);
create index if not exists slices_published_created on public.slices(created_at desc) where status='published';
create policy slices_public_read on public.slices for select to anon, authenticated using(status='published');
create policy versions_public_read on public.slice_versions for select to anon, authenticated using(exists(select 1 from public.slices s where s.id=slice_id and s.status='published'));
grant select on public.slices,public.slice_versions to anon,authenticated;
grant select on public.slice_sources to authenticated;
revoke insert,update,delete on public.slices,public.slice_sources,public.slice_versions from anon,authenticated;
create or replace view public.public_slices with (security_invoker=true) as
select s.id,s.title,s.description,s.author,s.created_at,s.current_version_id,
 v.html,v.content_hash,v.runtime_metadata
from public.slices s join public.slice_versions v on v.id=s.current_version_id
where s.status='published';
grant select on public.public_slices to anon,authenticated;

-- Called only by the Edge Function after validating the session and re-importing
-- the source through the pinned-IP acquisition service. It is not a client RPC.
create or replace function public.publish_verified_slice(p_creator uuid,p_request uuid,p_title text,p_description text,p_source jsonb,p_version jsonb)
returns uuid language plpgsql security definer set search_path=public,extensions as $$
declare sid uuid; sourceid uuid:=gen_random_uuid(); versionid uuid:=gen_random_uuid();
begin
 if p_creator is null or p_request is null then raise exception 'Invalid publication'; end if;
 perform pg_advisory_xact_lock(hashtext(p_creator::text));
 select id into sid from public.slices where creator_id=p_creator and request_id=p_request;
 if sid is not null then return sid; end if;
 if length(trim(p_title)) not between 1 and 80 or length(p_description)>160 then raise exception 'Invalid title or description'; end if;
 if (p_source->>'source_type') is distinct from 'url' or (p_source->>'source_url') !~ '^https://' or (p_source->>'resolved_url') !~ '^https://' then raise exception 'Invalid source'; end if;
 if octet_length(p_version->>'html') not between 1 and 307200 then raise exception 'Invalid artifact size'; end if;
 if encode(extensions.digest(p_version->>'html','sha256'),'hex') is distinct from p_version->>'content_hash' then raise exception 'Artifact hash mismatch'; end if;
 if (select count(*) from public.slices where creator_id=p_creator and created_at>now()-interval '24 hours')>=20 then raise exception 'Daily publishing limit reached (20).'; end if;
 if (select count(*) from public.slices where creator_id=p_creator)>=100 then raise exception 'Account publishing limit reached (100).'; end if;
 sid:=gen_random_uuid();
 insert into public.slices(id,creator_id,title,description,status,request_id) values(sid,p_creator,trim(p_title),p_description,'draft',p_request);
 insert into public.slice_sources(id,slice_id,source_type,source_url,resolved_url) values(sourceid,sid,'url',p_source->>'source_url',p_source->>'resolved_url');
 insert into public.slice_versions(id,slice_id,source_id,version,html,content_hash,runtime_metadata) values(versionid,sid,sourceid,1,p_version->>'html',p_version->>'content_hash',p_version->'runtime_metadata');
 update public.slices set current_version_id=versionid,status='published' where id=sid;
 return sid;
end $$;
revoke all on function public.publish_verified_slice(uuid,uuid,text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.publish_verified_slice(uuid,uuid,text,text,jsonb,jsonb) to service_role;
