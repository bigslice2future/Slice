# Creator Import V1

Implemented in `feature/url-import-platform-v1`. The feature branch includes the existing Supabase account work.

## What works now

Creator → Import from URL → server acquisition → preflight → sandbox preview → creator confirmation → Publish to Slice (production) → Discover → Library / replay after refresh.

GitHub remains the prominent first card, marked Coming soon. ZIP and local-file acquisition are disabled. Existing playable templates and drafts remain usable. URL import accepts public HTTPS HTML up to 300 KiB with inline JavaScript and CSS. It is an import of one document, not a mirror of a website. React/Vite must first export a self-contained HTML artifact. Remote scripts, styles, images, iframes and APIs are unsupported in V1.

The API is `POST /api/import/url`, JSON `{ "url": "https://…" }`. Success returns `preview` or `unsupported`, checks, a source record and an immutable version candidate. It does not publish. Invalid source requests return an actionable 422 response. UI provides a copyable repair prompt. No credentials or cookies from the client or upstream are forwarded.

## Data and repository boundary

`dist/import-repository.js` implements `publish(preview, details, confirmed)`, `list()` and `get(id)` with a single atomic localStorage write containing `slices`, `slice_sources`, `slice_versions`. Metadata and source details are separate from version HTML and runtime metadata. Content SHA-256 is recorded. Repeated publication of the same preview is idempotent. Storage failures leave the preview available for retry.

Localhost uses browser storage; clearing browser data removes local Slices. Production uses `dist/cloud-publishing.js` and the authenticated Supabase `publish-slice` Edge Function. The function re-imports the URL through the fixed acquisition endpoint and compares its hash with the preview before saving. No client-supplied HTML is persisted. The service-only transaction atomically creates normalized slices, sources and immutable versions, with an idempotent request ID. Published works are publicly readable; drafts and source metadata remain owner-readable. Client database writes and direct publication RPC execution are revoked.

Apply both import-platform and public-publish migrations. Built-in service credentials remain inside Supabase. The public feed currently loads the latest 100 publications. GitHub synchronization and moderation tooling remain future work.

## Security model

**User code is always untrusted.**

- HTTPS only, no URL credentials/custom ports. Normalize URLs before checks.
- Resolve all DNS records; reject non-public ranges, including IPv4-mapped IPv6. Pin Node's socket lookup to a checked address, preserving hostname for TLS verification. Do not use an automatic redirecting fetch or a proxy that resolves the hostname a second time.
- Revalidate every redirect; maximum three. A single eight-second deadline includes DNS, headers, redirects and body. Enforce 300 KiB while streaming, not just from Content-Length. Require successful HTTP and text/html; compressed responses are rejected to avoid decompression bombs.
- The parser and capability patterns generate compatibility guidance, not a security guarantee. Obfuscated JavaScript can evade static detection. Interaction detection is heuristic; creators must test their actual interaction.
- `dist/runtime.js` is the shared preview/published runtime renderer. It always uses an opaque-origin `srcdoc` iframe with only `sandbox="allow-scripts"`. Never add `allow-same-origin`, popups, downloads, forms or top-navigation. HTML is escaped as an attribute and never executed in the host document.
- CSP precedes untrusted content: no external resources, network connections, nested frames, objects, base URLs or workers. Inline JS/CSS are allowed to support interactions. Removing/changing the meta element cannot relax an already-active CSP. Service workers also require a non-opaque origin and are unavailable here.
- Permissions Policy denies camera, microphone, geolocation, clipboard, payment, device access and capture. `referrerpolicy=no-referrer` avoids leaking the main URL.
- Browser sandboxing does not bound CPU/memory or stop deceptive content. CSP does not reliably prohibit same-frame navigation in all browsers; patterns detect common navigation but are not a complete JavaScript verifier. Before broad untrusted public hosting, use an independent runtime site with response-header CSP/Permissions Policy, controlled navigation/egress, abuse controls, moderation, and resource limits. There is no claim of malware certification.
- Public import API needs infrastructure rate limiting/abuse monitoring before broad rollout. The app rejects cross-site browser requests and sets no-store but those are not authentication or distributed rate limiting.

## Deferred source adapters

`server/import/types.d.ts` and `acquireSource()` define `url | github | upload`. GitHub has repo URL, owner/repo, branch and commit SHA fields. Its future acquisition/build step must run in an isolated disposable worker with time/resource/egress limits; never run npm install/build in the main API server. Upload has a future storage key but no storage SDK, bucket, upload endpoint or active file-picker flow in this version.

## Run and verify

Use Node 22 or 24 and pnpm:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm test
pnpm check
```

Open http://127.0.0.1:4173. `pnpm dev` serves both dist and the real API. A plain static HTTP server cannot import URLs.

With Playwright available and Chrome installed:

```sh
SLICE_TEST_URL=http://127.0.0.1:4173/ BROWSER_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/browser-check.cjs
```

The browser regression imports the live MDN sample by default; set `SLICE_IMPORT_URL` to your deployed `sample-interactive.html` if needed. Tests deliberately provoke denied network access, which produces expected browser CSP console errors.

Unit tests cover successful HTTPS HTML, illegal protocols/credentials, private IPv4/IPv6, DNS and redirect defenses, deadline expiry, oversize headers/streaming, non-HTML, outbound header isolation and dangerous capabilities. Browser checks cover existing demos/accounts/Library/templates, actual HTTPS import, opaque origin, blocked fetch/service workers, confirmation, local publish, reload/replay and desktop/mobile overflow.

## Manual successful import

1. Run the app with the Node server or deploy this branch to Vercel.
2. Creator → Import from URL.
3. Paste https://mdn.github.io/learning-area/javascript/building-blocks/events/random-color-addeventlistener.html (MDN's small interactive teaching example).
4. Check & preview. Click **Change color**; the background changes.
5. Enter a title; check the preview confirmation; **Publish to Slice** (or **Publish locally** on localhost).
6. Find the card in Discover, save to Library, refresh, and reopen.

For a sample you control, this repo also serves `/sample-interactive.html`. After deployment, import `https://YOUR-DEPLOYMENT/sample-interactive.html`. The old `slice-jade.vercel.app` host timed out from this environment during verification; it is not used as evidence of success.

## Changed files / verification record

- API and acquisition: `api/import/url.js`, `server/import/acquire.cjs`, `server/import/pipeline.cjs`, `server/import/types.d.ts`.
- Product/runtime/persistence: `dist/creator-gateway.js`, `dist/creator-gateway.css`, `dist/runtime.js`, `dist/import-repository.js`, `dist/upload-helpers.js`, `dist/index.html`.
- Future data schema: `supabase/migrations/202609280001_import_platform.sql`.
- Run/build/test: `package.json`, `pnpm-lock.yaml`, `vercel.json`, `scripts/dev.cjs`, `scripts/check.cjs`, `scripts/browser-check.cjs`, `tests/*.test.cjs`.
- Documentation: README, DEPLOYMENT, this guide; historical prototype documents link here for current behavior.

Verified locally on 2026-09-28: `pnpm build`, `pnpm check`, all 14 unit/API/repository/cloud-function tests and the complete Chrome browser regression passed. The browser run used the actual Node API and a public MDN HTTPS document, not a mocked import response. It exercised the imported button, confirmation, publication, refresh and Library replay. Desktop/mobile gateway overflow checks passed. Expected blocked-fetch CSP messages are not runtime failures. The two Supabase import/publication migrations have since been applied successfully; production deployment and cloud browser verification are pending.
