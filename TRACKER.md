# TRACKER — Sere (Fijian song lyrics)

> **Every AI: read this whole file before you start any work on this project, and update it before you finish — in the same commit as your work.**
> Newest entries go at the TOP of each section. If something is listed under *In progress* or *Done*, do not redo it: carry it on, or check with Donovan.
> Work that applies to **every** project (shared rules, rollouts, new-project checklist) lives on the main board: `donovandimau/dimau-ops` → `ALL-PROJECTS.md`. Check it too, and tick this project off there when you apply a rollout here.

## Project
- Ops Room card: `platform-culture-fijian-lyrics`
- Code: https://github.com/donovandimau/sere
- Live: https://fijian-lyrics-site.vercel.app
- Scope: canonical repository and existing public tool only; preserve all songs, local media, transcription and export behavior.

## Current state
- Status: Ready to Test — live four-song Sere catalogue
- Blocker: full catalogue conversion incomplete (see Ops Room card)


## In progress — claim a task here BEFORE you start it
| Started | AI | Task | Branch / PR |
|---|---|---|---|

## Do not change
- Song records, lyrics, local media, transcription and export behavior

## Done — newest first
- 2026-11-07 — Claude — Added AGENTS.md / CLAUDE.md pointing every AI to this tracker; added the standard tracker header, links and current state. Existing entries kept unchanged.
- 2026-11-06 — Codex — Added safe response headers (nosniff and strict-origin-when-cross-origin), preserving existing routing, caching and embedding. JSON and baseline JavaScript/CSS MIME checks pass; hosted checks and live readback belong to the scoped security PR.
- 2026-11-06 — Codex — Aligned existing music at the right of the song-library and studio headers and gave navigation links at least 44px tap height. All six lyric/media regression tests and whitespace checks pass. Local 390px and 1440px checks on both pages show a 48px music entry and no page overflow. Song records, lyrics, local media, transcription and exports are unchanged; hosted release evidence follows on the scoped PR.
- 2026-11-06 — Codex — Added robots.txt and a two-page canonical sitemap for the existing song library and lyric studio; improved the library search title. Song data, lyrics and media behavior are preserved. XML parse, canonical URL checks, six existing tests and git diff --check pass. Production verification is recorded on the scoped PR.
- 2026-11-05 — Codex — Added the genuine Dimau D mark and Dimau Group label inside the link-preview phone footer. Retained the photorealistic scenes and app-specific copy. Existing image addresses and 1200×630 JPEG format are retained. Visual review, JPEG decode/dimensions and git diff --check pass; exact prompt and logo provenance are in docs/phone-preview-branding-20261105.json. Hosted publication evidence is recorded on this image-only revision.
- 2026-11-05 — Codex — Replaced the phone-screen imagery in the existing link-preview JPEG with generated photorealistic illustrative scenes. Existing image URLs and 1200×630 JPEG format are retained. Image decoding/dimensions, asset hashes and source whitespace checks pass. Prompt and provenance are recorded in docs/phone-preview-photography-20261105.json; hosted release evidence is recorded on this image-only revision.
- 2026-11-04 — Codex — Phone inspection found a long public song-source URL extending the library to 478px at a 390px viewport. Scoped source-link wrapping keeps the address readable within the page; lyric text, source addresses and all app behavior remain unchanged.
- 2026-11-04 — Codex — Added studio-specific public preview text and canonical address, reusing Sere’s existing artwork. Root and studio body bytes, songs, local media, transcription and export logic remain identical.
- 2026-11-04 — Codex — Completed scoped public preview metadata correction. Completed canonical and matching X preview details while retaining the original app-specific 1200 by 630 artwork and all page body bytes. Source whitespace checks pass; host gates and exact hosted evidence follow on this revision’s PR.
