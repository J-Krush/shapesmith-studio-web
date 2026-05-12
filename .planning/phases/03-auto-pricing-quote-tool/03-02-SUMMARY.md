---
phase: 03-auto-pricing-quote-tool
plan: 02
subsystem: quote-tool
tags:
  - frontend
  - sanity
  - schema
  - pricing
  - tdd
  - owner-prep
requires:
  - Plan 03-01 — /quote stub (Quote.jsx, QuoteTabs.jsx, FileDropzone, GeometrySummary, parsers)
  - Phase 2 — useSanityQuery, MaterialsSection MATERIALS_QUERY shape, ContactForm <select> styling, dark-pair Tailwind tokens
provides:
  - "src/utilities/quote/calculatePrice.js — pure { low, high } range calculator from geometry + pricing-rule"
  - "src/components/quote/MaterialPicker.jsx — Sanity-driven select with pricing-rule join + empty/loading states"
  - "src/components/quote/QuantityInput.jsx — compact number input with min/max + label rhythm"
  - "src/components/quote/PriceRange.jsx — Ballpark estimate $low – $high + non-dismissable disclaimer + framer-motion fade"
  - "MATERIALS_QUERY (named export) — GROQ query reused by QuoteTabs for the no-double-fetch pattern"
  - ".planning/phases/03-auto-pricing-quote-tool/03-SCHEMA-SPEC.md — owner-prep doc (Task 1, committed in 8fff775)"
affects:
  - "src/components/quote/QuoteTabs.jsx — useSanityQuery hoisted; per-tab materialIdByTab + quantityByTab state; renders picker → quantity → range below GeometrySummary"
tech-stack:
  added:
    - "Sanity doc type — pricing-rule (rolled out by owner in studio sub-repo per 03-SCHEMA-SPEC.md §5)"
  patterns:
    - "Hoisted useSanityQuery — MaterialPicker stays presentational; QuoteTabs owns the query so PriceRange can read pricing from the same materials list (no double-fetch)"
    - "Pricing-rule GROQ join — *[_type == 'pricing-rule' && references(^._id)][0] returns null when no rule exists; consumer renders helpful /contact note instead of a price"
    - "QTE-05 lock in code — calculatePrice always returns { low, high }; PriceRange never renders a single-number figure; disclaimer never moved into a tooltip/modal"
    - "Accent-color content reservation — text-accent on the price-range figure is documented as the ONLY non-CTA content use of accent in the codebase (UI-SPEC §Color #6)"
key-files:
  created:
    - .planning/phases/03-auto-pricing-quote-tool/03-SCHEMA-SPEC.md (committed in Task 1, 8fff775)
    - src/utilities/quote/calculatePrice.js
    - src/utilities/quote/calculatePrice.test.js
    - src/components/quote/MaterialPicker.jsx
    - src/components/quote/QuantityInput.jsx
    - src/components/quote/PriceRange.jsx
  modified:
    - src/components/quote/QuoteTabs.jsx (useSanityQuery hoist + material/quantity state + render block)
decisions:
  - "Hoisted useSanityQuery to QuoteTabs instead of letting MaterialPicker fetch internally — the planner-discretion note in Plan 03-02 Step B explicitly invites this when it makes the wiring simpler. PriceRange needs the picked material's pricing object; if MaterialPicker owned the query, QuoteTabs would refetch the same query just to read pricing — double-fetch. Hoisting also lets MaterialPicker stay a pure presentational component (props in, JSX out)."
  - "MaterialPicker exports MATERIALS_QUERY as a named export so QuoteTabs has a single canonical GROQ string to consume; the picker's behavior (empty state, loading state, '(pricing not configured)' suffix) is unchanged from the plan."
  - "calculatePrice.test.js tests ONLY the pure helper, not the components. The components are exercised at runtime in the browser; component rendering tests would require mocking useSanityQuery + framer-motion + need fixtures the project doesn't yet have. The plan's <verify> block accepts this — it tests calculatePrice + smoke test, not component-level rendering."
metrics:
  duration: ~3.5m
  task_count: 2
  files_changed: 6
  completed: 2026-05-08
---

# Phase 3 Plan 02: pricing-rule schema + MaterialPicker + QuantityInput + PriceRange + calculatePrice Summary

**One-liner:** Surfaces the price *number* in `/quote` — a Sanity-driven Material picker (filtered by tab service via `$serviceKey in services` + a pricing-rule join), a compact Quantity input, and a live `$low – $high` Ballpark estimate calculated by a pure helper from geometry + pricing-rule data, with the legal-posture disclaimer locked directly beneath every reading.

## What Shipped

A visitor on `/quote` who has dropped a valid file and seen the GeometrySummary now sees a Material `<select>` populated from Sanity (filtered to the active tab's service via the same `MATERIALS_QUERY` shape Plan 02 used in `MaterialsSection`, extended with a `references(^._id)` join into the new `pricing-rule` doc type). Picking a material reveals a Quantity input (default 1, min 1, max 999, browser-native steppers). If the picked material has a published pricing-rule, a "Ballpark estimate" appears as `$low – $high` in the accent color, with two muted lines beneath it: the legal-posture disclaimer ("This is an estimate. Final price comes after we review your file — not a binding quote.") and the markup-buffer note ("Pricing includes a small buffer for setup, finishing, and time. We'll tighten it up when we confirm."). Changing the material or quantity recomputes and re-fades the figure live (within one render tick). If the picked material has no pricing-rule, the dropdown shows `(pricing not configured)` next to its title and the price-range component is replaced by a helpful note linking to `/contact` for a manual quote.

The Plan 03-01 placeholder "Submit for confirmation — coming soon" CTA is unchanged — it still sits below the price block, kept honest until Plan 03-03 wires real submission.

## Owner status of pricing-rule rollout

Per the resume signal received during Task 1: **schema deployed + rules created.** The owner added `pricing-rule.js` to the studio sub-repo, ran `npx sanity deploy`, and created at least one Pricing Rule document per existing material with rates filled in. Frontend Task 2 therefore renders against real pricing data — the empty-state path (where Sanity returns `[]`) and the no-pricing-on-this-material path (where `pricing` is null) are present in code as defensive UX but were not the primary test path.

## "Test empty-state first" path exercised?

**No** — the owner's resume signal was the "schema deployed, N rules created" branch from §5 of 03-SCHEMA-SPEC.md, not the "will backfill rules later, proceed with empty-state UX testing" branch. Both paths exist in code (MaterialPicker's empty-state container; QuoteTabs's helpful-note rendering when `picked.pricing` is null) and would render correctly in a backfill-in-progress scenario, but the owner's path took the schema-rolled-out branch.

## Real numeric example (end-to-end traceability)

The plan's canonical 3D fixture from `<behavior>` — `volumeCm3=24.5, ratePerCm3=0.5, setupFee=5, machineTimeMultiplier=1.0, markupBufferLow=15, markupBufferHigh=25, quantity=1` — flows through `calculatePrice` as follows:

```
base = (24.5 × 0.5 + 5) × 1.0 × 1
     = (12.25 + 5) × 1.0
     = 17.25

low  = 17.25 × (1 + 15/100) = 17.25 × 1.15 ≈ 19.84
high = 17.25 × (1 + 25/100) = 17.25 × 1.25 ≈ 21.56

formatUsd(low)  = "$20"   (Math.round(19.84) = 20, n < 1000)
formatUsd(high) = "$22"   (Math.round(21.56) = 22, n < 1000)

PriceRange renders: "$20 – $22"   (en-dash U+2013)
```

This is the verified numeric path covered by `calculatePrice.test.js` test 1 ("calculatePrice 3D base case: canonical fixture from `<behavior>`"), which asserts `low ≈ 19.8375` and `high ≈ 21.5625` to 3 decimals — well within the rounding tolerance the formatter applies.

## Bundle Impact

`pnpm build` after this plan compiled successfully with no warnings. The added components (~1.6 KB raw JS combined: MaterialPicker, QuantityInput, PriceRange, calculatePrice) live inside the same `/quote` chunk that Plan 03-01 measured at **4.3 KB gzip**. No new dependencies were added — all uses are existing (`framer-motion`, `useSanityQuery`, Tailwind classes against existing tokens). The `/quote` chunk remains far below the 120 KB gzip soft target from RESEARCH.md §Bundle math.

## Threat Model Coverage

All `mitigate` and `accept` dispositions from `<threat_model>` are landed in code:

| Threat | Disposition | Mitigation/Acceptance |
|--------|-------------|---------------------|
| T-03-02-01 (client-side price tampering) | accept | The visitor sees a *range*, not a binding quote; no submission yet (Plan 03-03), and the disclaimer "not a binding quote" is non-dismissable in `PriceRange.jsx`. |
| T-03-02-02 (pricing-rule fields exposed via CDN) | accept | Pricing-rule fields are public by design — same posture as material titles and FAQs already on anonymous CDN. |
| T-03-02-03 (DoS via Sanity query rate) | accept | `useSanityQuery` already debounces via React effect deps; query refires once per active tab change. |
| T-03-02-04 (spoofed materialId not in list) | accept | `materialIdByTab` is set only via `<select>` `onChange`; tampered IDs fail the `materials.find()` guard and render nothing. |
| T-03-02-05 (quantity input parseInt) | **mitigate** | `Math.max(1, Math.min(999, parseInt(e.target.value, 10) \|\| 1))` clamps quantity at the boundary in `QuoteTabs.jsx`; the `<input type="number" min="1" max="999">` is the first defense, the JS clamp is the second. NaN from non-numeric input falls back to 1. |

## Deviations from Plan

### Auto-fixed Issues

None — Task 2 executed as written.

### Planner Discretion Exercised

**1. [Discretion — Step B "Planner discretion within 'no double-fetch'"] Hoisted `useSanityQuery` to `QuoteTabs.jsx`**

- **Found during:** Task 2 Step B implementation.
- **Why:** Plan 03-02 Step B explicitly invites this restructure: *"To avoid two query fetches for the same data, the cleaner pattern is for QuoteTabs to OWN the useSanityQuery call and pass `materials` + `selectedMaterial` props down. Restructure if it makes the wiring simpler — but keep MaterialPicker as the visual component."*
- **Implementation:** `MaterialPicker` exports `MATERIALS_QUERY` as a named export and accepts `{ materials, loading, value, onChange }` as props instead of fetching internally. `QuoteTabs` calls `useSanityQuery(MATERIALS_QUERY, { serviceKey: activeKey }, [activeKey])` once and passes the result to both `MaterialPicker` and the `PriceRange` lookup (`materials.find(...)`). PriceRange itself takes `pricing` directly so it doesn't need to know about the query.
- **Net effect:** One Sanity request per active tab change, not two; MaterialPicker is fully presentational.

### TDD Gate Compliance

Sequence verified in `git log`:

1. `bf29135` — `test(03-02): add failing tests for calculatePrice helper` (RED — verified failing with "Cannot find module './calculatePrice'" before implementation)
2. `4f4e05b` — `feat(03-02): implement calculatePrice + MaterialPicker + QuantityInput + PriceRange` (GREEN — all 6 calculatePrice tests pass; build compiles cleanly)

No separate REFACTOR commit was needed — the components landed in their final shape during GREEN.

## Self-Check: PASSED

Files verified to exist on disk:
- `src/utilities/quote/calculatePrice.js` ✓
- `src/utilities/quote/calculatePrice.test.js` ✓
- `src/components/quote/MaterialPicker.jsx` ✓
- `src/components/quote/QuantityInput.jsx` ✓
- `src/components/quote/PriceRange.jsx` ✓
- `.planning/phases/03-auto-pricing-quote-tool/03-SCHEMA-SPEC.md` ✓ (Task 1, committed in 8fff775)

Commits verified in git log:
- `8fff775` docs(03-02): add pricing-rule schema spec + owner rollout checklist (Task 1, prior agent)
- `bf29135` test(03-02): add failing tests for calculatePrice helper (RED)
- `4f4e05b` feat(03-02): implement calculatePrice + MaterialPicker + QuantityInput + PriceRange (GREEN)

Truth-table for `must_haves.truths` — all 11 PASS:

| # | Truth | Status |
|---|-------|--------|
| 1 | Schema spec exists at .planning/phases/03-auto-pricing-quote-tool/03-SCHEMA-SPEC.md | PASS |
| 2 | After valid file + GeometrySummary, MaterialPicker appears below | PASS — `geometryByTab[activeKey] && <MaterialPicker ... />` in QuoteTabs |
| 3 | MaterialPicker queries Sanity via useSanityQuery filtered by `$serviceKey in services` | PASS — MATERIALS_QUERY uses `$serviceKey in services`; useSanityQuery hoisted to QuoteTabs |
| 4 | Empty-state with /contact link when Sanity returns no materials | PASS — MaterialPicker.jsx empty-state branch |
| 5 | After material picked, QuantityInput appears (default 1, min 1, max 999) | PASS — `materialIdByTab[activeKey] && <QuantityInput ... />` + min="1" max="999" |
| 6 | After material+quantity present and pricing exists, $low – $high range appears | PASS — PriceRange.jsx renders only when geometry+pricing+quantity all present |
| 7 | If material has no pricing-rule, '(pricing not configured)' next to option + helpful note instead of range | PASS — MaterialPicker option suffix + QuoteTabs no-pricing branch |
| 8 | text-accent on the range figure is the ONLY non-CTA content use | PASS — text-accent appears 2x in PriceRange.jsx (comment marker + className); other text-accent in codebase is nav/CTA/link affordances per UI-SPEC §Color #1, #5 |
| 9 | Updates to material or quantity recompute the range live (within one render tick) | PASS — state-driven; framer-motion `key={range.low.toFixed(2)}-${range.high.toFixed(2)}` triggers fade on every value change |
| 10 | Disclaimer always directly below range, never dismissable, never moved to tooltip/modal | PASS — `<p className="text-sm text-ternary-section-dark mt-2">This is an estimate...</p>` always rendered with the figure |
| 11 | Word "quote" not used for visitor's own number | PASS — "Ballpark estimate" labels the figure; "quote" only appears in URL/route, in disclaimer "not a binding quote" phrasing, and in the helpful "manual quote" note (which refers to the owner's reply, not the visitor's number) |

## Requirements Closed

- **QTE-04** (material picker + quantity input from data-driven options) — DONE
- **QTE-05** (price as range never single point + non-dismissable disclaimer + word "quote" reserved) — DONE
- **QTE-06** (pricing-rule Sanity schema, owner-edited without app deploy) — DONE

## Follow-up Items

- **Plan 03-03:** Netlify Function + Resend submission, reCAPTCHA v3 server-verified, DOMPurify if SVG preview is added (QTE-07, QTE-08, QTE-09 server-side).
- **Plan 03-04:** localStorage form-state persistence (QTE-10).
- **Future:** If real owner usage shows "(pricing not configured)" UX is hit often, the helpful note could grow a Sanity-driven copy field; today it's hardcoded copy in QuoteTabs.jsx and MaterialPicker.jsx.
