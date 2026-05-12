---
phase: 260512-cur
plan: 01
subsystem: marketing-site-nav
tags: [quick-task, ship-gate, snipcart-production-test, nav, home-banner, feature-flag]
dependency_graph:
  requires: []
  provides:
    - "SERVICES.hidden flag (optional boolean) on the print service entry"
    - "NAV_ITEMS filters SERVICES by !hidden + has /shop and /quote commented out"
    - "Home banner service-cards row filters SERVICES by !hidden and centers single card"
  affects:
    - src/App.js (route map intentionally untouched — still uses unfiltered SERVICES.map)
tech_stack:
  added: []
  patterns:
    - "Filter-on-render feature flag — single source of truth (SERVICES.hidden) consumed by visible-UI iterators only; route-map iterator intentionally unfiltered"
key_files:
  created: []
  modified:
    - src/data/services.js
    - src/components/shared/AppHeader.jsx
    - src/components/shared/AppBanner.jsx
decisions:
  - "Hide via a hidden:true flag on SERVICES entries rather than deleting code. Reversal is a three-line change (delete flag + uncomment two NAV_ITEMS entries) so launching the WIP sections is low-friction."
  - "Routes in src/App.js MUST stay registered against unfiltered SERVICES.map so direct URLs (/shop, /shop/:slug, /3d-printing, /3d-printing/:slug, /quote) keep resolving — required for the Snipcart production test on shapesmith.studio."
  - "Add sm:justify-center to the home-banner cards wrapper instead of widening the single card. The centered sm:w-1/2 card reads as deliberate and the class is correct for any service count, so no follow-up cleanup is needed when 3D Printing returns."
metrics:
  duration: "~2 minutes"
  completed: "2026-05-12T13:20:08Z"
  tasks_completed: 3
  files_modified: 3
  commits: 3
---

# Phase 260512-cur Plan 01: Hide WIP Entry Points (Shop, 3D Printing, Get a Quote) Summary

Single-flag hide of Shop, 3D Printing, and Get a Quote from nav + home banner, with routes kept registered so direct URLs work for the Snipcart production test on `shapesmith.studio`.

## Objective

Unblock the production Snipcart 500 diagnostic by deploying `dev` → `master` without exposing in-progress features. Visible nav must reduce to **Home, Laser Cutting, About, Contact (CTA)** and the home banner must show one centered Laser Cutting card — while `/shop`, `/shop/:slug`, `/3d-printing`, `/3d-printing/:slug`, and `/quote` all still resolve (no 404) so the Snipcart shop can be tested at `shapesmith.studio/shop/kinetic-sculpture`.

## What Shipped

| # | Task | File | Commit |
| - | ---- | ---- | ------ |
| 1 | Add `hidden: true` flag (+ explanatory comment) to the `print` SERVICES entry | `src/data/services.js` | `df021a0` |
| 2 | Filter `NAV_ITEMS` by `!s.hidden` and comment out the `/shop` + `/quote` entries with a restore note | `src/components/shared/AppHeader.jsx` | `fdba9c1` |
| 3 | Filter home-banner service cards by `!s.hidden` and add `sm:justify-center` to the wrapper so the lone Laser Cutting card centers on `sm+` viewports | `src/components/shared/AppBanner.jsx` | `3512cf8` |

Resulting visible UI:

- **Desktop nav:** Home  Laser Cutting  About  [Contact CTA] — exactly four items
- **Mobile (hamburger) nav:** same four items
- **Home banner:** one centered Laser Cutting service card + Contact CTA below

Routes still registered (unfiltered `SERVICES.map(...)` in `src/App.js`): `/shop`, `/shop/:slug`, `/3d-printing`, `/3d-printing/:slug`, `/quote` — all resolve via direct URL.

## How It Works

`SERVICES` in `src/data/services.js` gains an optional `hidden` boolean. The single iterator change is mirrored across the two visible-UI consumers:

```js
// AppHeader NAV_ITEMS
...SERVICES.filter((s) => !s.hidden).map((s) => ({ ... }))

// AppBanner service-cards row
{SERVICES.filter((s) => !s.hidden).map((s) => { ... })}
```

`src/App.js` deliberately uses the **unfiltered** form so the route map still registers every service, keeping direct URLs reachable. This split — visible iterators filter, route iterator does not — is the load-bearing constraint that makes the Snipcart production test possible.

The two manually-listed `/shop` and `/quote` entries in `NAV_ITEMS` are commented out (not deleted) so restoring them when the features ship is a single uncomment per line.

## Reversal Path (when these features ship)

Three lines, no logic change:

1. Delete the `hidden: true` line from `src/data/services.js` (the explanatory comment above it can be deleted along with it).
2. Uncomment `// { to: '/shop', label: 'Shop', match: '/shop' },` in `AppHeader.jsx`.
3. Uncomment `// { to: '/quote', label: 'Get a Quote', match: '/quote' },` in `AppHeader.jsx`.

`sm:justify-center` on the banner cards wrapper stays — it's correct for any service count.

## Decisions Made

- **Flag-based hide over code deletion** — Reversal is one-liner-per-file. Future plan can flip the flag without re-deriving the change set.
- **Filter at visible-UI iterators only, never at the route map** — The route map in `src/App.js` is the single source of truth for which URLs resolve. Filtering it would 404 `/shop/kinetic-sculpture` and break the Snipcart production test that triggered this plan.
- **`sm:justify-center` over single-card widening** — Card stays `sm:w-1/2` so when 3D Printing returns, the layout is unchanged. Centering is a wrapper-level no-op for two-card layouts.

## Verification Results

### Static grep invariants (all pass)

```text
services.js — exactly 1 hidden: true                     PASS (count=1)
App.js — uses SERVICES.map (unfiltered)                  PASS
App.js — contains no SERVICES.filter                     PASS
AppHeader.jsx — SERVICES.filter((s) => !s.hidden)        PASS
AppHeader.jsx — /shop entry commented out                PASS
AppHeader.jsx — /quote entry commented out               PASS
AppHeader.jsx — no active /shop entry                    PASS
AppHeader.jsx — no active /quote entry                   PASS
AppBanner.jsx — SERVICES.filter((s) => !s.hidden)        PASS
AppBanner.jsx — sm:justify-center present                PASS
```

### `pnpm build` — clean

- `vite v7.3.3` → 644 modules → built in 1.29s → 24 chunks
- `postbuild` ran (`sitemap.xml` written with 7 URLs)
- Exit 0; no warnings beyond the baseline carry-over (PostCSS `@import`-after-`@tailwind` in `src/css/tailwind.css:5` — pre-existing from Plan 04-02)

### Manual verification (owner action, post-deploy)

The plan's verification §3 (visible nav + direct-URL spot checks on `pnpm start`) and §4 (deploy preview on `dev` then production via PR to `master` for the Snipcart test) are owner-side checkpoint steps explicitly called out in the plan's `<output>` block. They're not executor preconditions — they're the actual goal this plan unblocks. Per project memory (`git_workflow.md`): never push directly to `master`; deploy previews go on `dev`; production via PR.

## Deviations from Plan

None — plan executed exactly as written. The three edits match the verbatim code in the orchestrator plan (`/Users/krush/.claude/plans/i-am-trying-to-whimsical-cook.md`) §1–§3.

Note: `pnpm install` was run once before `pnpm build` because the worktree was spawned without `node_modules`. This is normal worktree setup, not a deviation — `node_modules/` is gitignored and no source changes resulted.

## Deferred Items

None.

## Self-Check: PASSED

**Files exist:**

- `src/data/services.js` — FOUND
- `src/components/shared/AppHeader.jsx` — FOUND
- `src/components/shared/AppBanner.jsx` — FOUND

**Commits exist (per `git log --oneline`):**

- `df021a0` — `feat(260512-cur): add hidden flag to print service entry` — FOUND
- `fdba9c1` — `feat(260512-cur): hide shop, quote, and hidden services from header nav` — FOUND
- `3512cf8` — `feat(260512-cur): filter hidden services and center single card on home banner` — FOUND

**Build:** `pnpm build` exit 0.

**Static greps:** all 10 invariants from the plan's verification §2 pass.
