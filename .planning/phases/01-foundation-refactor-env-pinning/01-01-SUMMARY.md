---
phase: 01-foundation-refactor-env-pinning
plan: 01
subsystem: infra
tags: [pnpm, node, netlify, lockfile, build-config]

requires: []
provides:
  - Reproducible build contract: Node 20 + pnpm 9.0.0 floor pin
  - Committed pnpm-lock.yaml (lockfileVersion '9.0', byte-identical to working-tree state)
  - netlify.toml driving Netlify build from repo (not dashboard)
  - .nvmrc for nvm/Volta auto-switch (literal `20`)
  - yarn.lock fully removed; pnpm is the sole package manager
affects: [01-02, 01-03, 01-04, 01-05, 01-06, phase-02, phase-03, phase-04, phase-05]

tech-stack:
  added: []  # Build-tooling pins only — no runtime deps changed
  patterns:
    - "Floor-pin packageManager (literal `pnpm@9.0.0`) so corepack converges all environments on the lockfile-producing minor"
    - "Lockfile-as-truth: SHA-256 captured before/after `pnpm install --frozen-lockfile` to assert no silent regeneration (invariant T-01-01)"
    - "Single source of build truth: netlify.toml in repo, not dashboard config"

key-files:
  created:
    - ".nvmrc"
    - "netlify.toml"
    - "pnpm-lock.yaml (newly tracked; existed untracked)"
    - ".planning/phases/01-foundation-refactor-env-pinning/01-01-SUMMARY.md"
  modified:
    - "package.json (added engines + packageManager)"
  deleted:
    - "yarn.lock (intentional — pnpm is the sole package manager going forward)"

key-decisions:
  - "packageManager pinned to literal `pnpm@9.0.0` (floor of the 9.x minor that produced lockfileVersion '9.0'), not the locally-installed pnpm version"
  - "Kept --openssl-legacy-provider in package.json scripts; Phase 4 (Vite migration) owns its removal per D-20"
  - "README NOT rewritten in this plan; SEO-04 (Phase 2) owns it per D-22"
  - ".nvmrc uses major-only literal `20` (no `v` prefix, no minor pin) per D-19 — tracks LTS minors, avoids CI breakage on patch bumps"

patterns-established:
  - "Lockfile integrity guard: capture SHA-256 before any install, assert unchanged after, fail-closed if mutated (T-01-01)"
  - "Build-tooling pins live in three coordinated files (.nvmrc + netlify.toml [build.environment] + package.json engines/packageManager) so local nvm, Netlify CI, and corepack all converge"

requirements-completed: [FOUND-05]

duration: 2min
completed: 2026-05-04
---

# Phase 1 Plan 01: Foundation — Env Pinning Summary

**Pinned Node 20 + pnpm 9.0.0 across `.nvmrc`, `netlify.toml`, and `package.json`; committed `pnpm-lock.yaml` verbatim (lockfileVersion '9.0', SHA-256 `36976a38f2943d6f4bfaf4df5da06ba5640dccbdaa111b3e42798d3e156758eb`); removed `yarn.lock`.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-04T02:04:46Z
- **Completed:** 2026-05-04T02:06:29Z
- **Tasks:** 2 / 2
- **Files modified:** 5 (4 created/modified, 1 deleted)

## Accomplishments

- `.nvmrc` (literal `20`) for nvm/Volta auto-switch on local checkouts
- `netlify.toml` declares `command = "pnpm build"`, `publish = "build"`, `NODE_VERSION = "20"` — Netlify build now driven by repo, not dashboard
- `package.json` adds `"engines": { "node": ">=20" }` and floor-pinned `"packageManager": "pnpm@9.0.0"` (corepack-driven environments converge on 9.0.0 regardless of locally installed pnpm)
- `pnpm-lock.yaml` (was untracked) committed verbatim with `lockfileVersion: '9.0'` preserved; SHA-256 byte-identical pre- and post-install
- `yarn.lock` removed (pnpm is the sole package manager going forward)
- Verified end-to-end: `pnpm install --frozen-lockfile` and `pnpm build` both succeed against Node 22 (≥20) with the existing `--openssl-legacy-provider` flag still in scripts

## Task Commits

Each task was committed atomically:

1. **Task 1: Add `.nvmrc`, write `netlify.toml`, update `package.json` engines + packageManager** — `dceeb3e` (chore)
2. **Task 2: Commit `pnpm-lock.yaml`, finalize `yarn.lock` deletion, verify clean install + build** — `bcddb61` (chore)

## Files Created/Modified

- **`.nvmrc`** (created) — Single line `20` (LF terminator, no `v`, no comments)
- **`netlify.toml`** (created) — `[build]` table with `command = "pnpm build"` and `publish = "build"`; `[build.environment]` table with `NODE_VERSION = "20"`
- **`package.json`** (modified) — Inserted `"engines": { "node": ">=20" }` and `"packageManager": "pnpm@9.0.0"` between `"private": true` and `"dependencies"`; `--openssl-legacy-provider` flag preserved in `scripts.start` and `scripts.build`
- **`pnpm-lock.yaml`** (newly tracked) — Committed byte-identical to its working-tree state; `lockfileVersion: '9.0'`; SHA-256 `36976a38f2943d6f4bfaf4df5da06ba5640dccbdaa111b3e42798d3e156758eb`
- **`yarn.lock`** (deleted) — Removed from tracking; pnpm is the sole package manager

## Decisions Made

- **Floor-pin `pnpm@9.0.0`:** Per D-19, the literal floor (9.0.0 — the minimum 9.x release that produced `lockfileVersion: '9.0'`) is the contract, NOT the locally installed pnpm minor. This ensures every contributor and CI runner converges on the same pnpm minor regardless of what they had installed locally.
- **Preserve `--openssl-legacy-provider`:** Per D-20, the flag stays in `package.json` until the Vite migration in Phase 4. Removing it now would risk breaking Netlify with no Phase-1 benefit.
- **Skip README rewrite:** Per D-22, README is owned by SEO-04 (Phase 2). Leaving the stale yarn instructions in place is acceptable scoped friction.

## Deviations from Plan

None — plan executed exactly as written.

The plan's must_haves required the committed `pnpm-lock.yaml` to be byte-identical to the lockfile in the working tree. The lockfile was sourced verbatim from the working tree (originally untracked from the parent repo, brought into the worktree at agent start), staged with `git add`, and never touched by `pnpm install` (only `--frozen-lockfile` was ever used). Pre- and post-install SHA-256 hashes match (`36976a38f2943d6f4bfaf4df5da06ba5640dccbdaa111b3e42798d3e156758eb`), confirming invariant T-01-01.

## Issues Encountered

None. The Task 2 fail-closed path (BLOCKED on `pnpm install --frozen-lockfile` failure) was not triggered — install succeeded on the first attempt with no lockfile modification.

## Lockfile Integrity Audit (T-01-01)

| Stage | SHA-256 |
|-------|---------|
| Pre-install (just before `git add`) | `36976a38f2943d6f4bfaf4df5da06ba5640dccbdaa111b3e42798d3e156758eb` |
| Post `pnpm install --frozen-lockfile` | `36976a38f2943d6f4bfaf4df5da06ba5640dccbdaa111b3e42798d3e156758eb` |
| Post `pnpm build` | `36976a38f2943d6f4bfaf4df5da06ba5640dccbdaa111b3e42798d3e156758eb` |

Hashes match across all three stages → invariant T-01-01 holds: lockfile committed exactly as produced, never silently regenerated mid-task.

## Build Verification

- `pnpm install --frozen-lockfile` → exit 0 (Node v22.22.0, pnpm 9.0.0)
- `pnpm build` → exit 0; `build/index.html` produced; bundle sizes nominal (`116.49 kB` main JS gzipped)

This satisfies ROADMAP success criterion #4: "`pnpm install && pnpm build` succeeds on a clean checkout against the pinned Node version."

## User Setup Required

None — no external service configuration required. The Netlify dashboard `NODE_VERSION` setting (if any was previously configured) is now superseded by the value in `netlify.toml`. Owner may optionally clear the dashboard override to keep the repo as the single source of truth.

## Next Phase Readiness

- All later plans in Phase 1 (and every later phase) can now assume Node 20 + pnpm 9 + a committed lockfile.
- No blockers, no carry-over decisions.
- Wave 2 of Phase 1 is unblocked; the remaining Phase 1 plans (01-02 through 01-06) can execute against this stable build contract.

## Self-Check: PASSED

- All 5 files claimed (`.nvmrc`, `netlify.toml`, `package.json`, `pnpm-lock.yaml`, `01-01-SUMMARY.md`) exist on disk
- `yarn.lock` is absent (deletion confirmed)
- Both task commits resolve in `git log --all`: `dceeb3e`, `bcddb61`
- `pnpm-lock.yaml` SHA-256 matches the committed value (`36976a38f2943d6f4bfaf4df5da06ba5640dccbdaa111b3e42798d3e156758eb`)

---
*Phase: 01-foundation-refactor-env-pinning*
*Completed: 2026-05-04*
