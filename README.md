# Slice

A web-first platform for interactive content and playable experiences. The current version is a static front-end prototype with local publishing and Library storage. Accounts, public publishing, and cloud sync are not connected yet.

## Run locally

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open http://localhost:4173. The files in `dist/` are both the source and the deployable site. No dependency installation or compilation is required. Vercel serves `dist/` directly.

## Verify

```sh
node scripts/check.cjs
```

For browser regression checks, make Playwright available, start the static server, and run:

```sh
SLICE_TEST_URL=http://127.0.0.1:4173/ node scripts/browser-check.cjs
```

Set `BROWSER_EXECUTABLE` if using an installed Chromium/Chrome executable instead of Playwright's bundled browser.

## Product scope

- Playable experiences only: games, simulations, experiments, creative tools, and interactive applications.
- Creator Gateway prioritizes GitHub, followed by local HTML and URL import. GitHub and URL flows currently validate addresses only; they do not import, build, or publish remote projects.
- Local publishing accepts six playable templates or one self-contained interactive HTML file up to 300 KB. Creators must test imported previews before publishing.
- Standalone image, text, document, and video posts are not supported. Images and text can still be assets inside an interactive experience.
- All built-in product copy and demo content are English. User-authored titles, comments, updates, and imported projects retain their original language.

See [prototype scope](docs/PROTOTYPE.md) and [change and data notes](docs/INTERACTIVE_ONLY.md). The existing deployment and timeline documents remain in `docs/`.
