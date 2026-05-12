---
phase: 01-foundation-refactor-env-pinning
plan: 05
subsystem: data-layer
tags: [react, react-router, services-constant, refactor, capabilities-title, url-stability]

# Dependency graph
requires:
  - phase: 01-foundation-refactor-env-pinning
    provides: "Plan 03 (FOUND-03) post-dark-theme App.js + AppHeader.jsx baseline this plan edits on top of"
provides:
  - "Single SERVICES constant in src/data/services.js as source of truth for service metadata (key, urlSegment, navLabel, sanityType, contactSubject)"
  - "laser entry consumed by Phase 1; print entry declared and ready for Phase 2 to consume without schema changes"
  - "/styles and /styles/:capability routes preserved verbatim (URL stability invariant)"
  - "capabilitiesTitle symbol fully removed from src/ codebase"
affects: [phase-02-bundle-1-spruce-3d-printing, services-context-decision, vis-05-legacy-data-purge]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Service metadata constant array (SERVICES) keyed by 'laser' / 'print' — replaces single-symbol coupling"
    - "Consumer pattern: const laser = SERVICES.find((s) => s.key === 'laser') at top of component body"

key-files:
  created:
    - "src/data/services.js"
  modified:
    - "src/App.js"
    - "src/components/shared/AppHeader.jsx"
    - "src/components/projects/ProjectsFilter.jsx"
    - "src/components/projects/ProjectsGrid.jsx"
    - "src/data/projects.js"

key-decisions:
  - "SERVICES.find((s) => s.key === 'laser') invoked locally in each consumer (no Context wrapper) — D-14 defers ServicesContext-vs-parallel decision to Phase 2"
  - "capabilitiesTitle export deleted; six slug template literals in capabilitiesData inlined to literal 'styles' to keep the legacy array module-evaluable until VIS-05 (D-15) deletes it in Phase 2"
  - "Route param ':capability' name preserved (ProjectSingle reads useParams().capability — renaming would cascade)"
  - "App.js import path typo fixed in passing: '../src/data/projects' -> './data/services'"

patterns-established:
  - "URL segment derivation: <Route path={`/${laser.urlSegment}`} ... /> — derived, not hard-coded"
  - "Nav label derivation: aria-label + rendered text both read from laser.navLabel; existing Tailwind 'capitalize' class stays in place to render lowercase 'styles' as 'Styles'"

requirements-completed: [FOUND-02]

# Metrics
duration: 3m25s
completed: 2026-05-04
---

# Phase 01 Plan 05: SERVICES constant consolidation Summary

**Replaced the load-bearing `capabilitiesTitle = 'styles'` single-symbol coupling with a SERVICES constant array (laser + print) and migrated all four consumers; URL surface and nav label render identical to before.**

## Performance

- **Duration:** 3m25s
- **Started:** 2026-05-04T02:26:41Z
- **Completed:** 2026-05-04T02:30:06Z
- **Tasks:** 3 of 3 (Task 4 checkpoint substituted with build-smoke verification per parallel_execution prompt directive)
- **Files modified:** 5 (1 created, 4 modified, 1 modified twice across tasks)

## Accomplishments

- Created `src/data/services.js` exporting `SERVICES` with both `laser` (consumed in Phase 1) and `print` (Phase 2 hand-off) entries — five-key shape per CONTEXT.md D-12.
- Migrated all four `capabilitiesTitle` consumers (`App.js`, `AppHeader.jsx`, `ProjectsFilter.jsx`, `ProjectsGrid.jsx`) to read from `SERVICES.find((s) => s.key === 'laser')`.
- Deleted `export const capabilitiesTitle = 'styles';` from `src/data/projects.js`; inlined six `${capabilitiesTitle}` template-literal references inside the legacy `capabilitiesData` slug strings to literal `'styles'` (keeps the array module-evaluable until VIS-05 purges it).
- `pnpm build` exits 0 with zero new warnings; bundle inspection confirms `urlSegment: 'styles'` is compiled in.
- Codebase-wide `grep -r capabilitiesTitle src/` returns nothing.

## Task Commits

Each task was committed atomically on branch `worktree-agent-a6eb66f7074175148`:

1. **Task 1: Create `src/data/services.js`** — `08c2226` (feat)
2. **Task 2: Migrate the four `capabilitiesTitle` consumers to read from SERVICES** — `30e5a08` (refactor)
3. **Task 3: Delete `capabilitiesTitle` export from `src/data/projects.js` and verify build + slugs** — `9a2d730` (refactor)

Plan metadata commit: pending (orchestrator owns final SUMMARY commit per parallel-executor protocol).

## Files Created/Modified

- `src/data/services.js` — **created.** New `SERVICES` constant: `[{key:'laser', urlSegment:'styles', navLabel:'styles', sanityType:'laser-style', contactSubject:'Laser cutting'}, {key:'print', urlSegment:'3d-printing', navLabel:'3D Printing', sanityType:'print-style', contactSubject:'3D printing'}]`. Tab-indented per `src/data/projects.js` precedent.
- `src/App.js` — replaced legacy import + two `<Route path>` template literals to use `laser.urlSegment`. Also fixes `'../src/data/projects'` → `'./data/services'` import-path typo (PATTERNS.md flagged) in passing.
- `src/components/shared/AppHeader.jsx` — replaced legacy import + four touchpoints in mobile nav `<Link>` (lines ~81–87) and three in large-screen nav `<Link>` (lines ~134–139): `to`, `aria-label`, rendered text. `capitalize` Tailwind class preserved on both Link elements (renders lowercase `'styles'` as `Styles`).
- `src/components/projects/ProjectsFilter.jsx` — replaced legacy import + `All {capabilitiesTitle}` → `All {laser.navLabel}` in the default `<option>` text. (Existing double-quote import-string convention preserved.)
- `src/components/projects/ProjectsGrid.jsx` — replaced legacy import + `Laser Cutting {capabilitiesTitle}` → `Laser Cutting {laser.navLabel}` in the section heading.
- `src/data/projects.js` — deleted line 22 (`export const capabilitiesTitle = 'styles';`); inlined six `slug:` template-literal references in `capabilitiesData` items from `` `/${capabilitiesTitle}/<id>` `` → `` `/styles/<id>` ``. The legacy `capabilitiesData` array and the `import { ... } from './images';` block are intentionally preserved (D-15 — VIS-05 owns purge).

## Decisions Made

- **D-12 / D-13 / D-14 / D-15 honored verbatim** as specified in the plan. No architectural deviation, no ServicesContext generalization (D-14 explicitly deferred to Phase 2).
- **Inline 'styles' in legacy slugs:** Without inlining, deleting `capabilitiesTitle` would leave `${capabilitiesTitle}` references inside `capabilitiesData` that throw `ReferenceError` at module-eval time if the array is ever imported. Per the audit (`grep -rn capabilitiesData src/` returned only the export line itself), no consumer exists today — but inlining was done unconditionally per the plan's instruction to keep the module internally consistent.
- **Route param `:capability` name preserved** — `ProjectSingle.jsx` reads `useParams().capability`; renaming would cascade across the SingleProject context. The URL **segment** is what matters for stability, the param **name** is internal.

## Deviations from Plan

None — plan executed exactly as written. Audit step in Task 3 confirmed `capabilitiesData` has no other consumers (matching plan expectation), so the inlining proceeded unconditionally per plan instructions.

One **non-deviation** worth noting: the worktree had no `node_modules` at agent start, so `pnpm build` initially failed with `react-scripts: command not found`. Ran `pnpm install` (4.4s, 1310 packages, all reused from local store) before re-running the build. This is environment setup, not a code change — no commit was made for it. Subsequent builds in Tasks 1 and 3 succeeded.

## Issues Encountered

- **Trailing whitespace preservation in `ProjectsFilter.jsx`:** The Edit tool stripped a trailing space on the `className="font-general-medium "` line during the Task 2 edit. Plan was explicit: "DO NOT touch any other line in these four files." Restored the trailing byte via a Python `replace` to keep the diff minimal. Verified via `od -c` on the final byte sequence and via `git diff` showing only the three intended changes.

## Threat Flags

None — refactor of an internal constant introduces no new trust boundary, external input, auth surface, or DB schema change. Per plan's `<threat_model>` table, T-01-07 (Tampering / route path derivation) is `accept` and the disposition is unchanged from baseline.

## URL Stability Verification

- `urlSegment: 'styles'` (services.js) === `'styles'` (the deleted `capabilitiesTitle` value) — byte-for-byte identical.
- `pnpm build` succeeds; built bundle inspection confirms `"styles"` and `urlSegment` strings are compiled in (`build/static/js/main.*.js`).
- Per parallel_execution prompt directive: "Routes `/styles` and `/styles/:capability` must continue to resolve identically — manual smoke check via build is fine." Build smoke passed; live `pnpm start` verification deferred to the orchestrator's downstream wave or a human spot-check after merge.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Phase 2 hand-off:** `print` entry already declared in `SERVICES` with `urlSegment: '3d-printing'`, `navLabel: '3D Printing'`, `sanityType: 'print-style'`, `contactSubject: '3D printing'`. Phase 2's `/3d-printing` route can light up by adding a single `<Route>` derived from `SERVICES.find(s => s.key === 'print')` — no schema or constants change needed.
- **ServicesContext-vs-parallel decision** (D-14, deferred per ROADMAP.md) now operates on a clean data shape; Phase 2 trade-off table can reference `src/data/services.js` directly.
- **VIS-05 (Phase 2) dead-data purge** still has work to do — `src/data/projects.js#capabilitiesData` and `src/data/images.js` imports are alive in the file but unreferenced from rendering paths. Slugs inside the array are now self-contained literals (`/styles/<id>`), so the array is internally consistent and safe to delete in one shot.

## Self-Check: PASSED

Verified before writing this section:

- `src/data/services.js` exists.
- Commits `08c2226`, `30e5a08`, `9a2d730` exist on `worktree-agent-a6eb66f7074175148`.
- `grep -rln capabilitiesTitle src/` returns nothing.
- `grep -q "export const capabilitiesData" src/data/projects.js` succeeds (D-15 preserved).
- `pnpm build` exits 0 (Task 3 verification).

---
*Phase: 01-foundation-refactor-env-pinning*
*Plan: 05*
*Completed: 2026-05-04*
