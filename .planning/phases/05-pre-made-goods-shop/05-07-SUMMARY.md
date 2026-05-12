---
phase: 05-pre-made-goods-shop
plan: 07
subsystem: api
tags: [shop, netlify-function, snipcart, webhook, resend, security, vitest]

# Dependency graph
requires:
  - phase: 03-quote-tool
    provides: "Resend account, RESEND_API_KEY env var, fetchWithTimeout + Promise.race timeout idiom, function-local pnpm-lock.yaml precedent, formatQuoteText.js as the pure-function formatter analog"
  - phase: 05-pre-made-goods-shop/05-06
    provides: "snipcart-validate-product Netlify Function (sibling Function — same AbortController + 5s timeout idiom, parallel slot in netlify/functions/)"
provides:
  - "netlify/functions/snipcart-order-webhook handler — POST endpoint that receives Snipcart's order.completed webhook, validates the request token, sends a custom-formatted owner email via Resend"
  - "netlify/functions/snipcart-order-webhook/formatOrderEmail.js — pure CommonJS formatter (61 lines) for the order → plain-text email body. Unit-tested."
  - "5 Vitest unit tests for formatOrderEmail covering missing-data fallback, full happy path, single-item pluralization, empty-items no-throw, billingAddress fallback when shippingAddress missing"
  - "Vitest test.include extension — netlify/functions/**/__tests__/*.{test,spec}.{js,jsx} now picks up function-colocated tests in addition to src/**/*"
affects:
  - "Plan 05-08 (owner-prep) — needs to subscribe Snipcart Dashboard webhook to order.completed pointing at /.netlify/functions/snipcart-order-webhook AND verify RESEND_API_KEY is present"
  - "Plan 05-09 (UAT) — must place a Snipcart test-mode order, confirm the custom email arrives within 30s, confirm Snipcart's webhooks log shows 200, confirm Netlify Function logs show no errors"
  - "Future phases adding function-colocated unit tests (vitest pattern now established)"

# Tech tracking
tech-stack:
  added:
    - "resend@^6.12.3 (function-local — already in submit-quote)"
  patterns:
    - "Token-callback webhook validation (Snipcart): GET app.snipcart.com/api/requestvalidation/{token} + 5s AbortController"
    - "Fail-closed on validation API outage: return 502 (Snipcart retries non-2xx, replays once recovered)"
    - "Fail-open on email-send failure: return 200 + log invoice (suppresses Snipcart retry storm; CONTEXT D-15 keeps Snipcart's default email as safety net)"
    - "eventName guard against dashboard misconfig: non-order.completed → 200 + skip email"
    - "Function-colocated unit tests: netlify/functions/<name>/__tests__/*.test.js picked up by Vitest via extended include glob"

key-files:
  created:
    - "netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js"
    - "netlify/functions/snipcart-order-webhook/formatOrderEmail.js"
    - "netlify/functions/snipcart-order-webhook/package.json"
    - "netlify/functions/snipcart-order-webhook/pnpm-lock.yaml"
    - "netlify/functions/snipcart-order-webhook/__tests__/formatOrderEmail.test.js"
  modified:
    - "vite.config.js (broaden test.include to cover netlify/functions/**/__tests__/)"

key-decisions:
  - "Function-colocated test placement (netlify/functions/<name>/__tests__/) preferred over Phase 3's cross-rootDir require pattern (src/utilities/quote/formatQuoteText.test.js → ../../../netlify/functions/...). Required broadening Vitest's test.include — the cleaner option going forward and explicitly anticipated by the plan."
  - "Function-local pnpm-lock.yaml committed (matches Phase 3 submit-quote/pnpm-lock.yaml precedent). Netlify's esbuild bundler picks it up at deploy."
  - "Resend failure → 200 + log (NOT 502). Trade-off: occasional missed custom email vs. cascading Snipcart retry storm. Owner still gets Snipcart's default email per CONTEXT D-15. Documented in PATTERNS deviation 9 + threat T-05-07-06."

patterns-established:
  - "Snipcart token-callback validation: read x-snipcart-requesttoken (lowercase + uppercase header fallback), GET requestvalidation API with 5s AbortController, 401 on missing/invalid, 502 on timeout"
  - "Optional-chained payload reads: every payload.content.* access uses ?? fallback (RESEARCH A4 — Snipcart payload shape is documented across support threads but not pinned to a canonical reference)"
  - "PII-redacted logging: console.error on Resend failure logs the invoice number only; never customer email, address, or phone"

requirements-completed: [SHOP-06]

# Metrics
duration: 5m
completed: 2026-05-09
---

# Phase 5 Plan 07: Snipcart Order Webhook Handler Summary

**Snipcart `order.completed` webhook handler with token-callback validation, Resend custom email, and retry-storm-suppressing 200-on-fail — the custom-email half of CONTEXT D-15 dual-email strategy.**

## Performance

- **Duration:** 5m 16s
- **Started:** 2026-05-09T14:59:00Z
- **Completed:** 2026-05-09T15:04:25Z
- **Tasks:** 2 (Task 1 followed full TDD RED → GREEN; Task 2 was a single feat commit)
- **Files modified:** 6 (5 created, 1 modified)

## Accomplishments

- **Webhook handler shipped** — `netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js` (156 lines) validates the Snipcart request token via the token-callback endpoint, filters to `order.completed` only, builds the custom email body, and sends via Resend with a 5s timeout. All threat-model mitigations applied (T-05-07-01..06).
- **Email formatter unit-tested** — `formatOrderEmail.js` is a pure CommonJS function (61 lines) covered by 5 Vitest assertions: missing-data fallback, full happy-path output, single-item pluralization, empty-items no-throw, and billingAddress fallback when shippingAddress is missing.
- **Vitest test scope extended** — `vite.config.js` `test.include` now picks up function-colocated tests (`netlify/functions/**/__tests__/*.{test,spec}.{js,jsx}`), preserving the existing `src/**/*.{test,spec}.{js,jsx}` glob. Establishes the pattern for future function-colocated tests.
- **Verification:** `pnpm test` 60/60 pass (was 55, +5 new); `pnpm build` clean.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: failing test for formatOrderEmail** — `71d5de7` (test)
2. **Task 1 GREEN: implement formatOrderEmail helper** — `de0359c` (feat)
3. **Task 2: ship snipcart-order-webhook Function** — `89fbef7` (feat)

_Note: Task 1 followed full TDD cycle (RED → GREEN, no REFACTOR needed — implementation matched the plan's source verbatim)._

## Files Created/Modified

- `netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js` — POST handler. Token validation, body-size guard, eventName filter, Resend send with timeout, 200-on-Resend-fail.
- `netlify/functions/snipcart-order-webhook/formatOrderEmail.js` — Pure CommonJS function that builds the plain-text owner email body from a Snipcart order.completed payload's `content` object. Defensive optional-chained field reads.
- `netlify/functions/snipcart-order-webhook/package.json` — Function manifest with `resend@^6.12.3` (matches submit-quote pin).
- `netlify/functions/snipcart-order-webhook/pnpm-lock.yaml` — Function-local lockfile (Phase 3 precedent).
- `netlify/functions/snipcart-order-webhook/__tests__/formatOrderEmail.test.js` — 5 Vitest unit tests for the formatter.
- `vite.config.js` — Extended `test.include` to also pick up `netlify/functions/**/__tests__/*.{test,spec}.{js,jsx}`.

## Decisions Made

- **Test placement: function-colocated over Phase 3 cross-rootDir pattern.** Phase 3's `formatQuoteText.test.js` lives in `src/utilities/quote/` and uses a `require('../../../netlify/...')`. The plan's required artifact path was `netlify/functions/snipcart-order-webhook/__tests__/formatOrderEmail.test.js`, so the test now lives next to the helper. This is cleaner going forward — anything modifying the Function or its formatter has tests in the same directory tree. Cost: one tiny `vite.config.js` addition (extending `test.include`).
- **Function-local `pnpm-lock.yaml` committed.** Matches `submit-quote/pnpm-lock.yaml` precedent. The sibling `snipcart-validate-product` doesn't commit one because it has zero deps; we have one (`resend`), so the lock file pins the transitive tree.
- **`new Resend(...)` at module scope (matches submit-quote precedent).** Throws if `RESEND_API_KEY` is missing at module load — but that's the same behavior as submit-quote and works fine in the production runtime (env var is set). Plan 08 owner-prep verifies the env var is present before deploy.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extended Vitest `test.include` to cover `netlify/functions/**/__tests__/`**

- **Found during:** Task 1 RED (writing the failing test)
- **Issue:** `vite.config.js` had `test.include: ['src/**/*.{test,spec}.{js,jsx}']` — the new test at `netlify/functions/snipcart-order-webhook/__tests__/formatOrderEmail.test.js` would not be picked up by `pnpm test`, blocking the TDD cycle and the plan's verification grep `pnpm test ... | grep -q "formatOrderEmail"`.
- **Fix:** Added a second include glob — `'netlify/functions/**/__tests__/*.{test,spec}.{js,jsx}'` — alongside the existing src glob. Comment in the file pins the rationale to Plan 05-07.
- **Files modified:** `vite.config.js`
- **Verification:** `pnpm test` shows 12 test files (was 11), 60 tests (was 55, +5 new). RED phase saw the test fail; GREEN phase saw all 5 pass.
- **Committed in:** `71d5de7` (Task 1 RED commit, alongside the test file).
- **Anticipated by plan:** PLAN.md Task 1 Step 3 explicitly raised this as a possibility ("If `vite.config.js` has an explicit `test.include` that scopes to `src/**`, this test won't run unless the config is broadened. Check; if scoped to src/, ADD a deviation note in the SUMMARY..."). The chosen fix (extend the include) matches the plan's "Recommended approach" of keeping the test colocated with the Function.

---

**Total deviations:** 1 auto-fixed (1 blocking, anticipated by plan).
**Impact on plan:** No scope change. Plan recommended this exact fix as one of two acceptable options; the colocated-test path was chosen.

## Issues Encountered

- None during planned work. Local `node -e "require(handler)"` smoke test threw on missing `RESEND_API_KEY` (Resend SDK constructor enforces it) — confirmed this matches the existing `submit-quote.js` behavior in production (env var is set there too) and is a non-issue for the deploy runtime. No fix needed.

## User Setup Required

The plan's `<user_setup>` block defers all Snipcart Dashboard configuration and env-var verification to Plan 05-08 (owner-prep). This plan ships only the code:

- **Plan 05-08 owner-prep checklist:**
  1. Snipcart Dashboard → Webhooks → Add endpoint: `https://shapesmith.studio/.netlify/functions/snipcart-order-webhook`. Subscribe to `order.completed` ONLY (the eventName filter in the handler is defensive but the dashboard subscription should be tight).
  2. Verify `RESEND_API_KEY` is present in Netlify env vars (already added in Phase 3 owner-prep — should still be there; confirm by running a dry-run from the Resend dashboard or by inspecting Netlify dashboard).
  3. Optional: Verify the `orders@shapesmith.studio` envelope-from is on the verified-sender domain in Resend (Phase 3 owner-prep verified `quotes@shapesmith.studio`; both share the same domain so this should be inherited, but confirming once removes ambiguity).

## Next Phase Readiness

- **Code is deploy-ready.** After Plan 05-08 dashboard wiring + Plan 05-09 UAT, every Snipcart test-mode and live-mode order will trigger:
  - Snipcart's default order-confirmation email to the owner (CONTEXT D-15 safety-net half).
  - This Function's custom-formatted email with line items, customer, shipping address, total, and dashboard link (CONTEXT D-15 preferred-format half).
- **Open assumptions to verify in UAT (RESEARCH A3 + A4):**
  - A3: Token-validation endpoint accepts unauthenticated GETs. If the first webhook returns 401, add `process.env.SNIPCART_API_SECRET` and a `Basic` auth header.
  - A4: Payload field shape (`content.invoiceNumber`, `content.items[]`, etc.). If any field comes back undefined in the first real webhook, the formatter falls back gracefully (no throw) but the email may show `???` — adjust `formatOrderEmail.js` based on what Netlify Function logs reveal.
- **No blockers** for downstream Plan 05-08.

## Self-Check: PASSED

- File `netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js`: FOUND
- File `netlify/functions/snipcart-order-webhook/formatOrderEmail.js`: FOUND
- File `netlify/functions/snipcart-order-webhook/package.json`: FOUND
- File `netlify/functions/snipcart-order-webhook/pnpm-lock.yaml`: FOUND
- File `netlify/functions/snipcart-order-webhook/__tests__/formatOrderEmail.test.js`: FOUND
- File `vite.config.js`: MODIFIED (test.include extended)
- Commit `71d5de7` (test RED): FOUND
- Commit `de0359c` (feat GREEN): FOUND
- Commit `89fbef7` (feat handler): FOUND

---
*Phase: 05-pre-made-goods-shop*
*Plan: 07*
*Completed: 2026-05-09*
