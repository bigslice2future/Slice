-- Run in SQL Editor as postgres after the migration. All fixtures roll back.
begin;
do $$
declare owner_id uuid:=gen_random_uuid(); other_id uuid:=gen_random_uuid(); sid uuid:=gen_random_uuid(); uid uuid; denied boolean:=false;
begin
 insert into auth.users(id) values(owner_id);
 insert into public.slices(id,creator_id,title,status) values(sid,owner_id,'Account QA fixture','published');
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform public.save_creator_profile('QA Slicer','');
 uid:=public.save_slice_update(sid,null,'Release notes','QA update','Test message',null);
 perform public.save_slice_update(sid,uid,'Announcement','Edited update','Edited message',null);
 if not exists(select 1 from public.slice_updates where id=uid and edited and title='Edited update') then raise exception 'Update edit failed'; end if;
 perform public.set_slice_update_deleted(sid,uid,true);
 if not exists(select 1 from public.slice_updates where id=uid and deleted_at is not null) then raise exception 'Update deletion failed'; end if;
 perform public.set_slice_update_deleted(sid,uid,false);
 perform public.set_slice_deleted(sid,true);
 if not exists(select 1 from public.slices where id=sid and deleted_at is not null) then raise exception 'Slice deletion failed'; end if;
 perform public.set_slice_deleted(sid,false);
 if not exists(select 1 from public.slices where id=sid and deleted_at is null) then raise exception 'Slice restore failed'; end if;
 perform set_config('request.jwt.claim.sub',other_id::text,true);
 begin perform public.set_slice_deleted(sid,true); exception when raise_exception then denied:=true; end;
 if not denied then raise exception 'Cross-account deletion allowed'; end if;
 denied:=false;
 begin perform public.save_slice_update(sid,null,'Release notes','Forbidden','Forbidden',null); exception when raise_exception then denied:=true; end;
 if not denied then raise exception 'Cross-account update allowed'; end if;
 if has_function_privilege('anon','public.save_creator_profile(text,text)','execute') or has_function_privilege('anon','public.set_slice_deleted(uuid,boolean)','execute') or has_function_privilege('anon','public.save_slice_update(uuid,uuid,text,text,text,date)','execute') then raise exception 'Anonymous mutation permission found'; end if;
 if has_table_privilege('authenticated','public.creator_profiles','update') or has_table_privilege('authenticated','public.slice_updates','insert') or has_table_privilege('authenticated','public.slices','update') then raise exception 'Unrestricted table write found'; end if;
 perform set_config('qa.slice_id',sid::text,true);
 perform set_config('request.jwt.claim.sub','',true);
end $$;
set local role anon;
do $$ begin
 if not exists(select 1 from public.slices where id=current_setting('qa.slice_id')::uuid) then raise exception 'Public published Slice hidden'; end if;
 if not exists(select 1 from public.slice_updates where slice_id=current_setting('qa.slice_id')::uuid) then raise exception 'Public updates hidden'; end if;
end $$;
reset role;
update public.slices set deleted_at=now() where id=current_setting('qa.slice_id')::uuid;
set local role anon;
do $$ begin
 if exists(select 1 from public.slices where id=current_setting('qa.slice_id')::uuid) or exists(select 1 from public.slice_updates where slice_id=current_setting('qa.slice_id')::uuid) then raise exception 'Deleted Slice data publicly visible'; end if;
end $$;
reset role;
rollback;
select 'PASS: profile, update CRUD, delete/restore, owner isolation, anonymous permissions and deleted visibility. Fixtures rolled back.' as result;
