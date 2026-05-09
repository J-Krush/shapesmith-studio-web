---
phase: 04-vite-migration
verified: 2026-05-08T22:08:00Z
status: passed
score: 3/3 success criteria verified (all in-repo); 0 deferred items are silently buried
re_verification:
  initial: true
deferred_at_phase_close:
  # These were intentionally deferred and ARE documented in 04-06-SUMMARY.md and earlier SUMMARYs.
  # They do NOT block phase closure or Phase 5 planning, per phase plan.
  - item: "Netlify dashboard env-var rename REACT_APP_RECAPTCHA_SITE_KEY -> VITE_RECAPTCHA_SITE_KEY"
    documented_in: "04-06-SUMMARY.md Task 1; 04-05-SUMMARY.md Handoff §1"
    blocks: "Real reCAPTCHA token mint on a future Netlify build (graceful-degrade until then)"
  - item: "Netlify-only deploy-preview parity checks (Forms tab detection, real form submission, /materials 301, real reCAPTCHA, deploy-log vite confirmation, CDN headers)"
    documented_in: "04-06-SUMMARY.md Task 2 'Deferred to dev-branch / PR' table"
    blocks: "Production parity sign-off — local pnpm preview substitutes for now"
  - item: "tailwind.config.js:61 @tailwindcss/forms plugin string-vs-require bug"
    documented_in: "04-04-SUMMARY.md Deferred Follow-ups; 04-06-SUMMARY.md item 1; RESEARCH §Open Question 3"
    blocks: "Nothing — would change form-element styling, violates 'no user-visible change' contract"
  - item: "netlify/functions/submit-quote/submit-quote.js:18 server-side comment still references REACT_APP_RECAPTCHA_SITE_KEY"
    documented_in: "04-04-SUMMARY.md Deferred Follow-ups row 3; 04-06-SUMMARY.md item 3"
    blocks: "Nothing — single-line comment in server-side code; trivial follow-up"
  - item: "README.md:16 still mentions --openssl-legacy-provider"
    documented_in: "04-04-SUMMARY.md Deferred Follow-ups row 4; 04-06-SUMMARY.md item 4"
    blocks: "Nothing — stale prose in human-readable README"
  - item: "CLAUDE.md GSD-managed blocks reference react-scripts / postcss-cli / REACT_APP_ / openssl-legacy-provider"
    documented_in: "04-04-SUMMARY.md Issues Encountered table; 04-06-SUMMARY.md item 5"
    blocks: "Nothing — auto-generated docs, regen pass needed"
  - item: "PostCSS @import order warning at src/css/tailwind.css:5"
    documented_in: "04-02-SUMMARY.md Issues Encountered; 04-04-SUMMARY.md Issues Encountered; 04-06-SUMMARY.md item 6"
    blocks: "Nothing — non-fatal warning; CSS still emits complete file"
  - item: "jsdom 'window.scrollTo not implemented' console noise during pnpm test"
    documented_in: "04-03-SUMMARY.md Issues Encountered; 04-04-SUMMARY.md Issues Encountered; 04-06-SUMMARY.md item 7"
    blocks: "Nothing — cosmetic; tests still report 8/8 files, 43/43 tests passing"
---

# Phase 4: Vite Migration — Verification Report

**Phase Goal:** Replace `react-scripts` with Vite as the build tool while the site is in a low-stakes window between revenue features, so Phase 5's shop work doesn't land on a deprecated foundation and no Netlify Node bump can silently break the production build.

**Verified:** 2026-05-08T22:08:00Z
**Status:** passed (in-repo); deferred items properly documented for dev-branch push
**Re-verification:** No — initial verification

## Goal Achievement

### Success Criteria (Roadmap Truths)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `pnpm build` produces a deployable bundle via Vite (not `react-scripts`); the static SPA output behaves identically to the CRA build from any user's perspective on a deploy preview | VERIFIED (in-repo); deploy-preview check deferred to dev-branch push (documented) | `pnpm build` exit 0; vite v7.3.3 emits `build/index.html` (3.08 kB), 24 JS chunks + 1 CSS chunk + 25 fonts; `build/sitemap.xml` (7 URLs) via postbuild; `build/_redirects` copied; both Netlify form blocks intact in build output (`grep -c name="contact-form"` = 1, `grep -c name="shop-notify"` = 1, `grep -c name="bot-field"` = 2). Owner local-preview walkthrough of 10 URLs passed (04-06 SUMMARY). |
| 2 | All `REACT_APP_*` environment variables have been renamed to `VITE_*` with code references updated; `--openssl-legacy-provider` is no longer needed anywhere | VERIFIED | `grep -rn 'REACT_APP' src/ scripts/ public/ package.json netlify.toml` returns 0 hits. `src/App.js:35` uses `import.meta.env.VITE_RECAPTCHA_SITE_KEY`. `src/components/quote/QuoteSubmitForm.jsx:15` doc-comment uses `VITE_RECAPTCHA_SITE_KEY`. `grep -rn 'openssl-legacy-provider' package.json src/ scripts/` returns 0 hits. `package.json#scripts` use `vite`/`vitest run`. (Server-side `RESEND_API_KEY` + `RECAPTCHA_SECRET_KEY` correctly NOT prefixed and untouched.) |
| 3 | `netlify.toml` reflects the new build command and publish directory; the deploy preview confirms parity with production before merge | VERIFIED (in-repo); deploy-preview check deferred (documented) | `netlify.toml` has `command = "pnpm build"` (line 2), `publish = "build"` (line 3) — matches `vite.config.js#build.outDir: 'build'`. SPA fallback `[[redirects]] /* -> /index.html status=200` appended (lines 15-18) preserving original `[functions]` block byte-identical. `[functions] directory = "netlify/functions"` unchanged. Local `pnpm preview` walkthrough of 10 URLs (including `/<bogus-route>` SPA fallback) passed per 04-06 SUMMARY; Netlify-only checks (Forms tab, real submission, edge `/materials` 301, real reCAPTCHA, deploy log, CDN headers) deferred to dev-branch push and explicitly enumerated in 04-06 SUMMARY. |

**Score:** 3/3 success criteria verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | Vite scripts + deps; no react-scripts/postcss-cli/babel plugin/openssl flag | VERIFIED | `dev`/`start`/`build`/`preview`/`postbuild`/`test`/`test:watch` scripts; `vite ^7.3.3`, `@vitejs/plugin-react ^5.0.0`, `vitest ^4.1.5`, `jsdom ^25.0.0` in devDependencies. No `react-scripts`, `postcss-cli`, `@babel/plugin-proposal-private-property-in-object`, `--openssl-legacy-provider`, `eject`, `build:css` anywhere. |
| `vite.config.js` | ESM, outDir='build', JSX-in-.js loader, Vitest inline | VERIFIED | 27 lines; ESM `defineConfig`; `build.outDir: 'build'`; `esbuild.loader: 'jsx'`; `optimizeDeps.esbuildOptions.loader: { '.js': 'jsx' }`; `test: { globals: true, environment: 'jsdom', setupFiles: './src/setupTests.js', include: ['src/**/*.{test,spec}.{js,jsx}'] }`. |
| `index.html` (repo root) | Moved from public/, both Netlify form blocks intact, `<script type="module">`, no %PUBLIC_URL% | VERIFIED | 77 lines at repo root. `<script type="module" src="/src/index.js">` on line 65. Both `name="contact-form"` (with bot-field/name/email/service/subject/message) and `name="shop-notify"` (with bot-field/email) present. `grep -c '%PUBLIC_URL%' index.html` = 0. |
| `public/index.html` | GONE | VERIFIED | `ls public/index.html` -> No such file or directory. |
| `src/App.js` | `import.meta.env.VITE_RECAPTCHA_SITE_KEY`; no process.env | VERIFIED | Line 35 uses `import.meta.env.VITE_RECAPTCHA_SITE_KEY`. `grep -n 'process.env' src/App.js` returns 0. |
| `src/components/quote/QuoteSubmitForm.jsx` | Doc-comment uses VITE_*, no REACT_APP_* | VERIFIED | Line 15: `// - When VITE_RECAPTCHA_SITE_KEY is unset (e.g. local dev without env`. No REACT_APP. |
| `netlify.toml` | command=`pnpm build`, publish=`build`, [functions] dir, SPA [[redirects]] | VERIFIED | All four blocks present and correct (lines 1-18). |
| `src/css/main.css` | DELETED | VERIFIED | `ls src/css/` returns only `App.css` and `tailwind.css`. |

### Key Link Verification (Wiring)

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `index.html` | `src/index.js` | `<script type="module" src="/src/index.js">` | WIRED | Vite resolved entry from explicit script tag; `pnpm build` produced `build/assets/index-BI4RGJBk.js` and references it in `build/index.html`. |
| `vite.config.js` | `src/setupTests.js` | `test.setupFiles: './src/setupTests.js'` | WIRED | All 8 test files run; `@testing-library/jest-dom` matchers (`.toBeInTheDocument`, `.toHaveTextContent`, `.toBeDisabled`) work — confirmed by 43/43 passing. |
| `vite.config.js` | `src/App.js` (JSX in .js) | `esbuild.loader: 'jsx'` + `optimizeDeps.esbuildOptions.loader: { '.js': 'jsx' }` | WIRED | Build succeeds without renaming foundational files; `App.js` and `index.js` parse + transform clean. |
| `package.json#postbuild` | `scripts/generate-sitemap.cjs` | `node scripts/generate-sitemap.cjs` | WIRED | Postbuild step runs; `build/sitemap.xml` produced with 7 URLs after each `pnpm build`. |
| `netlify.toml#publish` | `vite.config.js#build.outDir` | both = `'build'` | WIRED | Strings match exactly; sitemap script also pins `'build'` (carried over). |
| `netlify.toml#[[redirects]] /*` | `/index.html` | status=200 rewrite | WIRED | Block present at lines 15-18; tested via local `pnpm preview` 10-URL walkthrough including `/<bogus-route>` (SPA fallback at React Router level). |
| `src/App.js` | `VITE_RECAPTCHA_SITE_KEY` | `import.meta.env.VITE_RECAPTCHA_SITE_KEY` | WIRED (in code); dashboard binding deferred | Code path correct; runtime value depends on Netlify dashboard rename (Plan 04-06 Task 1 deferred). Graceful-degrade documented (Pitfall 6). |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Vite production build succeeds | `pnpm build` | exit 0; 644 modules; 1.78s; 24 chunks emitted; sitemap with 7 URLs | PASS |
| Vitest test suite passes | `pnpm test` | exit 0; `Test Files 8 passed (8)` / `Tests 43 passed (43)` in 1.43s | PASS |
| Build output contains contact-form (Netlify deploy-time prerender) | `grep -c 'name="contact-form"' build/index.html` | 1 | PASS |
| Build output contains shop-notify (Netlify deploy-time prerender) | `grep -c 'name="shop-notify"' build/index.html` | 1 | PASS |
| Build output preserves both honeypots | `grep -c 'name="bot-field"' build/index.html` | 2 | PASS |
| Build output preserves new `service` field (D-25 / Plan 02-05) | `grep -c 'name="service"' build/index.html` | 1 | PASS |
| Build output has SPA fallback `_redirects` | `ls build/_redirects` | exists; `diff -q public/_redirects build/_redirects` -> empty | PASS |
| No process.env in src/ | `grep -rn 'process.env' src/` | 0 hits | PASS |
| No REACT_APP_ in src/scripts/public/package.json/netlify.toml | `grep -rn 'REACT_APP' ...` | 0 hits | PASS |
| No jest.* in src/ test files | `grep -rnE 'jest\.(fn\|mock\|spyOn\|...)' src/` | 0 hits | PASS |
| No --openssl-legacy-provider in build/dev scripts | `grep 'openssl-legacy-provider' package.json` | 0 hits | PASS |
| `react-scripts` no longer a dependency | `pnpm why react-scripts` | empty | PASS |
| `postcss-cli` no longer a dependency | `pnpm why postcss-cli` | empty | PASS |

### Requirements Coverage

| Requirement | Plans | Description | Status | Evidence |
|-------------|-------|-------------|--------|----------|
| VITE-01 | 04-01, 04-02, 04-03, 04-04 | Build tool migrates from `react-scripts` to Vite; `pnpm build` produces deployable bundle | SATISFIED | `pnpm build` exit 0 via vite v7.3.3; `react-scripts` purged; `vite.config.js` + repo-root `index.html` in place; orphan `src/css/main.css` deleted; 8 test files green under `vitest run` |
| VITE-02 | 04-02 (in-code), 04-06 (dashboard — deferred) | All `REACT_APP_*` renamed to `VITE_*`; code refs updated; `--openssl-legacy-provider` no longer needed | SATISFIED (in-repo); dashboard rename deferred to dev-branch push and documented in 04-06 SUMMARY | `import.meta.env.VITE_RECAPTCHA_SITE_KEY` in `src/App.js:35`; openssl flag fully purged; 0 hits for `REACT_APP_` across in-tree source/config |
| VITE-03 | 04-05 (in-repo), 04-06 (deploy preview — deferred) | `netlify.toml` reflects new build command + publish dir; deploy preview confirms parity | SATISFIED (in-repo); Netlify deploy-preview parity check deferred to dev-branch push and documented in 04-06 SUMMARY | `netlify.toml` `command="pnpm build"` + `publish="build"` + `[[redirects]] /* -> /index.html 200`; local `pnpm preview` walkthrough of 10 URLs passed (owner sign-off "looking good, quote tool awesome, styles look good") |

No orphaned requirements (REQUIREMENTS.md Phase 4 row maps VITE-01..03 only).

### Anti-Patterns Found

None blocking. The expected pre-existing documentation drift outside the source tree (`README.md:16`, `CLAUDE.md` GSD-managed blocks, `netlify/functions/submit-quote/submit-quote.js:18` server-side comment) is enumerated in 04-04-SUMMARY.md "Deferred Follow-ups" and 04-06-SUMMARY.md "Follow-ups surfaced during Phase 4". They are not silently buried — every item appears in at least one SUMMARY's deferred list with rationale.

### Data-Flow Trace (Level 4)

Phase 4 is infra/build-tool work — no new dynamic-data UI surfaces. The runtime value of `import.meta.env.VITE_RECAPTCHA_SITE_KEY` flows via Vite's build-time substitution into `src/App.js`'s `<GoogleReCaptchaProvider reCaptchaKey={...}>` prop. Where the env var is unset (local dev, or Netlify before the dashboard rename), the documented graceful-degrade behavior (Pitfall 6) takes over: `executeRecaptcha` stays undefined and `QuoteSubmitForm` shows "spam protection isn't loaded yet". This is by design and was validated by the owner during the local preview walkthrough.

### Human Verification Required

None outstanding for phase closure. The owner has already signed off on the local preview walkthrough ("looking good, quote tool awesome, styles look good" — 04-06 SUMMARY). The Netlify-only deploy-preview parity checks are deferred to a future dev-branch push per the project's git rule "never push to master; preview locally first; deploy previews go on a `dev` branch — not yet created" — these are explicitly enumerated in 04-06 SUMMARY Task 2 "Deferred to dev-branch / PR" table.

### Goal-Backward Question

**Could a Phase 5 (Pre-Made Goods Shop) plan land on this foundation without re-doing Phase 4 work, and without inheriting any silent breakage?**

YES. Concretely:

1. The build tool is Vite; `pnpm build` is green; output is at `build/` exactly where `netlify.toml#publish` expects it. Phase 5 work that adds new pages/components will route through the same Vite + Vitest pipeline that already passes for the existing tree.
2. Env-var contract is `import.meta.env.VITE_*` in browser code; new shop client code can use the same shape. Server-side Netlify Functions (where Phase 5 will likely add cart/order endpoints) keep their unprefixed env-var convention — independently of any Vite changes.
3. The SPA fallback redirect is explicit; new `/shop/*` deep-link routes will work without depending on Netlify auto-detection.
4. The orphan `src/css/main.css` is gone; no Phase 5 contributor will trip over "is this stale?" confusion when adding new CSS.
5. Test runner is Vitest with `vi.*` API; new shop tests can be authored against `vi.*` directly per the convention spelled out in 04-03 SUMMARY.
6. The deferred items (Netlify dashboard rename, deploy-preview parity, README/CLAUDE/server-comment cleanups, tailwind plugin bug) are all documented in at least one SUMMARY and either don't block Phase 5 (cosmetic) or block only the production deploy of Phase 5 (dashboard rename — but that's a one-button owner action when the dev-branch is cut).

No silent breakage; no rework needed for Phase 5 to begin.

### Gaps Summary

**No gaps.** All three roadmap success criteria are verified in the codebase as the in-repo half of the contract. The Netlify-only deploy-preview portion of SC1 + SC3 and the Netlify-dashboard portion of SC2 are deferred — these are external-system actions that the project's git rules require to happen on a `dev` branch (which has not been created yet); they are not silently dropped. Each deferred item is documented in 04-06 SUMMARY Task 2 with a clear "Action when dev-branch is cut" column.

The owner explicitly signed off on the local-preview walkthrough as the substitute verification surface.

---

_Verified: 2026-05-08T22:08:00Z_
_Verifier: Claude (gsd-verifier)_
