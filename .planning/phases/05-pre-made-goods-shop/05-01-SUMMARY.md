---
phase: 05-pre-made-goods-shop
plan: 01
subsystem: cms
tags: [sanity, schema, shop, owner-prep, snipcart]

# Dependency graph
requires:
  - phase: 02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub
    provides: "process enum docs (laser, print) reused via product.processes; material doc reused via product.materials; 02-SCHEMA-SPEC.md format precedent for owner-prep docs; print-style.seo block mirrored on product.seo; studio-info.shippingLeadTime as fallback for product.leadTime; image alt-required convention (D-18)"
provides:
  - "Owner-facing Sanity schema spec for the new `product` document type (12 fields covering CONTEXT D-06..D-09)"
  - "GROQ list projection that Plan 05-03 ShopContext.jsx PRODUCTS_QUERY consumes verbatim"
  - "GROQ single-product projection that Plan 05-06 snipcart-validate-product Function consumes verbatim"
  - "Snipcart data-item-* attribute mapping spec (id, name, price, description, image, categories, max-quantity, url) for Plan 05-05's AddToCartButton"
  - "Owner Studio rollout checklist (7 steps ending in `sanity deploy` + Vision verification)"
  - "Hard-rule fence: no customFields, no weight, no currency, alt text required, slug-not-string, processes-references-existing-enum"
affects: [05-03, 05-04, 05-05, 05-06, 05-07, 05-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Owner-prep schema-spec docs live alongside the phase (mirrors Phase 2 02-SCHEMA-SPEC.md location and section structure)"
    - "Schema documents the exact GROQ projections downstream code consumes — schema edits propagate to the spec FIRST, then to consumers"
    - "Snipcart data-item-* attribute contract is a render-time transform of the Sanity schema (no Sanity-side denormalization)"

key-files:
  created:
    - .planning/phases/05-pre-made-goods-shop/05-PRODUCT-SCHEMA-SPEC.md
  modified: []

key-decisions:
  - "description split into short string (≤200 chars, Snipcart cart line item / SEO meta) + body portable text (rich detail-page rendering) per CONTEXT Claude's Discretion"
  - "Image schema = array of object with required altText (Phase 2 D-18); 1–6 ceiling caps gallery growth and detail-page LCP; first image is hero across all consumer paths"
  - "processes references the existing Phase 2 process enum docs (one source of truth across material/faq/product); Snipcart categories are pipe-joined at render time, NOT comma-joined"
  - "Hard fence v1: no customFields (variants are SHOP-09 v2), no weight (flat-rate shipping per D-04), no currency (single-currency USD; Snipcart dashboard owns currency)"
  - "preview block surfaces price + stock state in the Studio list view so owner sees inventory at a glance; orderings expose featured-newest (matches grid) + name-asc"
  - "Spec is decoupled from owner application — Plans 05-03..07 can be coded in parallel; only Plan 05-08 deploy-preview verification is gated on real Sanity data"

patterns-established:
  - "Schema spec doc owns the GROQ projections that downstream code consumes — edits to the schema propagate here first, then to ShopContext PRODUCTS_QUERY and snipcart-validate-product (per 05-01-PLAN frontmatter key_links)"
  - "Owner-prep docs mirror Phase 2 02-SCHEMA-SPEC.md structure (header note → overview → defineType block → field rationale table → GROQ examples → rollout checklist → hard-rule constraints → deviation log)"
  - "Snipcart data-item-categories uses pipe separator (NOT comma) — locked in §5 of the spec, must propagate to AddToCartButton in Plan 05-05"

requirements-completed: [SHOP-04]

# Metrics
duration: 3min
completed: 2026-05-09
---

# Phase 5 Plan 01: Sanity `product` schema spec for owner Studio rollout

**Owner-facing Sanity schema spec for the new `product` document type — 12 fields covering CONTEXT D-06..D-09, with both GROQ projections, the Snipcart `data-item-*` attribute contract, and a 7-step owner rollout checklist.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-09T14:01:37Z
- **Completed:** 2026-05-09T14:05:01Z
- **Tasks:** 1 of 2 complete (Task 2 is an owner-action checkpoint — see "Owner Action Required" below)
- **Files modified:** 1 created, 0 modified

## Accomplishments

- `05-PRODUCT-SCHEMA-SPEC.md` written and committed at `.planning/phases/05-pre-made-goods-shop/05-PRODUCT-SCHEMA-SPEC.md` (395 lines).
- All 12 product fields documented with `defineType` v3 syntax: `name`, `slug`, `description`, `body`, `price`, `stockQuantity`, `featured`, `dimensions`, `leadTime`, `images` (array of object with required altText), `materials` (ref array → material), `processes` (ref array → process), `seo` (object).
- Field-by-field rationale table tying every field back to a CONTEXT decision ID (D-06..D-09) or a Claude's Discretion item.
- Two GROQ projections committed verbatim into the spec — the list query Plan 05-03's `ShopContext` will use and the single-product query Plan 05-06's `snipcart-validate-product` Function will use.
- Snipcart `data-item-*` attribute mapping (8 attributes) with the pipe-separator convention for `data-item-categories` explicitly called out.
- Studio preview block (price + stock state in list view) and orderings block (`featured-newest` matching the `/shop` grid sort, plus `name-asc`).
- Hard-rule fence (no customFields, no weight, no currency, alt-required, slug-not-string, processes-references-existing-enum) so Plans 05-03..07 don't drift into v2 scope.
- Deviation log section reserved (currently empty) for plan-execution deviations.

## Task Commits

1. **Task 1: Write 05-PRODUCT-SCHEMA-SPEC.md** — `1d181e8` (docs)
2. **Task 2: Owner-prep checkpoint — apply schema to Sanity Studio** — paused (owner-action checkpoint, gate=non-blocking; see "Owner Action Required" below)

_Plan metadata commit deferred until Task 2 resolves; this SUMMARY.md is committed alongside the spec to ensure worktree merge preserves both artifacts (#2070)._

## Files Created/Modified

- `.planning/phases/05-pre-made-goods-shop/05-PRODUCT-SCHEMA-SPEC.md` (created, 395 lines) — the owner-facing schema spec. Sections: §1 Overview, §2 `defineType` block, §3 field-by-field rationale table, §4 GROQ examples (list + single-product), §5 Snipcart data-item-* attribute mapping, §6 owner Studio rollout checklist (7 steps ending in `sanity deploy` + Vision verification), §7 hard-rule constraints, §8 deviation log.

## Decisions Made

- **Description model = short string + portable text body.** Locked the Claude's Discretion recommendation: `description` (string, ≤200 chars, used by Snipcart `data-item-description` and meta description) + `body` (portable text, rendered on `/shop/:slug`). Rationale: Snipcart's cart line-item descriptions cap at ~200 chars; rich product copy belongs in portable text.
- **Image schema = array of object (NOT plain image array).** Each item has `asset` (image with hotspot), required `altText`, optional `caption`. Hotspot enabled so `@sanity/image-url` responsive crops respect owner-chosen framing.
- **`images` ceiling = 6.** Caps gallery growth at the schema level — keeps detail-page LCP predictable and the gallery tractable for Plan 05-05's `ServiceGallery`-pattern reuse.
- **`processes` references the existing Phase 2 process enum docs.** Single source of truth across `material`, `faq`, and `product` — owner edits one set of enum docs, the storefront reads `processes[]->key` consistently.
- **Pipe separator (NOT comma) for `data-item-categories`.** Verified against Snipcart docs in CONTEXT (D-09 references the pattern; the spec locks it in §5). Documented explicitly so Plan 05-05's `AddToCartButton` doesn't silently use the wrong separator.
- **`seo` block mirrors Phase 2 `print-style.seo` exactly.** Same `metaTitle` / `metaDescription` / `ogImage` shape so the existing `SEOHead` component pattern applies on `/shop/:slug` without divergent code paths.
- **No `customFields`, no `weight`, no `currency` in v1.** Customised products = SHOP-09 (v2-deferred). Weight = D-04 flat-rate-by-region shipping makes weight unused. Currency = single-USD v1; Snipcart dashboard owns currency.

## Deviations from Plan

None — plan executed exactly as written. Every acceptance criterion in 05-01-PLAN.md `<acceptance_criteria>` was met:

- [x] File exists at the documented path
- [x] Contains a `defineType` block for `name: 'product'`
- [x] Documents all 12 fields from CONTEXT D-06..D-09 (name, slug, description, body, price, stockQuantity, featured, dimensions, leadTime, images, materials, processes, seo)
- [x] `images` field documents 1–6 max, hero-first convention, required `altText` per item
- [x] `processes` documents pipe-separator pattern for Snipcart `data-item-categories`
- [x] Both GROQ queries included (list query + single-product query)
- [x] Owner Studio rollout checklist with 7 ordered steps ending in `sanity deploy` + Vision verification
- [x] Deviation log section header included (currently empty)
- [x] Explicitly notes the no-customFields, no-weight, no-currency constraints with rationale

The plan-defined automated verification command passed:
```bash
test -f .planning/phases/05-pre-made-goods-shop/05-PRODUCT-SCHEMA-SPEC.md \
  && grep -q defineType ... && grep -q stockQuantity ... && grep -q processes ... \
  && grep -q images ... && grep -q altText ... && grep -q featured ... \
  && grep -q leadTime ... && grep -q "Owner Studio rollout" ...
```

## Issues Encountered

None.

## Owner Action Required (Task 2 — non-blocking checkpoint)

**Type:** checkpoint:human-action (gate=non-blocking)

The schema spec is committed and ready for the owner to apply. Task 2 of this plan is an owner-prep gate that resolves with one of two replies:

- **"schema applied"** → owner has copied the schema into the Sanity Studio repo, run `sanity deploy`, and confirmed via Vision query that the test products are returned with all projected fields. Plan 05-08 deploy-preview verification can run end-to-end.
- **"spec approved, schema deferred"** → owner approves the spec but wants Plans 05-03..07 to proceed in parallel while they apply the schema separately. Plans 05-03..07 are coded against the spec — only Plan 05-08's final deploy-preview verification is gated on real product data being live in production Sanity.

The detailed rollout checklist is §6 of `05-PRODUCT-SCHEMA-SPEC.md`. Summary:

1. Add `schemas/product.js` (or `.ts`) to the Sanity Studio repo using §2's `defineType` block.
2. Register in `schemas/index.js`.
3. Run `sanity dev` locally; verify "Product" appears in schema list and "+ Create" menu.
4. Publish 1–2 test products with required fields filled.
5. Run `sanity deploy` to push to production Sanity.
6. Run §4's list query in Sanity Vision against the `production` dataset; confirm test products return with all projected fields.
7. Reply "schema applied" OR "spec approved, schema deferred".

## Known Stubs

None. This plan is documentation-only; no source files were created or modified.

## User Setup Required

The schema must be applied in the Sanity Studio repo (separate from this web repo). See "Owner Action Required" above for the resume protocol. No `.env` changes for this plan — Snipcart env-var setup is owned by Plan 05-07 (webhook) and the cross-cutting owner-prep checkpoint in Plan 05-08.

## Next Phase Readiness

- **Plan 05-02 (cart drawer Tailwind tokens spec)** — independent of `product` schema; can run.
- **Plan 05-03 (ShopContext + grid)** — coded against the spec's §4 list query; runs in parallel with owner application.
- **Plan 05-04..05-05 (filter, card, detail page, AddToCartButton)** — coded against the spec's field set + §5 data-item-* mapping; runs in parallel.
- **Plan 05-06 (snipcart-validate-product Function)** — coded against the spec's §4 single-product query; runs in parallel.
- **Plan 05-07 (snipcart-order-webhook + Resend)** — independent of `product` schema (consumes Snipcart's order payload, not Sanity); can run.
- **Plan 05-08 (deploy-preview verification + UAT)** — gated on Task 2 resolving with "schema applied" so real product cards render end-to-end. If Task 2 resolves with "spec approved, schema deferred", Plan 05-08's UAT step waits for the owner to apply the schema before final sign-off.

## Self-Check: PASSED

- File exists: `.planning/phases/05-pre-made-goods-shop/05-PRODUCT-SCHEMA-SPEC.md` — FOUND
- Commit exists: `1d181e8` — verified via `git log --oneline`
- Automated verification (PLAN.md Task 1 `<verify>`): PASSED
- All 9 acceptance criteria met: YES

---

*Phase: 05-pre-made-goods-shop*
*Plan: 01*
*Completed (Task 1): 2026-05-09*
*Task 2: paused at owner-action checkpoint (non-blocking gate)*
