-- Future cloud repository. Local v1 uses the same three entities in browser storage.
create table if not exists public.slices (
 id uuid primary key default gen_random_uuid(), creator_id uuid not null references auth.users(id),
 title text not null, description text not null default '', status text not null check (status in ('draft','published')),
 current_version_id uuid, created_at timestamptz not null default now()
);
create table if not exists public.slice_sources (
 id uuid primary key default gen_random_uuid(), slice_id uuid not null references public.slices(id) on delete cascade,
 source_type text not null check (source_type in ('url','github','upload')),
 source_url text, resolved_url text, repo_url text, owner text, repo text, branch text, commit_sha text,
 upload_key text, created_at timestamptz not null default now(), unique(slice_id,id)
);
create table if not exists public.slice_versions (
 id uuid primary key default gen_random_uuid(), slice_id uuid not null references public.slices(id) on delete cascade,
 source_id uuid not null, version integer not null check(version>0),
 html text not null check(octet_length(html)<=307200), content_hash text not null,
 runtime_metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(slice_id,version), unique(slice_id,id),
 foreign key(slice_id,source_id) references public.slice_sources(slice_id,id)
);
alter table public.slices add constraint slices_current_version_fk foreign key (id,current_version_id) references public.slice_versions(slice_id,id) deferrable initially deferred;
alter table public.slices enable row level security;
alter table public.slice_sources enable row level security;
alter table public.slice_versions enable row level security;
-- Owner-only draft access. Public publication must be mediated by a future verified
-- server repository with moderation. No anonymous writes or direct publish policy.
create policy slices_owner_read on public.slices for select to authenticated using (creator_id=auth.uid());
create policy sources_owner_read on public.slice_sources for select to authenticated using (exists(select 1 from public.slices s where s.id=slice_id and s.creator_id=auth.uid()));
create policy versions_owner_read on public.slice_versions for select to authenticated using (exists(select 1 from public.slices s where s.id=slice_id and s.creator_id=auth.uid()));
