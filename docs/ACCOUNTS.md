# Accounts and cloud Library

This step adds email-link sign-in and account-owned saves for built-in experiences. Guest saves and uploaded projects remain in the current browser. Signing in does not migrate guest data. Public publishing, profiles, following and comments are not backed by this table.

## Configuration

- Project: `xkwahmqsmcdbuufvhslh`.
- Public URL and publishable key live in `dist/account-config.js`. These values are intended for browser use. Never put a secret or service-role key in `dist/`.
- Apply `supabase/migrations/202609260001_saved_slices.sql` once in the project's SQL Editor. It creates an empty table and enables row-level security in one transaction. Do not run it against an existing table without reviewing the schema first.
- Set Authentication > URL Configuration > Site URL to `https://slice-jade.vercel.app/`. The application requests a redirect to its current origin. Add individual development or preview origins only when testing them; avoid broad wildcard redirects.
- Check Authentication > Emails before inviting users. Supabase's default mail service restricts recipients and delivery volume. Configure a production email provider through custom SMTP before opening sign-up publicly. Keep email verification enabled.

## Access rules

The primary key is `(user_id, slice_id)`. Signed-in users can select, insert and delete only their own rows; anonymous users have no table grants. No client update grant is required. Saves use insert with duplicate conflicts ignored. Account changes invalidate pending requests so an old response cannot populate the next user's Library. Ambiguous save failures require a reload rather than claiming success.

Local uploads continue to use browser storage. They are not sent to Supabase. Signing out restores the guest Library. The SDK persists login on the device; the account menu provides local sign-out.

## Validation and rollout

Project setup verified on 2026-09-28: the table exists, row-level security is enabled with three owner policies, and Site URL persists as `https://slice-jade.vercel.app/`. A rolled-back SQL test verified owner-only reads, duplicate-save insertion, blocked cross-account insertion and blocked anonymous reads. Follow-up inspection showed zero test users and zero saved rows. Live email delivery, cross-device sessions and the browser-to-database flow still need end-to-end testing.

Run `node scripts/check.cjs` and `node scripts/account-check.cjs`. The latter exercises account switching, sign-out during pending requests, duplicate-click protection and failed-save recovery with controlled adapters; it does not prove live database policies or email delivery.

Before merging for production, verify the migration, persisted Site URL, and email configuration. Then use two real test accounts to confirm that each sees only its own saves, verify a second browser receives saved IDs, and check sign-out restores guest saves. A successful unit test is not an end-to-end sign-in test. Sending a test email is a separate user action.

## SDK provenance

`dist/vendor/supabase-2.117.2.js` is the browser UMD distribution from the official `@supabase/supabase-js` npm package, version 2.117.2. The downloaded archive was checked against the npm package's SHA-512 integrity value. Its MIT license is included alongside it. Vendoring pins the version and avoids a runtime CDN dependency.

References: [email sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithotp), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [email delivery](https://supabase.com/docs/guides/auth/auth-smtp).
