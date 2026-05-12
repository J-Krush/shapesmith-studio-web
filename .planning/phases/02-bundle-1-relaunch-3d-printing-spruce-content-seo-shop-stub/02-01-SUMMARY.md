---
phase: 02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub
plan: 01
subsystem: foundations
tags: [sanity, react-helmet-async, sanity-image-url, react-router, services-context, schema-spec, seo, jsonld]

# Dependency graph
requires:
  - phase: 01-foundation-refactor-env-pinning
    provides: useSanityQuery hook, SERVICES constant (laser + print already declared), pinned Node 20 + pnpm 9, dark-only commitment, smoke-test scaffold
provides:
  - Sanity Studio schema spec doc (`02-SCHEMA-SPEC.md`) covering `process` enum, NEW `material.services` field, `studio-info` singleton, `print-style` schema, `laser-style` extension, `faq` schema — single doc owner pastes into Studio
  - `@sanity/image-url@^2.1.1` and `react-helmet-async@^2.0.5` installed at pinned versions (resolved 2.1.1 / 2.0.5 in `pnpm-lock.yaml`)
  - Generalized `ServicesContext` + `SingleServiceContext` parameterized by `serviceKey` — replaces `ProjectsContext`/`SingleProjectContext` (clean rip per D-03)
  - `src/components/projects/` → `src/components/services/` rename with 5 generalized files (`ServicesGrid`, `ServiceCard`, `ServiceGallery`, `ServiceHeader`, `ServiceInfo`); 2 orphaned files deleted
  - `src/pages/Projects.jsx` and `src/pages/ProjectSingle.jsx` accept a `serviceKey` prop and wrap in `<ServicesProvider serviceKey={serviceKey}>` (and `<SingleServiceProvider>` for the detail page)
  - `src/App.js` wraps the tree in `<HelmetProvider>` and iterates `SERVICES.map` to declare `/styles` + `/3d-printing` routes (param normalized to `:slug`)
  - Four shared scaffolds: `SanityImage` (responsive `srcSet` + lazy + Placeholder fallback), `Placeholder` (branded D-11 token-locked), `SEOHead` (per-route `<Helmet>` wrapper), `JsonLdLocalBusiness` (homepage `LocalBusiness` JSON-LD reading `studio-info` singleton)
  - Resolution of CONTEXT.md D-06 / D-07 ambiguity for `material.processes` shape — owner verified, deviation captured (see Deviations section)
affects: [02-02-bundle-1-MaterialsSection-FAQ-WontMake-TrustCopyBlock, 02-03-visual-spruce, 02-04-trust-copy-and-SEO-mounting, 02-05-contact-shop-cleanup-readme, phase-3-quote-tool, phase-5-shop]

# Tech tracking
tech-stack:
  added:
    - "@sanity/image-url@^2.1.1 (resolved 2.1.1) — Sanity image URL builder for responsive srcSet"
    - "react-helmet-async@^2.0.5 (resolved 2.0.5) — per-route SEO meta + JSON-LD injection"
  patterns:
    - "ServicesContext parameterized by serviceKey — one provider, one shared GROQ projection (D-05) covers both `laser-style` and `print-style` types"
    - "SERVICES.map-driven routing — `/styles` and `/3d-printing` declared from a single iteration in App.js (no per-service route duplication)"
    - "SanityImage wraps imageUrlBuilder with explicit DEFAULT_WIDTHS = [400, 800, 1200, 1600] srcSet + Placeholder fallback for empty image fields (D-11)"
    - "SEOHead via react-helmet-async — props-driven (title/description/ogImage/ogUrl/noindex), used for both static-route hardcoded defaults and Sanity-driven content routes"
    - "JsonLdLocalBusiness self-fetches studio-info via useSanityQuery; JSON.stringify(ld) auto-escapes </script> for the JSON-LD injection mitigation (T-02-01-01)"

key-files:
  created:
    - ".planning/phases/02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub/02-SCHEMA-SPEC.md"
    - "src/context/ServicesContext.jsx"
    - "src/context/SingleServiceContext.jsx"
    - "src/components/services/ServicesGrid.jsx"
    - "src/components/services/ServiceCard.jsx"
    - "src/components/services/ServiceGallery.jsx"
    - "src/components/services/ServiceHeader.jsx"
    - "src/components/services/ServiceInfo.jsx"
    - "src/utilities/sanityImage.jsx"
    - "src/components/shared/SanityImage.jsx"
    - "src/components/shared/Placeholder.jsx"
    - "src/components/shared/SEOHead.jsx"
    - "src/components/shared/JsonLdLocalBusiness.jsx"
  modified:
    - "src/App.js (HelmetProvider wrap + SERVICES.map routing + :slug param normalization)"
    - "src/pages/Projects.jsx (accepts serviceKey prop, wraps in ServicesProvider)"
    - "src/pages/ProjectSingle.jsx (accepts serviceKey prop, wraps in ServicesProvider + SingleServiceProvider)"
    - "package.json (+@sanity/image-url, +react-helmet-async; styled-components preserved for Plan 05)"
    - "pnpm-lock.yaml (resolved transitive deps for the two new packages)"
  deleted:
    - "src/context/ProjectsContext.jsx (D-03 clean rip — replaced by ServicesContext)"
    - "src/context/SingleProjectContext.jsx (D-03 clean rip — replaced by SingleServiceContext)"
    - "src/components/projects/ (entire directory — 5 files renamed into services/, 2 orphaned files deleted)"

key-decisions:
  - "D-01..D-05 honored: generalized ServicesContext over parallel PrintsContext; clean-rip migration sequence; identical-only generalization; shared GROQ projection parameterized by `_type`"
  - "D-08 honored: zero new tokens added to tailwind.config.js; Placeholder uses only existing locked tokens (bg-secondary-section-dark, text-ternary-section-dark, aspect-square, rounded-xl)"
  - "D-11 honored: branded Placeholder component renders intentional 'Image coming soon' caption when Sanity image field is empty — never broken-image"
  - "D-13 honored: studio-info singleton declared in 02-SCHEMA-SPEC.md (§3) with all JSON-LD fields and placeholder copy"
  - "D-14 honored: laser-style + print-style schemas declared in 02-SCHEMA-SPEC.md with `turnaround`, `wontMakeScope`, `seo` fields mirrored across both"
  - "D-15 honored: faq schema declared in 02-SCHEMA-SPEC.md (§6) with `service` reference array → process enum"
  - "D-16 honored: placeholder copy strategy documented in 02-SCHEMA-SPEC.md for studio-info, print-style, laser-style extension"
  - "D-18 honored: SanityImage alt fallback chain (`alt ?? source?.altText ?? source?.asset?.altText ?? ''`) — never empty/filename"
  - "D-19 honored: react-helmet-async pinned to ^2.0.5 (NOT ^3.x — too new); SEOHead scaffold declares the per-page meta contract"
  - "D-20 honored: SEOHead supports an `ogImage` prop with a studio-branded fallback path; Plan 04 wires per-doc Sanity overrides"
  - "T-02-01-01 mitigated: JsonLdLocalBusiness uses JSON.stringify(ld) for the script-block injection mitigation"
  - "DEVIATION resolved: `material.processes` shape mismatch (Vision-confirmed laser-operations, not service tags) → adopted NEW `material.services` string-array field instead of D-06/D-07 paths"

patterns-established:
  - "Pattern 1 — Generalized ServicesContext: parameterized by `serviceKey`, throws on unknown keys, exposes `{ serviceKey, service, services, loading, error, refetch }` to consumers via useServices()"
  - "Pattern 2 — Defensive slug lookup in SingleServiceContext: handles both `slug.current` (object form) and `slug.includes` (string form) until Wave 1 spike confirms the actual Sanity shape"
  - "Pattern 3 — SERVICES.map routing: each SERVICES entry produces both list (`/${urlSegment}`) and detail (`/${urlSegment}/:slug`) routes from a single map iteration in App.js"
  - "Pattern 4 — SanityImage with DEFAULT_WIDTHS srcSet: 400/800/1200/1600 widths, auto('format').quality(80), Placeholder fallback when source.asset is missing"
  - "Pattern 5 — JSON-LD injection via JSON.stringify: prevents </script> breakout in studio-info-driven JsonLdLocalBusiness"

requirements-completed: [SVC-04, SVC-05, VIS-04, CNT-04, SEO-01]

# Metrics
duration: ~2h (across multiple sessions including the human-verify checkpoint pause)
completed: 2026-05-06
---

# Phase 2 Plan 01: Foundations Summary

**Generalized ServicesContext + clean rip of ProjectsContext, four shared SEO/image scaffolds (`SanityImage`, `Placeholder`, `SEOHead`, `JsonLdLocalBusiness`), `@sanity/image-url` + `react-helmet-async` pinned, and the canonical Sanity schema spec doc — Wave 1 of 5.**

## Performance

- **Started:** 2026-05-05 (Tasks 1–3 sequential session)
- **Tasks 1–3 completed:** 2026-05-06T17:38:00Z (commits b554335, 5d54082, c6440f9)
- **Checkpoint pause:** 2026-05-06T17:38Z → owner ran Sanity Vision query and reported a deviation
- **Plan finalization:** 2026-05-06 (this commit set)
- **Tasks:** 4 (3 auto + 1 human-verify checkpoint)
- **Files created/modified:** 14 source files + 1 schema-spec doc + 1 pkg manifest + 1 lockfile

## Accomplishments

- **Schema spec doc** (`02-SCHEMA-SPEC.md`) — single document the owner pastes into Sanity Studio. Covers `process` enum, NEW `material.services` field (post-deviation), `studio-info` singleton with placeholder copy, `print-style` schema, `laser-style` 3-field extension (`turnaround`, `wontMakeScope`, `seo`), `faq` schema. Includes verification queries and an 8-step rollout checklist.
- **Package install at pinned versions** — `@sanity/image-url@^2.1.1` (resolved 2.1.1) and `react-helmet-async@^2.0.5` (resolved 2.0.5). `react-helmet-async` deliberately NOT v3.x per D-19 (RESEARCH §"Pitfall 7" — too new for production).
- **Generalized context layer (D-01..D-05 + D-03 clean rip)** — `ServicesContext` parameterized by `serviceKey`, plus `SingleServiceContext` derived from it. Old `ProjectsContext.jsx` and `SingleProjectContext.jsx` deleted with no compat shim. Shared GROQ projection in one place (D-05) — projects all fields that exist on both `laser-style` and `print-style` (turnaround, wontMakeScope, seo, listImage, detailImages, etc.). `useSanityQuery` (Phase 1) used for the fetch — no inline `sanityClient.fetch` patterns introduced.
- **Directory rename** — `src/components/projects/` → `src/components/services/`. Five files renamed and generalized (`ProjectsGrid`→`ServicesGrid`, `ProjectSingle`→`ServiceCard`, `ProjectGallery`→`ServiceGallery`, `ProjectHeader`→`ServiceHeader`, `ProjectInfo`→`ServiceInfo`). Two orphaned files (`ProjectsFilter.jsx`, `ProjectRelatedProjects.jsx`) deleted (per D-29 scope-narrow exception — they could not survive the directory rename).
- **Page generalization** — `src/pages/Projects.jsx` and `src/pages/ProjectSingle.jsx` accept a `serviceKey` prop and wrap in the new providers. The page files retain their original names (rename to a service-neutral name is deferred to Plan 05's cleanup wave).
- **Routing** — `src/App.js` wraps the tree in `<HelmetProvider>` (outermost — outside `<AnimatePresence>` per RESEARCH §"Pattern 4 HelmetProvider placement") and iterates `SERVICES.map` to declare `/styles`, `/styles/:slug`, `/3d-printing`, `/3d-printing/:slug` from one block. Route param normalized to `:slug` (was `:capability`) per RESEARCH §"Pattern 3 Note 2".
- **Four shared scaffolds (not yet mounted)** — `SanityImage`, `Placeholder`, `SEOHead`, `JsonLdLocalBusiness`. They compile and pass smoke tests. Plans 02–04 wire them into real surfaces.
- **Deviation captured & resolved** — Plan 02-01 Task 4 checkpoint resolved with the owner. See Deviations section below for the full record.

## Task Commits

Each task committed atomically:

1. **Task 1 — Sanity schema spec doc + package install + HelmetProvider mount** — `b554335` (feat)
2. **Task 2 — ServicesContext + SingleServiceContext, services/* rename, page generalization, clean rip** — `5d54082` (refactor)
3. **Task 3 — SanityImage + Placeholder + sanityImage utility + SEOHead + JsonLdLocalBusiness scaffolds** — `c6440f9` (feat)
4. **Task 4 — [CHECKPOINT] Owner verified `material.processes` shape** — `07cdc53` (docs: pause-at-checkpoint marker) → resolved via deviation in `c175a90` (see below)

**Schema-spec deviation:** `c175a90` (docs: correct schema spec — material.services)
**Plan metadata:** [this commit] (docs: complete foundations plan)

## Files Created / Modified / Deleted

**Created**
- `.planning/phases/02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub/02-SCHEMA-SPEC.md` — owner-prep schema doc (revised post-deviation)
- `src/context/ServicesContext.jsx` — generalized provider parameterized by `serviceKey`
- `src/context/SingleServiceContext.jsx` — single-service detail, derived from ServicesContext, defensive slug lookup
- `src/components/services/{ServicesGrid,ServiceCard,ServiceGallery,ServiceHeader,ServiceInfo}.jsx` — generalized renames
- `src/utilities/sanityImage.jsx` — `urlFor` + `urlAt` builder helpers
- `src/components/shared/SanityImage.jsx` — responsive `<img srcSet>` with Placeholder fallback + alt fallback chain
- `src/components/shared/Placeholder.jsx` — branded "Image coming soon" placeholder (D-11, locked tokens)
- `src/components/shared/SEOHead.jsx` — per-route Helmet wrapper (props-driven)
- `src/components/shared/JsonLdLocalBusiness.jsx` — `LocalBusiness` JSON-LD self-fetching `studio-info`

**Modified**
- `src/App.js` — `<HelmetProvider>` outermost wrap + `SERVICES.map`-driven route declaration; `:slug` param
- `src/pages/Projects.jsx` — accepts `serviceKey`, wraps in `<ServicesProvider serviceKey={serviceKey}>`
- `src/pages/ProjectSingle.jsx` — accepts `serviceKey`, nests `<ServicesProvider>` + `<SingleServiceProvider>`
- `package.json` — added `@sanity/image-url@^2.1.1`, `react-helmet-async@^2.0.5`
- `pnpm-lock.yaml` — transitive resolutions for the two new packages (e.g., `react-fast-compare`, `shallowequal` under react-helmet-async)

**Deleted**
- `src/context/ProjectsContext.jsx` — clean rip per D-03
- `src/context/SingleProjectContext.jsx` — clean rip per D-03
- `src/components/projects/` — entire directory removed (5 files renamed into `services/`, 2 orphaned files deleted: `ProjectsFilter.jsx`, `ProjectRelatedProjects.jsx`)

## Decisions Made

All decisions for this plan flow from CONTEXT.md (D-01..D-21) and were honored verbatim except for the Plan 02-01 Task 4 deviation — see the Deviations section below.

**Honored decisions cited in code:**

- **D-01:** `ServicesContext` is the one-pair-of-files providers covering both laser and print. `useServices()` returns `{ serviceKey, service, services, loading, error, refetch }`.
- **D-02:** Migration sequence: copy → wire new → repoint old → delete. Laser routes worked uninterrupted throughout — verified by smoke test passing after every commit.
- **D-03:** Clean rip — no compat shim from `ProjectsContext`/`SingleProjectContext` paths. `grep -r "ProjectsContext\|SingleProjectContext" src/` returns nothing.
- **D-04:** `ServicesContext` does not branch on service inside the provider. Per-service GROQ extensions (Plan 02-02 work) layer on top, not inside.
- **D-05:** Shared GROQ projection in `ServicesContext.jsx` parameterizes `_type` via `$sanityType`; only fields present on both `laser-style` AND `print-style` are projected (RESEARCH §Pitfall 3 — drift prevention).
- **D-08:** Zero new tokens added to `tailwind.config.js`. `Placeholder.jsx` uses only existing locked tokens.
- **D-11:** `Placeholder` renders an intentional, branded image-coming-soon block — never broken-image.
- **D-13:** `studio-info` singleton declared in `02-SCHEMA-SPEC.md` §3 with full field list and placeholder-copy table.
- **D-14:** `laser-style` 3-field extension (`turnaround`, `wontMakeScope`, `seo`) declared in §5; mirrored on `print-style` in §4.
- **D-15:** `faq` schema with `service` reference array declared in §6.
- **D-16:** Placeholder copy is committed in `02-SCHEMA-SPEC.md` for `studio-info`, `print-style`, `laser-style`.
- **D-18:** `SanityImage` alt fallback chain — `alt ?? source?.altText ?? source?.asset?.altText ?? ''` — no filenames, no stub strings.
- **D-19:** `react-helmet-async` pinned to `^2.0.5`. RESEARCH §"Pitfall 7" — `^3.0.0` is too new.
- **D-20:** `SEOHead` accepts an `ogImage` prop. Plan 04 wires the studio-branded fallback per route.

## Deviations from Plan

### 1. [DEVIATION] `material.processes` field semantics — adopted NEW `material.services` field instead of D-06/D-07

- **Found during:** Task 4 (human-verify checkpoint — owner ran Sanity Vision query)
- **Issue:** CONTEXT.md D-06 and D-07 both committed to migrating `material.processes` into a service-compatibility field (either reference array → `process` enum, or string array of `laser`/`print`/`both`). The owner's Sanity Vision query returned values like `["Cut", "engrave", "etch"]` — a flat string array of **laser-cutting operations**, NOT service compatibility tags. Both planned paths assumed wrong semantics.
- **Resolution (owner-approved):** Add a NEW field `services` to the `material` schema (string array of `laser` | `print` | `both`). Preserve the existing `processes` field as-is — it correctly documents laser operations and stays useful (and may be surfaced in future UI for laser-material detail). Backfill: every existing material gets `services: ["laser"]` (the current site is laser-only).
- **Impact on Wave 2:** `MaterialsSection.jsx` `MATERIALS_QUERY` filter must read `$serviceKey in services` — NOT `$serviceKey in processes[]->key` (D-06, obsolete) and NOT `$serviceKey in processes` (D-07, obsolete). Both prior paths are superseded.
- **Impact on `process` enum (§1):** Reduced scope — no longer used by `material`. Still required by `faq.service` references; kept in the spec.
- **Files modified:** `02-SCHEMA-SPEC.md` (deviation header note added near top; §1 scope-reduced; §2 fully replaced with `material.services` field addition + backfill instructions; §7 verification queries updated; §8 rollout checklist updated).
- **Verification:** Updated spec is internally consistent — `services` field referenced in §2, §7, §8; `processes` references retained only in the deviation note + §7 verification expectation that the laser-operation field is preserved alongside the new service field.
- **Committed in:** `c175a90` (`docs(02-01): correct schema spec — material.services (deviation from D-06/D-07)`)

### 2. [Rule 3 - Blocking, micro] Two orphaned files in the renamed directory

- **Found during:** Task 2 (services/* rename)
- **Issue:** `src/components/projects/ProjectsFilter.jsx` and `src/components/projects/ProjectRelatedProjects.jsx` lived in the directory being collapsed but were not part of the canonical 5-file rename set. Leaving them would have produced an empty `services/` parent ambiguity or a half-migrated `projects/` directory still in the tree.
- **Resolution:** Deleted both files at the same commit as the rename. Per the plan's explicit instruction (CONTEXT.md D-29 carve-out — Plan 05 owns dead-code purge generally, but the directory-collapse-collateral is in scope here).
- **Impact:** None — neither file was imported anywhere in `src/`. Smoke test passes; production build passes.
- **Committed in:** `5d54082` (Task 2 commit)

---

**Total deviations:** 2 — 1 owner-approved schema-direction change (Task 4 checkpoint resolution), 1 micro scope-narrow file deletion (planned in CONTEXT.md D-29).
**Impact on plan:** The schema deviation is documented end-to-end in `02-SCHEMA-SPEC.md` and recorded in STATE.md `Accumulated Context` so Wave 2's executor knows to use `$serviceKey in services` GROQ. No scope creep.

## Acceptance Criteria Status

Verifying each truth from this plan's `must_haves.truths`:

- [x] Phase 2 schema spec doc exists at `.planning/phases/02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub/02-SCHEMA-SPEC.md` covering `process` enum, NEW `material.services` field (post-deviation), `studio-info` singleton, `print-style` schema, `laser-style` extension, `faq` schema. (Deviation: §2 covers `material.services` instead of `material.processes` migration — owner-approved.)
- [x] `@sanity/image-url@^2.1.1` and `react-helmet-async@^2.0.5` are installed (verified in `package.json`); `pnpm-lock.yaml` shows resolved 2.1.1 / 2.0.5. `styled-components` NOT touched in this plan.
- [x] `ServicesContext` + `SingleServiceContext` exist, parameterized by `serviceKey`, using the shared GROQ projection. Old `ProjectsContext` + `SingleProjectContext` files are deleted (clean rip per D-03).
- [x] `src/components/projects/` → `src/components/services/` rename is complete; every file's contents are generalized (no laser-only hardcoded copy in renamed files).
- [x] `src/pages/Projects.jsx` and `src/pages/ProjectSingle.jsx` both accept a `serviceKey` prop and wrap in `<ServicesProvider serviceKey={serviceKey}>`.
- [x] `src/App.js` wraps the tree in `<HelmetProvider>` and iterates `SERVICES.map` to declare `/styles` + `/3d-printing` routes (each pointing at the same generalized Projects/ProjectSingle pages with different `serviceKey` props).
- [x] `SanityImage` component renders `<img srcSet>` via @sanity/image-url builder, falling back to `<Placeholder>` when `source.asset` is missing; alt text is read from `source.altText` or `asset.altText` (never empty/filename).
- [x] `SEOHead` and `JsonLdLocalBusiness` scaffolds exist with hardcoded Phase-2 defaults (real Sanity wiring happens in Plan 04).
- [x] Existing `/styles` route still works without regression — Phase 1 smoke test passes (re-confirmed after each Task commit).
- [x] **Wave atomicity (D-32):** `pnpm test -- --watchAll=false` passes (smoke test); `pnpm build` succeeds (each task included a `pnpm build` smoke). Existing `/styles` and `/styles/:slug` routes render laser content without regression.
- [x] **Owner has verified the actual shape of `material.processes` in Sanity (D-06 ref-array vs D-07 string-array fallback)** via the Plan 02-01 Task 4 checkpoint and **the outcome is recorded** in this SUMMARY (Deviations §1) before Wave 2 executes. The result is **neither A nor B** — see deviation: a NEW `material.services` field is being added; `processes` stays as-is.

`material.processes shape: DEVIATION — neither A nor B` — `processes` is a flat string array of laser-operation values (`Cut`, `engrave`, `etch`), NOT service-compatibility tags. Wave 2 must use a NEW `material.services` field with GROQ filter `$serviceKey in services`. Full deviation context: see Deviations §1 above and `02-SCHEMA-SPEC.md` §"Deviation from Plan 02-01 Task 4 Checkpoint".

## Issues Encountered

**Slug shape uncertainty (RESEARCH A2 / PATTERNS Open Question 1)** — Not verified during this plan. `SingleServiceContext` retains the defensive fallback `services.find((s) => s.slug?.current === slug || s.slug?.includes?.(slug))` that handles both object and string slug forms. A Wave 2 spike should confirm the actual Sanity shape and remove the unused branch.

**Smoke test status** — The Phase 1 smoke test (`src/App.test.js` per Phase 1 Plan 01-06) is the only regression sentinel for this rename. It passed after each task commit. No per-route render tests exist; that is deferred to a later phase per CONTEXT.md Deferred Items.

## User Setup Required

**External services require manual configuration.** The owner must apply the schemas in `02-SCHEMA-SPEC.md` to Sanity Studio **before Wave 2 (Plan 02-02) executes**:

1. Add the `process` schema (§1) and publish.
2. Create the two `process` enum docs (`key: "laser"`, `key: "print"`).
3. Add the new `services` field to the `material` schema (§2) and publish.
4. Backfill every existing material with `services: ["laser"]` (Vision patch mutation in §2, or per-doc edit in Studio).
5. Add the `studio-info` schema (§3), publish, create the singleton doc, fill placeholder copy from §3.
6. Add the `print-style` schema (§4), publish, create at least one starter doc (or accept "3D printing styles coming soon" empty state).
7. Extend the `laser-style` schema with the 3 new fields (§5); fill placeholder copy on every existing doc.
8. Add the `faq` schema (§6), publish, create 5–8 FAQ docs per service tagged with `process` references.
9. Run the verification queries in §7. Both `material.services` and `faq.service` should return populated rows.

**Owner ack expected:** When the rollout checklist (§8) is complete, post a confirmation in the project channel — Wave 2 (Plan 02-02) will read the actual Sanity data via `useSanityQuery` and render the new MaterialsSection / FAQ / WontMake / TrustCopyBlock sections.

The relaunch is **not blocked** on owner copy quality — placeholder copy exists for every Sanity-backed field per D-16. Owner can refine in Studio anytime without a redeploy.

## Next Phase Readiness

**Wave 2 (Plan 02-02) is unblocked**, with one constraint:

- Wave 2 executor must use the **`$serviceKey in services`** GROQ filter in `MaterialsSection.jsx` `MATERIALS_QUERY` — NOT the D-06 `processes[]->key` path and NOT the D-07 `processes` path.
- Wave 2 should also do a one-line spike to confirm Sanity slug shape (`current` vs string) and remove the unused branch in `SingleServiceContext.jsx`.

**Other readiness items:**

- Schema spec doc is canonical for owner Studio prep. Owner can begin Studio work in parallel with Wave 2's code work — no execution ordering constraint (Wave 2 components render the loading/empty states gracefully when Sanity data is sparse).
- All four shared scaffolds (`SanityImage`, `Placeholder`, `SEOHead`, `JsonLdLocalBusiness`) compile and are ready to be imported. Plan 02-02 mounts `SanityImage` on `ServiceCard` / `ServiceGallery` / `MaterialSingle`. Plan 02-04 mounts `SEOHead` and `JsonLdLocalBusiness` on real pages.

**Plan 02-01 complete. Wave 1 of 5.**

---
*Phase: 02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub*
*Completed: 2026-05-06*

## Self-Check: PASSED

All claimed artifacts verified on disk (18 files), three deletions confirmed (`src/context/ProjectsContext.jsx`, `src/context/SingleProjectContext.jsx`, `src/components/projects/` directory), and all five referenced commits found in git log:

- `b554335` — Task 1 (schema spec + packages + HelmetProvider mount)
- `5d54082` — Task 2 (ServicesContext + clean rip + services/* rename + page generalization)
- `c6440f9` — Task 3 (SanityImage + Placeholder + SEOHead + JsonLdLocalBusiness scaffolds)
- `07cdc53` — Task 4 checkpoint pause marker
- `c175a90` — schema spec deviation correction (this finalization)
