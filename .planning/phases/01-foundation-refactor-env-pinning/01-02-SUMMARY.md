---
phase: 01-foundation-refactor-env-pinning
plan: 02
subsystem: data-fetch
tags: [hooks, sanity, abort-controller, refactor, react]

requires: []
provides:
  - "Single Sanity-fetch hook `useSanityQuery(query, params, deps)` returning `{ data, loading, error, refetch }`"
  - "AbortController-based cancellation on unmount (silent on AbortError)"
  - "Allowlist contract: `sanityClient` is imported only by `src/utilities/sanityClient.jsx` (declares it) and `src/hooks/useSanityQuery.jsx` (consumes it)"
  - "Caller-controlled re-fetch via `refetch()` (idempotent useCallback) plus optional `deps` array for query-param-driven refetches"
affects: [01-03, 01-04, 01-05, 01-06, phase-02, phase-03, phase-05]

tech-stack:
  added: []  # No new runtime deps; pure refactor on top of existing @sanity/client + React 18
  patterns:
    - "Centralized data-fetch primitive: every Sanity GROQ fetch in the app routes through one hook (no inline `useEffect` + `sanityClient.fetch` pattern remains)"
    - "AbortController + AbortError short-circuit so React 18 strict-mode dev double-effect mounts and rapid route changes do not call setState on an unmounted component"
    - "Per-shape caller default: array consumers do `data ?? []` to keep `.sort()`/`.map()` chains stable across the initial `data === null` window; single-doc consumers index `data?.[0]` to preserve the prior `data[0]` semantics"
    - "Hook returns the raw fetch result; post-processing (e.g. `.find()` for `oversized-piece` / `bed-size`) lives at the call site"

key-files:
  created:
    - "src/hooks/useSanityQuery.jsx"
    - ".planning/phases/01-foundation-refactor-env-pinning/01-02-SUMMARY.md"
  modified:
    - "src/context/ProjectsContext.jsx"
    - "src/context/AboutMeContext.jsx"
    - "src/components/home/Collaborations.jsx"
    - "src/components/home/OurProcess.jsx"
    - "src/components/home/QuickSpecs.jsx"
    - "src/pages/Materials.jsx"
  deleted: []

key-decisions:
  - "Hook API locked to `{ data, loading, error, refetch }` per D-01 — no destructured tuple, no separate `isLoading` boolean alias, no auto-stringified `params`"
  - "Effect deps are `[query, refetchIndex, ...deps]` per D-03 — caller explicitly opts into re-fetches via the `deps` array; `params` is intentionally NOT in deps (avoids accidental refetch loops on inline-object literals)"
  - "Hook lives at `src/hooks/useSanityQuery.jsx` (`.jsx` extension) per D-05, matching `useScrollToTop.jsx` / `useThemeSwitcher.jsx` convention even though no JSX is rendered"
  - "Preserve no-op `setProjects` / `setAboutMe` keys in the Context value shape — current consumers do not call them, but removing the keys would break future destructuring readers and the change isn't worth it"
  - "QuickInfo.jsx intentionally NOT migrated — it has no Sanity fetch (verified by grep against `useEffect` + `sanityClient` simultaneously); PATTERNS.md discrepancy #1 corrected the original 7-site count to 6"

patterns-established:
  - "AbortController cancellation in custom data-fetch hooks: scope the controller in the effect body, pass `{ signal }` to the fetch, return `() => controller.abort()` cleanup, short-circuit `if (err.name === 'AbortError') return` in the catch"
  - "Allowlist diff audit pattern: build an importers list (`grep -rl … | sort`) and an explicit allowed list, then `diff` them — fails loud and deterministically, unlike count-based assertions which silently pass when no consumers exist"
  - "Render-contract preservation across data-loading refactors: keep the JSX (and the `value && value.foo` guards) untouched; only swap the variable initialization so existing `undefined`/empty-array semantics still hold"

requirements-completed: [FOUND-01]

duration: ~4min
completed: 2026-05-04
---

# Phase 1 Plan 02: Foundation — Sanity Fetch Hook Summary

**Replaced 6 copies of inline `useEffect` + `sanityClient.fetch` boilerplate with a single `useSanityQuery` hook that returns `{ data, loading, error, refetch }` and cancels via `AbortController` on unmount; allowlist diff confirms `sanityClient` is now imported only by the wrapper itself and the new hook.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-04T02:10:48Z
- **Completed:** 2026-05-04T02:14:41Z
- **Tasks:** 5 / 5 (Task 5 audit-only, no commit)
- **Files modified:** 7 (1 created, 6 modified)

## Accomplishments

- `src/hooks/useSanityQuery.jsx` — new 37-line hook with `useState` + `useEffect` + `useCallback`; AbortController per-effect; `AbortError` short-circuit in catch; preserves the existing `console.error` log; default-export arrow function matching the project's hook convention
- `src/context/ProjectsContext.jsx` — array consumer; `data ?? []` keeps `.sort()`/`.map()` stable; `setProjects` no-op preserved for context-value-shape stability
- `src/context/AboutMeContext.jsx` — single-doc consumer; `data?.[0]` matches prior `data[0]` semantics; `setAboutMe` no-op preserved; `export default AboutMeContext` and named `export const AboutMeProvider` intact
- `src/components/home/Collaborations.jsx` — single-doc consumer (`data?.[0]`); `collaborationData && collaborationData.images[0].asset.url` JSX guard untouched
- `src/components/home/OurProcess.jsx` — array consumer (`data ?? []`); `processSteps.sort(...).map(...)` chain untouched
- `src/components/home/QuickSpecs.jsx` — array consumer with caller-side `.find()` post-processing (`'oversized-piece'`, `'bed-size'` altText keys preserved verbatim); component-name / filename mismatch (file `QuickSpecs.jsx`, component `QuickInfo`) preserved as out-of-scope
- `src/pages/Materials.jsx` — array consumer (`data ?? []`); `materials.sort(...).map(...)` chain untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: Create `src/hooks/useSanityQuery.jsx`** — `d990171` (feat)
2. **Task 2: Migrate `ProjectsContext` + `AboutMeContext`** — `cb22bdf` (refactor)
3. **Task 3: Migrate `Collaborations` + `OurProcess` + `Materials`** — `f588772` (refactor)
4. **Task 4: Migrate `QuickSpecs` (post-processed)** — `2e0ba9f` (refactor)
5. **Task 5: Allowlist diff audit** — audit-only, no file edits, no commit (per plan); audit output captured in this SUMMARY below

## Files Created/Modified

- **`src/hooks/useSanityQuery.jsx`** (created, 37 lines)
  - `import { useState, useEffect, useCallback } from 'react'`
  - `import sanityClient from '../utilities/sanityClient'`
  - `useSanityQuery(query, params = {}, deps = [])` returns `{ data, loading, error, refetch }`
  - Initial state: `data = null`, `loading = true`, `error = null`
  - Effect body: `const controller = new AbortController()` → `setLoading(true) / setError(null)` → `sanityClient.fetch(query, params, { signal })` → on success `setData / setLoading(false)` → on error if `err.name === 'AbortError'` return; else `console.error(err); setError(err); setLoading(false)`
  - Cleanup: `return () => controller.abort()`
  - Effect deps: `[query, refetchIndex, ...deps]` with `eslint-disable-next-line react-hooks/exhaustive-deps` (params intentionally not in deps per D-03)
  - `refetch` = `useCallback(() => setRefetchIndex((i) => i + 1), [])`
- **`src/context/ProjectsContext.jsx`** (modified)
  - Drops `useState` / `useEffect` / `sanityClient` imports
  - Adds `import useSanityQuery from '../hooks/useSanityQuery'`
  - `const { data } = useSanityQuery(<laser-style GROQ>); const projects = data ?? [];`
  - Context value: `{ projects, setProjects: () => {} }` (no-op kept for shape stability)
- **`src/context/AboutMeContext.jsx`** (modified)
  - Drops `useState` / `useEffect` / `sanityClient` imports
  - Adds `import useSanityQuery from '../hooks/useSanityQuery'`
  - `const { data } = useSanityQuery(<profile GROQ>); const aboutMe = data?.[0];`
  - Context value: `{ aboutMe, setAboutMe: () => {} }`; `export default AboutMeContext` preserved
  - Pre-existing commented `// import { aboutMeData } from '../data/aboutMeData';` line preserved (owned by VIS-05 in Phase 2)
- **`src/components/home/Collaborations.jsx`** (modified)
  - Drops `useState` / `useEffect` / `sanityClient` imports; keeps `import { Link } from 'react-router-dom'`
  - Adds `import useSanityQuery from '../../hooks/useSanityQuery'`
  - `const { data } = useSanityQuery(<collaboration GROQ>); const collaborationData = data?.[0];`
  - JSX, classNames, `<Link>` props all preserved verbatim — only the data-loading machinery changed
- **`src/components/home/OurProcess.jsx`** (modified)
  - Drops `useState` / `useEffect` / `sanityClient` imports
  - Adds `import useSanityQuery from '../../hooks/useSanityQuery'`
  - `const { data } = useSanityQuery(<maker-process GROQ>); const processSteps = data ?? [];`
  - JSX (`processSteps.sort(...).map(...)`) untouched
- **`src/components/home/QuickSpecs.jsx`** (modified)
  - Drops `useState` / `useEffect` / `sanityClient` imports
  - Adds `import useSanityQuery from '../../hooks/useSanityQuery'`
  - `const { data } = useSanityQuery(<laser-specs GROQ>); const specs = data ?? []; const oversizedPieceImage = specs.find((img) => img.image.altText === 'oversized-piece'); const bedSizeImage = specs.find((img) => img.image.altText === 'bed-size');`
  - Variable names `oversizedPieceImage` / `bedSizeImage` preserved (referenced by JSX); altText literals preserved exactly
  - Pre-existing component-name mismatch (`const QuickInfo = …` exported as `QuickInfo` from file `QuickSpecs.jsx`) NOT renamed — out of scope for this plan
- **`src/pages/Materials.jsx`** (modified)
  - Drops `useState` / `useEffect` / `sanityClient` imports; keeps `import MaterialSingle from "../materials/MaterialSingle"`
  - Adds `import useSanityQuery from '../hooks/useSanityQuery'`
  - `const { data } = useSanityQuery(<material GROQ>); const materials = data ?? [];`
  - JSX (`materials.sort(...).map(...)`) untouched

## Decisions Made

- **Hook returns `{ data, loading, error, refetch }`** (not a tuple, not a `swr`-style status enum). Locked by D-01 in CONTEXT.md. Future plans (Phase 3 quote-tool retries) will use `refetch`; Phase 2 print-style provider will use the same primitive for symmetry with `ProjectsContext`.
- **Don't auto-stringify `params`.** Per D-03, the caller controls re-fetch triggers via the `deps` array. This avoids the trap where an inline-object literal (`{ slug }`) creates a new identity on every render and triggers an infinite refetch loop. None of the 6 consumers actually pass params today, so this design has zero blast radius now and is the right contract for future callers.
- **Keep no-op `setProjects` / `setAboutMe` setters in the Context value.** No current consumer destructures them, but removing the keys is a public-API change with no benefit. Future visual-polish work in Phase 2 may add a controlled `aboutMe`/`projects` override (test fixture, manual override) — keeping the shape stable preserves that option.
- **`QuickInfo.jsx` is NOT a fetch site.** PATTERNS.md discrepancy #1 corrected an earlier 7-site claim to 6. Verified again at execution time: `grep -L "sanityClient" src/components/home/QuickInfo.jsx` returns the file, confirming no client import (the `QuickInfo` component is a static section with hard-coded copy and a single `<a href="/materials">` link).
- **Preserve the pre-existing component-name / filename mismatch in `QuickSpecs.jsx`.** The file is named `QuickSpecs.jsx`, but the component declares `const QuickInfo = () => { … }` and exports `QuickInfo`. Renaming would require updating the import in `Home.jsx` (which currently imports `QuickInfo from './QuickSpecs'` — confirmed via earlier grep). That's out of scope for a data-fetch refactor and would risk visual or routing regressions.

## Allowlist Diff Audit (Task 5)

Before-state (read at execution start):

```text
src/context/AboutMeContext.jsx
src/context/ProjectsContext.jsx
src/utilities/sanityClient.jsx
src/components/home/QuickSpecs.jsx
src/components/home/Collaborations.jsx
src/components/home/OurProcess.jsx
src/pages/Materials.jsx
```

(7 files: the 6 consumers + the wrapper itself)

After-state (Task 5 audit output):

```bash
$ grep -rl "sanityClient" src/ --include="*.jsx" --include="*.js" | sort > /tmp/sc-importers.txt
$ printf "src/hooks/useSanityQuery.jsx\nsrc/utilities/sanityClient.jsx\n" | sort > /tmp/sc-allowed.txt
$ diff /tmp/sc-importers.txt /tmp/sc-allowed.txt
$ echo $?
0
$ wc -l < /tmp/sc-importers.txt
2
```

Importers list contains exactly the 2 allowlisted files:

```text
src/hooks/useSanityQuery.jsx
src/utilities/sanityClient.jsx
```

`diff` exits 0 with no output → audit passes deterministically. ROADMAP success criterion #1 ("Every Sanity fetch goes through a single `useSanityQuery` hook with `{ data, loading, error }` semantics — no inline `useEffect` + `sanityClient.fetch` patterns remain") is satisfied.

## Build Verification

`pnpm build` was run after each task and at end-of-plan; every run reported `Compiled successfully.` with no warnings related to the migrated files. Final bundle sizes are nominal (matching the Plan 01-01 baseline of `116.49 kB` main JS gzipped).

The new hook compiles with no `react-hooks/exhaustive-deps` complaint (suppressed inline on the `params`-not-in-deps line per D-03 design).

## Render-Contract Preservation Audit

Each migrated consumer was checked against its prior render contract:

| Consumer | Prior init state | New init state | JSX guard | Outcome |
|---|---|---|---|---|
| ProjectsContext | `useState([])` | `data ?? []` (when `data === null`) | `projects.sort(...).map(...)` in `ProjectsGrid` | Equivalent — empty array on first render, populated after fetch |
| AboutMeContext | `useState()` (initial `undefined`) | `data?.[0]` (initial `undefined` because `data === null`) | `aboutMe && aboutMe.title` in `AboutMeBio` | Equivalent — `undefined` on first render |
| Collaborations | `useState()` (initial `undefined`) | `data?.[0]` (initial `undefined`) | `collaborationData && collaborationData.images[0].asset.url` | Equivalent |
| OurProcess | `useState([])` | `data ?? []` | `processSteps.sort(...).map(...)` | Equivalent |
| QuickSpecs | `useState()` × 2 (each initial `undefined`) | `specs.find(...)` returning `undefined` when `data === null → specs === []` | `bedSizeImage && bedSizeImage.image.asset.url`, `oversizedPieceImage && oversizedPieceImage.image.asset.url` | Equivalent — both initial `undefined` |
| Materials | `useState([])` | `data ?? []` | `materials.sort(...).map(...)` | Equivalent |

No visual or behavioral change at runtime. Phase 1 Plan 06 (smoke verification) will confirm in dev server.

## Hook API Contract for Downstream Phases

For Phase 2 (print-style fetch), Phase 3 (quote-tool retries), Phase 5 (shop inventory):

```js
const { data, loading, error, refetch } = useSanityQuery(query, params = {}, deps = []);
```

- `data`: raw fetch result, or `null` while pending. Caller chooses `data ?? []` (array) or `data?.[0]` (single doc) or `data?.foo` (object).
- `loading`: `true` while a request is in flight (including during a `refetch()`).
- `error`: the caught error object, or `null`. `AbortError` is silenced internally.
- `refetch()`: idempotent `useCallback` that bumps an internal `refetchIndex` and re-runs the effect.
- `params` is forwarded to `sanityClient.fetch(query, params, { signal })` and is NOT auto-watched. Pass query-driving values through `deps` (e.g. `useSanityQuery(byIdQuery, { id }, [id])`).

## Deviations from Plan

None — plan executed exactly as written. All 5 tasks landed; the audit in Task 5 passed on the first run.

## Issues Encountered

One self-corrected near-miss: my first attempt at migrating `Collaborations.jsx` used `Write` to replace the whole file. The rewrite trimmed trailing whitespace from JSX text nodes (a no-op for HTML rendering, but a violation of the plan's "DO NOT touch any JSX" directive). Reverted with `git checkout --` and re-did the migration with `Edit` against the exact original `useEffect`/`useState` block — leaving every JSX byte untouched. No commit was lost; the bad attempt was never staged.

## User Setup Required

None. No external service configuration changed. No env vars added. No Sanity studio changes required. Phase 1 Plan 06 will run a smoke test against the dev server.

## Next Phase Readiness

- All later plans in Phase 1 can now assume the hook exists at `src/hooks/useSanityQuery.jsx`.
- Phase 2 (`PrintStylesContext` mirroring `ProjectsContext`) will consume the same primitive — no new fetch boilerplate to write.
- Phase 3 (quote-tool form retry-on-error) gets `refetch` for free.
- Phase 5 (shop inventory) gets the same primitive for the new schema.
- No blockers, no carry-over decisions.

## Self-Check: PASSED

- All 6 modified consumer files exist and contain `useSanityQuery` (verified with grep)
- New hook file `src/hooks/useSanityQuery.jsx` exists with the expected exports and contains `AbortController`, `useCallback`, `AbortError`, `controller.abort` (verified with grep)
- All 4 task commits resolve in `git log --all`: `d990171`, `cb22bdf`, `f588772`, `2e0ba9f`
- Task 5 audit `diff` exits 0 against the allowlist
- `pnpm build` exits 0 at end of plan with no compile errors
- `setProjects: () => {}` and `setAboutMe: () => {}` no-ops present (legacy shape preserved)
- `QuickInfo.jsx` does NOT contain `useSanityQuery` (verified — out-of-scope per PATTERNS.md discrepancy #1)
- `data?.[0]` present in `AboutMeContext.jsx` and `Collaborations.jsx` (single-doc form)
- `data ?? []` present in `ProjectsContext.jsx`, `OurProcess.jsx`, `Materials.jsx`, `QuickSpecs.jsx` (array form)

---
*Phase: 01-foundation-refactor-env-pinning*
*Completed: 2026-05-04*
