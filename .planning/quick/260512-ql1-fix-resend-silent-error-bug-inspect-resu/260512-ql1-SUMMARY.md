---
phase: 260512-ql1-fix-resend-silent-error
plan: 01
subsystem: netlify-functions/snipcart-order-webhook
tags: [bugfix, resend, webhook, observability, owner-uat]
requires:
  - resend SDK v6 result shape ({ data, error })
  - existing Promise.race + 5s timeout pattern
  - PATTERNS.md deviation 9 (200-on-Resend-fail; no-retry-storm)
provides:
  - Three distinct, greppable log signatures for Resend send outcomes
  - Resolved-error path now surfaced (was silently swallowed)
  - Success-path traceability (message id + invoice correlation)
affects:
  - Owner UAT diagnosis for Phase 5 "no emails arriving" mystery
tech-stack:
  added: []
  patterns:
    - "Inspect awaited SDK result for { error } before treating as success"
key-files:
  created: []
  modified:
    - netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js
decisions:
  - "Preserved statusCode: 200 on resolved-error path (no Snipcart retry storm)"
  - "Used console.log (not console.error) for success path so Netlify log filters can isolate failures"
  - "Kept three log signatures distinct so owner can grep one of three substrings to diagnose"
metrics:
  duration: ~4 minutes
  completed: 2026-05-12
---

# Quick Task 260512-ql1: Fix Resend Silent-Error Bug Summary

Surface Resend SDK v6 resolved-error responses in the Snipcart order webhook so owner UAT can diagnose why Phase 5 emails aren't arriving — the SDK was returning `{ data: null, error: {...} }` rather than throwing, so the old `try/catch` silently treated every API failure as success.

## What Was Done

Single surgical edit to `netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js` (commit `88a504f`):

1. **Expanded the section comment above the `try` block** to document the two-path error model (resolved-error vs thrown) and explain why both return 200 (PATTERNS.md deviation 9 — Snipcart retry storm avoidance).
2. **Captured the awaited result** into `const result` instead of discarding it.
3. **Added a resolved-error branch** that inspects `result?.error`, logs `Resend API returned error: <message>` (+ invoice for Snipcart-dashboard correlation), and returns `{ statusCode: 200, body: 'OK (email send failed; logged)' }` — same shape as the existing thrown-exception path.
4. **Added a success-path log** with the Resend message id and invoice number for correlation.
5. **Left the existing `catch` block untouched** — it still handles thrown exceptions (timeout race, missing SDK module, network reset) and its log line (`Resend send failed (non-fatal):`) is intentionally distinct from the new resolved-error line.

## Three Log Signatures (Greppable)

| Outcome | Log line | Level |
|---|---|---|
| Success | `Resend send accepted, message id: <id> invoice: <invoice>` | `console.log` |
| Resolved-error (API said no, but didn't throw) | `Resend API returned error: <message>` + `Order received but custom email failed — see Snipcart dashboard: <invoice>` | `console.error` |
| Thrown (timeout, missing module, network reset) | `Resend send failed (non-fatal): <message>` + `Order received but custom email failed — see Snipcart dashboard: <invoice>` | `console.error` (pre-existing) |

All three return `statusCode: 200` — no-retry-storm semantics preserved.

## Verification

- `node --check netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js` — passes
- `grep -c "Resend API returned error:"` — 1 occurrence
- `grep -c "Resend send accepted, message id:"` — 1 occurrence
- `grep -c "Resend send failed (non-fatal):"` — 1 occurrence (pre-existing, preserved)
- `grep -c "result?.error"` — 2 occurrences (1 in code, 1 in the comment block)
- `git diff --stat` — exactly 1 file changed, +39/-1 lines
- `pnpm build` — succeeded (CRA → Vite + postbuild sitemap)
- `formatOrderEmail.js` and its `__tests__/` tree — untouched
- No deletions in the commit

## Deviations from Plan

None — plan executed exactly as written.

## Owner UAT Next Step

1. Merge / promote the deploy preview for this commit (or push the worktree branch and let Netlify build a preview).
2. Place a Snipcart test order against the preview URL.
3. Open Netlify Functions logs for `snipcart-order-webhook`.
4. Report which of the three log signatures appears for that order:
   - `Resend send accepted, message id: …` → success path; the email left Resend. Diagnosis shifts to recipient mailbox / spam folder / forwarding rules at `jkrush@shapesmith.studio`.
   - `Resend API returned error: …` → resolved-error path. The message will name the cause — most likely candidates: invalid `RESEND_API_KEY`, unverified sender domain (`orders@shapesmith.studio` not configured in Resend), recipient blocked, or rate limit.
   - `Resend send failed (non-fatal): Resend timeout` (or other) → thrown path. SDK never got a response in 5s — network / Resend outage.

## Self-Check: PASSED

- File exists: `netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js` — FOUND
- Commit exists: `88a504f` — FOUND
- All three log-signature strings present in source — FOUND
- `result?.error` inspection present in source — FOUND
