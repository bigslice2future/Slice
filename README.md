# Slice

A web-first platform for interactive content and playable experiences. The static frontend supports local publishing and guest Library storage, with Supabase email-link accounts and cloud saves for built-in experiences. See [account setup and rollout checks](docs/ACCOUNTS.md) before enabling this in production. Production publication uses a verified Supabase Edge Function and normalized versioned records; see the deployment guide for setup.

## Run locally

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:4173. The files in `dist/` remain the frontend source and output. The Node server also runs the real URL import API; Vercel serves the same API as a function. Use Node 22/24. See [Creator Import V1](docs/URL_IMPORT_V1.md) and [deployment](docs/DEPLOYMENT.md).

## Verify

```sh
pnpm build
pnpm test
pnpm check
```

For browser regression checks, make Playwright available, start the Node server, and run:

```sh
SLICE_TEST_URL=http://127.0.0.1:4173/ node scripts/browser-check.cjs
```

Set `BROWSER_EXECUTABLE` if using an installed Chromium/Chrome executable instead of Playwright's bundled browser.

## Product scope

- Playable experiences only: games, simulations, experiments, creative tools, and interactive applications.
- Creator Gateway starts with Upload HTML (file or pasted code), followed by URL import and GitHub (Coming soon). URL imports receive server-side security checks and an isolated preview before explicit creator confirmation.
- Local publication uses a normalized browser repository. Imported Slices appear in Discover, can be saved to Library and replayed after refresh. Production uses authenticated cloud publication and a public Discover feed.
- GitHub builds and ZIP/project-folder acquisition are disabled. Single HTML files up to 300 KiB are supported. Six playable templates and existing drafts remain available.
- Standalone image, text, document, and video posts are not supported. Images and text can still be assets inside an interactive experience.
- All built-in product copy and demo content are English. User-authored titles, comments, updates, and imported projects retain their original language.

See [prototype scope](docs/PROTOTYPE.md) and [change and data notes](docs/INTERACTIVE_ONLY.md). The existing deployment and timeline documents remain in `docs/`.
