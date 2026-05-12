---
phase: 04-vite-migration
plan: 04
subsystem: infra
tags: [cleanup, tailwind, postcss, hygiene, vite, cra-residue]

# Dependency graph
requires:
  - phase: 04-vite-migration
    provides: "Plan 04-02 removed react-scripts/postcss-cli/@babel/plugin-proposal-private-property-in-object/--openssl-legacy-provider; Plan 04-03 migrated tests to Vitest. This plan closes the loop on the orphan compiled-CSS file the dead build:css script left behind."
provides:
  - "src/css/main.css removed (1,676 lines of compiled Tailwind utility CSS — generated artifact with zero importers)"
  - "Sentinel-grep-clean source tree (src/, public/, root config) — no main.css consumers, no --openssl-legacy-provider/react-scripts/postcss-cli/REACT_APP_/process.env in src/"
  - "pnpm build green (24 chunks; index-BI4RGJBk.js byte-identical to Plan 04-02 baseline; sitemap with 7 URLs) and pnpm test green (8 files / 43 tests) after deletion"
affects:
  - "04-05 deploy preview — repo is now CRA-residue-free at the source level; deploy preview will exercise an even-smaller artifact set (the 31 KB main.css was never published to build/, but its absence makes the working tree match the deployed shape)"
  - "Future contributors — no more 'is src/css/main.css used?' confusion; the file is gone and the build:css script that produced it is also gone"

# Tech tracking
tech-stack:
  added: []
  removed:
    - "src/css/main.css (1,676 lines of compiled Tailwind utility CSS — runtime-orphan generated artifact)"
  patterns:
    - "Vite consumes src/css/tailwind.css (3 @tailwind directives + 1 Google Fonts @import) directly through PostCSS — no intermediate compiled output committed to source"

key-files:
  modified: []
  deleted:
    - "src/css/main.css (31,526 bytes / 1,676 lines; last modified 2026-05-06; content was Tailwind v3 utility class output produced by the now-removed `postcss src/css/tailwind.css -o src/css/main.css` build:css script)"

key-decisions:
  - "Plan 04-04 (2026-05-08): Deleted src/css/main.css with `git rm` in a single atomic commit (76365c7) — no delete-then-add round-trip; the file goes from tracked to untracked via the deletion commit alone."
  - "Plan 04-04 (2026-05-08): Confirmed orphan status with two-pass grep before deletion: (a) `grep -rn 'main\\.css' src/ public/` returned only the file itself, and (b) whole-repo grep across all source/config extensions (.js/.jsx/.html/.json/.css/.cjs/.mjs/.toml) under everything except node_modules/.git/.planning/build/dist returned 0 hits. Vite's runtime CSS path is src/index.js → src/index.css → @tailwind directives → Vite PostCSS pipeline; main.css was parallel and unused."
  - "Plan 04-04 (2026-05-08): Did NOT touch the deferred items called out in the executor's <critical_constraints>: (a) tailwind.config.js @tailwindcss/forms plugin string-vs-require bug (RESEARCH §Open Question 3 — fixing it would activate form-element styling and violate the 'no user-visible change' criterion), (b) web-vitals dependency (RESEARCH §Open Question 4 — out of Phase 4 scope), (c) PostCSS @import order warning at src/css/tailwind.css:5 (carried over from Plan 04-02 — pre-existing CSS authoring issue), (d) jsdom 'window.scrollTo' not-implemented console output during tests (cosmetic; tests still pass green)."
  - "Plan 04-04 (2026-05-08): Did NOT update the stale CRA-era prose in CLAUDE.md, README.md, or the comment at netlify/functions/submit-quote/submit-quote.js:18 referring to REACT_APP_RECAPTCHA_SITE_KEY. These are documentation drift outside the source tree, not regressions introduced by Plan 04. The CLAUDE.md content is generated from .planning/codebase/STACK.md / CONVENTIONS.md / ARCHITECTURE.md — those docs are themselves Phase 1 artifacts that pre-date the Vite migration. Updating them is its own scope and was not authorized by PLAN.md or the executor's critical_constraints. Filed as a follow-up below."

requirements-completed: [VITE-01]

# Metrics
duration: ~3min
completed: 2026-05-08
---

# Phase 04 Plan 04: Cleanup Orphan CRA Residue Summary

**Removed the last unused CRA-era artifact — `src/css/main.css` (1,676 lines of compiled Tailwind utility output left behind by the deleted `build:css` script) — via `git rm`; `pnpm build` and `pnpm test` both stay green and the production JS bundle hash is byte-identical to the Plan 04-02 baseline, proving nothing in the runtime path ever referenced the file.**

## Performance

- **Duration:** ~3 minutes (single sequential session, no checkpoint)
- **Started:** 2026-05-08T21:24:00Z (approx)
- **Completed:** 2026-05-08T21:27:00Z (approx)
- **Tasks:** 1 (type=auto, no checkpoints)
- **Files modified:** 0
- **Files deleted:** 1 (src/css/main.css)
- **Commits:** 1 task commit (76365c7) + this metadata commit

## Accomplishments

- **`src/css/main.css` deleted via `git rm`** in commit `76365c7` — the file was 31,526 bytes / 1,676 lines, last modified 2026-05-06, and contained compiled Tailwind v3 utility CSS produced by the now-removed `build:css` npm script (`postcss src/css/tailwind.css -o src/css/main.css`). The script was deleted in Plan 04-02; the file was the loose end Plan 04-04 was scoped to close.
- **Pre-deletion grep proved the file was a true orphan.** Two-pass verification:
  - Inside source tree: `grep -rn 'main\.css' src/ public/` (with `--include` for `.js/.jsx/.html/.json/.css/.cjs/.mjs`) returned 0 hits (the only `main.css` line in the repo was the file itself in `git ls-files`).
  - Across root config: `vite.config.js`, `postcss.config.js`, `tailwind.config.js`, `package.json`, `netlify.toml`, `index.html` — 0 hits.
  - Vite's runtime CSS path is `src/index.js → src/index.css → @tailwind directives → Vite PostCSS pipeline`. `main.css` was parallel and unreachable.
- **Regression checks pass.** Both gates demanded by the success criteria are green:
  - `pnpm build` → vite v7.3.3 → 644 modules in 3.04s → `build/index.html` (3.08 kB) + 24 JS chunks + 1 CSS chunk + sitemap.xml (7 URLs). The main JS bundle is `build/assets/index-BI4RGJBk.js` — **byte-identical hash** to the Plan 04-02 baseline, confirming nothing in the runtime tree referenced `main.css` (otherwise the chunk content would have differed and the hash would have changed).
  - `pnpm test` → vitest v4.1.5 → `Test Files  8 passed (8)` / `Tests  43 passed (43)` / Duration 3.90s.

## Task Commits

1. **Task 1: Verify no consumers, then delete src/css/main.css and run final smoke checks** — `76365c7` (chore)

The plan was a single-task plan; this is the only feature/source commit. The metadata commit (this SUMMARY + STATE/ROADMAP updates) follows.

## Files Created/Modified

### Deleted

- **`src/css/main.css`** — 1,676 lines, 31,526 bytes. Compiled Tailwind v3 utility CSS produced by the now-deleted `build:css` npm script (`postcss src/css/tailwind.css -o src/css/main.css`). Last modified 2026-05-06 (last build of the dead script). Zero importers across the repo; nothing references the file by name. Deleted via `git rm` so the deletion is tracked in commit `76365c7`.

### Modified

None. The plan was a pure deletion + verification.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Delete with `git rm` (not `rm` then `git add -A`) | Single atomic stage operation; the deletion is recorded in the commit object directly. Avoids the delete-then-add round-trip that some VCS interfaces produce. |
| Use commit type `chore` (not `refactor` or `fix`) | Per `<task_commit_protocol>` in execute-plan.md: `chore = config, tooling, dependencies`. This is build-pipeline residue cleanup — not a behavior change, not a refactor of live code. |
| Do NOT touch the deferred items in `<critical_constraints>` | Hard constraint from the executor prompt. The four deferred items (tailwind.config.js plugin bug, web-vitals removal, PostCSS @import order warning, jsdom window.scrollTo note) are intentionally left for future plans because each could change behavior or has separate scope. |
| Do NOT update stale CRA-era prose in CLAUDE.md / README.md / netlify/functions comment | These are documentation drift discovered during the sentinel grep pass. They are pre-existing (introduced by Phase 1 codebase context generation, before Phase 4 even started) and out of the source tree. Per the SCOPE BOUNDARY rule in `<deviation_rules>`, pre-existing issues unrelated to the current task's changes go to deferred-items, not silent-fix. The executor's `<critical_constraints>` does not authorize updating these files. |

## Deviations from Plan

None — plan executed exactly as written. Single-task plan, single atomic commit, all in-source-tree sentinel checks clean before and after the deletion, regression gates green, no auto-fixes triggered.

## Issues Encountered

### Stale documentation discovered during sentinel grep (NOT fixed in this plan — out of scope)

The PLAN.md acceptance criteria (Step 3) call for six grep checks (`openssl-legacy-provider`, `react-scripts`, `postcss-cli`, `@babel/plugin-proposal-private-property-in-object`, `REACT_APP`, `process.env in src/`) to return zero hits with `--exclude-dir={node_modules,.git,.planning}`. **Inside the source tree (`src/`, `public/`, repo root config) all six greps return zero hits.** Outside the source tree, three legacy mentions surfaced:

| File | Line(s) | Stale reference | Why it's there | Action |
| ---- | ------- | --------------- | -------------- | ------ |
| `CLAUDE.md` | 12, 30, 37, 38, 44, 45, 48, 62, 70, 72, 123, 213, 214, 223 | `--openssl-legacy-provider`, `react-scripts`, `postcss-cli`, `@babel/plugin-proposal-private-property-in-object`, `REACT_APP_` | Generated from `.planning/codebase/STACK.md` / `CONVENTIONS.md` / `ARCHITECTURE.md` (Phase 1 artifacts that pre-date Vite migration) by the `generate-claude-profile` tool. The `<!-- GSD:* -->` markers indicate the content is managed externally. | **Deferred — not in scope.** Updating CLAUDE.md properly requires regenerating from updated codebase docs, which is its own multi-file edit pass. PLAN.md does not authorize this. |
| `README.md` | 16 | `--openssl-legacy-provider` | Hand-written project README mentioning the historical CRA build flag. | **Deferred — not in scope.** PLAN.md does not authorize README edits. |
| `netlify/functions/submit-quote/submit-quote.js` | 18 | `REACT_APP_RECAPTCHA_SITE_KEY` | Comment in the Netlify Function explaining that the site key is BROWSER-side only and NOT read here. The comment is true (the function reads the secret key, not the site key) but uses the old env-var name. | **Deferred — not in scope.** Plan 04-02 explicitly left server-side env vars and comments untouched (no `REACT_APP_` prefix); this comment was missed because it references the BROWSER-side var by name. Update is a single-line comment edit; documenting as a follow-up. |

These are pre-existing documentation drift outside the executable source tree, not regressions introduced by Plan 04. The executor's `<critical_constraints>` and the `SCOPE BOUNDARY` rule in `<deviation_rules>` both say pre-existing out-of-scope issues should be deferred, not silently fixed.

### PostCSS `@import` order warning (carried over from Plan 04-02; explicitly deferred per critical_constraints)

`src/css/tailwind.css` line 5 has `@import url('https://fonts.googleapis.com/...')` AFTER the `@tailwind` directives. `pnpm build` continues to emit:

```
[vite:css][postcss] @import must precede all other statements (besides @charset or empty @layer)
```

Non-fatal; CSS still emits a complete file. Not touched per executor's `<critical_constraints>` — fixing it would change font-loading order and is out of Phase 4's "no user-visible change" contract.

### jsdom `Not implemented: window.scrollTo` test console noise (carried over from Plan 04-03; explicitly deferred per critical_constraints)

`pnpm test` continues to print a `not-implemented.js` stack trace from `ScrollToTop`'s `useEffect` calling `window.scrollTo(0, 0)`. Tests still report `Test Files 8 passed (8)` / `Tests 43 passed (43)` exit 0. Not touched per executor's `<critical_constraints>`.

## User Setup Required

None for this plan. The Plan 03-03 Task 1 deferred owner-prep (Resend domain verify, reCAPTCHA registration, Netlify env vars including `VITE_RECAPTCHA_SITE_KEY`) and the Plan 04-06 Netlify dashboard env-var rename remain owner-action gated — both unaffected by this plan.

## Deferred Follow-ups (carry forward to v2 cleanup or a future hygiene plan)

| Category | Item | Source | Why deferred |
| -------- | ---- | ------ | ------------ |
| Documentation drift | Update `CLAUDE.md` `<!-- GSD:* -->` blocks (regen from updated `.planning/codebase/STACK.md` / `CONVENTIONS.md` / `ARCHITECTURE.md`) to reflect Vite migration | Discovered during sentinel grep this plan | Multi-file regen pass; not authorized by PLAN.md |
| Documentation drift | Update `README.md:16` to drop `--openssl-legacy-provider` mention | Discovered during sentinel grep this plan | Not authorized by PLAN.md |
| Documentation drift | Update comment at `netlify/functions/submit-quote/submit-quote.js:18` from `REACT_APP_RECAPTCHA_SITE_KEY` to `VITE_RECAPTCHA_SITE_KEY` | Discovered during sentinel grep this plan; missed by Plan 04-02 because it touched only browser-side code | Trivial single-line edit, but not authorized by PLAN.md |
| CSS hygiene | Reorder `@import url('https://fonts.googleapis.com/...')` to BEFORE `@tailwind` directives in `src/css/tailwind.css` | RESEARCH §Open Question 3 + Plan 04-02 SUMMARY + this plan | Pre-existing PostCSS warning; would change font-loading order; out of "no user-visible change" scope |
| Tailwind config | Fix `@tailwindcss/forms` plugin string-vs-require bug at `tailwind.config.js:61` | RESEARCH §Open Question 3 | Activating the plugin would change form-element styling — violates "no user-visible change" criterion |
| Dead code | Remove `web-vitals` dependency + `src/reportWebVitals.js` (called with no callback in `src/index.js:17`, so it's a no-op) | RESEARCH §Open Question 4 | Out of Phase 4 scope; v2 cleanup candidate |
| Test infra | Stub `window.scrollTo` in `src/setupTests.js` to silence the jsdom not-implemented noise from `ScrollToTop` | Plan 04-03 SUMMARY + this plan | Cosmetic; tests pass without it; out of scope per critical_constraints |

## Threat Flags

None. Per PLAN.md `<threat_model>`:

- **T-04-04-01 (Tampering — silent regression from deletion):** mitigated. Pre-deletion two-pass grep verified zero consumers; post-deletion `pnpm build` + `pnpm test` both exit 0; production JS bundle hash byte-identical to Plan 04-02 baseline (`build/assets/index-BI4RGJBk.js`).
- **T-04-04-02 (Information Disclosure):** accept. Deleted file contained no secrets — pure compiled Tailwind utility classes.

No new security-relevant surface introduced (deletion-only plan; no new endpoints, auth paths, file access patterns, or schema changes).

## Next Phase Readiness

- **Plan 04-05 (deploy preview)** — fully unblocked. The repo's source tree is now CRA-residue-free; the only outstanding Phase 4 work is: (a) deploy preview verification on Netlify, and (b) the Plan 04-06 dashboard env-var rename (owner-action). `pnpm build` produces a deployable artifact set in 3.04s with the same `index-BI4RGJBk.js` bundle hash that Plan 04-02 verified.
- **Plan 04-06 (Netlify dashboard env-var rename)** — unaffected by this plan; still owner-action gated.

## Self-Check: PASSED

**File deletion verified:**
- `[ ! -f src/css/main.css ]` → file no longer present in working tree
- `git ls-files | grep 'main\.css'` → 0 hits (no longer tracked)
- `git diff --diff-filter=D --name-only HEAD~1 HEAD` → `src/css/main.css` (intentional, single file)

**Commit verified to exist on `master`:**
- `76365c7` — FOUND (`chore(04-04): remove orphan src/css/main.css from CRA-era pipeline`)

**Constraints verified:**
- Source-tree grep results (with `--exclude-dir={node_modules,.git,.planning,build,dist}`):
  - `--openssl-legacy-provider` in `src/`/`public/`/root config → 0 hits (only out-of-scope hits in `CLAUDE.md`, `README.md` documented above)
  - `react-scripts` in source tree → 0 hits (only out-of-scope hits in `CLAUDE.md`)
  - `postcss-cli` in source tree → 0 hits (only out-of-scope hit in `CLAUDE.md`)
  - `REACT_APP_` in source tree → 0 hits (only out-of-scope hits in `CLAUDE.md`, `netlify/functions/submit-quote/submit-quote.js:18`)
  - `@babel/plugin-proposal-private-property-in-object` in source tree → 0 hits (only out-of-scope hit in `CLAUDE.md`)
  - `process.env` in `src/` → 0 hits
  - `main.css` consumers anywhere in source/config (`grep` across `.js/.jsx/.html/.json/.css/.cjs/.mjs/.toml` under everything except `node_modules/.git/.planning/build/dist`) → 0 hits
- `pnpm build` → exit 0, 24 chunks, `build/index.html` (3.08 kB), `build/sitemap.xml` (7 URLs), `build/assets/index-BI4RGJBk.js` (hash unchanged from Plan 04-02 baseline)
- `pnpm test` → exit 0, `Test Files  8 passed (8)`, `Tests  43 passed (43)`
- `src/css/App.css`, `src/index.css`, `src/css/tailwind.css`, `tailwind.config.js`, `postcss.config.js`, `vite.config.js` — all unchanged (verified via `git diff HEAD~1 HEAD --name-only` returning only `src/css/main.css`)
- `tailwind.config.js` `@tailwindcss/forms` plugin bug → DEFERRED per RESEARCH §Open Question 3 (verified untouched)

---
*Phase: 04-vite-migration*
*Completed: 2026-05-08*
