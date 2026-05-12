---
phase: 04-vite-migration
plan: 05
subsystem: deploy-config
tags: [netlify, redirects, spa-fallback, vite-migration, deploy]
requires:
  - 04-04 (clean repo: build/test green; orphan main.css gone; CRA residue clear)
provides:
  - "Explicit SPA history-fallback redirect in netlify.toml ([[redirects]] /* -> /index.html 200)"
  - "Final in-repo verification that pnpm build is deploy-ready under Vite"
affects:
  - "Netlify deploy: any path Netlify cannot statically resolve now explicitly rewrites to /index.html so React Router can take over (was implicitly auto-detected before)"
  - "/materials 301 redirect: still wins (Netlify processes public/_redirects before netlify.toml [[redirects]])"
tech-stack:
  added: []
  patterns:
    - "Two-layer redirect precedence preserved: public/_redirects (specific 301s) processed before netlify.toml [[redirects]] (catch-all rewrites). RESEARCH.md Pattern 5."
key-files:
  created: []
  modified:
    - "netlify.toml: appended 8 lines (1 blank + 3 comment + 4 TOML block) at the bottom; original 11 lines byte-unchanged"
decisions:
  - "Append [[redirects]] to netlify.toml after [functions] (RESEARCH.md Step 5 canonical layout). Order doesn't matter for a single catch-all when no other [[redirects]] exist, and Netlify rule-order processes public/_redirects FIRST regardless of TOML block order."
  - "Keep /materials -> /styles#materials 301 in public/_redirects (NOT moved into TOML). Netlify processes _redirects before netlify.toml [[redirects]], so the specific 301 correctly wins over the catch-all /* rewrite. Preserves the documented two-layer pattern from Plan 02-02 (deploy-time 301 + SPA hop via React Router)."
  - "Comment uses ASCII '->' arrow (not Unicode →) for portability; the file is plain TOML and ASCII is friction-free."
metrics:
  duration_minutes: 1
  tasks_completed: 1
  files_modified: 1
  commits: 1
  completed_date: "2026-05-09"
---

# Phase 4 Plan 5: Netlify SPA Fallback + Final Build Verification Summary

Made the React-Router SPA history-fallback redirect explicit in `netlify.toml` (`[[redirects]] /* -> /index.html 200`) so Phase 4's deploy posture no longer depends on Netlify's auto-detection, and ran the migration's final local `pnpm build` smoke — clean, byte-identical Netlify-form blocks, 7-URL sitemap, `build/_redirects` copied verbatim from `public/_redirects`.

## What Shipped

### Single atomic commit

**`c830092` — `chore(04-05): append SPA fallback [[redirects]] to netlify.toml`**

Eight lines appended to `netlify.toml` after the existing `[functions]` block:

```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
+
+# SPA fallback for React Router. Processes after public/_redirects, so the
+# /materials -> /styles#materials 301 in _redirects continues to win for that
+# specific path; everything else gets the index.html rewrite.
+[[redirects]]
+  from = "/*"
+  to = "/index.html"
+  status = 200
```

Original 11 lines (`[build]`, `[build.environment]`, `[functions]`) byte-unchanged. `git diff --stat`: 1 file changed, 8 insertions(+), 0 deletions.

### Final `pnpm build` output

```
> shapesmith-studio-web@0.1.0 build
> vite build

vite v7.3.3 building for production...
✓ 644 modules transformed.
✓ built in 1.49s

> shapesmith-studio-web@0.1.0 postbuild
> node scripts/generate-sitemap.cjs
sitemap.xml written with 7 URLs
```

Output structure:

| Artifact | Size | Notes |
|----------|------|-------|
| `build/index.html` | 3,079 B | Both Netlify form blocks intact (`contact-form`, `shop-notify`) |
| `build/_redirects` | 508 B | Byte-identical to `public/_redirects` (`diff -q` returns no output) |
| `build/sitemap.xml` | 701 B | Postbuild ran; 7 URLs (static routes — Sanity slugs not yet populated) |
| `build/assets/index-BI4RGJBk.js` | 299.94 kB / 99.43 kB gzip | Main JS bundle (hash unchanged from Plan 04-04 baseline — netlify.toml is deploy-time config, not bundled) |
| `build/assets/index-C1UgqUPx.css` | 27.01 kB / 5.88 kB gzip | Main CSS chunk |
| Total chunks | 24 JS + 1 CSS + fonts | 22 lazy route/component chunks ranging from 0.11 kB (encodeFormData) to 125.87 kB (volumeAndBbox/Three.js) |

### Form-field roster preserved in `build/index.html`

`grep -oE 'name="[^"]+"' build/index.html | sort | uniq -c`:

```
   2 name="bot-field"      ← honeypot (1 per form)
   1 name="contact-form"   ← form attribute
   1 name="description"    ← <meta>
   2 name="email"          ← contact-form + shop-notify
   1 name="message"        ← contact-form
   1 name="name"           ← contact-form (visitor name)
   1 name="service"        ← contact-form (D-25)
   1 name="shop-notify"    ← form attribute
   1 name="subject"        ← contact-form
   1 name="theme-color"    ← <meta>
   1 name="viewport"       ← <meta>
```

Both forms register at deploy time with their full Phase 2/3 field set — D-28 (contact-form prerender) + D-23 (shop-notify prerender) contracts honored.

## Acceptance Criteria — All Pass

| Gate | Result |
|------|--------|
| `grep -c '\[\[redirects\]\]' netlify.toml` returns 1 | PASS |
| `grep -c 'from = "/\*"' netlify.toml` returns 1 | PASS |
| `grep -c 'to = "/index.html"' netlify.toml` returns 1 | PASS |
| `grep -c 'status = 200' netlify.toml` returns 1 | PASS |
| `grep -c 'publish = "build"' netlify.toml` returns 1 (unchanged) | PASS |
| `grep -c 'command = "pnpm build"' netlify.toml` returns 1 (unchanged) | PASS |
| `grep -c 'NODE_VERSION = "20"' netlify.toml` returns 1 (unchanged) | PASS |
| `grep -c 'directory = "netlify/functions"' netlify.toml` returns 1 (unchanged) | PASS |
| `grep -c 'node_bundler = "esbuild"' netlify.toml` returns 1 (unchanged) | PASS |
| `wc -l < netlify.toml` returns at least 17 | PASS (returned 18) |
| `pnpm build` exits 0 | PASS |
| `build/index.html` exists | PASS |
| `build/_redirects` exists and contains `/materials` | PASS (2 grep hits — 1 comment + 1 redirect rule) |
| `build/sitemap.xml` exists | PASS |
| `grep -c 'name="contact-form"' build/index.html` returns 1 | PASS |
| `grep -c 'name="shop-notify"' build/index.html` returns 1 | PASS |

## Threat Model Status (from PLAN.md)

| Threat ID | Disposition | Status |
|-----------|-------------|--------|
| T-04-05-01 (silent regression of `/materials` 301) | mitigate | MITIGATED — `public/_redirects` byte-preserved; Netlify rule-order ensures 301 wins over catch-all (RESEARCH.md citation to Netlify docs). Verified `build/_redirects` is byte-identical to `public/_redirects` (`diff -q` returns no output). |
| T-04-05-02 (DoS: deep-link visits silently 404 if Netlify auto-detect changes) | mitigate | MITIGATED — `[[redirects]] /* -> /index.html 200` makes the SPA fallback explicit in source; no longer depends on Netlify auto-detection. |
| T-04-05-03 (`[functions]` block accidentally modified) | mitigate | MITIGATED — `git diff --stat` shows insertions only (8 lines added, 0 deleted); diff hunk shows the `[functions]` block exclusively as context lines, no `+`/`-`. Acceptance grep gates for `directory = "netlify/functions"` and `node_bundler = "esbuild"` both return 1. |

## Deviations from Plan

None — plan executed exactly as written. The PLAN.md `<action>` block specified the exact text of the appended block; the `<verify><automated>` grep chain plus the `<acceptance_criteria>` list defined the success contract; both were satisfied without modification.

## Self-Check: PASSED

**Files claimed created/modified:**
- `netlify.toml`: FOUND (modified; 18 lines, 8-line additive diff committed)

**Commits claimed:**
- `c830092`: FOUND (`git log --oneline --all | grep -q c830092` returns 0)

**Build artifacts (regenerated each build, gitignored — verified post-build):**
- `build/index.html`: FOUND
- `build/_redirects`: FOUND (byte-identical to `public/_redirects`)
- `build/sitemap.xml`: FOUND (7 URLs)

## Handoff to Plan 04-06

The in-repo Vite migration is now self-consistent. The remaining work is owner-side and deploy-preview verification:

1. **Netlify dashboard env var rename** (owner-action checkpoint in Plan 04-06): rename `REACT_APP_RECAPTCHA_SITE_KEY` to `VITE_RECAPTCHA_SITE_KEY` in the Netlify site Environment Variables UI. Same value, new key. If the owner has a local `.env.local`, do the same rename there.
   - This is also the unblock for Plan 03-03 deferred Task 1 owner-prep — set the env var under the new name directly; do NOT use the old `REACT_APP_` name.
   - Server-side env vars (`RESEND_API_KEY`, `RECAPTCHA_SECRET_KEY`) are NOT renamed — they have no `REACT_APP_` prefix and are bound to the `[functions]` block, which is independent of the Vite/CRA build-tool migration.

2. **Deploy preview parity walkthrough** (Plan 04-06): trigger a Netlify deploy preview, then walk the 11-URL parity checklist:
   - `/`, `/styles`, `/styles/laser-cut`, `/3d-printing`, `/3d-printing/3d-print`, `/about`, `/contact`, `/shop`, `/quote`, `/materials` (must 301 to `/styles#materials`), `/some-nonexistent-path` (must serve `/404` via SPA rewrite + React Router NotFound).
   - Open the Netlify Forms tab and confirm both `contact-form` and `shop-notify` are registered with the field roster shown above (no `0 fields detected`, no missing forms).
   - Open DevTools console at the top of `<App>` mount: confirm no `process is not defined` errors and that reCAPTCHA's `executeRecaptcha` is defined (i.e., `VITE_RECAPTCHA_SITE_KEY` was wired correctly in step 1).

3. **Plan 04-06 is `autonomous: false`** — it requires owner participation at the Netlify dashboard and at the live deploy-preview URL. The agent automates everything except the dashboard rename and the visual eye-test.

## Phase 4 Status After This Plan

| Plan | Status | Closes |
|------|--------|--------|
| 04-01 | done | VITE-01 (scaffolding) |
| 04-02 | done | VITE-01 build-flip + VITE-02 env-var rename in code |
| 04-03 | done | VITE-01 test-runner half |
| 04-04 | done | VITE-01 cleanup half |
| 04-05 | done (this plan) | VITE-03 (netlify.toml SPA fallback + final local build verification) |
| 04-06 | pending | VITE-02 dashboard rename + VITE-03 deploy-preview parity |

Phase 4 success criteria status:

| # | Criterion | Status |
|---|-----------|--------|
| 1 | `pnpm build` produces a deployable bundle via Vite; SPA output behaves identically to CRA build on a deploy preview | IN-REPO COMPLETE; deploy-preview verification owned by Plan 04-06 |
| 2 | All `REACT_APP_*` renamed to `VITE_*` with code references updated; `--openssl-legacy-provider` no longer needed | IN-REPO COMPLETE (Plans 04-02 + 04-04); Netlify dashboard rename owned by Plan 04-06 |
| 3 | `netlify.toml` reflects the new build command and publish directory; deploy preview confirms parity | IN-REPO COMPLETE (this plan); deploy-preview verification owned by Plan 04-06 |
