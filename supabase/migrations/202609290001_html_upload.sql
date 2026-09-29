-- HTML is revalidated by the upload pipeline before this service-only transaction.
create or replace function public.publish_verified_slice(p_creator uuid,p_request uuid,p_title text,p_description text,p_source jsonb,p_version jsonb)
returns uuid language plpgsql security definer set search_path=public,extensions as $$
declare sid uuid; sourceid uuid:=gen_random_uuid(); versionid uuid:=gen_random_uuid();
begin
 if p_creator is null or p_request is null then raise exception 'Invalid publication'; end if;
 perform pg_advisory_xact_lock(hashtext(p_creator::text));
 select id into sid from public.slices where creator_id=p_creator and request_id=p_request;
 if sid is not null then return sid; end if;
 if length(trim(p_title)) not between 1 and 80 or length(p_description)>160 then raise exception 'Invalid title or description'; end if;
 if coalesce(p_source->>'source_type','') not in ('url','upload') then raise exception 'Invalid source'; end if;
 if p_source->>'source_type'='url' and (coalesce(p_source->>'source_url','') !~ '^https://' or coalesce(p_source->>'resolved_url','') !~ '^https://') then raise exception 'Invalid URL source'; end if;
 if p_source->>'source_type'='upload' and (p_source->>'source_url' is not null or p_source->>'resolved_url' is not null) then raise exception 'Invalid upload source'; end if;
 if octet_length(p_version->>'html') not between 1 and 307200 then raise exception 'Invalid artifact size'; end if;
 if encode(extensions.digest(p_version->>'html','sha256'),'hex') is distinct from p_version->>'content_hash' then raise exception 'Artifact hash mismatch'; end if;
 if (select count(*) from public.slices where creator_id=p_creator and created_at>now()-interval '24 hours')>=20 then raise exception 'Daily publishing limit reached (20).'; end if;
 if (select count(*) from public.slices where creator_id=p_creator)>=100 then raise exception 'Account publishing limit reached (100).'; end if;
 sid:=gen_random_uuid();
 insert into public.slices(id,creator_id,title,description,status,request_id) values(sid,p_creator,trim(p_title),p_description,'draft',p_request);
 insert into public.slice_sources(id,slice_id,source_type,source_url,resolved_url) values(sourceid,sid,p_source->>'source_type',p_source->>'source_url',p_source->>'resolved_url');
 insert into public.slice_versions(id,slice_id,source_id,version,html,content_hash,runtime_metadata) values(versionid,sid,sourceid,1,p_version->>'html',p_version->>'content_hash',p_version->'runtime_metadata');
 update public.slices set current_version_id=versionid,status='published' where id=sid;
 return sid;
end $$;
revoke all on function public.publish_verified_slice(uuid,uuid,text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.publish_verified_slice(uuid,uuid,text,text,jsonb,jsonb) to service_role;
