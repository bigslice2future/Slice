# Interactive-only publishing and English UI

## Result

Slice now presents playable experiences throughout Creator Gateway, publishing, Discover, Slicers, Spaces, Library, examples, and sharing. The slice* identity and existing visual system are retained.

Standalone image, text, document, and video publishing has been removed. Interactive HTML and playable templates remain. Images and text are still allowed as assets within an interactive experience. Comments and release notes belong to an experience and do not become independent Feed items.

## Changed files

| Files | Change |
| --- | --- |
| `dist/content-policy.js` (new) | Defines the interactive content boundary and recognizes inline interaction code. |
| `dist/publish.js`, `dist/upload.js`, `dist/upload-helpers.js`, `dist/creation.js` | Restricts creation, preview, submission, draft restoration, and legacy loading to playable experiences; adds preview confirmation and English validation. |
| `dist/creator-gateway.js`, `dist/creator-gateway.css` | Removes standalone posting, explains playable-only imports, retains GitHub-first source selection, and preserves the Space destination. |
| `dist/index.html`, `dist/app.js`, `dist/discovery.js` | English page metadata, navigation, homepage, Feed, instructions, accessible labels, and template examples. |
| `dist/delivery.js`, `dist/following.js`, `dist/slace.js`, `dist/queue.js` | English Library, delivery settings, creator follows, Spaces, and exploration queue; replaces the lifestyle Space with a playable-games Space. |
| `dist/more-content.js` | Keeps mini games and removes static diary samples. |
| `dist/documents.js` | Keeps the interactive manual Q&A demo in English, removes raw document ingestion and generated-post publishing. |
| `dist/share.js`, `dist/comments.js`, `dist/updates.js` | English sharing, comments, updates, date formatting, and validation; compatibility for old update labels. |
| `dist/sample-interactive.html`, `dist/assets/Luma-One-Manual.txt` | English interactive upload example and fictional source manual; replaces the Chinese manual asset. |
| `dist/posts.js`, `dist/daily.js`, `dist/generate.js` (removed) | Removes standalone social posts, lifestyle diary seeds, and photo/text-reveal generation paths. |
| `scripts/check.cjs`, `scripts/browser-check.cjs` (new) | Repeatable static checks and browser regressions for the changed product boundary. |
| `README.md`, `docs/PROTOTYPE.md`, this file | Updated product scope, setup, verification, and data notes. |

## Language audit

All first-party HTML, JavaScript, CSS, accessible labels, built-in demo content, and the downloadable example/manual are English. The page language is `en`. Product-owned form validation is English even when the browser UI uses another language.

User-authored titles, descriptions, imported runtimes, comments, and saved updates retain their original language. This change does not translate or overwrite personal content already stored in a browser. Internal deployment/timeline documentation and comments inside unused third-party vendor libraries can still contain Chinese; they are not rendered as product copy. There is no separate account Profile page or onboarding system in this prototype; the existing profile notice and creator guidance are English.

## Content model and legacy data

There is no database schema, SQL migration, server API, Supabase client, or database `image`/`text` enum in this repository. New published works have:

```js
{
  contentType: 'interactive',
  // Either a supported playable template, or:
  assetType: 'html',
  asset: '<!-- self-contained interactive runtime -->'
}
```

- `slice-local-works-v1`: old `assetType: 'image'`, static HTML wrappers, and known post flags are excluded from the runtime list. Publishing preserves these old stored records rather than deleting them.
- `slice-plain-posts-v1`: no longer read or written by the app. Old posts remain archived in browser storage.
- `slice-publish-draft-v1`: incompatible legacy drafts open with an English explanation and a fresh playable editor. They are not silently restored as publishable posts. Explicitly saving a new draft replaces the old single-slot draft, as before.
- Library, follows, and Space views resolve against the supported in-memory experiences; old standalone posts cannot reappear via those routes or the queue.

A future database integration should enforce `content_type = 'interactive'` at the API/database boundary, validate runtime artifacts, and explicitly archive or migrate any existing image/text records before adding a constraint. No production data has been deleted or migrated here.

## Validation and limitations

Verified locally: static checks passed; all browser regression groups passed with no page errors. Desktop (1440 px) and mobile (390 px) layouts were captured and visually reviewed. The final mobile copy spacing adjustment was checked separately.

The site is deployed directly from `dist/`; there is no compilation/build command. `node scripts/check.cjs` validates JavaScript syntax, referenced scripts/styles, English UI source, removed modules, and the static Vercel configuration.

The browser regression script checks all eleven demos, document Q&A, Library, following, sharing, Space publishing, GitHub/URL validation, rejected image/text/static HTML, confirmed playable publishing, reload persistence, draft restoration, legacy-data exclusion without deletion, and desktop/mobile overflow.

The HTML detector checks for recognizable inline event handlers/listeners and rejects ordinary static pages. It is not a full semantic verifier, and some frameworks or unconventional interaction code may need adaptation. Creator preview confirmation adds a manual check. Production publishing still needs server-side validation and content review. GitHub/URL imports remain address checks only; OAuth, repository builds, embed validation, and public publishing have not been implemented in this task.

Changes are local. This task has not pushed to GitHub or redeployed Vercel.
