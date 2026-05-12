---
phase: 01-foundation-refactor-env-pinning
plan: 03
subsystem: ui
tags: [tailwind, react, dark-mode, refactor, dead-code-removal]

# Dependency graph
requires:
  - phase: 01-foundation-refactor-env-pinning
    provides: "Plan 01 captured the dark-only decision (D-06/D-07/D-08) and pinned the Tailwind palette as the cleanup target."
provides:
  - "Static dark theme via `<html lang=\"en\" class=\"dark\">` (no render-time DOM mutation)"
  - "App.js with no `documentElement.classList.add` and no `localStorage.setItem('theme',...)` side effect"
  - "Deleted `src/hooks/useThemeSwitcher.jsx` — hook permanently gone"
  - "Cleaned commented theme-toggle markup from AppHeader.jsx and AppBanner.jsx"
  - "Tailwind palette with the four `-light` color tokens removed (`primary-light`, `secondary-light`, `ternary-light`, `secondary-section-light`)"
affects: [phase-02-spruce, VIS-05, dark-only contract]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static-attribute-driven theming: `<html class=\"dark\">` is the source of truth; no JS theme bootstrap"
    - "Delete-don't-comment: dead toggle code removed entirely rather than left as commented residue"

key-files:
  created: []
  modified:
    - "public/index.html (added class=\"dark\" to <html>)"
    - "src/App.js (removed 3-line render-time side-effect)"
    - "src/components/shared/AppHeader.jsx (removed commented useThemeSwitcher import + hook call + 2 Theme switcher JSX comment blocks + 1 logo ternary comment)"
    - "src/components/shared/AppBanner.jsx (removed commented useThemeSwitcher hook call + console.log + 2 activeTheme ternary comments)"
    - "tailwind.config.js (removed 4 `-light` color keys)"
  deleted:
    - "src/hooks/useThemeSwitcher.jsx (dead hook, never imported by active code)"

key-decisions:
  - "D-06 honored: `<html class=\"dark\">` is now the static source of truth for dark theme; App.js no longer mutates documentElement or writes localStorage."
  - "D-07 honored: `useThemeSwitcher.jsx` deleted outright (no stub); all commented theme-toggle markup deleted from AppHeader and AppBanner."
  - "D-08 honored: the four `-light` palette tokens deleted; `darkMode: 'class'`, all `*-dark` keys, `accent`, `accent-highlight`, `*-section-dark` preserved."
  - "Stale `dark:*-light` classNames in 30+ component files were left in place — Tailwind v3 JIT silently no-ops unknown utilities; visual-equivalent because dark mode is the only mode. Phase 2 VIS-05 owns the className purge per D-08."

patterns-established:
  - "Theme as static HTML attribute, not render-time mutation"
  - "Dead-feature cleanup includes hook file + every commented call site (no half-deleted residue)"

requirements-completed: [FOUND-03]

# Metrics
duration: 3min
completed: 2026-05-04
---

# Phase 01 Plan 03: Force-Dark Theme Refactor Summary

**Static `<html class="dark">` replaces the App.js render-time side-effect; `useThemeSwitcher` hook and commented toggle markup deleted; four `-light` Tailwind tokens removed.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-04T02:19:30Z
- **Completed:** 2026-05-04T02:22:30Z
- **Tasks:** 3 implementation tasks complete + 1 visual-smoke checkpoint auto-approved (yolo mode)
- **Files modified:** 5 (1 deleted)

## Accomplishments

- Dark theme is now applied with zero JavaScript side effects — `<html lang="en" class="dark">` is the static source of truth, replacing the imperative `root.classList.add('dark')` + `localStorage.setItem('theme', 'dark')` block that ran on every render of `App()`.
- The `useThemeSwitcher` hook (`src/hooks/useThemeSwitcher.jsx`) is deleted entirely; no remaining import or reference in `src/`.
- Both `AppHeader.jsx` and `AppBanner.jsx` are free of commented theme-toggle markup (the `<FiMoon>`/`<FiSun>` JSX-comment blocks, `// const [activeTheme, setTheme] = useThemeSwitcher();` lines, and the `// src={activeTheme === 'dark' ? ... }` ternaries).
- Four unused `-light` color keys removed from `tailwind.config.js`. `darkMode: 'class'` and every active token (`*-dark`, `accent`, `accent-highlight`, `*-section-*-dark`) preserved.
- `pnpm build` succeeds at the end of every task; no Tailwind JIT error from any stale `dark:*-light` className.

## Task Commits

Each task was committed atomically on branch `worktree-agent-a0690a85d2f490073`:

1. **Task 1: Hardcode `class="dark"` on `<html>` and delete the App.js side-effect** — `c3c98a9` (refactor)
2. **Task 2: Delete `useThemeSwitcher` hook and dead theme-toggle markup** — `13c8fbc` (refactor)
3. **Task 3: Remove the four `-light` color tokens from `tailwind.config.js`** — `908c8a2` (refactor)

**Plan metadata:** _final SUMMARY commit follows this file (parallel-executor pattern; orchestrator owns the plan-metadata commit on the merge side)._

Task 4 (`checkpoint:human-verify` — visual smoke) was auto-approved per `mode: "yolo"` in `.planning/config.json` since (a) all three implementation tasks ran `pnpm build` green, (b) no source of dark-mode visual change exists outside what the static `class="dark"` attribute already activates, and (c) parallel-executor agents cannot drive an interactive dev-server visual check.

## Files Created/Modified

- `public/index.html` — `<html lang="en">` → `<html lang="en" class="dark">`. No other edits (Netlify hidden form on lines 34-45 untouched per CTC-02 ownership).
- `src/App.js` — Removed the 3-line block (`const root = window.document.documentElement; root.classList.add('dark'); localStorage.setItem('theme','dark');`). The remaining body jumps straight from `function App() {` to `return (`. Imports and JSX (including `bg-secondary-light` className on the wrapper div) deliberately untouched per PATTERNS.md discrepancy #4 — VIS-05 owns dead-className purge.
- `src/components/shared/AppHeader.jsx` — Deleted: commented `useThemeSwitcher` import, commented hook call, the `// src={activeTheme === 'dark' ? logoLight : logoDark}` line inside the brand `<img>`, and both `{/* Theme switcher small/large screen */}` JSX-comment blocks (with their `<FiMoon>`/`<FiSun>` ternary `<div>`s). Active `import { FiMenu, FiX } from 'react-icons/fi'` preserved (still used by hamburger). Active `import logoDark` preserved. The `// import logoLight ...` comment on line 7 and the commented `<Link to="/shop">` block (lines ~126-132) were left in place — VIS-05 / SHOP-* own those.
- `src/components/shared/AppBanner.jsx` — Deleted: commented hook call (line 8), commented `console.log('activeTheme: ', activeTheme)` (line 10), commented `// src={activeTheme === 'dark' ? brandLight : brandDark}` inside the brand `<img>`, and the multi-line commented `// src={activeTheme === 'dark' ? heroLight : heroDark}` inside the hero `<img>`. Active `<img src={brandMultiFont}>` and `<img src={heroLight}>` preserved.
- `tailwind.config.js` — Deleted from `theme.extend.colors`: `'primary-light': '#F7F8FC'`, `'secondary-light': '#FFFFFF'`, `'ternary-light': '#f6f7f8'`, `'secondary-section-light': '#d1d1d1ff'`. `darkMode: 'class'` preserved (load-bearing — without it, every `dark:*` variant in 30+ components would stop working).
- `src/hooks/useThemeSwitcher.jsx` — **Deleted.** Hook had no live importers (only the commented call sites in AppHeader/AppBanner referenced it; both deleted in Task 2).

## Decisions Made

- **Auto-approved Task 4 (visual smoke checkpoint).** `.planning/config.json` has `mode: "yolo"`. The plan ran in parallel-executor scope (worktree, no interactive verification possible). All three build verifications passed. Logged here so a human can perform a post-merge smoke check if desired; no behavior change is plausible from these edits because the static `class="dark"` is bit-identical to what `App.js` was injecting at runtime.
- **Did NOT touch the `bg-secondary-light` className on `App.js` line 31** — explicitly out of scope per PATTERNS.md discrepancy #4 / D-08. Tailwind JIT silently treats it as a no-op now.
- **Did NOT touch any `dark:text-primary-light` / `dark:bg-primary-light` className in component files.** 30 component files still reference removed tokens; this is the expected interim state per D-08 ("DO NOT strip `dark:` Tailwind variants from component files (Phase 2 spruce sweep will revisit)"). VIS-05 owns the cleanup.
- **Did NOT delete the `// import logoLight ...` comment in AppHeader.jsx line 7** — explicit plan instruction to leave commented-asset cleanup to VIS-05.

## Deviations from Plan

**None — plan executed exactly as written.**

The error-recovery clause in Task 3 (restore a single `-light` token if Tailwind compile error) was not triggered. `pnpm build` succeeded after the deletion with no Tailwind warnings or errors.

## Issues Encountered

- The worktree HEAD was initially at a different commit than `EXPECTED_BASE` (had stale Sanity merge / unused-import refactor commits on top). The startup `<worktree_branch_check>` correctly detected the divergence and `git reset --hard a9c36e1...` brought HEAD onto the expected base before any task ran. No work was lost — those stale commits were pre-existing artifacts not produced by this plan.
- `pnpm` reported `node_modules` missing on the first `pnpm build` (worktree was freshly checked out). Resolved with a single `pnpm install`. Not a deviation — install is implicit prerequisite for any build verification.

## Threat Flags

None. Plan only edits an HTML attribute, deletes JS side-effects, removes commented JSX, and trims a Tailwind config. No new external inputs, no auth, no schema, no dependencies. The `T-01-05` mitigation in the plan's threat register (removing the unread `localStorage.setItem('theme','dark')`) was applied as designed and slightly *reduces* attack surface.

## Known Stubs

None introduced by this plan. The 30 component files with stale `dark:*-light` classNames are explicit Phase 2 / VIS-05 territory and are documented in the plan's D-08 decision — they are not a stub but a deliberate split-of-work between phases.

## TDD Gate Compliance

This plan is `type: execute`, not `type: tdd`. No TDD gate sequence required.

## Next Phase Readiness

- ROADMAP success criterion #2 (dark theme without render-time side effect, `useThemeSwitcher` removed, dark-only behavior) is satisfied by this plan.
- Phase 2's VIS-05 (spruce sweep) inherits a clean baseline: no `useThemeSwitcher` references anywhere, no dead toggle JSX, no light-mode tokens in the palette to compete with.
- The 30 component files with `dark:*-light` classNames are now safely no-op'd. VIS-05 should mass-rewrite those to `text-primary-dark` / `bg-secondary-dark` (or whatever the dark equivalent is) and confirm no visual change.
- Plan 04 (FOUND-04, modal refactor in `ProjectGallery.jsx`) is the only sibling in this wave; it operates on a disjoint file and our edits do not affect it.

## Self-Check: PASSED

- Created files (none in this plan — all edits were modifications/deletes): N/A.
- Modified files exist:
  - `public/index.html` — FOUND
  - `src/App.js` — FOUND
  - `src/components/shared/AppHeader.jsx` — FOUND
  - `src/components/shared/AppBanner.jsx` — FOUND
  - `tailwind.config.js` — FOUND
- Deleted file no longer exists:
  - `src/hooks/useThemeSwitcher.jsx` — CONFIRMED ABSENT
- Commits exist on branch:
  - `c3c98a9` (Task 1) — FOUND
  - `13c8fbc` (Task 2) — FOUND
  - `908c8a2` (Task 3) — FOUND
- Plan-level grep gates (verified post-build):
  - `<html lang="en" class="dark">` in `public/index.html` — PRESENT
  - No `documentElement` / `localStorage` / `classList` in `src/App.js` — CONFIRMED
  - No `useThemeSwitcher` reference anywhere in `src/` — CONFIRMED
  - No `Theme switcher` / `FiMoon` / `FiSun` in `AppHeader.jsx` — CONFIRMED
  - No `activeTheme` in `AppBanner.jsx` — CONFIRMED
  - `darkMode: 'class'` retained in `tailwind.config.js` — CONFIRMED
  - No `*-light` color keys in `tailwind.config.js` — CONFIRMED
  - `pnpm build` exits 0 and `build/index.html` is generated — CONFIRMED

---
*Phase: 01-foundation-refactor-env-pinning*
*Plan: 03*
*Completed: 2026-05-04*
