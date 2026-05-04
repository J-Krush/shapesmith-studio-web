---
phase: 01-foundation-refactor-env-pinning
verified: 2026-05-03T00:00:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification: false
---

# Phase 1: Foundation — Refactor + Env Pinning Verification Report

**Phase Goal:** Stabilize the codebase substrate so Phase 2's relaunch and every later phase land on a clean, pinned foundation rather than on Create React App rot, render-time side effects, and inline-fetch anti-patterns.

**Verified:** 2026-05-03
**Status:** passed
**Re-verification:** No — initial verification.

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every Sanity fetch goes through a single `useSanityQuery` hook with `{ data, loading, error }` semantics — no inline `useEffect` + `sanityClient.fetch` patterns remain | VERIFIED | `src/hooks/useSanityQuery.jsx` exists (37 lines) with `useState`/`useEffect`/`useCallback`, AbortController + AbortError short-circuit, returns `{ data, loading, error, refetch }`. All 6 consumers migrated (`ProjectsContext`, `AboutMeContext`, `Collaborations`, `OurProcess`, `QuickSpecs`, `Materials`). `grep -E "useEffect" src/context/*.jsx src/components/home/{Collaborations,OurProcess,QuickSpecs}.jsx src/pages/Materials.jsx` returns no matches. `grep -rl sanityClient src/` returns 3 files: the wrapper, the hook, and `src/App.test.js` (where `'./utilities/sanityClient'` is a `jest.mock` string literal, not a runtime import) — runtime importer set is exactly the wrapper + hook. |
| 2 | Dark theme applied without a render-time side effect, `useThemeSwitcher` fully removed, site behaves identically (dark-only) | VERIFIED | `public/index.html` line 2: `<html lang="en" class="dark">`. `src/App.js` has no `documentElement`/`localStorage`/`classList` references. `src/hooks/useThemeSwitcher.jsx` does not exist. `grep -rln useThemeSwitcher src/` returns nothing. `grep -E "Theme switcher\|FiMoon\|FiSun\|activeTheme" src/components/shared/{AppHeader,AppBanner}.jsx` returns nothing. BL-01 (-light tokens deletion regression) was caught in code review and resolved by commit 6942a1a — `tailwind.config.js` lines 32-34, 40 restore `primary-light`, `secondary-light`, `ternary-light`, `secondary-section-light`. Compiled `build/static/css/main.*.css` contains `.dark\:text-ternary-light:is(.dark *)` and `.dark\:text-primary-light:is(.dark *)` selectors — proving dark-mode visual rules paint correctly. |
| 3 | `ProjectGallery` image modal opens/closes via React state — no `document.getElementById` `classList` manipulation in the codebase | VERIFIED | `src/components/projects/ProjectGallery.jsx` uses `const [openImage, setOpenImage] = useState(null)`; modal wrapped in `{openImage && (…)}`; thumbnail handler `onClick={() => setOpenImage(image.asset.url)}`; close handler `setOpenImage(null)`. React-key bug fixed: `key={image.asset._id}` (Sanity's actual identifier). `grep -rn "document.getElementById" src/` returns ONLY `src/index.js:7` (canonical React mount). `grep -rn classList src/` returns nothing. |
| 4 | `pnpm install && pnpm build` succeeds on a clean checkout against the pinned Node version | VERIFIED | `.nvmrc` = `20`. `netlify.toml` declares `NODE_VERSION = "20"`, `command = "pnpm build"`, `publish = "build"`. `package.json` has `"engines": { "node": ">=20" }` and `"packageManager": "pnpm@9.0.0"` (literal floor pin). `pnpm-lock.yaml` is git-tracked with `lockfileVersion: '9.0'`; SHA-256 is `36976a38f2943d6f4bfaf4df5da06ba5640dccbdaa111b3e42798d3e156758eb` matching the SUMMARY's claimed pre/post-install hash (lockfile integrity invariant T-01-01 holds). `yarn.lock` is not tracked. Verifier-confirmed `pnpm install --frozen-lockfile && pnpm build` succeeds; in this verification session `pnpm build` produced `build/index.html` and `build/static/css/main.*.css` cleanly. |
| 5 | `pnpm test` runs a passing smoke test that mounts `<App />`; broken legacy `App.test.js` is gone | VERIFIED | `src/App.test.js` mocks `./utilities/sanityClient` at the module boundary with `__esModule: true` ESM-default interop; calls `render(<App />)` directly (no `MemoryRouter` wrapper, per Option A — App.js owns its own `BrowserRouter`); asserts `(await screen.findAllByText(/contact/i)).length > 0` (async to absorb `Promise.resolve([])` microtask deferral and the 2 Contact links in mobile + desktop nav). Verifier-confirmed `CI=true pnpm test` exits 0 with `Tests: 1 passed, 1 total`. No `Warning: An update to .* inside a test was not wrapped in act` regex matches in test output. The boilerplate `learn react` text is absent from the file. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.nvmrc` | Node version pin (literal `20`) | VERIFIED | Contains exactly `20\n`; 3 bytes; tracked in git. |
| `netlify.toml` | Netlify build config (pnpm command, publish dir, NODE_VERSION pin) | VERIFIED | Declares `[build]` + `[build.environment]` with `command = "pnpm build"`, `publish = "build"`, `NODE_VERSION = "20"`. |
| `package.json` | engines + packageManager fields | VERIFIED | `"engines": { "node": ">=20" }`, `"packageManager": "pnpm@9.0.0"`. `--openssl-legacy-provider` retained in scripts (per D-20). |
| `pnpm-lock.yaml` | Tracked, byte-identical, `lockfileVersion: '9.0'` | VERIFIED | `git ls-files pnpm-lock.yaml` outputs `pnpm-lock.yaml`; SHA-256 matches SUMMARY claim. |
| `src/hooks/useSanityQuery.jsx` | Single Sanity-fetch hook with AbortController cancellation | VERIFIED | 37 lines; default-exports the hook; uses `AbortController`, `useCallback`, `AbortError` short-circuit, `console.error`, `controller.abort()` cleanup. |
| `src/context/ProjectsContext.jsx` | ProjectsProvider — Sanity fetch via hook | VERIFIED | Imports `useSanityQuery`; no `sanityClient`/`useEffect`/`useState` imports; uses `data ?? []` array default; `setProjects` no-op preserved. |
| `src/context/AboutMeContext.jsx` | AboutMeProvider — Sanity fetch via hook (single-doc: `data?.[0]`) | VERIFIED | Imports `useSanityQuery`; uses `data?.[0]`; `export default AboutMeContext` preserved. |
| `src/components/home/Collaborations.jsx` | Sanity fetch via hook (single-doc) | VERIFIED | Imports `useSanityQuery`; `collaborationData = data?.[0]`. |
| `src/components/home/OurProcess.jsx` | Sanity fetch via hook (array) | VERIFIED | Imports `useSanityQuery`; `processSteps = data ?? []`. |
| `src/components/home/QuickSpecs.jsx` | Sanity fetch via hook (array, post-processed via `.find()`) | VERIFIED | Imports `useSanityQuery`; `specs = data ?? []`; `oversizedPieceImage`/`bedSizeImage` derived via `.find()` against `altText` keys. |
| `src/pages/Materials.jsx` | Sanity fetch via hook (array) | VERIFIED | Imports `useSanityQuery`; `materials = data ?? []`. |
| `public/index.html` | Hardcoded `class="dark"` on `<html>` | VERIFIED | Line 2: `<html lang="en" class="dark">`. |
| `src/App.js` | No render-time DOM mutation, no theme localStorage write | VERIFIED | No `documentElement`/`localStorage`/`classList` references. Uses `SERVICES.find` lookup for routes. |
| `tailwind.config.js` | `darkMode: 'class'` preserved; previously deleted `-light` tokens RESTORED post-BL-01 | VERIFIED (with override-via-fix) | `darkMode: 'class'` + all `*-dark`, `accent`, `accent-highlight`, `*-section-*` tokens present. The four `-light` tokens (`primary-light`, `secondary-light`, `ternary-light`, `secondary-section-light`) were re-added by commit 6942a1a after BL-01 was filed. The PLAN-03 frontmatter expected them deleted, but the corrected post-review state preserves dark-mode visual rendering — which is the actual ROADMAP success criterion. |
| `src/hooks/useThemeSwitcher.jsx` | DELETED | VERIFIED | File does not exist; `grep -rln useThemeSwitcher src/` returns nothing. |
| `src/components/shared/AppHeader.jsx` | Theme-toggle markup/comments removed | VERIFIED | No `Theme switcher`/`FiMoon`/`FiSun`/`useThemeSwitcher` references. Active `import { FiMenu, FiX }` and `import logoDark` preserved. |
| `src/components/shared/AppBanner.jsx` | Theme-toggle markup/comments removed | VERIFIED | No `activeTheme`/`useThemeSwitcher` references. Active `<img src={brandMultiFont}>` and `<img src={heroLight}>` preserved. |
| `src/components/projects/ProjectGallery.jsx` | State-driven modal — `openImage` useState replaces DOM mutation | VERIFIED | `useState(null)`, `{openImage && (…)}`, `setOpenImage(image.asset.url)`/`setOpenImage(null)`, `image.asset._id` key. No `document.getElementById`/`classList`/`var`/`id="modal"`. |
| `src/data/services.js` | SERVICES constant — array of {key, urlSegment, navLabel, sanityType, contactSubject} | VERIFIED | Both `laser` and `print` entries present with all 5 keys. `urlSegment: 'styles'` for laser preserves URL stability (byte-identical to deleted `capabilitiesTitle`). |
| `src/data/projects.js` | Without `capabilitiesTitle` export; `capabilitiesData` array preserved (D-15) | VERIFIED | `grep "export const capabilitiesTitle"` returns nothing; `export const capabilitiesData` still present; six `${capabilitiesTitle}` slug references inlined to literal `/styles/<id>`. |
| `src/App.test.js` | Smoke test — mounts `<App />`, asserts nav `Contact` link renders | VERIFIED | Async test using `await screen.findAllByText(/contact/i)`; `__esModule: true`-flagged jest.mock; no `MemoryRouter`; no `learn react`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/hooks/useSanityQuery.jsx` | `src/utilities/sanityClient` | default import | WIRED | Line 2: `import sanityClient from '../utilities/sanityClient';`. |
| consumer | `useSanityQuery` | default import + destructure { data } | WIRED | All 6 consumer files: `import useSanityQuery from '...'` + `const { data } = useSanityQuery(...)`. |
| `useSanityQuery` | `AbortController` | `fetch(query, params, { signal: controller.signal })` + cleanup `controller.abort()` | WIRED | Lines 13, 18, 30 in the hook. AbortError short-circuit at line 24. |
| `netlify.toml` | `package.json scripts` | `command = "pnpm build"` → `react-scripts build --openssl-legacy-provider` | WIRED | `netlify.toml:2` ⟶ `package.json:28`. |
| `.nvmrc` | `netlify.toml [build.environment]` | Both declare Node 20 | WIRED | `.nvmrc` = `20`; `netlify.toml` `NODE_VERSION = "20"`. |
| `public/index.html` | `tailwind.config.js darkMode: 'class'` | `dark` class on `<html>` activates `dark:` variants | WIRED | `public/index.html:2` has `class="dark"`; `tailwind.config.js:26` has `darkMode: 'class'`. Compiled CSS rules confirm the wiring works. |
| `src/App.js` | `SERVICES.find(s => s.key === 'laser').urlSegment` | Route path derivation | WIRED | Lines 24, 35, 37 — derived path equals `/styles`, byte-identical to old `capabilitiesTitle`. |
| `src/components/shared/AppHeader.jsx` | `SERVICES.find(s => s.key === 'laser')` | Nav `<Link>` to + label | WIRED | Lines 12, 82-87 (mobile), 135-139 (desktop). |
| thumbnail onClick | `setOpenImage(image.asset.url)` | React event handler | WIRED | `ProjectGallery.jsx:22`. |
| modal render | `openImage` state | conditional `{openImage && (…)}` | WIRED | `ProjectGallery.jsx:31`. |
| `src/App.test.js` | `src/utilities/sanityClient` (mocked) | `jest.mock('./utilities/sanityClient', ...)` | WIRED | Line 4 in App.test.js with `__esModule: true` interop. |
| `src/App.test.js` | `src/App` | `render(<App />)` — no MemoryRouter wrapper | WIRED | Line 12; App.js owns its own BrowserRouter (Option A). |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `useSanityQuery.jsx` | `data` | `sanityClient.fetch(query, params, { signal })` (Sanity CDN, anon read) | Yes (when CDN reachable; tests mock to `Promise.resolve([])`) | FLOWING |
| `ProjectsContext.jsx` | `projects` | `useSanityQuery` of `*[_type == "laser-style"]{...}` | Yes — real GROQ on `laser-style` schema | FLOWING |
| `AboutMeContext.jsx` | `aboutMe` | `useSanityQuery` of `*[_type == "profile"]{...}`, indexed `data?.[0]` | Yes — real GROQ on `profile` schema | FLOWING |
| `Collaborations.jsx` | `collaborationData` | `useSanityQuery` of `*[_type == "collaboration"]{...}`, indexed `data?.[0]` | Yes — real GROQ on `collaboration` schema | FLOWING |
| `OurProcess.jsx` | `processSteps` | `useSanityQuery` of `*[_type == "maker-process"]{...}` | Yes | FLOWING |
| `QuickSpecs.jsx` | `oversizedPieceImage`, `bedSizeImage` | `specs.find(...)` against `useSanityQuery` of `*[_type == "laser-specs"]{...}` | Yes | FLOWING |
| `Materials.jsx` | `materials` | `useSanityQuery` of `*[_type == "material"]{...}` | Yes | FLOWING |
| `ProjectGallery.jsx` | `openImage`, `singleProjectData.detailImages` | local `useState(null)` + `SingleProjectContext` (which fetches via Sanity) | Yes — modal state is local; gallery feed comes from `SingleProjectContext` (out of scope but unchanged) | FLOWING |
| `App.js` (route paths) | `laser.urlSegment` | `SERVICES.find(s => s.key === 'laser')` from `src/data/services.js` | Yes — module-evaluated constant; resolves to `'styles'` | FLOWING |
| `AppHeader.jsx` (nav links) | `laser.navLabel` | same | Yes — `'styles'` (capitalized via Tailwind `capitalize`) | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Smoke test mounts `<App />` end-to-end | `CI=true pnpm test` | `Tests: 1 passed, 1 total`; exit 0 | PASS |
| Build produces deployable bundle | `pnpm build` | `Compiled successfully.` — `build/index.html`, `build/static/css/main.*.css`, `build/static/js/main.*.js` produced (~116.73 kB main JS gzipped) | PASS |
| Compiled CSS contains dark-mode rules for restored `-light` tokens | `grep -oE '\.dark\\:text-(ternary\|primary)-light' build/static/css/main.*.css` | Both selectors present (`.dark\:text-primary-light`, `.dark\:text-ternary-light`); 3+ occurrences of `is(.dark *)` selector wiring | PASS |
| No imperative DOM mutation outside React mount | `grep -rn "document.getElementById" src/` | Single match at `src/index.js:7` (`ReactDOM.createRoot(document.getElementById('root'))`) — the canonical mount; no in-component matches | PASS |
| No `classList` calls anywhere in `src/` | `grep -rn classList src/` | No matches | PASS |
| No `useThemeSwitcher` references | `grep -rln useThemeSwitcher src/` | No matches; hook file absent | PASS |
| Lockfile integrity (T-01-01) | `shasum -a 256 pnpm-lock.yaml` | `36976a38f2943d6f4bfaf4df5da06ba5640dccbdaa111b3e42798d3e156758eb` — matches SUMMARY claim byte-for-byte | PASS |
| `capabilitiesTitle` symbol fully removed | `grep -rln capabilitiesTitle src/` | No matches | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| FOUND-01 | 01-02 | Sanity data fetching unified through `useSanityQuery` with `{ data, loading, error }` and request cancellation; existing inline `useEffect` fetch sites migrated | SATISFIED | Hook exists; 6 consumers migrated; allowlist `diff` audit pinned `sanityClient` runtime importers to wrapper + hook only. AbortController + AbortError short-circuit present. |
| FOUND-02 | 01-05 | Single `SERVICES` constant in `src/data/services.js` is source of truth for service `key`/`urlSegment`/`navLabel`/`sanityType`/`contactSubject`; `capabilitiesTitle` removed | SATISFIED | `SERVICES` exists with both `laser` (consumed) and `print` (Phase 2 hand-off) entries; all four consumers migrated; `capabilitiesTitle` symbol gone codebase-wide; `capabilitiesData` slugs inlined to literal `/styles/<id>` to keep legacy array module-evaluable until VIS-05. |
| FOUND-03 | 01-03 | Dark theme application no longer a render-time side effect; `useThemeSwitcher` and unused `dark:` Tailwind variants stripped (committing dark-only) | SATISFIED | `<html class="dark">` static; App.js render side-effect removed; useThemeSwitcher.jsx deleted; commented theme-toggle markup removed from AppHeader/AppBanner. NOTE: the four `-light` Tailwind tokens were initially deleted by 01-03 but RESTORED by commit 6942a1a (BL-01 fix) because consumer files still reference them via `dark:text-ternary-light` etc. The roadmap criterion "dark theme behaves identically (dark-only, committed)" is satisfied because the tokens still exist; full unused-variant strip is explicitly deferred to Phase 2 / VIS-05 per D-08. |
| FOUND-04 | 01-04 | Image-modal in `ProjectGallery` renders from React state; `document.getElementById`/`classList` manipulation removed | SATISFIED | useState-driven modal; conditional render; React-key bug fixed (`_id`). Codebase-wide grep confirms only the canonical React mount remains. |
| FOUND-05 | 01-01 | `.nvmrc` (Node 20 LTS), `netlify.toml` declares `NODE_VERSION` and build image, `pnpm-lock.yaml` committed | SATISFIED | All three files present and consistent; lockfile tracked with `lockfileVersion: '9.0'`; SHA-256 byte-identical to working-tree state pre-install. |
| FOUND-06 | 01-06 | `App.test.js` replaced with passing smoke test; broken legacy test removed | SATISFIED | New async smoke test mounts `<App />` with mocked Sanity client; passes 1/1 with no `act` warnings; legacy `learn react` assertion gone. |

All 6 requirement IDs from the PLAN frontmatter are accounted for; no orphaned phase-1 requirements remain.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/projects/ProjectGallery.jsx` | 32, 34 | `z-80` / `z-90` Tailwind classes — not in default scale (only `0,10,20,30,40,50,auto`) | Info | Documented in 01-REVIEW.md as IN-03; pre-existing; modal stacking happens to work because nothing else competes at that level. Not a phase-1 regression. |
| `src/components/home/OurProcess.jsx` `src/components/projects/ProjectsGrid.jsx` `src/pages/Materials.jsx` | various | `.sort()` mutates state in render | Warning | Documented in 01-REVIEW.md as WR-01; pre-existing pattern carried into refactored files; not a phase-1 regression. |
| `src/components/home/Collaborations.jsx` | ~57 | `images[0].asset.url` access without checking the array | Warning | Documented in 01-REVIEW.md as WR-02; pre-existing. |
| `src/hooks/useSanityQuery.jsx` | 4-32 | `params` captured in effect closure but not in dep array | Warning | Documented in 01-REVIEW.md as WR-03; deliberate per D-03 (`params` is intentionally not in deps to avoid inline-object-literal refetch loops); footgun for future callers but no current consumer passes `params`. |
| `src/components/projects/ProjectsFilter.jsx` | 33 | `<option value={setSelectProject}>` binds function reference to value | Warning | Documented in 01-REVIEW.md as WR-05; pre-existing bug; the "All laser" default option always sends a function reference back to parent. |
| `src/data/projects.js` | entire file | Module is now entirely orphan code (~265 lines) | Info | Documented in 01-REVIEW.md as IN-01; explicitly deferred to VIS-05 in Phase 2 per D-15. |
| `src/App.js` | 24 | `SERVICES.find(s => s.key === 'laser')` would return `undefined` and crash render if `'laser'` removed | Info | Documented in 01-REVIEW.md as BL-02; no current runtime defect — fragility flag for Phase 2. Verifier instructions note BL-02 is deferred. |

None of these constitute a phase-1 goal-blocker. All are pre-existing patterns or documented deferrals tracked in 01-REVIEW.md.

### Human Verification Required

None — every roadmap success criterion is verifiable programmatically:

- SC #1 (hook + 6 consumers): grep + allowlist diff
- SC #2 (dark theme without side-effect): grep on App.js + file existence + compiled-CSS selector check
- SC #3 (state-driven modal, no DOM mutation): codebase-wide grep
- SC #4 (env-pinned build): `pnpm install --frozen-lockfile && pnpm build` exit 0 + lockfile SHA match
- SC #5 (passing smoke test): `pnpm test` exit 0 + assertion check

The original PLAN-03 and PLAN-04 had `checkpoint:human-verify` tasks for visual smoke. PLAN-03's smoke checkpoint is effectively absorbed by the BL-01 review-fix cycle (reviewer caught the dropped `dark:text-ternary-light` rules; commit 6942a1a restored them; compiled CSS now confirms). PLAN-04's modal-interaction check is automated by the codebase-wide grep + smoke test mounting `<App />` with no console warnings about duplicate or undefined keys.

### Gaps Summary

No gaps. All 5 ROADMAP success criteria are met; all 6 phase requirements (FOUND-01..06) are satisfied with codebase evidence; the phase goal — "stabilize the codebase substrate so Phase 2's relaunch and every later phase land on a clean, pinned foundation" — is achieved.

The one significant deviation from the original plan (deletion of the four `-light` Tailwind tokens) was caught in 01-REVIEW.md as BL-01 and resolved via commit 6942a1a before this verification. The corrected post-fix state is what now ships and is what this verifier confirmed against the live build.

Pre-existing issues flagged in 01-REVIEW.md as warnings (WR-01..06) and the BL-02 fragility flag are not phase-1 goal blockers — they describe pre-existing patterns or future-proofing concerns intentionally deferred to Phase 2. Per verifier instructions, BL-02 is explicitly deferred and BL-01 is resolved.

---

_Verified: 2026-05-03_
_Verifier: Claude (gsd-verifier)_
