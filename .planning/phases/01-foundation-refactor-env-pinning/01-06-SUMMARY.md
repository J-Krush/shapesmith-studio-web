---
phase: 01-foundation-refactor-env-pinning
plan: 06
subsystem: testing
tags: [jest, react-testing-library, smoke-test, sanity-mock, cra]

# Dependency graph
requires:
  - phase: 01-foundation-refactor-env-pinning
    provides: "Phase 1 baseline (Plans 01-05): pinned Node engine, services data module driving header nav, hardcoded `<html class=\"dark\">` in public/index.html, two `Contact` links rendered by AppHeader.jsx (mobile + desktop variants). The smoke test exercises this surface end-to-end."
provides:
  - Passing smoke test (`src/App.test.js`) that mounts `<App />` end-to-end
  - Module-boundary mock pattern for `./utilities/sanityClient` (reusable in future tests)
  - Regression sentinel for the rest of Phase 1 — any future edit that breaks `<App />` mount-time fails CI immediately
  - ROADMAP success criterion #5 satisfied (`pnpm test` runs a passing smoke test; the broken legacy `App.test.js` is gone)
affects: [phase-2 testing, ui-bundle, 3d-printing-route, ci]

# Tech tracking
tech-stack:
  added: []  # No new dependencies — D-17 honored
  patterns:
    - "Module-boundary mock for the Sanity client wrapper (`jest.mock('./utilities/sanityClient', ...)`) instead of mocking `@sanity/client` directly — short-circuits the entire fetch chain at the import site every consumer uses"
    - "Async-by-default smoke assertions using `await screen.findAllByText(...)` to absorb microtask deferral from `Promise.resolve(...)` mocks"
    - "`__esModule: true` flag on jest.mock factory for ES default-export interop under CRA's babel-jest"

key-files:
  created: []
  modified:
    - src/App.test.js

key-decisions:
  - "D-16 Option A: dropped MemoryRouter wrapper — App.js owns its own BrowserRouter (line 29) so wrapping would throw 'You cannot render a <Router> inside another <Router>'"
  - "D-18: mocked the local wrapper at `./utilities/sanityClient` (NOT `@sanity/client`) — every consumer imports the wrapper, so this single mock collapses the entire fetch chain"
  - "Async assertion via `findAllByText` (not `getAllByText`) chosen for two compounding reasons: (1) two Contact links exist in AppHeader.jsx (mobile nav + desktop nav) so `findByText` would throw 'Found multiple elements'; (2) the mocked `fetch` returns `Promise.resolve([])` which guarantees a microtask deferral, so synchronous queries would race the hook's `setData` flush"
  - "No new test deps added (D-17) — CRA-bundled Jest + @testing-library/react + jest-dom (already wired via setupTests.js) are sufficient"

patterns-established:
  - "Smoke test as Phase regression sentinel: a single test that mounts the app root, mocks external IO at the module boundary, and asserts a persistent UI element renders. Cheap to run, catches mount-time regressions across any future plan."
  - "ES default-export mock idiom for CRA: `jest.mock(path, () => ({ __esModule: true, default: { ...mockedShape } }))`. The `__esModule: true` flag is mandatory under CRA's babel-jest interop or `import sanityClient from '...'` will resolve to `undefined`."

requirements-completed: [FOUND-06]

# Metrics
duration: 2min
completed: 2026-05-04
---

# Phase 1 Plan 06: Smoke Test Summary

**Replaced the broken CRA-boilerplate `App.test.js` with a passing smoke test that mounts `<App />`, mocks the Sanity client at `./utilities/sanityClient`, and asserts the persistent header `Contact` link renders via async `findAllByText`.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-04T02:33:17Z
- **Completed:** 2026-05-04T02:35:01Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- `pnpm test -- --watchAll=false` exits 0 with `Tests: 1 passed, 1 total` (was previously failing on the boilerplate `learn react` query)
- Sanity client mocked at the module boundary — the test makes zero network calls to the Sanity CDN
- Smoke test serves as Phase 1 regression sentinel: any future plan that breaks `<App />` mount-time fails this test on the next CI run
- Closes Phase 1 as the final wave-5 plan; ROADMAP success criterion #5 satisfied

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace `src/App.test.js` with a mount-without-crashing smoke test** — `cc235dd` (test)

## Files Created/Modified

- `src/App.test.js` — Rewritten in full. Imports `render`, `screen` from `@testing-library/react`. Declares a top-of-file `jest.mock('./utilities/sanityClient', ...)` returning `{ __esModule: true, default: { fetch: jest.fn(() => Promise.resolve([])) } }`. The single test is async, calls `render(<App />)` directly (no wrapper), and asserts `(await screen.findAllByText(/contact/i)).length > 0`.

## Decisions Made

### D-16 → Option A divergence (MemoryRouter dropped) — DOCUMENTED

D-16 in CONTEXT.md called for `<MemoryRouter>` wrapping. PATTERNS.md flagged Discrepancy #2: `App.js` mounts its own `<BrowserRouter as Router>` on line 29 (and Plans 03/04/05 did not change that). Wrapping `<App />` in `<MemoryRouter>` would throw `You cannot render a <Router> inside another <Router>`.

**Resolution per the plan:** Use Option A — call `render(<App />)` directly with no router wrapper. The Sanity mock and the assertion shape stay exactly as D-16 / D-18 describe; only the router-wrapping is dropped. The plan documents this divergence in its `<interfaces>` block; this SUMMARY records it as the closing artifact of the decision trail.

### Async-by-default assertion strategy

The `await screen.findAllByText(/contact/i)` choice is load-bearing for two reasons:

1. **Duplicate match guard:** AppHeader.jsx renders two `Contact` `<Link>`s (mobile-nav variant on line 113, desktop-nav variant on line 167). `findByText` would throw `Found multiple elements`. `findAllByText` returns the array; `length > 0` is the assertion.
2. **Microtask deferral safety:** The mocked `fetch` returns `Promise.resolve([])`. The mocked promise still has to resolve through the microtask queue before any `useEffect` reading from the wrapper would have its `setData` flushed. Synchronous `getAllByText` would race that flush and could surface `Warning: An update to ... was not wrapped in act(...)`. Using the async query absorbs the resolution into the same `act` window RTL already manages around `findBy*`.

Verified: the run does NOT contain `Warning: An update to .* inside a test was not wrapped in act(...)` (the specific act-update warning the plan's acceptance criterion checks for).

## Deviations from Plan

None — plan executed exactly as written. The test body matches the verbatim replacement body specified in the plan's `<interfaces>` block, with the D-16 → Option-A correction (already explicitly documented in the plan, not a deviation).

## Issues Encountered

### Pre-existing devDependencies installation

Status: resolved transparently.

When `pnpm test -- --watchAll=false` was first invoked in this fresh worktree, pnpm reported `react-scripts: command not found` and `Local package.json exists, but node_modules missing`. Resolved by running `pnpm install --prefer-offline --frozen-lockfile`, which used the existing `pnpm-lock.yaml` (no lockfile changes). After install, the test suite passed cleanly.

This is expected behaviour for a freshly-checked-out worktree and not a code issue.

### `act()`-related warnings observed during the run (non-blocking)

The acceptance criterion checks for the specific string `Warning: An update to .* inside a test was not wrapped in act` — that warning was NOT emitted (verified with `grep`). The test passes with exit code 0.

For full transparency, the run did emit these unrelated console warnings, none of which fail the test:

1. **`Warning: \`ReactDOMTestUtils.act\` is deprecated in favor of \`React.act\`.`** — Emitted by `@testing-library/react` 13.4.0 internally calling `react-dom/test-utils.act` against React 18.3.1 (which prefers `React.act`). This is a library-version mismatch in pre-existing devDependencies. Unrelated to test code; not addressable without a RTL upgrade (out of scope for this plan and explicitly forbidden by D-17 "no new test deps").
2. **`Warning: A suspended resource finished loading inside a test, but the event was not wrapped in act(...)`** — Emitted because `<App />` lazy-loads page components via `React.lazy` + `<Suspense>`. The persistent `Contact` link in the header is NOT behind Suspense, so `findAllByText` resolves and the test asserts before the lazy `Home` chunk has finished loading. When the lazy chunk eventually settles, the suspense resolution fires outside the test's `act` window. This warning does NOT cause the test to fail and is benign for a smoke test scoped to mount-time persistent UI. Fixing it would require either (a) dropping `React.lazy` in `App.js` (out of scope), or (b) explicitly waiting on a lazy-route element with another `findBy*` query (would require per-route assertions, which D-16 explicitly forbids — "single smoke test only"). Documented here per the plan's output spec.
3. **Two React Router v6 future-flag deprecation warnings** (`v7_startTransition`, `v7_relativeSplatPath`) — Emitted by `react-router-dom` 6.30.3 on every mount of `<BrowserRouter>` without future flags. Pre-existing in `App.js`; unrelated to the test.

None of these warnings match the plan's specific acceptance regex `Warning: An update to .* inside a test was not wrapped in act`. The test exits 0; the smoke test is green.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 1 is complete with this plan. Ready hand-offs to Phase 2:

- **CI tripwire active:** `pnpm test` is now a meaningful gate. Any Phase 2 plan that introduces a regression at `<App />` mount time will fail the smoke test on the next run.
- **Mock pattern documented:** Future tests that need to short-circuit Sanity reads can copy the `jest.mock('./utilities/sanityClient', () => ({ __esModule: true, default: { fetch: jest.fn(...) } }))` idiom verbatim.
- **No new test infrastructure added** (D-17 honored): if Phase 2 wants per-route or per-component testing, that decision is open and unconstrained by this plan.

## TDD Gate Compliance

This plan's frontmatter `type: execute` (not `type: tdd`), so RED/GREEN/REFACTOR gate sequencing does not apply. The single task is `tdd="false"`. The plan delivers a test, but the test is a regression sentinel for already-shipped code, not the test side of a new TDD feature. Per `tdd_execution` guidance, no gate enforcement is required.

## Self-Check: PASSED

Verified before writing this section:

- File exists: `src/App.test.js` — FOUND
- File exists: `.planning/phases/01-foundation-refactor-env-pinning/01-06-SUMMARY.md` — FOUND (this file)
- Commit `cc235dd` exists in `git log --oneline --all` — FOUND
- `package.json` is unchanged from baseline (`git diff HEAD package.json` empty) — D-17 honored
- `pnpm test -- --watchAll=false` exits 0 with `Tests: 1 passed, 1 total` — VERIFIED
- The acceptance regex `Warning: An update to .* inside a test was not wrapped in act` does NOT appear in test output — VERIFIED via grep

---
*Phase: 01-foundation-refactor-env-pinning*
*Completed: 2026-05-04*
