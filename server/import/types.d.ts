/** Acquisition adapters produce the same artifact; GitHub MUST use an isolated build worker. */
export type ImportSource =
  | { source_type: 'url'; source_url: string }
  | { source_type: 'github'; repo_url: string; owner: string; repo: string; branch?: string; commit_sha?: string }
  | { source_type: 'upload'; html: string; filename?: string; upload_key?: string };
export interface Artifact { html: string; bytes: number; source_url: string | null; resolved_url: string | null }
export interface SliceSource {
  id: string; slice_id: string; source_type: ImportSource['source_type'];
  source_url?: string; resolved_url?: string; repo_url?: string;
  owner?: string; repo?: string; branch?: string; commit_sha?: string; upload_key?: string;
}
export interface SliceVersion {
  id: string; slice_id: string; source_id: string; version: number; html: string;
  content_hash: string; runtime_metadata: { type: string; policy_version: number; bytes: number }; created_at: string;
}
