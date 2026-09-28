# Vercel deployment — Creator Import V1

Use the repository root containing package.json, api/, server/ and dist/. Framework preset: **Other**. Build command: **npm run build** (or pnpm build). Output directory: **dist**. Node version: **22.x or 24.x**. Install dependencies from pnpm-lock.yaml. Clear any old dashboard override that leaves Build Command empty. The api/import/url.js Node function is deployed alongside the static site and has maxDuration 15 seconds; its own import deadline is 8 seconds.

Vercel supports root `api/*.js` Node functions without a framework: https://vercel.com/docs/functions/runtimes/node-js . Configuration: https://vercel.com/docs/project-configuration/vercel-json . No Next.js conversion or build worker is needed for this version.

## Cloud publication

Apply `supabase/migrations/202609280001_import_platform.sql`, then `202609280002_public_publish.sql`. Existing account tables remain unchanged. Deploy `supabase/functions/publish-slice/index.ts` as the `publish-slice` Edge Function. It uses Supabase's built-in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY; no service key belongs in Vercel or frontend configuration. Keep JWT verification enabled. The existing public account-config.js selects the project.

The production origin is https://slice-jade.vercel.app. Update the Edge Function's CORS origin and fixed acquisition endpoint if moving domains. Auth Site URL and allowed redirects must include the production origin. Email delivery for general users requires configured Supabase SMTP (see ACCOUNTS.md).

Deploy the feature branch and verify the Vercel build before production promotion. Test `/api/import/url` returns JSON. On production, sign in, import a public self-contained HTML URL, preview, confirm, and publish. Open the published Slice from another browser to verify public reads. Localhost keeps the local repository for development.

Configure platform rate limits/abuse monitoring before a broad launch. Cloud publication is authenticated, re-acquires and hashes the source, and limits each account to 20 publications per day and 100 total. GitHub requires an isolated worker; ZIP requires object storage and validation. Neither is enabled.

Deployment progress, 2026-09-28: both import/publication SQL migrations executed successfully in the Slice project. Edge Function and Vercel release still pending verification.
