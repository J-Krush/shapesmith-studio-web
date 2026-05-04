---
phase: 01-foundation-refactor-env-pinning
plan: 04
subsystem: ui
tags: [react, useState, modal, refactor, sanity-keys, project-gallery]

requires:
  - phase: 01-foundation-refactor-env-pinning
    provides: "Wave 1 env pin (Plan 01-01) — Node 20 pin + pnpm-lock.yaml committed; build runs against the locked toolchain used to verify this refactor."
provides:
  - "State-driven `ProjectGallery` image modal: `const [openImage, setOpenImage] = useState(null)` replaces `document.getElementById('modal').classList.remove/add('hidden')` DOM mutation"
  - "Conditional modal render: `{openImage && (<div>…</div>)}` — modal markup is unmounted when closed, not just visually hidden"
  - "React-key bug fix: list `key` is `image.asset._id` (Sanity's actual asset identifier) instead of the previously-undefined `image.asset.id`"
  - "Cleanup: `var` purged from the file; redundant inner `<img key>` removed (single key on the wrapping `<div>`); `id=\"modal\"` / `id=\"modal-img\"` HTML attributes removed (no JS targets them anymore)"
affects: [01-06, phase-02]

tech-stack:
  added: []  # No new runtime deps. Pure refactor on top of existing React 18 + useState.
  patterns:
    - "State-driven conditional modal render in this component — the established idiom that Phase 2's `/3d-printing` gallery will be lifted from when N=2 and a shared `<Modal>` becomes correct (D-10)"
    - "React keys on Sanity-asset lists use `image.asset._id` — Sanity asset documents expose `_id`, not `id`; this is the right identifier for any future asset-list rendering"

key-files:
  created:
    - ".planning/phases/01-foundation-refactor-env-pinning/01-04-SUMMARY.md"
  modified:
    - "src/components/projects/ProjectGallery.jsx"
  deleted: []

key-decisions:
  - "D-09 honored: narrow `useState` fix in `ProjectGallery.jsx` only — modal renders conditionally on `openImage`, no shared component lift"
  - "D-10 honored: did NOT extract a reusable `<Modal>` component; deferred to Phase 2 when `/3d-printing` ships its own gallery and N=2 makes the abstraction correct (Sandi-Metz wrong-abstraction guard)"
  - "D-11 honored: while in the file, fixed the `image.asset.id` (undefined) → `image.asset._id` React-key bug; touching the same file made the additional fix free"
  - "Bonus cleanup (in-scope-by-proximity): `var` keyword purged in favor of `const`, redundant inner `<img key>` dropped, dead `id=\"modal\"` / `id=\"modal-img\"` HTML attributes removed since nothing targets them anymore"
  - "Did NOT add focus-trap, ESC-to-close, click-outside-to-close, or animation — none are scoped for Plan 01-04; those are accessibility / UX concerns better addressed when the shared `<Modal>` is lifted in Phase 2"

patterns-established:
  - "State-driven modal pattern: declare `useState(null)` for the open-target, set the value in the trigger handler, conditionally render the modal block on truthy state, and reset to `null` in the close handler. Replaces the imperative `document.getElementById(...).classList...` anti-pattern that fights React reconciliation"
  - "Sanity asset key correctness: when iterating a Sanity asset list, the React `key` is `image.asset._id` (or the parent doc's `_key` if rendering inline blocks). The plain `.id` field does not exist on Sanity assets and silently evaluates to `undefined`"

requirements-completed: [FOUND-04]

duration: ~2min
completed: 2026-05-04
---

# Phase 1 Plan 04: State-Driven ProjectGallery Modal Summary

**Replaced the `document.getElementById("modal").classList.remove/add('hidden')` DOM-mutation modal in `ProjectGallery.jsx` with a `useState`-driven conditional render, fixed the latent `image.asset.id` (undefined) → `image.asset._id` React-key bug on the gallery list, and dropped the now-redundant `id="modal"` / inner-`<img key>` / `var` cruft while in the same file.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-04T02:19:30Z
- **Completed:** 2026-05-04T02:21:26Z
- **Tasks:** 1 / 2 executed (Task 2 is a manual visual smoke checkpoint — see "Checkpoint: Manual Smoke Test" below; deferred to post-merge owner)
- **Files modified:** 1 (`src/components/projects/ProjectGallery.jsx`)

## Accomplishments

- **State-driven modal:** `const [openImage, setOpenImage] = useState(null)` replaces the prior `var [imgToShow, setImgToShow] = useState()` plus `document.getElementById("modal").classList.remove/add('hidden')` pair. The modal `<div>` is now wrapped in `{openImage && (...)}` so it is fully unmounted when closed (not just visually hidden by a `hidden` class).
- **Thumbnail handler:** `onClick={() => setOpenImage(image.asset.url)}` directly drives the modal open. The intermediate `showModal(img)` function (and its DOM mutation) is gone.
- **Close handler:** `onClick={(event) => { event.preventDefault(); setOpenImage(null); }}` on the `×` button. The intermediate `closeModal()` function (and its DOM mutation) is gone.
- **React key fix (D-11):** outer wrapping `<div>` `key={image.asset._id}` — Sanity asset documents expose `_id`, not `id`. The previous `image.asset.id` evaluated to `undefined` for every entry, which React tolerates with a console warning but breaks reconciliation if the order of detail images ever changes (e.g. content edits in Sanity Studio).
- **Cleanup carried by proximity:**
  - `var` keyword purged (`const` is the only declaration form remaining in the file).
  - The duplicate `key={image.asset.id}` on the inner `<img>` is removed entirely — one key per list item belongs on the outermost element returned from the `.map()` callback, not on a child.
  - `id="modal"` and `id="modal-img"` HTML attributes are removed because no JavaScript targets them anymore. Reduces a stable selector surface that ad-hoc browser-extension scripts could have hooked, though that was never a real attack vector (T-01-06).

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite `ProjectGallery.jsx` with state-driven modal and `_id` key fix** — `cc996b0` (refactor)
2. **Task 2: Manually verify gallery thumbnail-to-modal interaction** — manual visual smoke checkpoint; not automatable in a parallel-worktree executor (see "Checkpoint: Manual Smoke Test" below)

## Files Created/Modified

- **`src/components/projects/ProjectGallery.jsx`** (modified, 60 → 54 lines, net −6)
  - Imports unchanged: `import { useContext, useState } from 'react'; import SingleProjectContext from '../../context/SingleProjectContext';`
  - State: `const [openImage, setOpenImage] = useState(null);` (replaces `var [imgToShow, setImgToShow] = useState();`)
  - Removed entirely: `const showModal = (img) => { setImgToShow(img); var modal = document.getElementById("modal"); modal.classList.remove('hidden'); }` and `const closeModal = () => { var modal = document.getElementById("modal"); modal.classList.add('hidden'); }`
  - Outer list `<div>` key: `key={image.asset._id}` (was `key={image.asset.id}` — undefined)
  - Thumbnail `<img>`: dropped redundant `key={image.asset.id}`; `onClick={() => setOpenImage(image.asset.url)}` (was `onClick={() => showModal(image.asset.url)}`)
  - Modal block: was `<div id="modal" className="hidden fixed top-0 left-0 z-80 w-screen h-screen bg-black/70 flex justify-center items-center"> … </div>`; is now `{openImage && (<div className="fixed top-0 left-0 z-80 w-screen h-screen bg-black/70 flex justify-center items-center"> … </div>)}` — `id="modal"` removed, `hidden` class removed (no longer needed; modal is unmounted when closed)
  - Close button `onClick`: `(event) => { event.preventDefault(); setOpenImage(null); }` (was `(event) => { event.preventDefault(); closeModal(); }`)
  - Modal `<img>`: was `<img id="modal-img" className="max-w-[800px] max-h-[600px] object-cover" src={imgToShow} key={imgToShow} alt="Modal Zoom"/>`; is now `<img className="max-w-[800px] max-h-[600px] object-cover" src={openImage} alt="Modal Zoom" />` — `id="modal-img"`, redundant `key={imgToShow}`, and the `imgToShow` reference removed; `src` reads directly from the `openImage` state

## Decisions Made

- **No `<Modal>` component extraction (D-10).** The plan's pattern guidance and CONTEXT.md D-10 explicitly defer this to Phase 2 when `/3d-printing` ships its own gallery and `N=2` makes the abstraction correct. Avoiding the Sandi-Metz wrong-abstraction trap.
- **No accessibility add-ons (focus-trap, ESC-to-close, click-outside-to-close, animation).** All four are out of scope for Plan 01-04; they are correctness/UX concerns naturally owned by the Phase 2 shared-`<Modal>` lift, not by this state-machine swap.
- **`SingleProjectContext.jsx` and call sites untouched.** The plan's `files_modified` is a single-file allowlist (`src/components/projects/ProjectGallery.jsx`); no caller change was needed because the component's external contract (no props, reads from context) is unchanged.
- **Modal is now fully unmounted when closed.** Previously the modal `<div>` lived in the DOM permanently with a `hidden` class flipped on/off. The new code conditionally renders it, so the entire subtree (including the `<img>`) is unmounted when `openImage` is null. This is a visible-in-devtools behavior change (DOM does not contain the modal node when closed); ROADMAP success criterion #3 phrasing is satisfied either way, but the behavior change is worth flagging.

## Codebase-Wide Invariant Check

ROADMAP success criterion #3:
> "The `ProjectGallery` image modal opens and closes via React state — no `document.getElementById` `classList` manipulation in the codebase"

State after this plan (in this worktree, before merge):

```bash
$ grep -rn "document.getElementById" src/
src/index.js:7:const root = ReactDOM.createRoot(document.getElementById('root'));

$ grep -rn "classList" src/
src/App.js:26:	root.classList.add('dark');
src/hooks/useThemeSwitcher.jsx:14:		root.classList.remove(activeTheme);
src/hooks/useThemeSwitcher.jsx:15:		root.classList.add(theme);
```

The remaining matches are **not** in scope for Plan 01-04 and do **not** violate the ROADMAP criterion's intent:

- `src/index.js:7` `document.getElementById('root')` — the **canonical CRA / React 18 mount point** (`ReactDOM.createRoot(document.getElementById('root'))`). This is the one legitimate, idiomatic use of `getElementById` in any React app; removing it would crash the app at startup. It is not in any FOUND-XX plan's `files_modified` and not what ROADMAP criterion #3 prohibits ("imperative DOM `classList` manipulation").
- `src/App.js:26` `root.classList.add('dark')` and `src/hooks/useThemeSwitcher.jsx:14-15` `root.classList.remove/add(theme)` — owned by **Plan 01-03** (FOUND-03), which is running in parallel in a separate worktree per the wave-3 schedule. Plan 01-03's frontmatter and CONTEXT.md decisions D-06 / D-07 explicitly delete `useThemeSwitcher.jsx` entirely and remove the `root.classList.add('dark')` line in favor of hard-coded `class="dark"` on `<html>` in `public/index.html`.

After Plan 01-03 merges, the only remaining match in the entire `src/` tree will be the React mount in `src/index.js:7` — exactly the post-Phase-1 steady state.

**Within `src/components/projects/ProjectGallery.jsx` itself, the prohibited patterns are gone:**

```bash
$ grep -n "document.getElementById" src/components/projects/ProjectGallery.jsx
(no match)
$ grep -n "classList" src/components/projects/ProjectGallery.jsx
(no match)
$ grep -n "image.asset.id\b" src/components/projects/ProjectGallery.jsx
(no match)
$ grep -wn "var" src/components/projects/ProjectGallery.jsx
(no match)
$ grep -n 'id="modal"' src/components/projects/ProjectGallery.jsx
(no match)
```

Positive checks (must match):

```bash
$ grep -n "image.asset._id" src/components/projects/ProjectGallery.jsx
16:				<div className="flex w-1/3 flex-wrap" key={image.asset._id}>
$ grep -n "useState(null)" src/components/projects/ProjectGallery.jsx
7:	const [openImage, setOpenImage] = useState(null);
$ grep -n "{openImage && (" src/components/projects/ProjectGallery.jsx
31:			{openImage && (
$ grep -n "setOpenImage(image.asset.url)" src/components/projects/ProjectGallery.jsx
22:										onClick={() => setOpenImage(image.asset.url)}
$ grep -n "setOpenImage(null)" src/components/projects/ProjectGallery.jsx
37:							setOpenImage(null);
```

All file-scoped invariants from `<acceptance_criteria>` pass.

## Build Verification

`pnpm install --frozen-lockfile` (worktree was fresh; `node_modules` was missing on first invocation), then `pnpm build`:

```text
> shapesmith-studio-web@0.1.0 build
> react-scripts build --openssl-legacy-provider

Creating an optimized production build...
Compiled successfully.

File sizes after gzip:
  116.64 kB  build/static/js/main.d9c1253e.js
  …
```

`Compiled successfully.` with no warnings related to `ProjectGallery.jsx`. The 116.64 kB main bundle is in line with the Plan 01-02 baseline (116.49 kB) — no measurable bundle impact (this is a 6-line net-removal refactor in a code-split route chunk).

## Checkpoint: Manual Smoke Test (Task 2)

Task 2 was authored as `type="checkpoint:human-verify"` and asks the user to start `pnpm start`, navigate to a style detail page, click thumbnails, observe the modal opens and closes, and confirm no console warnings about duplicate or undefined keys.

**Why deferred to post-merge:**
- This executor runs in a parallel-worktree context per the prompt: "REQUIRED: SUMMARY.md MUST be committed before you return — the orchestrator force-removes the worktree afterward." A checkpoint return inside this worktree has no resume path; the worktree gets removed and the parent orchestrator reconvenes after the merge.
- All automatable verification is green: every grep predicate from `<acceptance_criteria>` passes, `pnpm build` exits 0, and the file-shape audit matches the plan's diff summary line-for-line.
- The remaining concern is purely visual / interactive (does the modal render? does it close on `×`?), which the orchestrator's Phase 1 closeout (or the user, post-merge) is the natural owner of — particularly since the live Sanity dataset and a running dev server are needed to view detail images.

**To run the smoke test post-merge** (steps lifted verbatim from the plan):

1. `pnpm start` — wait for `Local: http://localhost:3000`.
2. Navigate to a style detail page that has at least one detail image (e.g. visit `/styles` and click into a style with photos).
3. Click any thumbnail. The modal should appear: full-screen dark backdrop, large image centered, close `×` button in the top right.
4. Click the `×` button. The modal should disappear.
5. Click another thumbnail. The modal should reappear with the new image. Close again.
6. Open dev tools, Console tab. Confirm no React warnings about duplicate keys or undefined keys.
7. Open dev tools, Elements tab. With the modal closed, confirm there is **no** `<div className="fixed top-0 left-0 …">` for the modal in the DOM (proof of conditional render — the previous build had a permanent `<div id="modal" class="hidden">` instead). With the modal open, confirm the modal `<div>` IS in the DOM.

If any of these fail, the regression is most likely in (a) the `_id` key fix (if Sanity is returning a different field shape than expected — the GROQ for `singleProjectData.detailImages` is in `SingleProjectContext.jsx` and is unchanged by this plan), or (b) a CSS issue from the `hidden` class removal (the new render has no `hidden` class because the modal is now mounted only when open). Neither is expected.

## Threat Surface Scan

Per the plan's `<threat_model>`:

> No new external inputs, no auth, no DB, no new dependencies; threat surface unchanged from baseline. ASVS L1 not triggered.

T-01-06 ("removing `id="modal"` reduces the ad-hoc selector surface but was never a real attack vector") accepted; no new threat flags discovered during execution. No `## Threat Flags` section needed.

## Deviations from Plan

**None — plan executed exactly as written.** The single `<action>` block was applied verbatim; every `<acceptance_criteria>` predicate passes; `pnpm build` exits 0.

The only nuance worth recording is the Task 2 checkpoint handling above — the executor is a parallel-worktree agent without a resume path, so the manual visual smoke is documented for post-merge follow-up rather than blocking on a checkpoint return that would orphan the SUMMARY.md commit.

## Issues Encountered

- **`node_modules` missing on first `pnpm build`.** Worktrees do not inherit `node_modules` from the parent repo. Resolved by running `pnpm install --frozen-lockfile` (which honored the lockfile committed in Plan 01-01); subsequent `pnpm build` succeeded. Not a deviation — expected worktree-bootstrap step.

## User Setup Required

None. No external service configuration changed. No env vars added. No Sanity studio changes. The Sanity GROQ query for `detailImages` is unchanged (and lives in `SingleProjectContext.jsx`, untouched by this plan), so existing content displays without any CMS-side action.

## Next Phase Readiness

- ROADMAP success criterion #3 ("`ProjectGallery` image modal opens/closes via React state — no `document.getElementById`/`classList` manipulation in the codebase") is functionally satisfied for the Gallery surface. Final codebase-wide convergence depends on Plan 01-03 landing in parallel (its scope owns the remaining `App.js` / `useThemeSwitcher.jsx` matches).
- Plan 01-06 (smoke test that mounts `<App />`) inherits the cleaner `ProjectGallery` — no `document` global access in the component subtree, which makes JSDOM-based mounting cheaper and avoids the prior brittle dependency on `<div id="modal">` existing in the DOM at the moment `showModal` ran.
- Phase 2's `/3d-printing` gallery is the natural N=2 trigger for lifting a shared `<Modal>` component (D-10). The pattern to lift is now obvious and inline in this file: `useState(null)` + `{open && (...)}` — no DOM-mutation residue to untangle when the abstraction lift happens.

## Self-Check: PASSED

- `src/components/projects/ProjectGallery.jsx` exists and contains `useState(null)`, `image.asset._id`, `{openImage && (`, `setOpenImage(image.asset.url)`, `setOpenImage(null)` (verified with grep)
- `src/components/projects/ProjectGallery.jsx` does **not** contain `document.getElementById`, `classList`, bare `image.asset.id`, `var`, or `id="modal"` (verified with grep)
- Task 1 commit `cc996b0` resolves in `git log --all`
- `pnpm build` exits 0 at end of plan with `Compiled successfully.` and no warnings
- File line count: 54 (was 60; net −6 matches the diff summary — `var`/handler removal outweighed JSX expansion of the conditional render block)
- This SUMMARY.md is being committed in the same worktree as the Task 1 commit, so the orchestrator's post-merge force-removal will not orphan any work

---
*Phase: 01-foundation-refactor-env-pinning*
*Completed: 2026-05-04*
