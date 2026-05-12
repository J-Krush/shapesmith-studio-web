---
phase: 05-pre-made-goods-shop
plan: 03
subsystem: shop-platform-scaffold
tags: [shop, snipcart, sanity, context, scaffold, dark-theme]
dependency_graph:
  requires:
    - "phase 05 plan 01 — 05-PRODUCT-SCHEMA-SPEC.md §4 PRODUCTS_QUERY GROQ projection (verbatim)"
    - "phase 1 useSanityQuery hook (FOUND-01) — { data, loading, error, refetch } contract"
    - "phase 2 ServicesContext.jsx + SingleServiceContext.jsx — structural templates"
    - "phase 2 D-23 + D-28 — Netlify form prerenders in index.html (must remain byte-stable)"
  provides:
    - "index.html — Snipcart preconnects (app + cdn), v3.7.1 stylesheet, async script, #snipcart drawer mount with placeholder data-api-key"
    - "src/css/snipcart.css — 74-line CSS-variable theme overrides scoped to #snipcart for the cart drawer dark theme"
    - "src/index.js — single import line wiring snipcart.css after index.css so the dark theme cascades on top of Snipcart's default stylesheet"
    - "src/context/ShopContext.jsx — ShopProvider + useShop hook, useSanityQuery-backed, PRODUCTS_QUERY mirrors 05-PRODUCT-SCHEMA-SPEC.md §4 verbatim (featured desc, _createdAt desc per D-11)"
    - "src/context/SingleProductContext.jsx — SingleProductProvider + useSingleProduct hook, derives product from useParams().slug + ShopContext.products via useMemo (no second Sanity fetch)"
    - "src/context/ShopContext.test.jsx — vitest smoke test for the useShop hook contract"
  affects:
    - "Plan 05-04 (catalog): can `import { useShop } from '../context/ShopContext'` and start rendering"
    - "Plan 05-05 (detail): can stack <ShopProvider><SingleProductProvider>...</...></...> in ShopSingle.jsx"
    - "Plan 05-06 (snipcart-validate-product Function): not affected — it owns its own simpler GROQ projection"
    - "Plan 05-08 (owner-prep): owns the placeholder→test-key swap + live-key swap on launch"
tech_stack:
  added:
    - "Snipcart v3.7.1 (CDN-loaded JS + CSS, no npm package)"
  patterns:
    - "CSS-variable scoped overrides — single #snipcart selector defines the entire dark-theme palette mapping; cart drawer-only scope (CONTEXT D-14)"
    - "Public-key in source — Snipcart's data-api-key is browser-exposed by design (RESEARCH Pattern 1 / Approach 1); placeholder string until Plan 08 owner-prep substitutes the real test-mode key"
    - "Light TDD — RED smoke test for ShopContext written before implementation; failed with `Failed to resolve import './ShopContext'` then turned green after the file was created"
key_files:
  created:
    - "src/css/snipcart.css (74 LOC, 30+ CSS variable declarations + 2 element-level overrides)"
    - "src/context/ShopContext.jsx (44 LOC)"
    - "src/context/SingleProductContext.jsx (27 LOC)"
    - "src/context/ShopContext.test.jsx (32 LOC, 1 vitest case)"
    - ".planning/phases/05-pre-made-goods-shop/05-03-SUMMARY.md"
  modified:
    - "index.html (+13 lines: 5 Snipcart-related lines + 8-line comment block; both Netlify forms byte-stable)"
    - "src/index.js (+1 line: snipcart.css import after index.css)"
decisions:
  - "Snipcart version pin: v3.7.1 — verified live via `curl -sI` returning HTTP/2 200 on 2026-05-09. Annual revisit calendared in Plan 08 owner-prep per RESEARCH Pitfall 6."
  - "data-api-key value: chose Approach 1 (placeholder `REPLACE_WITH_SNIPCART_TEST_PUBLIC_KEY` deferred to Plan 08) over Approach 2 (insert real test key now). Build still succeeds and the rest of the site is unaffected because Snipcart fails silently (cart drawer just stays empty until a real key is dropped in)."
  - "Indentation in index.html: 2 spaces (matched the existing file's convention; verified before edit via `awk` visualization). Snipcart additions sit at column 4 (under <body>) consistent with the surrounding form blocks."
  - "snipcart.css scope: every CSS variable lives inside a single `#snipcart {` rule, so nothing leaks to the rest of the site. Two element-level rules at the bottom (`#snipcart .snipcart-cart-header h1/h2` and `#snipcart .snipcart__icon--blue/gray`) override font-family + SVG fills since those don't take CSS variables."
  - "ShopContext takes no required prop (PATTERNS deviation 5) — ShopProvider only takes `{ children }`. The shop is its own concept, distinct from Phase 2's per-service ServicesProvider which takes `{ serviceKey, children }`."
  - "SingleProductContext drops the legacy `params.slug ?? params.capability` fallback (PATTERNS deviation 3) — Plan 05's route is `/shop/:slug` only. Slug equality is direct (`p.slug === slug`) since the GROQ projection projects `slug.current` as a string, no `slug?.current` fallback needed."
  - "PRODUCTS_QUERY GROQ kept private to ShopContext.jsx — Plan 05-06's snipcart-validate-product Function owns its own simpler single-product projection (per 05-PRODUCT-SCHEMA-SPEC.md §4)."
metrics:
  duration: "~5 min"
  completed: "2026-05-09"
  tests_added: 1
  tests_total_after: 51
---

# Phase 05 Plan 03: Shop Foundation (Snipcart + Contexts) Summary

Landed the platform-level scaffolding for Phase 5 in three atomic commits: loaded Snipcart's JS+CSS globally from `index.html` with a placeholder public-key, themed the cart drawer to match the dark site via scoped CSS variable overrides, and created the two React contexts (`ShopContext` + `SingleProductContext`) that every downstream shop component will consume. Nothing renders product data yet — this plan is the foundation Plans 04 (catalog) and 05 (detail) build on.

## What Shipped

### Task 1 — Snipcart CDN scripts in `index.html` (`49db8c5`)

Inserted five Snipcart-related elements (preconnects, stylesheet, async script, `#snipcart` drawer mount) AFTER both Netlify form prerenders and BEFORE the React entry script. Both `<form name="contact-form">` and `<form name="shop-notify">` blocks remained byte-stable — `git diff index.html` shows ONLY a 13-line insertion (5 functional lines + 8-line documentation comment) at the expected position. Snipcart `<script>` is `async` per RESEARCH Pattern 1, and `cdn.snipcart.com` preconnect carries `crossorigin` per RESEARCH Example 1.

The `data-api-key` value is the literal placeholder string `REPLACE_WITH_SNIPCART_TEST_PUBLIC_KEY`. Plan 08 owner-prep replaces it with the actual test-mode public API key when the owner is ready; build and the rest of the site work unaffected in the interim.

### Task 2 — `src/css/snipcart.css` + `src/index.js` import (`9ad7177`)

Created `src/css/snipcart.css` (74 LOC) with all CSS variables scoped under a single `#snipcart {` selector — Global, Buttons (Primary + Secondary), Inputs, Links — mapping the site's dark palette tokens (`primary-dark #291c30`, `secondary-dark #102D44`, `ternary-dark #1E3851`, `accent #348bd8`, `accent-highlight #3c6eb1`, `ternary-light #f6f7f8`, `ternary-section-dark #94989c`) to Snipcart's official variable names. Two element-level rules at the bottom override font-family on cart-drawer headers and SVG icon fills (the only two places that don't take CSS variables; both use `!important` only on the SVG fills as required for Snipcart's inline-SVG specificity).

Added `import './css/snipcart.css';` to `src/index.js` immediately after `import './index.css';` so the cascade order puts our overrides on top of Snipcart's default stylesheet (which loads from CDN per Task 1). Vitebuild bundles snipcart.css into `build/assets/index-*.css` — verified `--bgColor-default` and `--color-buttonPrimary` are present in the bundled CSS chunk.

### Task 3 — `ShopContext` + `SingleProductContext` (`5817b23`)

Created the two React contexts that mirror Phase 2's ServicesContext + SingleServiceContext shape:

- `src/context/ShopContext.jsx` (44 LOC): `ShopProvider({ children })` runs `useSanityQuery(PRODUCTS_QUERY)` and exposes `{ products, loading, error, refetch }` via `useShop()`. PRODUCTS_QUERY mirrors 05-PRODUCT-SCHEMA-SPEC.md §4 verbatim — `_type == "product"`, draft-exclusion via `!(_id in path("drafts.**"))`, ordering `featured desc, _createdAt desc` per D-11, and projects `slug` as a string, `processes` as an array of dereffed key strings, `materials` as dereffed material objects with stringified slug, `images` with full alt-text + caption + asset URL, and the `seo` block with `ogImage` URL.

- `src/context/SingleProductContext.jsx` (27 LOC): `SingleProductProvider({ children })` reads `useParams().slug`, pulls `products` from `ShopContext`, and `useMemo`s a single product via `products.find((p) => p.slug === slug)`. Returns `{ product, loading, error }`. MUST be mounted inside a `ShopProvider` (Plan 05's `ShopSingle.jsx` will stack them).

Light TDD: wrote `src/context/ShopContext.test.jsx` (32 LOC) BEFORE the implementation. Initial run failed with `Failed to resolve import './ShopContext'` (RED confirmed); after creating the implementation, the test passed. Full test suite went from 50 → 51 passing.

## Snipcart Version Pin Note

`v3.7.1` was specified in the plan and verified live via `curl -sI https://cdn.snipcart.com/themes/v3.7.1/default/snipcart.js | head -1` returning `HTTP/2 200`. No version drift was needed.

## Deviations from Plan

None of substance. Two minor housekeeping notes:

1. The plan's Task 3 Step 3 suggested writing the smoke test under `src/context/__tests__/ShopContext.test.jsx`, but this codebase uses co-located `*.test.jsx` files (verified via `find src -name "*.test.*"` — every existing test sits next to its source, e.g. `src/hooks/useLocalStorageState.test.jsx`, `src/components/shared/ImageGallery.test.jsx`). Wrote the test at `src/context/ShopContext.test.jsx` to follow project convention. (Rule 3 — convention compliance — but no functional change to the plan's intent.)
2. The plan's CSS sample comment said "verified 2026-05-08"; updated to "verified 2026-05-09" to reflect the actual verification date.

No Rule 1, Rule 2, Rule 4, or auth-gate situations encountered.

## Threat Surface Scan

No new threat surface beyond what 05-03-PLAN.md `<threat_model>` already covers (T-05-03-01 Snipcart CDN tampering — mitigated by version pin; T-05-03-02 public-key disclosure — accepted by design; T-05-03-03 Snipcart CDN DoS — accepted async-load failure mode; T-05-03-04 GROQ injection — n/a, no user input flows into PRODUCTS_QUERY here). No additional flags.

## Verification

- `pnpm build` — clean (✓ built in 1.18s; sitemap.xml regenerated with 7 URLs).
- `pnpm test` — 10 test files, 51 tests passed (50 baseline + 1 new ShopContext smoke test).
- `grep -c "snipcart" build/index.html` → 7 (≥4 required: 2 preconnects + stylesheet + script + drawer mount + 2 in the comment block).
- `grep -c 'name="contact-form"\|name="shop-notify"' build/index.html` → 2 (both Netlify forms intact).
- `grep -c '_type == "product"' src/context/ShopContext.jsx` → 1.
- `grep -c "featured desc, _createdAt desc" src/context/ShopContext.jsx` → 1 (D-11 sort order locked in).
- No `--snipcart-` prefixed variable names in `src/css/snipcart.css` (UI-SPEC §6's wrong names rejected per plan hard rule).

## Self-Check: PASSED

Files exist:
- FOUND: index.html (modified)
- FOUND: src/index.js (modified)
- FOUND: src/css/snipcart.css
- FOUND: src/context/ShopContext.jsx
- FOUND: src/context/SingleProductContext.jsx
- FOUND: src/context/ShopContext.test.jsx
- FOUND: .planning/phases/05-pre-made-goods-shop/05-03-SUMMARY.md (this file)

Commits exist (verified via `git log --oneline aafc7466..HEAD`):
- FOUND: 49db8c5 — feat(05-03): add Snipcart CDN scripts and drawer mount to index.html
- FOUND: 9ad7177 — feat(05-03): add Snipcart cart drawer dark-theme CSS
- FOUND: 5817b23 — feat(05-03): add ShopContext + SingleProductContext for shop data layer
