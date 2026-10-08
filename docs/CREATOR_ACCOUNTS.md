# Creator account center

The Account button opens a creator space with My Slices, Edit profile and Trophies. Email-link authentication and Cloud Library remain available. Names and square JPEG avatars sync to `creator_profiles`; email stays private. Uploaded JPG/PNG/WebP files are decoded and resized in the browser, bounded to 5 MB input and 100 KB output. No external avatar URL or new storage bucket is required.

Published works can be played, given release notes/events/announcements, or soft-deleted and restored. Creator pages are public at `/#creator=<user UUID>` and have share links. Public pages include only published, non-deleted works. Ownership uses the authenticated user ID and database ownership, never a display name or user-editable auth metadata.

Apply `supabase/migrations/202610080001_creator_accounts.sql` before deploying the frontend. The migration is additive except for replacing two public read policies to exclude deleted works. All profile/update mutations use bounded RPCs; table writes are revoked from browser roles. Run `supabase/creator-account-check.sql` in the SQL Editor to verify the actual owner checks and public read rules. Its generated fixture account, Slice, profile and updates are inside a rolled-back transaction; no existing user data is changed.

The Trophy section and public trophy shelf are reserved UI positions. No trophies are invented or awarded. A later system should provide server-owned definitions and awards with public read access; clients must never write awards themselves.

Validation: 23 automated tests (including account changes, logout during writes, duplicate clicks and ambiguous failures), static checks and Cloud Library checks. Browser tests with a local test adapter cover profile name/photo save, public creator page, update publish/delete/undo, Slice delete/restore, sign-out and 390 px layout. This test adapter is not shipped.
