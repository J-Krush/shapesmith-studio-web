# Phase 1: Foundation — refactor + env pinning - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Stabilize the codebase substrate before Phase 2's relaunch lands net-new features on it. Six mechanical refactors (FOUND-01..06) covering: a unified Sanity-fetch hook, a `SERVICES` constant replacing `capabilitiesTitle`, dark-theme correctness fix, state-driven gallery modal, Node/build-tool pinning, and a passing smoke test. Non-visual; zero new user-facing capability.

**In scope:** the six FOUND-XX requirements exactly as written.
**Out of scope:** anything in CONCERNS.md not covered by FOUND-XX (`useScrollToTop` listener leak, `BackToTop` stub deletion, `isProd`/`getImageUrl` purge, dead-data-file deletion, contact-form refactor, `styled-components` removal). VIS-05 already owns the dead-code purge in Phase 2; do not pull it forward.

</domain>

<decisions>
## Implementation Decisions

The user delegated all five gray areas to Claude's discretion with two constraints: **don't refactor too much** and **bring it up to date with modern React + best practices**. The decisions below are calibrated to that brief — minimum surface area, modern idioms, no scope creep.

### useSanityQuery hook (FOUND-01)
- **D-01:** API is `const { data, loading, error, refetch } = useSanityQuery(query, params, deps = [])`. Includes `refetch` because it's a one-line addition with obvious downstream value (Phase 3 quote-tool retries, Phase 5 shop inventory). No `mutate`/optimistic helpers — out of scope for read-only Sanity.
- **D-02:** Cancellation via `AbortController` passed to `sanityClient.fetch(query, params, { signal })`. Modern idiom; the older mounted-flag pattern is leftover 2018. Effect cleanup calls `controller.abort()`.
- **D-03:** Effect deps are `[query, ...deps]`. Caller controls re-fetch triggers explicitly (matches the `useEffect`/`useMemo` mental model). Do NOT auto-`JSON.stringify` params — surprising re-fetches on shallow object identity changes are worse than asking the caller to pass primitives.
- **D-04:** All seven existing fetch sites migrate in this phase: `ProjectsContext`, `AboutMeContext`, `QuickInfo`, `OurProcess`, `QuickSpecs`, `Collaborations`, `Materials`. Loading/error states surface as graceful empty-render (current behavior preserved) — no new loading skeletons or error UI in Phase 1; that's a Phase 2 visual concern.
- **D-05:** Hook lives at `src/hooks/useSanityQuery.jsx`. JSX extension to match existing hook directory convention (even though no JSX is rendered).

### Dark theme application (FOUND-03)
- **D-06:** Hardcode `class="dark"` on `<html>` in `public/index.html`. Zero JS, zero FOUC, no React side effect. The `root.classList.add('dark')` and `localStorage.setItem('theme', 'dark')` lines in `App.js` are deleted entirely.
- **D-07:** `src/hooks/useThemeSwitcher.jsx` is deleted, plus all commented-out theme-toggle markup in `AppHeader.jsx` and `AppBanner.jsx`. No dark/light toggle survives anywhere.
- **D-08:** Tailwind `dark:` variants stay in component files for now — they're the active styling and stripping them across 50+ files is mechanical churn that belongs in Phase 2's spruce sweep where every file gets touched anyway. Phase 1 only removes the unused **light-mode color tokens** in `tailwind.config.js` (`primary-light`, `secondary-light`, `ternary-light`, `secondary-section-light` — only the `-light` keys, the `dark:` lookups still need targets in dark mode). Re-evaluate during Phase 2 if `dark:` prefix flattening is worth the diff.

### ProjectGallery modal (FOUND-04)
- **D-09:** Narrow useState fix in `src/components/projects/ProjectGallery.jsx` only. `const [openImage, setOpenImage] = useState(null)`; modal renders conditionally on `openImage`. The `document.getElementById("modal").classList...` calls are removed.
- **D-10:** Do NOT extract a reusable `<Modal>` component yet. Phase 2 ships `/3d-printing` with its own gallery and is the natural moment to lift a shared component once N=2. Avoiding the wrong-abstraction trap (Sandi Metz, called out in research SUMMARY.md pitfalls).
- **D-11:** While in this file, also fix the `image.asset.id` → `image.asset._id` React-key bug (CONCERNS.md flagged it; touching the same file makes this free).

### SERVICES constant + capabilitiesTitle removal (FOUND-02)
- **D-12:** Clean rip. `src/data/services.js` exports `SERVICES = [{ key, urlSegment, navLabel, sanityType, contactSubject }]`. Phase 1 lands two entries: `laser` (sanityType `laser-style`, urlSegment `styles`) and `print` (sanityType `print-style`, urlSegment `3d-printing`) — Phase 2 consumes both, but Phase 1 only USES the `laser` entry; `print` is declared so Phase 2 doesn't need to extend the schema, just light up the existing slot.
- **D-13:** Migrate all four `capabilitiesTitle` consumers in this phase: `App.js`, `AppHeader.jsx`, `ProjectsFilter.jsx`, `ProjectsGrid.jsx`. The export from `src/data/projects.js` is deleted.
- **D-14:** Do NOT generalize `ProjectsContext` → `ServicesContext` in this phase. The ServicesContext-vs-parallel decision is explicitly deferred to Phase 2 per ROADMAP.md. Phase 1 only introduces the `SERVICES` constant; Phase 2's plan picks the context shape.
- **D-15:** `src/data/projects.js` still contains other dead exports (the legacy projects array). Leave them — VIS-05 (Phase 2) is the named owner of dead-data purge. Phase 1 only removes the `capabilitiesTitle` symbol.

### Smoke test (FOUND-06)
- **D-16:** `src/App.test.js` is replaced with a minimal mount-without-crashing test: render `<App />` inside a `MemoryRouter`, mock `@sanity/client` to return empty arrays, assert nothing throws and the header navigation renders. Single test, no per-route coverage.
- **D-17:** No new test deps. Stay on CRA-bundled Jest + `@testing-library/react`. `@testing-library/user-event` and `@testing-library/dom` already in `devDependencies` are left alone.
- **D-18:** Sanity client mock uses `jest.mock('../utilities/sanityClient')`. Centralize the mock at the top of the file; if Phase 2 adds more tests it can be lifted to `src/setupTests.js`.

### Environment pinning (FOUND-05)
- **D-19:** `.nvmrc` contains `20` (major-only pin — track LTS minors, avoid lockstep CI breakage on patch bumps). `package.json` adds `"engines": { "node": ">=20" }` and `"packageManager": "pnpm@9.0.0"` (or whichever pnpm matches the lockfile's `lockfileVersion: '9.0'`).
- **D-20:** `netlify.toml` is created with `[build] command = "pnpm build"`, `publish = "build"`, and `[build.environment] NODE_VERSION = "20"`. The `--openssl-legacy-provider` flag stays in `package.json` scripts until the Vite migration (Phase 4) — removing it now risks breaking the Netlify build for no Phase 1 benefit.
- **D-21:** `pnpm-lock.yaml` (currently untracked per `git status`) is committed in the same PR as `netlify.toml`. `yarn.lock` is fully gone.
- **D-22:** README is NOT rewritten in this phase. SEO-04 (Phase 2) is the named owner. If contributors trip over the stale yarn instructions in the meantime, that's acceptable scoped friction.

### Plan structure
- **D-23:** Hint to the planner: the six FOUND-XX items are independent and can land as 6 atomic commits/PRs (or one PR with 6 commits). Granular rollback during a Phase 1→Phase 2 handoff is worth the small overhead. Suggested order: FOUND-05 (env pin, foundational) → FOUND-01 (hook, no consumers yet) → FOUND-01 cont. (migrate fetch sites) → FOUND-03 (dark theme) → FOUND-04 (modal) → FOUND-02 (SERVICES) → FOUND-06 (smoke test, last because it covers everything above).

### Claude's Discretion
All five originally-presented gray areas. The user said "just move forward with whatever you think is best" — decisions D-01..D-23 are exercised under that grant. The planner and researcher should treat them as locked unless they hit a concrete obstacle in the codebase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level requirements & roadmap
- `.planning/REQUIREMENTS.md` §Foundation — FOUND-01..06 are the locked requirements; do not invent new ones in this phase
- `.planning/ROADMAP.md` §Phase 1 — goal, success criteria, dependency edges
- `.planning/PROJECT.md` §Constraints, §Key Decisions — tech-stack lock (CRA + React 18 + JS, no TS/Next), dark-only commitment

### Codebase ground truth (already mapped)
- `.planning/codebase/CONCERNS.md` — file:line locations for every refactor target (`isProd`, `useScrollToTop` leak, `ProjectGallery` modal, dead `src/data/*`, theme switcher residue, contact-form duplicates). Phase 1 only acts on the FOUND-XX subset; the rest is reference for "don't accidentally break this."
- `.planning/codebase/STACK.md` — confirms Node 17+ via `--openssl-legacy-provider`, pnpm 8+ via `lockfileVersion: '9.0'`, CRA 5 + React 18.3.1
- `.planning/codebase/ARCHITECTURE.md` — current Sanity-fetch idioms (Context providers + inline `useEffect`s) that `useSanityQuery` consolidates
- `.planning/codebase/CONVENTIONS.md` — file naming (`.jsx` for hooks/components, `.js` for plain modules), color-token typo (`ternary` not `tertiary` — preserve), Tailwind dark-pair convention

### Research (already conducted)
- `.planning/research/SUMMARY.md` §Phase 1, §"Critical Pitfalls" — env-pin rationale, ServicesContext deferral to Phase 2, "do NOT `npm audit fix --force`" warning
- `.planning/research/PITFALLS.md` (if it discusses Phase 1 specifics — researcher should pull whatever's relevant)

### Out-of-scope guardrails
- `.planning/PROJECT.md` §"Out of Scope" — TypeScript migration, Next.js migration, accounts, blog, configurable shop, light-mode pass. Reject any scope creep here.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/utilities/sanityClient.jsx`** — single configured client; `useSanityQuery` wraps this, no need to reconfigure. Hardcoded `projectId: "qx9kep1e"`, `dataset: "production"`, `useCdn: true` — explicitly NOT environmentalized in Phase 1 (out of scope; would expand the foundation work).
- **CRA's bundled Jest + `@testing-library/react`** — already wired via `react-scripts test`. `setupTests.js` already imports `@testing-library/jest-dom` matchers. FOUND-06 builds on this; no new infra.
- **`src/data/projects.js` `capabilitiesTitle`** — currently the "constant that everything depends on." `SERVICES` replaces this role.

### Established Patterns
- **Context provider per Sanity content type** (`ProjectsContext`, `AboutMeContext`) — the 2-of-2 pattern that Phase 2 will decide whether to generalize. Phase 1 leaves this shape untouched; only swaps the inner `useEffect` for `useSanityQuery`.
- **Inline `useEffect` + `sanityClient.fetch` in leaf components** (`QuickInfo`, `OurProcess`, `QuickSpecs`, `Collaborations`, `Materials`) — the **anti-pattern** that `useSanityQuery` consolidates. Five sites; identical replacement template.
- **Dark-pair Tailwind classes** (`text-primary-dark dark:text-primary-light`) — preserved in Phase 1; only the **dead light-mode color tokens** in `tailwind.config.js` get removed.
- **`.jsx` for hooks/components, `.js` for data modules** — `useSanityQuery.jsx` follows existing hook convention.

### Integration Points
- **`App.js`** — touched by FOUND-03 (remove dark side-effect) AND FOUND-02 (consume `SERVICES` instead of `capabilitiesTitle`). Plan should sequence to avoid stomping commits.
- **`src/components/shared/AppHeader.jsx`** — touched by FOUND-02 (nav label) AND FOUND-03 (delete commented theme-toggle markup). Same advisory.
- **`public/index.html`** — touched only by FOUND-03 (`class="dark"` on `<html>`). Phase 2 will revisit for SEO meta and the Netlify hidden form.
- **`tailwind.config.js`** — light-mode color tokens deleted. The `darkMode: 'class'` setting and `@tailwindcss/forms` plugin stay.
- **`package.json` scripts** — `--openssl-legacy-provider` flag retained until Phase 4 Vite migration.

</code_context>

<specifics>
## Specific Ideas

User did not surface specific references or examples — granted full discretion within the "modern React, minimum churn" framing. Decisions D-01..D-23 are the canonical record of what was chosen and why.

</specifics>

<deferred>
## Deferred Ideas

Items raised by codebase analysis that the user did NOT scope into Phase 1 — preserved here so they aren't lost:

- **`useScrollToTop` listener leak** (`src/hooks/useScrollToTop.jsx:10-15,32`) — duplicate `window.addEventListener` plus missing `useEffect` deps array. Real bug. Not in FOUND-XX. Candidate for a Phase 2 cleanup or its own surgical fix.
- **`BackToTop` stub component** (`src/components/BackToTop.jsx`) — does nothing useful. Delete candidate; Phase 2 VIS-05 is the natural owner.
- **`isProd`/`getImageUrl` dead code** (`src/utilities/helpers.jsx`) — Phase 2 VIS-05 owns dead-code purge.
- **`ProjectsFilter` broken UI placeholder** + **`ProjectRelatedProjects` crash-on-render** + **`AboutClients` undefined-context crash** + **`AboutCounter` template-residue copy** — orphaned components, none rendered in active routes. Delete during Phase 2 VIS-05.
- **`HireMeModal.jsx` + `contact-form.js`** — orphaned contact-form duplicates. Phase 2 VIS-05.
- **Sanity env-driven config** (`projectId`/`dataset` move to env vars) — flagged in CONCERNS.md as a smell. Not in FOUND-XX. Best paired with the Vite migration (Phase 4) where `REACT_APP_*` → `VITE_*` is happening anyway.
- **`rel="noopener noreferrer"` on external links** + **`target="__blank"` typo fix** — security smell in CONCERNS.md. Not scoped here.
- **README rewrite** — owned by SEO-04 (Phase 2).
- **Reusable `<Modal>` component extraction** — natural at N=2 in Phase 2 when `/3d-printing` gallery lands.
- **Tailwind `dark:` prefix flattening** — possible during Phase 2 spruce sweep when every component file is touched. Not required; only the light-mode color tokens go in Phase 1.
- **Test coverage expansion beyond smoke** — per-route tests, ContactForm submit happy path, Sanity-context tests with mocked client. Out of scope for FOUND-06; revisit when stakes warrant.

</deferred>

---

*Phase: 1-foundation-refactor-env-pinning*
*Context gathered: 2026-05-03*
