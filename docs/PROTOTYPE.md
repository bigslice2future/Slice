# Slice prototype

Slice publishes interactive content and playable experiences. The existing slice* identity, colors, cards, and runtime sandbox are retained.

## What works locally

- Discover, category filters, Featured Gravity Lab, Trending, and an exploration queue.
- Twelve built-in playable experiences: six core templates, Micro City, three mini games, an English manual search demo, and a walkable city map with destination selection, walking budgets, and bridge closures.
- Discover search filters titles, descriptions, creators, and categories, with category-aware results and a resettable empty state.
- Creator Gateway with GitHub as the primary source; GitHub and URL inputs validate URL formats only.
- Local publishing from playable templates or a self-contained HTML/HTM file (300 KB maximum). Inline CSS and JavaScript work in an iframe sandbox; network requests and external resources are blocked.
- Imported HTML must contain recognizable interaction code. The creator must also test and confirm the preview before publishing. This is a prototype-level check, not a semantic guarantee that arbitrary code is meaningfully interactive.
- English publishing instructions, examples, validation messages, buttons, accessible labels, empty states, Library, Slicers, Spaces, sharing, comments, and updates.
- Local drafts, saved experiences, follows, likes, comments, and experience-specific release notes/events.
- Browser, download, desktop-app, and external-platform delivery metadata for the full experience. Desktop/mobile apps and installers are still concepts, not working downloads.

## Removed publishing paths

Standalone image/text/video posts, photo diaries, static text cards, document-to-static-card conversion, and image reveal generation are no longer available. Raw documents and images cannot be selected for publishing. The built-in document search remains because it is a working interactive application; its source text is fictional demo content.

Comments and updates remain attached to playable experiences. They are not independently published Feed items.

## Storage and language

There is no backend, SQL schema, database enum, or Supabase integration in this repository. New local works have `contentType: 'interactive'`, plus either a playable `template` or `assetType: 'html'` and its runtime.

Legacy plain posts and static wrappers are not loaded into Discover, Slicers, Spaces, Library, or the queue. Their browser storage is not deleted. User-created content is not automatically translated or overwritten. See `INTERACTIVE_ONLY.md` for migration details.

## Limits

Activity counts and creators are illustrative. Orbit and city experiments are simplified models. Document Q&A is offline keyword retrieval, not an AI service. GitHub OAuth, repository access, build workers, URL embed validation, account permissions, public publishing, and cross-device sync remain future backend work.
