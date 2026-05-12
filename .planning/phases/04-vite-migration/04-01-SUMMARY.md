---
phase: 04-vite-migration
plan: 01
subsystem: infra
tags: [vite, vite7, vitest, jsx-loader, netlify-forms, build-tooling, html-entry]

# Dependency graph
requires:
  - phase: 02-bundle-1-spruce
    provides: "public/index.html with Netlify form prerender (contact-form D-28, shop-notify D-23) and SEO meta defaults — preserved byte-identical in moved index.html"
  - phase: 03-quote-flow
    provides: "src/index.js entry module + src/setupTests.js test bootstrap — referenced by new <script type='module'> tag and Vitest setupFiles"
provides:
  - "vite.config.js at repo root — ESM, Vite 7 + Vitest 4 config with build.outDir='build', JSX-in-.js loader override, jsdom test environment"
  - "index.html at repo root — Vite build entry with explicit <script type='module' src='/src/index.js'> tag and absolute / asset paths"
  - "Both Netlify form blocks preserved byte-identical at the new index.html location (D-23, D-28 contracts honored across the move)"
affects: ["04-02 package.json flip", "04-03 env-var rename", "04-04 Vitest test migration", "04-05 deploy preview verification", "04-06 Netlify dashboard env rename"]

# Tech tracking
tech-stack:
  added:
    - "vite.config.js (ESM root config — first ESM-style root config in repo; Vite 7 expects it)"
  patterns:
    - "ESM root config alongside CommonJS root configs (tailwind.config.js, postcss.config.js stay CJS; vite.config.js is ESM-only)"
    - "build.outDir override to 'build' instead of Vite default 'dist' — keeps netlify.toml#publish + scripts/generate-sitemap.cjs (line 59) aligned without coordinated edits"
    - "esbuild.loader='jsx' + optimizeDeps.esbuildOptions.loader{'.js':'jsx'} — handles JSX in src/App.js + src/index.js without renaming foundational files"
    - "Inline Vitest config in vite.config.js (no separate vitest.config.ts) reusing src/setupTests.js"
    - "Tab indentation for repo-root config files (matches tailwind.config.js, postcss.config.js)"

key-files:
  created:
    - "vite.config.js (27 lines, ESM, tab-indented)"
  modified:
    - "index.html (moved from public/index.html via git mv; 4 byte-faithful edits applied)"
  deleted:
    - "public/index.html (moved, not duplicated; tracked as rename)"

key-decisions:
  - "Plan 04-01 (2026-05-08): Vite scaffolding lands without flipping the build switch — vite.config.js + index.html created at repo root; package.json untouched (Plan 04-02 owns scripts + dep changes)."
  - "Plan 04-01 (2026-05-08): build.outDir pinned to 'build' (NOT Vite default 'dist') so netlify.toml#publish='build' and scripts/generate-sitemap.cjs#path.join(__dirname,'..','build','sitemap.xml') stay correct without coordinated edits (Pitfall 3 mitigation)."
  - "Plan 04-01 (2026-05-08): JSX-in-.js handled via esbuild.loader='jsx' + optimizeDeps loader override — chose this over renaming src/App.js / src/index.js to .jsx (anti-pattern per RESEARCH.md) to keep diff minimal and preserve git blame on foundational files."
  - "Plan 04-01 (2026-05-08): Both Netlify form blocks (contact-form D-28 with bot-field/name/email/service/subject/message + shop-notify D-23 with bot-field/email) preserved byte-identical in the moved index.html — diff hunks show forms as context only, no +/- lines (Pitfall 2 mitigation)."
  - "Plan 04-01 (2026-05-08): Vitest config inlined in vite.config.js#test rather than a separate vitest.config.ts — single-source build/test config; setupFiles points at the existing src/setupTests.js (which only `import '@testing-library/jest-dom'`) so no setup-file changes needed."
  - "Plan 04-01 (2026-05-08): [Rule 3 deviation] Deleted the 9-line CRA %PUBLIC_URL% explanatory comment block in index.html. The plan instructed 'DO NOT delete' but the same plan's automated verify gate `! grep -q '%PUBLIC_URL%' index.html` required zero hits anywhere in the file — the comment text contained 2 residual %PUBLIC_URL% mentions. Deletion aligns with RESEARCH.md Step 4 canonical post-migration HTML which omits the comment, and the comment described CRA-specific build semantics that no longer apply."

patterns-established:
  - "ESM root config: `import { defineConfig } from 'vite'; export default defineConfig({...})` — diverges from existing CJS root configs but is required for Vite 7"
  - "Inline Vitest config: `test: { globals: true, environment: 'jsdom', setupFiles: './src/setupTests.js', include: ['src/**/*.{test,spec}.{js,jsx}'] }` — no separate vitest.config.ts file"
  - "JSX-in-.js loader override: pair `esbuild.loader: 'jsx'` (production build) with `optimizeDeps.esbuildOptions.loader: { '.js': 'jsx' }` (dev pre-bundle) — both required, neither sufficient alone"
  - "Vite build entry HTML lives at repo root (NOT public/) and uses absolute / paths (NOT %PUBLIC_URL% tokens); the explicit <script type='module' src='/src/index.js'> tag replaces CRA's implicit injection"

requirements-completed: [VITE-01]

# Metrics
duration: 12min
completed: 2026-05-08
---

# Phase 04 Plan 01: Vite Migration — Scaffolding Summary

**Vite 7 + Vitest 4 scaffolding landed at repo root (vite.config.js + moved index.html) with both Netlify form blocks byte-identical and zero package.json churn — switch-flip deferred to Plan 04-02.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-08 (session start)
- **Completed:** 2026-05-08
- **Tasks:** 2 (both type=auto, no checkpoints)
- **Files modified:** 2 (1 created, 1 moved+edited)

## Accomplishments

- **vite.config.js** at repo root: ESM, Vite 7 + Vitest 4 inline config, `build.outDir: 'build'` pinned to keep `netlify.toml` + sitemap script aligned, JSX-in-`.js` loader override for `src/App.js` + `src/index.js`, jsdom test environment wired to existing `src/setupTests.js`. Tab-indented to match `tailwind.config.js` / `postcss.config.js`.
- **index.html** moved from `public/` to repo root via `git mv` (rename tracked at 80% similarity, blame preserved). Three `%PUBLIC_URL%` tokens replaced with absolute `/` paths. One explicit `<script type="module" src="/src/index.js"></script>` tag inserted after the closing `</form>` of `shop-notify` and before the trailing CRA-template comment.
- **Netlify form contracts honored:** Both `<form name="contact-form" netlify ...>` (D-28, fields: bot-field/name/email/service/subject/message) and `<form name="shop-notify" netlify ...>` (D-23, fields: bot-field/email) appear in the rename diff as **context only — zero `+`/`-` lines** — proving byte-identical preservation. Pitfall 2 (silent submission drop) mitigated.
- **package.json untouched:** No `react-scripts` removal, no Vite/Vitest deps added, no script changes. The build still runs via CRA today; Plan 04-02 owns the flip. The scaffolding plus the unchanged build means Phase 4 can be paused safely between 04-01 and 04-02 without breaking the current build.

## Task Commits

Each task was committed atomically on `master`:

1. **Task 1: Create vite.config.js at repo root** — `d29e33d` (feat)
2. **Task 2: Move public/index.html → ./index.html with byte-faithful Netlify form preservation** — `cca37a6` (feat)

**Plan metadata:** _(this commit, after SUMMARY.md write)_

## Files Created/Modified

- `vite.config.js` (CREATED, 27 lines) — Vite 7 + Vitest config; ESM `defineConfig`; `outDir: 'build'`; JSX-in-`.js` loader for both build (`esbuild.loader`) and dev pre-bundle (`optimizeDeps.esbuildOptions.loader`); inline Vitest with `globals: true`, `environment: 'jsdom'`, `setupFiles: './src/setupTests.js'`, `include: ['src/**/*.{test,spec}.{js,jsx}']`. Tab-indented.
- `index.html` (MOVED from `public/index.html` + 4 edits, 77 lines) — `<link rel="icon">`, `<link rel="apple-touch-icon">`, `<link rel="manifest">` now use absolute `/` paths; new `<script type="module" src="/src/index.js"></script>` tag inserted; both Netlify form blocks (lines 40-63 in the new file) byte-identical to original.
- `public/index.html` (DELETED via rename) — git tracks as `R public/index.html -> index.html` at 80% similarity.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| `build.outDir: 'build'` (override Vite default `'dist'`) | Three downstream consumers pin `'build'`: `netlify.toml#publish`, `scripts/generate-sitemap.cjs:59`, and Netlify's deploy-time form scan. One config line beats coordinated edits across three files. (Pitfall 3) |
| Pair `esbuild.loader: 'jsx'` with `optimizeDeps.esbuildOptions.loader: { '.js': 'jsx' }` | Both required: the first handles production build, the second handles dev pre-bundle. Renaming `App.js`/`index.js` to `.jsx` was the alternative, rejected as an anti-pattern per RESEARCH.md (touches every importer, dirties git blame on foundational files). |
| ESM root config (`import` + `export default`) | Vite 7 expects it. Diverges from existing CJS root configs (`tailwind.config.js`, `postcss.config.js`) but is the documented Vite 7 convention. |
| Inline Vitest config in `vite.config.js#test` | Single-source build/test config; reuses Vite resolver; no separate `vitest.config.ts`. `setupFiles` points at existing `src/setupTests.js` (one-line `@testing-library/jest-dom` import works under Vitest unchanged). |
| Move `index.html` via `git mv` (not copy + delete) | Preserves blame across the rename; git tracks at 80% similarity. The two Netlify form blocks (Plan 02-05 D-28 + D-23) keep their authorship history. |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Deleted the CRA `%PUBLIC_URL%` explanatory comment block in `index.html`**
- **Found during:** Task 2 (Move public/index.html → ./index.html with byte-faithful Netlify form preservation)
- **Issue:** The plan's narrative said "DO NOT delete the CRA `%PUBLIC_URL%` explanatory comment block (lines 27-35) — leaving it as-is keeps the diff small. RESEARCH.md says it's harmless residue." But the plan's `<verify><automated>` gate and acceptance criterion both required `! grep -q "%PUBLIC_URL%" index.html` and `grep -c "%PUBLIC_URL%" index.html` returning 0. The 9-line comment block contained 2 literal `%PUBLIC_URL%` mentions in its explanatory text (lines 28 and 32 of the original), so leaving it intact failed the verification gate by 2 hits.
- **Fix:** Deleted the entire 9-line comment block (originally lines 27-35 of `public/index.html`, now absent from `index.html`). This aligns with RESEARCH.md `### Step 4: index.html migration (after git mv)` (lines 511-560) which shows the canonical post-migration HTML with the comment omitted entirely. The comment described CRA-specific build semantics ("It will be replaced with the URL of the `public` folder during the build") that are inaccurate under Vite — Vite serves `public/` at `/` natively, no template token replacement happens.
- **Files modified:** `index.html`
- **Verification:** `grep -c "%PUBLIC_URL%" index.html` returns `0`. The two Netlify form blocks (lines 40-63 in the new file) remain byte-identical to the original — diff shows them as context-only with zero `+`/`-` lines.
- **Committed in:** `cca37a6` (Task 2 commit; deviation documented in commit message body)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to satisfy the plan's own verification gate. No scope creep — the deletion strengthens the byte-faithfulness contract by removing CRA-specific text that would otherwise be misleading post-migration. Aligns with RESEARCH.md canonical post-migration HTML.

## Issues Encountered

- **Task 2 commit staging quirk (resolved inline):** After `git mv` + the 4 in-place edits, `git status` showed `RM public/index.html -> index.html` (rename staged + working-tree modification on the new path). Running `git add index.html public/index.html` failed with `pathspec 'public/index.html' did not match any files` because `git mv` had already removed it from the working tree. Resolution: `git add index.html` alone promoted the unstaged content modification onto the staged rename, fully staging the rename + edits as a single change. No data lost; commit succeeded as `cca37a6`. Documenting this so future executors don't get tripped by the same idiom.

## User Setup Required

None. This plan is pure scaffolding — no env vars, no dashboard config, no external services. Plan 04-06 owns the Netlify dashboard env-var rename (`REACT_APP_RECAPTCHA_SITE_KEY` → `VITE_RECAPTCHA_SITE_KEY`), which depends on Plan 04-03 doing the in-code rename first.

## Threat Flags

None — no new security-relevant surface introduced. The two Netlify form blocks are the only trust boundary touched and they were preserved byte-identical (T-04-01-01 mitigation honored). The new `<script type="module" src="/src/index.js">` tag is the only injection (T-04-01-02 mitigation honored). `vite.config.js` contains no secrets (T-04-01-03 disposition `accept` honored).

## Next Phase Readiness

Plan 04-02 can now flip the build switch:
- `vite.config.js` is in place and configured correctly — `pnpm vite build` after the dep install will resolve the entry from `index.html`'s explicit `<script type="module">` tag, hand `src/App.js` + `src/index.js` to esbuild with the JSX loader, and write to `build/`.
- `scripts/generate-sitemap.cjs` will work unchanged after `pnpm build` because `build.outDir: 'build'` is honored.
- `netlify.toml` (`publish = "build"`) and `public/_redirects` (untouched) remain valid.
- Plan 04-04 (Vitest migration) can read `setupFiles` from the same config; the existing `src/setupTests.js` works as-is.

**Concerns for follow-on plans:**
- Plan 04-04: The `@tailwindcss/forms` plugin string-vs-require bug in `tailwind.config.js:61` is intentionally NOT touched in this plan (per CRITICAL CONSTRAINTS in the executor prompt and Open Question 3 in RESEARCH.md). Plan 04-04 should also leave it alone unless explicitly re-scoped.
- Plan 04-05 (deploy preview): Should verify in Netlify dashboard `Forms` tab that both `contact-form` and `shop-notify` continue to be detected with all expected fields after the first Vite-built deploy.

## Self-Check: PASSED

**Files verified to exist:**
- `vite.config.js` — FOUND (27 lines, tab-indented, ESM, `outDir: 'build'`, JSX loader, Vitest config)
- `index.html` — FOUND (77 lines, no `%PUBLIC_URL%` tokens, both Netlify forms with full field lists, one `<script type="module">` tag)

**Files verified to be absent:**
- `public/index.html` — MISSING (correctly removed via `git mv`)

**Commits verified to exist on `master`:**
- `d29e33d` — FOUND (Task 1: vite.config.js)
- `cca37a6` — FOUND (Task 2: index.html move + edits)

**Constraints verified:**
- `package.json` untouched — `git diff HEAD -- package.json` is empty (Plan 04-02 owns the flip)
- `tailwind.config.js` untouched — `@tailwindcss/forms` plugin bug deliberately deferred per RESEARCH §Open Question 3
- Both Netlify form blocks byte-identical — diff hunks show forms as context-only (zero `+`/`-` lines)
- `--openssl-legacy-provider` flag still present in `package.json` scripts — Plan 04-02 owns its removal

---
*Phase: 04-vite-migration*
*Completed: 2026-05-08*
