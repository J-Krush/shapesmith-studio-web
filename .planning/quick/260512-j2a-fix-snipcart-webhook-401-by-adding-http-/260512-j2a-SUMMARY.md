---
phase: quick-260512-j2a
plan: 01
subsystem: snipcart-webhook-auth
tags: [snipcart, netlify-functions, webhook, basic-auth, phase-5-fix]
requires:
  - SNIPCART_SECRET_API_KEY env var on Netlify (test-mode key for UAT; live key for prod)
provides:
  - Authenticated request-validation for Snipcart order.completed webhook
  - Distinct 502 'Webhook validation not configured' vs. 401 'Invalid webhook token' failure modes
affects:
  - netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js
  - .planning/phases/05-pre-made-goods-shop/05-OWNER-PREP-CHECKLIST.md
tech-stack:
  added: []
  patterns:
    - HTTP Basic auth on outbound fetch (secret key as username, empty password)
key-files:
  created: []
  modified:
    - netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js
    - .planning/phases/05-pre-made-goods-shop/05-OWNER-PREP-CHECKLIST.md
decisions:
  - "Read SNIPCART_SECRET_API_KEY at handler scope (not module scope) for parity with the existing lazy env-var read pattern in formatOrderEmail sibling tests"
  - "Use a distinct 502 body ('Webhook validation not configured') for the missing-key path so future config drift is greppable separately from the forged-token 401 and the outage 502"
  - "Bumped existing §F.3/§F.4 in OWNER-PREP-CHECKLIST.md down to §F.4/§F.5 to make room for the new §F.3 live-key swap step (preserves heading uniqueness)"
metrics:
  duration: "2m 11s"
  completed: "2026-05-12"
  tasks_completed: 1
  tasks_total: 2
  files_modified: 2
  files_created: 0
---

# Quick Task 260512-j2a: Fix Snipcart Webhook 401 by Adding HTTP Basic Auth Summary

**One-liner:** Authenticate the Snipcart order-completed webhook validation call with HTTP Basic auth (secret key as username, empty password) so `https://app.snipcart.com/api/requestvalidation/{token}` stops returning 401 — restoring the dual-email path (CONTEXT D-15) so the owner receives the custom Resend order email on real purchases.

---

## What Was Built

### Code change — `netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js`

1. **Top-of-file env var documentation block** updated to list `SNIPCART_SECRET_API_KEY` as a required server-only env var, with an inline note citing Snipcart support thread #169.

2. **Handler body** — inserted, between the missing-token 401 and the `try { fetchWithTimeout(...) }` block:
   - A read of `process.env.SNIPCART_SECRET_API_KEY` into `snipcartSecretKey`.
   - A fail-loud branch returning `{ statusCode: 502, body: 'Webhook validation not configured' }` when the env var is missing, with `console.error('SNIPCART_SECRET_API_KEY not configured')`. This body is intentionally distinct from both the forged-token 401 (`'Invalid webhook token'`) and the catch-block outage 502 (`'Webhook validation unavailable'`) so the owner can `grep` Netlify function logs and disambiguate config drift from forged payloads from API outage.
   - `const basicAuth = Buffer.from(`${snipcartSecretKey}:`).toString('base64')` (trailing colon — secret is the Basic-auth username with empty password).

3. **Validation fetch** — added `{ headers: { Authorization: \`Basic ${basicAuth}\`, Accept: 'application/json' } }` as the second argument to `fetchWithTimeout`. The URL, the surrounding `try`/`catch`, the `!verifyRes.ok → 401` path, and the catch-block 502 path are unchanged byte-for-byte.

4. **All other handler paths untouched** — POST-only gate, body-size ceiling, token-presence 401, eventName filter, Resend send + Promise.race timeout, missing-RESEND_API_KEY tolerance, and the final 200 return are all unchanged.

### Documentation change — `.planning/phases/05-pre-made-goods-shop/05-OWNER-PREP-CHECKLIST.md`

1. **§B.4 "Public vs. secret keys" blockquote** — Replaced the now-incorrect claim that "Phase 5 does NOT require a secret API key" with the corrected statement that Phase 5 also requires the test-mode secret key as `SNIPCART_SECRET_API_KEY`, citing Snipcart support thread #169 and noting RESEARCH A3 was wrong.

2. **§D Netlify env vars** — Removed the false-negative `SNIPCART_API_SECRET` bullet (it claimed the var was not needed). Added a positive checklist item for `SNIPCART_SECRET_API_KEY` with copy-paste instructions, the function reference, and the missing-config 502 grep hint. Kept the `VITE_SNIPCART_PUBLIC_KEY` "not needed" line.

3. **§F live-mode flip** — Added new §F.3 "Netlify env vars — swap Snipcart secret key to live mode" (three checklist items: edit env var, paste live key, redeploy). The previous §F.3 (Production deploy verification) and §F.4 (fulfillment workflow) were bumped to §F.4 and §F.5 respectively to keep heading numbering monotonic and unique.

---

## Tasks Completed

| Task | Name | Status | Commit | Files |
|------|------|--------|--------|-------|
| 1 | Add Basic-auth header to Snipcart request-validation call + update owner-prep checklist | DONE | `79d0762` | `netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js`, `.planning/phases/05-pre-made-goods-shop/05-OWNER-PREP-CHECKLIST.md` |
| 2 | Owner manual verification — deploy preview round-trip | **PENDING OWNER ACTION** | — | — |

### Task 2 — Pending Owner Action

Task 2 is a `checkpoint:human-verify` that requires the owner to:

1. Confirm `SNIPCART_SECRET_API_KEY` is set on Netlify (test-mode secret key, scoped to at least production).
2. Push this commit to the `dev` branch so the Netlify deploy preview rebuilds the function bundle.
3. Place a test order on the deploy preview using Stripe test card `4242 4242 4242 4242`.
4. Confirm in Snipcart Dashboard → Webhooks: most-recent `order.completed` delivery returns **200** with body `{ "ok": true }` (not 401, not 502).
5. Confirm in Resend Dashboard → Logs: a `Shapesmith Studio <orders@shapesmith.studio> → jkrush@shapesmith.studio` send appears, marked Delivered.
6. Confirm in `jkrush@shapesmith.studio` inbox: an order email with subject `[Order …] N item(s) — $…` arrives.

Optional negative-path check: temporarily remove `SNIPCART_SECRET_API_KEY`, redeploy, place an order; Snipcart log should show **502 "Webhook validation not configured"** (the new distinct body), not the older 401. Restore the env var after the check.

Full verification script lives in `260512-j2a-PLAN.md` Task 2 `<how-to-verify>` block.

---

## Verification Results

All automated checks from PLAN.md Task 1 `<verify><automated>` passed:

| Check | Result |
|---|---|
| `grep -q "SNIPCART_SECRET_API_KEY" snipcart-order-webhook.js` | PASS |
| `grep -qE "Authorization.*Basic" snipcart-order-webhook.js` | PASS |
| `grep -qE 'Buffer\.from\(`\$\{snipcartSecretKey\}:`\)'` | PASS |
| `grep -q "Webhook validation not configured"` | PASS |
| `grep -q "Invalid webhook token"` (forged-token 401 still present) | PASS |
| `grep -q "Webhook validation unavailable"` (outage 502 still present) | PASS |
| `! grep -q "SNIPCART_SECRET_API_KEY" snipcart-validate-product.js` (sister fn untouched) | PASS |
| `formatOrderEmail.js` byte-unchanged (`git diff --stat HEAD` empty) | PASS |
| `grep -q "SNIPCART_SECRET_API_KEY"` in OWNER-PREP-CHECKLIST.md | PASS |
| `grep -q "F.3"` in OWNER-PREP-CHECKLIST.md | PASS |
| `! grep -q "SNIPCART_API_SECRET"` in OWNER-PREP-CHECKLIST.md (false-negative removed) | PASS |
| `node --check netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js` | PASS |
| `pnpm test` | 60/60 tests pass across 12 files |
| `pnpm build` | Built in 1.16s, sitemap generated with 7 URLs |

Note: `pnpm test` emits a `jsdom: Error: Not implemented: window.scrollTo` warning unrelated to this task — it originates from `src/components/ScrollToTop.jsx`'s `useEffect` and pre-dates this change. All assertions still pass; the warning is jsdom output noise, not a test failure.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking fix] §F.5 renumbering to preserve heading uniqueness**

- **Found during:** Task 1, while editing the OWNER-PREP-CHECKLIST.md §F live-mode flip section.
- **Issue:** The plan instructed "append a new sub-section after §F.2" as `§F.3 Netlify env vars — swap Snipcart secret key to live mode`, and also said "Do NOT renumber existing §F.1 / §F.2 headings." The existing file already had `§F.3 Production deploy verification` and `§F.4 Set up your fulfillment workflow`. Inserting a new §F.3 created a duplicate heading number, leaving the document with two `### F.3` sections and two `### F.4` sections after the new heading shifted the original §F.3 to §F.4.
- **Fix:** After inserting the new §F.3, renumbered the original §F.3 → §F.4 (via the same edit that inserted the new §F.3), then renumbered the original §F.4 → §F.5 in a follow-up edit. The plan's "do not renumber §F.1/§F.2" rule was honored — only downstream headings were shifted, and only by the minimum needed to keep numbering monotonic.
- **Files modified:** `.planning/phases/05-pre-made-goods-shop/05-OWNER-PREP-CHECKLIST.md`
- **Commit:** `79d0762` (rolled into the Task 1 atomic commit per constraints)

**2. [Rule 3 - Blocking fix] Install missing `node_modules` to run `pnpm test`/`pnpm build`**

- **Found during:** Task 1 verification, attempting to run `pnpm test`.
- **Issue:** Worktree was spawned without `node_modules` populated (`sh: vitest: command not found`). `pnpm build` and `pnpm test` are explicit verify requirements in the plan.
- **Fix:** Ran `pnpm install --prefer-offline` once to hydrate the worktree's node_modules. No `package.json` or lockfile changes resulted.
- **Files modified:** None (install only).
- **Not committed:** `node_modules` is git-ignored.

No other deviations. The code edits to `snipcart-order-webhook.js` and the documentation edits to OWNER-PREP-CHECKLIST.md were applied exactly as written in PLAN.md Task 1.

---

## Authentication Gates

None. The function still calls Snipcart with a runtime-provided secret key — but that's the env-var owner responsibility (Task 2 owner verification covers that side). No CLI auth gates encountered during execution.

---

## Decisions Made

1. **Handler-scope env read for `SNIPCART_SECRET_API_KEY`** — Mirrors the way `resend = new Resend(process.env.RESEND_API_KEY)` is read at module load but used lazily; placing the env read inside the handler keeps the missing-key 502 path covered by per-invocation logging (each invocation independently logs `'SNIPCART_SECRET_API_KEY not configured'` if the env var was unset at deploy time, which is greppable per-delivery in Netlify logs).

2. **Distinct 502 body for missing-config vs. outage** — The catch-block already returned `502 'Webhook validation unavailable'` for fetch-level failures (timeout, DNS, network). The new missing-config path returns `502 'Webhook validation not configured'`. Both are 502s (server-side failure, Snipcart will retry per their 24h retry window), but the bodies are distinct so log filters can separate config drift from API outage.

3. **No reset/refactor of `fetchWithTimeout` helper** — The plan was clear that only the *callsite* changes (add the `options` argument with headers). The helper already accepts and forwards `options` via `{ ...options, signal: controller.signal }`, so no helper-side change is needed.

---

## Threat Flags

None. This change *removes* a deployment-blocking 401 from a webhook handler that was already designed with explicit threat mitigations in scope (T-05-07-04 body-size ceiling, T-05-07-05 information-disclosure logging discipline, T-05-07-06 retry-storm avoidance). The added Basic-auth header introduces no new attack surface — it sends an outbound credential to a single hard-coded Snipcart URL over HTTPS, and the credential is read from a Netlify-scoped server-only env var that was already documented as required.

---

## Known Stubs

None. No stubs, placeholders, or "coming soon" UI was introduced.

---

## Follow-Ups

1. **Owner action (blocking on live-mode flip):** Task 2 manual verification on the deploy preview. See "Task 2 — Pending Owner Action" above.
2. **Owner action (production launch):** When flipping to live mode per §F.1 of OWNER-PREP-CHECKLIST.md, also execute the new §F.3 (swap test secret key for live secret key in `SNIPCART_SECRET_API_KEY`).
3. **None for code:** The fix is single-callsite and uses an already-required-by-design env var pattern. No tech debt is introduced.

---

## Self-Check: PASSED

- `[ -f netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js ]` → FOUND
- `[ -f .planning/phases/05-pre-made-goods-shop/05-OWNER-PREP-CHECKLIST.md ]` → FOUND
- `git log --oneline --all | grep -q "79d0762"` → FOUND
