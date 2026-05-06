---
phase: 02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub
plan: 02
subsystem: 3d-printing-surface
tags: [services, materials, faq, wont-make, trust-copy, sanity-image, navigate-redirect, netlify-redirects]

# Dependency graph
requires:
  - phase: 02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub
    plan: 01
    provides: useSanityQuery, ServicesContext + SingleServiceContext (parameterized by serviceKey), services/* directory rename, SanityImage + Placeholder scaffolds, SERVICES.map routing for /styles + /3d-printing, schema spec doc with the new material.services field (Plan 02-01 deviation)
provides:
  - Four in-page service section components — MaterialsSection (id="materials" anchor target, GROQ filter `$serviceKey in services`), FAQ (native <details>/<summary>, GROQ `$serviceKey in service[]->key`), WontMake (presentational portable-text, silent absence), TrustCopyBlock (banded panel, studio-info trio + per-service turnaround override)
  - SanityImage adopted in three callsites — ServiceCard.jsx, ServiceGallery.jsx, MaterialSingle.jsx — so the print surface ships gracefully without photos (D-11 Placeholder fallback)
  - Section composition into both /styles + /3d-printing pages — Projects.jsx (grid: anchor link + ServicesGrid + TrustCopyBlock + MaterialsSection + FAQ) and ProjectSingle.jsx (detail: anchor link + Header + Gallery + Info + TrustCopy + Materials + FAQ + WontMake)
  - "See materials ↓" anchor links (MAT-01) on grid + detail pages, scrolling to id="materials" via text-accent CTA token
  - /materials redirect — React Router `<Navigate to="/styles#materials" replace />` (SPA hops) + Netlify `public/_redirects` 301 (deploy-time, search engines)
  - jest.mock shim for `./utilities/sanityImage` in App.test.js so the smoke test doesn't pull `@sanity/image-url` ESM through the require chain (Rule 3 fix triggered when MaterialSingle joined SanityImage)
affects: [02-03-visual-spruce, 02-04-trust-copy-and-SEO-mounting, 02-05-contact-shop-cleanup-readme]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-service section components consume serviceKey from props, NOT from useServices() — keeps them composable on the grid page (which IS inside ServicesProvider) and the detail page (also inside ServicesProvider via the shared composition)"
    - "Inner-component pattern for context-reading in detail page: ServiceDetailComposition wraps the section list so it can call useSingleService() inside the SingleServiceProvider boundary"
    - "Native <details>/<summary> for FAQ accordion — zero-JS, keyboard-accessible (Tab + Enter/Space) by default; no portable-text library introduced"
    - "Plain-text portable-text rendering — `block.children.map(c => c.text).join('')` per block as a <p>; deferred rich-text styling to v2 (would require @portabletext/react which CONTEXT.md doesn't authorize)"
    - "Two-layer redirect for legacy routes — Netlify public/_redirects (deploy-level 301) + React Router <Navigate replace> (client-level SPA hops); kept in sync via comments in both files"

key-files:
  created:
    - "src/components/services/MaterialsSection.jsx"
    - "src/components/services/FAQ.jsx"
    - "src/components/services/WontMake.jsx"
    - "src/components/services/TrustCopyBlock.jsx"
    - "public/_redirects"
  modified:
    - "src/components/services/ServiceCard.jsx (SanityImage adoption; signature change: imageUrl/imageAlt → listImage; reads serviceKey from useServices() for placeholder caption variant)"
    - "src/components/services/ServiceGallery.jsx (SanityImage in thumbnails + modal; loading=eager for modal; preserved Phase-1 useState-driven modal)"
    - "src/components/services/ServicesGrid.jsx (consumer-side: passes listImage={entry.listImage} to align with ServiceCard's new prop shape)"
    - "src/materials/MaterialSingle.jsx (SanityImage adoption; image prop changes from string URL to Sanity source object; alt fallback chain)"
    - "src/pages/Projects.jsx (grid page: anchor link + TrustCopyBlock + MaterialsSection + FAQ composed inside ServicesProvider)"
    - "src/pages/ProjectSingle.jsx (detail page: anchor link + inner ServiceDetailComposition that reads turnaround/wontMakeScope from useSingleService and threads to TrustCopyBlock + WontMake)"
    - "src/App.js (replaced /materials route element with <Navigate to=\"/styles#materials\" replace />; removed `import Materials` and the lint-silencing `void Navigate`)"
    - "src/App.test.js (Rule 3 fix: jest.mock for ./utilities/sanityImage to short-circuit the @sanity/image-url ESM dep through MaterialSingle's new chain)"
  deleted: []

key-decisions:
  - "DEVIATION honored from Plan 02-01: MaterialsSection GROQ uses `$serviceKey in services` (the new material.services field) — NOT D-06 ref-array `$serviceKey in processes[]->key` and NOT D-07 string-array `$serviceKey in processes`. Both prior decisions are superseded; the deviation is documented inline in MaterialsSection.jsx comments + this SUMMARY."
  - "D-04 honored: per-service section components branch on data presence (empty-state) but never on serviceKey value — no `if (serviceKey === 'shop')` etc."
  - "D-08 honored: zero new Tailwind tokens. Anchor link reuses text-accent + hover:text-accent-highlight (existing accent CTA budget). TrustCopyBlock reuses bg-secondary-section-dark + text-ternary-section-dark."
  - "D-11 honored: SanityImage routes empty image fields to Placeholder; placeholder caption varies by serviceKey ('3D print example coming soon' vs 'Laser cut example coming soon')."
  - "D-13 honored: TrustCopyBlock queries `studio-info[0]` for serviceArea + pickupAvailability + responseTimePromise."
  - "D-14 honored: per-service `turnaround` is threaded from singleService into TrustCopyBlock via prop; WontMake reads `wontMakeScope` from singleService."
  - "D-15 honored: FAQ filters `$serviceKey in service[]->key` (the reference-array pattern)."
  - "D-16 honored: every new section renders a graceful empty state when Sanity returns no rows; WontMake silently renders nothing rather than an empty-state."
  - "D-17 honored: /materials redirects via BOTH React Router <Navigate replace /> AND Netlify public/_redirects 301; in-page Materials section anchored at id='materials' on the new MaterialsSection wrapper."
  - "D-18 honored: SanityImage's alt fallback chain (`alt ?? source?.altText ?? source?.asset?.altText ?? ''`) is reused at every callsite; new callsites pass `image?.altText ?? title` as the alt prop."
  - "D-32 honored (wave atomicity): pnpm build succeeds, pnpm test passes, /styles + /styles/:slug routes still render, /3d-printing + /3d-printing/:slug routes resolve."

patterns-established:
  - "Section component contract: take serviceKey as prop, render `<section className='py-12 sm:py-24'>` with a `<h2>` headline + container, GROQ-fetch via useSanityQuery, render UI-SPEC empty-state copy verbatim when results are 0"
  - "Anchor-link placement: `<a href='#materials'>` lives in the page-level component (Projects.jsx, ProjectSingle.jsx), NOT inside the section components — keeps the link self-contained where future page redesigns can reposition it without touching the section"
  - "Inner-component context-reader: when a page needs to read a context value AND the context provider is its own immediate child, extract the consuming render into an inner functional component to satisfy React's hook-inside-provider boundary rule"

requirements-completed: [SVC-01, SVC-02, MAT-01, MAT-02, MAT-03, CNT-01, CNT-02, CNT-03]

# Metrics
duration: ~6 minutes (single sequential session, no checkpoint pause)
completed: 2026-05-06
---

# Phase 2 Plan 02: 3D Printing Surface Summary

**Composed four GROQ-backed service sections (MaterialsSection, FAQ, WontMake, TrustCopyBlock) onto both `/styles` and `/3d-printing` surfaces, adopted SanityImage with branded Placeholder fallback in three image callsites, added the MAT-01 "See materials ↓" anchor link, and replaced the legacy `/materials` route with a two-layer redirect (React Router `<Navigate replace>` + Netlify `public/_redirects` 301) — Wave 2 of 5.**

## Performance

- **Started:** 2026-05-06T18:51:40Z
- **Tasks 1–3 sequential, single session.**
- **Completed:** 2026-05-06T18:57:42Z (~6 minutes wall-clock)
- **Tasks:** 3 (all auto, no checkpoint)
- **Files created:** 5 (4 section components + public/_redirects)
- **Files modified:** 8 (3 service components, ServicesGrid, MaterialSingle, 2 page files, App.js, App.test.js)

## Accomplishments

- **Four in-page service section components** in `src/components/services/`:
  - `MaterialsSection.jsx` — `id="materials"` anchor target. GROQ filter `*[_type == "material" && $serviceKey in services]` per the Plan 02-01 deviation (NEW `material.services` field, NOT `processes`). Reuses `MaterialSingle` as-is. Empty-state copy ("Materials coming soon. We update this list as we add new stock. Contact us for special-order materials.") matches UI-SPEC verbatim.
  - `FAQ.jsx` — Native `<details>` / `<summary>`, no JS accordion library. GROQ filter `*[_type == "faq" && $serviceKey in service[]->key]`. Plain-text portable-text rendering. Empty-state copy matches UI-SPEC verbatim.
  - `WontMake.jsx` — Presentational portable-text renderer; receives `wontMakeScope` prop from parent. Silent absence (returns `null`) when scope is empty — no empty-state copy, per UI-SPEC. Heading "What we won't make".
  - `TrustCopyBlock.jsx` — Banded `bg-secondary-section-dark` panel rendering Turnaround (per-service prop) + Pickup + Service area + Response (last three from `studio-info[0]`). Returns `null` when nothing to show.

- **`SanityImage` adoption in 3 callsites** with `Placeholder` fallback (D-11):
  - `ServiceCard.jsx` — Signature changed: `imageUrl`/`imageAlt` (strings) → `listImage` (Sanity source object). Reads `serviceKey` from `useServices()` to vary the placeholder caption ("3D print example coming soon" vs "Laser cut example coming soon"). Updated consumer `ServicesGrid.jsx` to pass the object.
  - `ServiceGallery.jsx` — Both thumbnails AND modal use `SanityImage`. Modal sets `loading="eager"` (user-triggered). Preserved the Phase-1 `useState`-driven modal (no `document.getElementById` regression). Thumbnails get `aspect-[4/3]` per UI-SPEC.
  - `MaterialSingle.jsx` — `image` prop changes from string URL to Sanity source object. Alt fallback chain `image?.altText ?? title`. Caption template `${title} photo coming soon`.

- **Section composition on both pages**:
  - `Projects.jsx` (grid, mounts on both `/styles` and `/3d-printing`) — anchor link → `ServicesGrid` → `TrustCopyBlock` → `MaterialsSection` → `FAQ`. The "what we won't make" section is intentionally omitted (per-style concern). `TrustCopyBlock` receives no `turnaround` prop on the grid page; it returns `null` if no `studio-info` facts have loaded.
  - `ProjectSingle.jsx` (detail, mounts on `/styles/:slug` and `/3d-printing/:slug`) — anchor link → `ServiceHeader` → `ServiceGallery` → `ServiceInfo` → `TrustCopyBlock turnaround={turnaround}` → `MaterialsSection` → `FAQ` → `WontMake wontMakeScope={wontMakeScope}`. Inner `ServiceDetailComposition` component calls `useSingleService()` inside the provider boundary.

- **MAT-01 "See materials ↓" anchor link** on both grid and detail pages — `text-accent hover:text-accent-highlight font-general-medium underline-offset-4 hover:underline inline-block mb-6`. No new tokens (D-08).

- **Two-layer `/materials` redirect** (D-17):
  - `src/App.js`: `<Route path="/materials" element={<Navigate to="/styles#materials" replace />} />`. Removed eager `import Materials` and the Plan 01 `void Navigate` lint silencer.
  - `public/_redirects`: `/materials  /styles#materials  301`. Verified `pnpm build` copies it to `build/_redirects`.

- **Jest fix (Rule 3 deviation)** — Once `MaterialSingle.jsx` started importing `SanityImage`, the smoke test's require chain `App.test.js → App.js → Materials → MaterialSingle → SanityImage → @sanity/image-url` broke because Jest 27 (CRA 5) doesn't transform that ESM dep. Added a focused `jest.mock` of `./utilities/sanityImage` (the thin `urlFor`/`urlAt` wrapper) to `App.test.js`. The smoke test's purpose is routing + nav; image rendering is out of scope.

## Task Commits

Each task committed atomically:

1. **Task 1 — 4 section components** — `87e84d1` (feat)
2. **Task 2 — SanityImage adoption + Jest mock** — `e5bbe99` (feat, includes Rule 3 fix)
3. **Task 3 — Section composition + redirect** — `89a8db1` (feat)

## Files Created / Modified / Deleted

**Created (5)**
- `src/components/services/MaterialsSection.jsx`
- `src/components/services/FAQ.jsx`
- `src/components/services/WontMake.jsx`
- `src/components/services/TrustCopyBlock.jsx`
- `public/_redirects`

**Modified (8)**
- `src/components/services/ServiceCard.jsx` — SanityImage adoption + signature change
- `src/components/services/ServiceGallery.jsx` — SanityImage thumbnails + modal
- `src/components/services/ServicesGrid.jsx` — pass listImage object to ServiceCard
- `src/materials/MaterialSingle.jsx` — SanityImage adoption + image-prop shape change
- `src/pages/Projects.jsx` — anchor link + 3 new sections composed
- `src/pages/ProjectSingle.jsx` — anchor link + 4 new sections + inner composition pattern
- `src/App.js` — `/materials` Navigate redirect; removed Materials import + lint silencer
- `src/App.test.js` — jest.mock for ./utilities/sanityImage (Rule 3 fix)

**Deleted**
- None (Plan 05 owns the legacy `src/pages/Materials.jsx` deletion per VIS-05)

## Decisions Made

All decisions for this plan flow from Plan 02-CONTEXT.md (D-13, D-14, D-15, D-17, D-18) and the Plan 02-01 Task 4 deviation, all honored:

- **GROQ deviation honored** (the most important call): `MaterialsSection.MATERIALS_QUERY` reads `$serviceKey in services`, NOT D-06's `processes[]->key` ref-array path and NOT D-07's `processes` string-array path. The deviation is captured in an inline comment in `MaterialsSection.jsx` referencing `02-01-SUMMARY.md` Deviations §1 + `02-SCHEMA-SPEC.md`.
- **`<details>`/`<summary>` for FAQ** — zero-JS, keyboard-accessible by default. No accordion library introduced. RESEARCH §"Don't Hand-Roll" recommendation honored.
- **Plain-text portable-text rendering** for FAQ answers + WontMake — `block.children.map(c => c.text).join('')`. Rich-text styling deferred to v2 (would require `@portabletext/react`, not authorized for Phase 2). PATTERNS limitation documented; see Issues Encountered.
- **Inner-component composition pattern** in `ProjectSingle.jsx` so the section-list render can call `useSingleService()` inside the provider boundary. The outer `ProjectSingle` keeps the motion wrapper + provider tree; the inner `ServiceDetailComposition` reads context and renders.
- **Two-layer redirect** for `/materials` — both Netlify (`public/_redirects` for deploy-time 301) and React Router (`<Navigate replace />` for SPA hops). Comments in both files explain the duplication.
- **Anchor link placement** at the page level (not inside section components) — keeps the link self-contained where future page redesigns can reposition or duplicate it without modifying the per-service section components.
- **No new Tailwind tokens** (D-08) — anchor link uses `text-accent` + `hover:text-accent-highlight` (existing accent CTA budget); TrustCopyBlock uses `bg-secondary-section-dark` + `text-ternary-section-dark` (existing banded-panel idiom from QuickInfo).

## Deviations from Plan

### 1. [Plan-mandated GROQ override] `MaterialsSection.MATERIALS_QUERY` uses `$serviceKey in services` (not D-06/D-07)

- **Source:** Plan 02-01 Task 4 owner-approved deviation (recorded in `02-01-SUMMARY.md` Deviations §1 + STATE.md `Accumulated Context`).
- **What:** The plan's Task 1 action block hard-codes the GROQ as `*[_type == "material" && $serviceKey in processes[]->key]` (D-06 form) with a fallback comment pointing to `processes` (D-07 form). Both are obsolete per the Plan 02-01 spike — Sanity's existing `material.processes` field stores laser-cutting operations (`Cut`, `engrave`, `etch`), NOT service-compatibility tags.
- **Resolution:** Used `*[_type == "material" && $serviceKey in services]`. The new `material.services` field (string array of `laser` | `print` | `both`) is the canonical source of service compatibility, owner-managed in Sanity Studio.
- **Inline reference:** `MaterialsSection.jsx` comment block above the GROQ explains the deviation and links to `02-01-SUMMARY.md` + `02-SCHEMA-SPEC.md`.
- **Owner-prep status:** Owner is independently updating Sanity Studio to add the `services` field and backfill existing materials with `services: ["laser"]`. Until that lands, `MaterialsSection`'s GROQ returns an empty array and the section gracefully shows the "Materials coming soon" empty state — Wave 2's atomicity invariant ("site builds and laser routes still work") holds either way.
- **Committed in:** `87e84d1` (Task 1).

### 2. [Rule 3 - Blocking] `App.test.js` jest.mock for `./utilities/sanityImage`

- **Found during:** Task 2 verification step (`pnpm test -- --watchAll=false` failed).
- **Issue:** Once `MaterialSingle.jsx` started importing `SanityImage`, the test's require chain became `App.test.js → App.js → import Materials → Materials.jsx → MaterialSingle → SanityImage → sanityImage.jsx → @sanity/image-url (ESM)`. Jest 27 (CRA 5) without `transformIgnorePatterns` can't parse that ESM, so the test suite failed to compile.
- **Why this is Rule 3, not a plan failure:** The plan explicitly lists `MaterialSingle.jsx` for SanityImage adoption in Task 2 and Task 3 removes the `import Materials` from `App.js`. But the Materials chain isn't the only path — `ServiceCard` and `ServiceGallery` also reach `SanityImage` via `Projects.jsx` and `ProjectSingle.jsx`, both lazy-loaded but still discoverable by Jest's module resolver depending on traversal order. The mock is needed regardless.
- **Resolution:** Added a focused `jest.mock('./utilities/sanityImage', () => ({ ... }))` shim in `App.test.js` that returns no-op `urlFor`/`urlAt` stubs. Smoke test (whose purpose is routing + nav) doesn't need real image URL building.
- **Alternatives considered:**
  - Adding `transformIgnorePatterns: ['node_modules/(?!(@sanity/image-url)/)']` to a CRA jest config — requires `craco`/eject or jest-cli override; introduces config surface.
  - Moving the SanityImage adoption to a per-component shim — defeats the purpose of using SanityImage everywhere (D-11 graceful degradation).
- **Committed in:** `e5bbe99` (Task 2, alongside the SanityImage adoption).

---

**Total deviations:** 2 — 1 plan-mandated GROQ override (carried forward from Plan 02-01), 1 Rule 3 jest mock to keep the smoke test passing after `SanityImage` joined `MaterialSingle`'s import graph.
**Impact on plan:** None on success criteria. Both deviations are documented inline in their respective source files for future readers.

## Acceptance Criteria Status

Verifying each truth from this plan's `must_haves.truths`:

- [x] **Wave atomicity (D-32):** `pnpm test -- --watchAll=false` passes (smoke test); `pnpm build` succeeds and copies `_redirects` to `build/_redirects`. Existing `/styles` + `/styles/:slug` routes render laser content without regression — verified by smoke test passing after each task commit.
- [x] **/3d-printing route resolves** and renders the print-style grid (or graceful "Materials coming soon" / "FAQ coming soon" empty-states until owner publishes print-style + faq docs in Sanity).
- [x] **/3d-printing/:slug route resolves** and renders the detail page with the seven-section composition (anchor + Header + Gallery + Info + TrustCopy + Materials + FAQ + WontMake).
- [x] **/styles still works without regression** — laser detail pages now also include the four new in-page sections, filtered by `serviceKey='laser'`.
- [x] **/materials redirects to /styles#materials in TWO ways:** React Router `<Navigate to="/styles#materials" replace />` for in-SPA hops + `public/_redirects` line `/materials  /styles#materials  301` for Netlify direct hits. Verified `build/_redirects` exists post-build.
- [x] **Each service detail page contains an in-page Materials section anchored at id="materials"** — verified by `grep -q 'id="materials"' src/components/services/MaterialsSection.jsx`. GROQ uses the post-deviation `$serviceKey in services` form.
- [x] **MAT-01 anchor link present** in BOTH `Projects.jsx` AND `ProjectSingle.jsx` — `<a href="#materials">See materials ↓</a>` with `text-accent` + `font-general-medium` styling per UI-SPEC.
- [x] **FAQ section** — uses native `<details>`/`<summary>`, GROQ filters by `$serviceKey in service[]->key`, graceful "FAQ coming soon" empty-state.
- [x] **WontMake section** — renders portable text from `singleService.wontMakeScope`, returns `null` when empty (silent absence per UI-SPEC).
- [x] **TrustCopyBlock** surfaces all four trust facts: per-service `turnaround` (prop) + `pickupAvailability` + `serviceArea` + `responseTimePromise` (from `studio-info[0]`). Returns `null` when nothing to show.
- [x] **ServiceCard + ServiceGallery use SanityImage with placeholder fallback** — caption varies by `serviceKey` ('3D print example coming soon' vs 'Laser cut example coming soon').

## Issues Encountered

**Plain-text portable-text rendering limitation (PATTERNS Open Question)** — `FAQ.jsx` and `WontMake.jsx` render portable-text blocks as plain `<p>` elements via `block.children.map(c => c.text).join('')`. If owner copy in Sanity uses bold, italic, links, or list marks (`marks: ['strong', 'em', 'link']`, list types), they will render as flat text without formatting. This is acceptable for Phase 2 — owner can ship plain prose answers and v2 can layer in `@portabletext/react` if rich formatting is needed. CONTEXT.md does not authorize the dep for this phase.

**Slug shape uncertainty (carried over from Plan 02-01)** — `SingleServiceContext.jsx` retains the defensive fallback `services.find((s) => s.slug?.current === slug || s.slug?.includes?.(slug))`. Plan 02-02 did NOT spike-confirm the actual Sanity shape. If a future plan executes against a deploy preview, that's the chance to drop the unused branch.

**Manual /3d-printing verification deferred** — The plan's verification §9 ("manual verification at deploy preview") was NOT performed in this plan because (a) it requires owner to publish at least one `print-style` doc + relevant `faq` + `studio-info` content in Sanity for full visual confirmation, and (b) the smoke test + build success already prove the routes resolve and render without regression. Owner ack on the schema rollout (`02-01-SUMMARY.md` Owner-side prep §) will trigger the deploy-preview pass. Empty-state copy paths are exercised by the smoke test rendering with the mocked-empty Sanity client.

**`<details>`/`<summary>` keyboard accessibility — not regression-tested in this plan** — The element is keyboard-accessible by default (Tab + Enter/Space toggle). UI-SPEC notes this as a confirmed property; no manual Tab+Enter test was performed in this session. If a future a11y audit catches a regression, that's the place to revisit (e.g., screen-reader announcement of state change).

## User Setup Required

**No new owner-side setup beyond what Plan 02-01 already documented.**

The Plan 02-01 SUMMARY's "User Setup Required" §1–9 still applies: owner must apply schemas in `02-SCHEMA-SPEC.md` to Sanity Studio. Plan 02-02's components render the loading/empty states gracefully while owner is mid-rollout — no execution ordering constraint. Once owner publishes:

- `material` docs with `services: [...]` populated → `MaterialsSection` will render real material cards (filtered by serviceKey).
- `faq` docs with `service[]` references → `FAQ` will render real items.
- `studio-info[0]` doc with `serviceArea`, `pickupAvailability`, `responseTimePromise` filled → `TrustCopyBlock` will render the trust trio.
- Per-style `turnaround` and `wontMakeScope` on `laser-style`/`print-style` docs → detail pages will render the per-service overrides.
- At least one `print-style` doc → `/3d-printing` and `/3d-printing/:slug` will render real content beyond placeholder cards.

## Next Phase Readiness

**Wave 3 (Plan 02-03 — Visual spruce sweep) is unblocked.**

Wave 3 owns:
- `AppBanner` dual-service hero copy
- `AppHeader` peer-equal nav with active-state (and the `/3d-printing` nav link)
- `NotFound` /404 page
- `/shop` route added (Coming Soon stub)
- `bg-indigo-500` → `text-accent` template-residue swap across 4 sites (still present in `ContactForm.jsx` per the Wave 2 verification — confirmed)
- `target="__blank"` typo + `rel="noopener"` fixes
- `AboutMe` + `QuickInfo` touches

**No deploy-blocking debt left by Wave 2.** The site is in a deployable state — laser routes work, print routes resolve, `/materials` redirects, smoke test passes.

**Plan 02-02 complete. Wave 2 of 5.**

---
*Phase: 02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub*
*Completed: 2026-05-06*

## Self-Check: PASSED

All claimed artifacts verified on disk (5 created files + 8 modified files), and all three task commits found in git log:

- `87e84d1` — Task 1 (4 in-page section components: MaterialsSection, FAQ, WontMake, TrustCopyBlock)
- `e5bbe99` — Task 2 (SanityImage adoption in ServiceCard/ServiceGallery/MaterialSingle + jest.mock fix)
- `89a8db1` — Task 3 (section composition into Projects + ProjectSingle, /materials redirect via Navigate + public/_redirects)

`pnpm build` succeeds and copies `public/_redirects` to `build/_redirects`. `pnpm test -- --watchAll=false` passes. Wave atomicity invariant (D-32) holds — no laser regression, /3d-printing routes resolve, /materials redirects at both layers.
