---
phase: 04-vite-migration
plan: 06
type: execute
status: complete
date: 2026-05-08
autonomous: false
requirements:
  - VITE-02
  - VITE-03
---

# Plan 04-06 Summary — Owner Action + Deploy-Preview Sign-Off

## Outcome

**Phase 4 closed via local-preview verification** (deviation from plan: deploy preview deferred to dev-branch workflow per project git rules — see Deviation 1). Both checkpoints cleared, with two follow-ups recorded for whenever the owner cuts the `dev` branch / opens the PR into `master`.

## Task 1 — Netlify dashboard env var rename

**Status:** **DEFERRED** (owner-confirmed)

The owner chose to defer the `REACT_APP_RECAPTCHA_SITE_KEY` → `VITE_RECAPTCHA_SITE_KEY` rename until the dev-branch push / PR. Rationale: no Netlify build of this code is happening today, so the dashboard env var has no current consumer.

**Required before any Netlify build of Phase 4 code:**
1. Open Netlify dashboard → Site settings → Environment variables.
2. Rename `REACT_APP_RECAPTCHA_SITE_KEY` → `VITE_RECAPTCHA_SITE_KEY` (value unchanged) — OR create it fresh under the new name if Plan 03-03 owner-prep was never completed.
3. Confirm no env var still named `REACT_APP_*` exists.
4. Server-side env vars (`RESEND_API_KEY`, `RECAPTCHA_SECRET_KEY`) are unchanged — do NOT touch them.

**Failure mode if skipped:** reCAPTCHA gracefully degrades to "spam protection isn't loaded yet" on the deployed site (Pitfall 6 — by design). The build still succeeds. Quote-form submissions go through but without bot protection.

## Task 2 — Deploy-preview walkthrough

**Status:** **APPROVED via local preview** (owner-signed off: "looking good, quote tool awesome, styles look good")

**Verification surface used:** Local `pnpm preview` (Vite preview server at `http://localhost:4173/`) serving the actual production build output from `build/`. Scope-adapted from the original plan's deploy-preview walkthrough per project git rules ("never push to master; preview locally first; deploy previews go on a `dev` branch — not yet created").

### Local walkthrough — verified (10 URLs)

| URL | Result |
|---|---|
| `/` | Pass — home renders, dual-service hero, dark theme, no console errors |
| `/styles` | Pass — laser styles grid + Materials + supporting blocks |
| `/styles/<slug>` | Pass — single-style page + image modal |
| `/3d-printing` | Pass — print styles grid |
| `/3d-printing/<slug>` | Pass — single-style page |
| `/about` | Pass — profile content |
| `/contact` | Pass — form renders, honeypot hidden |
| `/quote` | Pass — owner explicitly called this out as "awesome"; STL/SVG parse, price range update, reCAPTCHA graceful-degrade as expected (no `.env.local` set) |
| `/shop` | Pass — Coming Soon + notify form visible |
| `/<bogus-route>` | Pass — NotFound renders (SPA fallback works at React Router level) |

### Deferred to dev-branch / PR (Netlify-only checks)

These cannot be exercised on `pnpm preview` because they require the real Netlify infrastructure:

| Check | Why deferred | Action when dev-branch is cut |
|---|---|---|
| Netlify Forms tab detection (`contact-form` + `shop-notify`) | `pnpm preview` doesn't run Netlify's HTML-prerender form scan | Open Netlify dashboard → Forms; verify both forms detected with same field set as production |
| Real contact-form submission landing in inbox | Same as above | Submit a test message on the dev-branch deploy preview; confirm Netlify Forms tab shows the submission |
| `/materials` → `/styles#materials` 301 redirect | Vite preview doesn't read `_redirects`; this is a Netlify-edge rule | Visit `/materials` on the deploy preview — confirm 301 to `/styles#materials` |
| Real reCAPTCHA token mint | Requires `VITE_RECAPTCHA_SITE_KEY` bound at build time (Task 1 deferred above) | After Task 1 dashboard rename, refresh deploy preview, confirm reCAPTCHA loads (not "not loaded yet" message) |
| Deploy log shows `vite build` (not `react-scripts build`) | No Netlify build today | Inspect the Netlify deploy log when the dev-branch / PR build runs |
| Asset cache headers + asset hashes (`/assets/index-<hash>.{js,css}`) | Local preview lacks Netlify's CDN | Spot-check on deploy preview Network tab |

## Deviations

### 1. **[Scope adaptation, not a Rule 3 deviation]** Local-preview verification instead of Netlify deploy preview

The plan's Task 2 assumed a "push branch → Netlify deploy preview" workflow. Project git rule (saved to memory `2026-05-08`): "Never push to `master`; preview locally first; deploy previews go on a `dev` branch — not yet created; production via PR-only." The owner does not maintain a `dev` branch yet, so the verification surface for Phase 4 was `pnpm preview` against the local `build/` output. The Netlify-only checks (Forms tab, real submissions, `_redirects`, reCAPTCHA, deploy log, CDN headers) are recorded as known follow-ups above and do NOT block phase closure — they will be exercised when the owner cuts the `dev` branch or opens the PR into `master`.

This is documented as a deviation rather than a plan revision because: (a) the local subset of checks meaningfully verifies Phase 4 Success Criterion 1 ("static SPA output behaves identically to the CRA build from any user's perspective" — the actual user-perceived rendering and behavior was verified against the real production bundle), (b) Success Criteria 2 (env var rename + `--openssl-legacy-provider` removal) and 3 (`netlify.toml` + deploy preview parity) are partially deferred but the in-repo half of each is fully complete and verified, and (c) the deferred portions are fully reversible — if the dev-branch push surfaces issues, Phase 4 can be reopened.

## Phase 4 Final State

| Requirement | Status |
|---|---|
| **VITE-01** — Build tool migrates from `react-scripts` to Vite, `pnpm build` produces deployable bundle | ✓ Complete (closed in Plan 04-02) |
| **VITE-02** — `REACT_APP_*` env vars renamed to `VITE_*`; `--openssl-legacy-provider` no longer needed | ✓ In-repo complete (closed in Plan 04-02). Dashboard rename deferred to dev-branch push (Task 1 above). |
| **VITE-03** — `netlify.toml` reflects new build command + publish dir; deploy preview confirms parity | ✓ In-repo complete (closed in Plan 04-05). Deploy preview parity verified locally; Netlify-only checks deferred to dev-branch push (Task 2 above). |

**Plans completed:** 6/6
**Phase 4 status:** **CLOSED** (with documented deferred follow-ups for dev-branch push)

## Follow-ups surfaced during Phase 4 (for future cleanup)

These are pre-existing or out-of-scope items that surfaced during Phase 4 execution and should be picked up in a follow-up phase or one-off cleanup:

1. **`tailwind.config.js:61` `@tailwindcss/forms` plugin string-vs-`require` bug** — silent no-op in Tailwind v3. Fixing it could change form-element rendering and violate the "no user-visible change" criterion of Phase 4. Deferred per RESEARCH §Open Question 3.
2. **`web-vitals` dead code** — wired in `src/reportWebVitals.js` but `reportWebVitals()` called with no callback in `src/index.js:17` (verified). Out of scope per RESEARCH §Open Question 4.
3. **`netlify/functions/submit-quote/submit-quote.js:18`** — server-side comment still references `REACT_APP_RECAPTCHA_SITE_KEY`. Plan 04-02 missed this because it touched only browser-side code. Trivial doc fix.
4. **`README.md:16`** — mentions `--openssl-legacy-provider`. Stale post-migration.
5. **`CLAUDE.md` `<!-- GSD:* -->` blocks** — auto-generated from Phase 1 codebase docs that pre-date Vite migration. Multi-file regen pass needed (likely via `/gsd-docs-update` or similar).
6. **PostCSS `@import` order warning** in `src/css/tailwind.css:5` — pre-existing CSS authoring issue, surfaced as a non-fatal warning during Vite build.
7. **jsdom `Error: Not implemented: window.scrollTo`** logged to stderr from `ScrollToTop.jsx`'s `useEffect` during tests. Doesn't fail any test; cosmetic.

Items 3 and 4 are direct Vite-migration loose ends and would be the natural starter set for any "Phase 4 polish" follow-up.

## Wall-clock summary

- Local preview server start: instant (`pnpm preview` after `pnpm build` already complete)
- Owner walkthrough of 10 URLs: ~5 min
- Sign-off: "looking good, quote tool awesome, styles look good"
- No issues surfaced

## Next Phase

Phase 5 — Pre-Made Goods Shop (SHOP-03..SHOP-07). Not blocked by the deferred items above; Phase 4 in-repo completeness is sufficient for Phase 5 planning to begin. The Netlify dashboard env var rename + dev-branch push become a precondition for Phase 5's eventual production deploy, not for its planning or implementation.
