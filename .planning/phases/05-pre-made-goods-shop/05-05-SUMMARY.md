---
phase: 05-pre-made-goods-shop
plan: 05
subsystem: ui
tags: [shop, detail, snipcart, add-to-cart, sticky, intersection-observer, react-router, sanity, portable-text]

# Dependency graph
requires:
  - phase: 05-pre-made-goods-shop
    provides: ImageGallery shared primitive (Plan 05-02), ShopProvider + SingleProductProvider + useSanityQuery (Plan 05-03), ProductCard + SoldOutBadge + LowStockTag (Plan 05-04), product Sanity schema with images/dimensions/materials/leadTime/processes/stockQuantity (Plan 05-01)
  - phase: 02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub
    provides: SEOHead component, useSanityQuery hook, FAQ portable-text walker idiom, TrustCopyBlock studio-info fallback pattern, dark-only Tailwind palette + ternary token typo
  - phase: 04-vite-migration
    provides: Vite + Vitest harness, build/ output target, browser-only window references safe in lazy chunks
provides:
  - "/shop/:slug product detail page (SHOP-05) — gallery-left + info-right composition with mobile sticky Add-to-Cart bar"
  - "Snipcart-wired Add-to-Cart button (SHOP-06) — full data-item-* contract; data-item-url targets the JSON crawler endpoint at /.netlify/functions/snipcart-validate-product?slug={slug}"
  - "Sold-out / low-stock detail-page state (SHOP-07) — sold-out replaces button with non-button <span>; low-stock renders 'Only N left' inline near price"
  - "ProductSpecTable with omit-empty rows + studio-info.shippingLeadTime fallback chain"
  - "StickyMobileAddToCart driven by IntersectionObserver on the in-content button anchorRef (no scroll listeners)"
  - "Lazy /shop/:slug route in src/App.js, registered between /shop and the catch-all NotFound"
affects: [05-06 (snipcart-validate-product Function — endpoint pointed at by data-item-url), 05-07 (cart drawer CSS), 05-08 (UAT)]

# Tech tracking
tech-stack:
  added: []  # No new npm dependencies — IntersectionObserver is browser-native; pipe-separated categories use vanilla Array.prototype.join
  patterns:
    - "IntersectionObserver-driven sticky UI (first usage in this codebase) — anchor ref owned by parent page, observer effect lives in the sticky leaf, scroll listeners explicitly avoided"
    - "data-item-url targeting Netlify Function JSON crawler endpoint (NOT the SPA route) for Snipcart order validation — RESEARCH Pitfall 1 + Pitfall 2 mitigation"
    - "Sold-out as non-button <span> (not disabled <button>) — Snipcart selector cannot match, semantic correctness preserved"
    - "Plain-text portable-text walker reused from FAQ.jsx — keeps the no-@portabletext/react constraint while accepting Sanity body[] arrays"
    - "Per-page provider stack (ShopProvider → SingleProductProvider → Inner) mirroring ProjectSingle.jsx — providers stay scoped to the page, not lifted to App.js"

key-files:
  created:
    - src/components/shop/ProductHeader.jsx
    - src/components/shop/AddToCartButton.jsx
    - src/components/shop/ProductSpecTable.jsx
    - src/components/shop/StickyMobileAddToCart.jsx
    - src/components/shop/ProductInfo.jsx
    - src/pages/ShopSingle.jsx
  modified:
    - src/App.js  # +1 lazy import, +1 Route entry between /shop and the catch-all

key-decisions:
  - "buttonRef plumbing: useRef created in ShopSingleInner, threaded as `buttonRef` to ProductInfo (which attaches to the in-content button wrapper) AND `anchorRef` to StickyMobileAddToCart (which observes it). Single source of truth; no forwardRef gymnastics. PATTERNS deviation 7 resolved exactly as planned."
  - "Pipe separator on data-item-categories (NOT comma) — verified in bundled output (`join(\"|\")` present in build/assets/ShopSingle-*.js)."
  - "Sold-out branch returns a non-button <span> instead of `<button disabled>` — Snipcart's `.snipcart-add-item` selector cannot match, no purchase action available, slot geometry preserved via matched padding/font tokens."
  - "data-item-url is `${window.location.origin}/.netlify/functions/snipcart-validate-product?slug={slug}` — Plan 05-06 ships the Function in parallel; production validation works once both land. SPA route would silently fail order validation per RESEARCH Pitfall 1."
  - "ProductSpecTable returns null entirely when all three rows would be empty (no dimensions, no materials, no leadTime from either source) — avoids an empty <dl> shell with just the contact-us fallback row."
  - "buttonRef wrapper uses `<div ref={buttonRef} className=\"mb-8\">` rather than attaching the ref directly to the button — keeps the IntersectionObserver target stable across the sold-out vs add-to-cart branch swap inside AddToCartButton."

patterns-established:
  - "Cross-component ref plumbing for IntersectionObserver: parent owns `useRef`, threads to BOTH the observed element wrapper and the observer component. Avoids forwardRef chains."
  - "Sold-out semantic correctness: replace the cart trigger element entirely (button → span), don't disable it. Generalizes to any commerce surface where 'no action available' is meaningfully different from 'disabled because pending'."
  - "data-item-* attribute contract for Snipcart-on-SPA: every attribute that affects validation (id, price, url, image, categories, max-quantity) is JSX-bound to canonical Sanity-projected fields; pipe separator and JSON-crawler URL are non-negotiable per docs.snipcart.com."

requirements-completed: [SHOP-05, SHOP-06, SHOP-07]

# Metrics
duration: 6min
completed: 2026-05-09
---

# Phase 5 Plan 05: /shop/:slug detail page Summary

**Snipcart-wired product detail page with image gallery, sold-out/low-stock state, and IntersectionObserver-driven mobile sticky Add-to-Cart bar at /shop/:slug**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-05-09T14:48:00Z
- **Completed:** 2026-05-09T14:54:00Z
- **Tasks:** 2 (both committed atomically)
- **Files created:** 6
- **Files modified:** 1 (src/App.js — 2-line edit per plan)

## Accomplishments

- `/shop/:slug` is now a fully wired product detail page composing image gallery (left, `lg:w-7/12`), info column (right, `lg:w-5/12`), and a mobile-only sticky footer bar that reveals when the in-content Add-to-Cart button scrolls out of viewport.
- `<button class="snipcart-add-item">` emits the full Snipcart `data-item-*` contract — id, name, price, url, image, description, pipe-separated categories, max-quantity, stackable. `data-item-url` targets the Plan 05-06 JSON crawler endpoint, mitigating the silent SPA-validation-failure pitfall (RESEARCH Pitfall 1 + Pitfall 2).
- Sold-out (CONTEXT D-16) rendered as a static `<span>Sold out</span>` rather than a disabled button — Snipcart's selector cannot match, so the purchase action genuinely doesn't exist on a sold-out detail page. Low-stock renders an inline `Only N left` muted-gray tag near the price (no urgency animations, no accent colors).
- Spec table renders Dimensions / Materials / Ships-in as a `<dl>` grid with omit-empty rows; Materials links cross-link to `/styles#materials` or `/3d-printing#materials` based on each material's `services` tag; lead-time falls back through `product.leadTime` → `studio-info.shippingLeadTime` → contact-us copy.
- Sticky mobile bar uses `IntersectionObserver` on the in-content button's wrapper — first usage of the API in this codebase. No scroll listeners; no animations on appearance (D-16 hard rule).

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the detail-page leaf components (ProductHeader, AddToCartButton, ProductSpecTable, StickyMobileAddToCart)** — `81f8c9f` (feat)
2. **Task 2: Compose ProductInfo + ShopSingle and register the /shop/:slug route** — `e5348ad` (feat)

_No final-metadata commit yet — orchestrator owns the ROADMAP/STATE writes after the wave completes per the parallel-execution prompt._

## Files Created/Modified

### Created

- `src/components/shop/ProductHeader.jsx` (15 lines) — `<h1>` rendering of `product.name` at `font-display font-black text-4xl sm:text-5xl text-primary-light`, mounted inside the right column.
- `src/components/shop/AddToCartButton.jsx` (78 lines) — Snipcart buy-button with the full `data-item-*` attribute contract; sold-out branch returns a non-button `<span>`; `variant="detail"` (in-content) and `variant="sticky"` (mobile bar) class sets defined here so the sticky bar reuses the same component.
- `src/components/shop/ProductSpecTable.jsx` (88 lines) — `<dl>` grid with omit-empty rows; `STUDIO_INFO_QUERY` fetched via `useSanityQuery`; `materialAnchor()` resolves `/styles#materials` vs `/3d-printing#materials`.
- `src/components/shop/StickyMobileAddToCart.jsx` (53 lines) — `IntersectionObserver` on the parent-supplied `anchorRef`; `md:hidden` outer container; renders `AddToCartButton variant="sticky"` next to a truncated name + price line.
- `src/components/shop/ProductInfo.jsx` (75 lines) — Right-column composition; price line with optional `LowStockTag`; sold-out copy line; description; `<div ref={buttonRef}>` wrapping the in-content button (anchor for the IntersectionObserver); plain-text portable-text body via the FAQ.jsx walker; `ProductSpecTable`.
- `src/pages/ShopSingle.jsx` (95 lines) — `<motion.div>` envelope (mirrors ProjectSingle.jsx); provider stack `<ShopProvider><SingleProductProvider>`; `useRef(null)` threaded to ProductInfo + StickyMobileAddToCart; SEO via `<SEOHead>` with first-image og:image at `width(1200)` (or `/og-default.png` fallback).

### Modified

- `src/App.js` (+5 lines net) — Added `const ShopSingle = lazy(() => import('./pages/ShopSingle.jsx'));` after the existing `Shop` lazy import. Added `<Route path="/shop/:slug" element={<ShopSingle />} />` immediately after `<Route path="/shop" element={<Shop />} />` and BEFORE the catch-all `<Route path="*" element={<NotFound />} />` (route order matters for narrative readability even though react-router-v6 doesn't strictly require it).

## Decisions Made

- **Ref plumbing shape (PATTERNS deviation 7).** `useRef(null)` lives in `ShopSingleInner`, threaded as `buttonRef` → `ProductInfo` (which spreads it on a `<div>` wrapper around the in-content `AddToCartButton`) and as `anchorRef` → `StickyMobileAddToCart` (which observes it via `IntersectionObserver`). Wrapping the button rather than attaching the ref to the `<button>` itself keeps the observer target stable across the sold-out vs add-to-cart branch swap inside `AddToCartButton`. PATTERNS resolved this open question; no deviation from the planned shape.
- **Sold-out branch as `<span>` not `<button disabled>`.** Plan + CONTEXT D-16 specify the semantic-correctness intent ("a sold-out item has no purchase action"). Implementation matches: same geometry via matching `px-6 py-3 text-base sm:text-lg` for the detail variant and `px-5 py-2.5` for the sticky variant; `bg-secondary-section-dark text-ternary-light cursor-not-allowed`; `aria-disabled="true"` for screen-reader semantics; no `snipcart-add-item` class so Snipcart's global handler cannot match.
- **Plain-text portable-text body (no @portabletext/react).** ProductInfo's `renderBody()` is the FAQ.jsx idiom with one defensive addition: skip blocks whose joined children string is empty (avoids rendering a `<p>` for empty paragraph blocks). The two `@portabletext/react` mentions in ProductInfo.jsx comments are documentation of WHY the dep is not pulled in — not actual imports (verified by `grep -E "^import.*@portabletext"` returning empty).
- **`window.location.origin` is browser-only safe here.** `ShopSingle` is a lazy route — the chunk is only fetched + evaluated after `<Suspense>` mounts the page, which never happens during SSR (this site is a static SPA; `vite build` doesn't pre-render routes). No `typeof window` guard needed.

## Deviations from Plan

None — plan executed exactly as written. The buttonRef plumbing question PATTERNS deviation 7 flagged as planner-judgment was resolved by the plan itself (`<div ref={buttonRef}>` wrapping the AddToCartButton inside ProductInfo, ref threaded from ShopSingleInner to BOTH ProductInfo and StickyMobileAddToCart). The sticky-bar `useEffect` got one defensive addition (a `typeof IntersectionObserver === 'undefined'` short-circuit), which is a Rule 2 micro-mitigation for old/exotic UA edge cases — matches the spirit of "render null while data resolves" from UI-SPEC §10. Not material enough to log as a tracked deviation.

## Issues Encountered

None during planned work. One environmental note: this worktree was missing `node_modules` after the worktree-base reset — `pnpm install` ran cleanly in 1.6s and the test suite immediately passed (55 tests across 11 files).

## User Setup Required

None for this plan. Plan 05-06 (parallel) ships the `snipcart-validate-product` Function that AddToCartButton's `data-item-url` already targets. Plan 05-07 ships the cart drawer CSS. Plan 05-08 / wave-6 owner-prep covers the Snipcart account + dashboard config.

## Verification

- `pnpm build` → exit 0; `✓ built in 1.32s`; new `build/assets/ShopSingle-*.js` chunk (6.3 KB) shipped.
- `pnpm test` → exit 0; **11 test files pass, 55 tests pass** (no regressions; the ScrollToTop jsdom `window.scrollTo` warning is a pre-existing baseline trace, not a Plan 05-05 issue).
- `grep -c 'name="contact-form"\|name="shop-notify"' build/index.html` → `2` (both Netlify form prerenders survive the Vite build, byte-stable per Phase 2 D-28 / D-23 contracts).
- `grep -o 'join("|")' build/assets/ShopSingle-*.js` → `join("|")` (pipe separator preserved in production bundle, verifying the docs.snipcart.com/v3/setup/products contract).
- `grep -l 'snipcart-validate-product' build/assets/*.js` → `build/assets/ShopSingle-DgzDSmXT.js` (Function-URL targeting in shipped output).
- `grep -E "^import.*@portabletext" src/components/shop/ProductInfo.jsx` → empty (no real `@portabletext/react` import; the only mentions are explanatory comments).
- All Task 1 + Task 2 grep acceptance checks pass (`<h1>`, `font-display font-black`, `snipcart-add-item`, `snipcart-validate-product?slug=`, `processes?.join('|')`, `isSoldOut`, `STUDIO_INFO_QUERY`, `shippingLeadTime`, `/styles#materials`, `IntersectionObserver`, `md:hidden`, `useSingleProduct`, `AddToCartButton`, `ProductSpecTable`, `renderBody`, `ShopProvider`, `SingleProductProvider`, `ImageGallery`, `StickyMobileAddToCart`, `useRef(null)`, `pb-16 md:pb-0`, `ShopSingle = lazy`, `path="/shop/:slug"`).

## Next Phase Readiness

- **Plan 05-06 (`snipcart-validate-product` Function)** — already in flight as the parallel sibling worktree. AddToCartButton's `data-item-url` is coding against the contract; Snipcart's order-validation crawler will hit the live endpoint as soon as both land on the deploy preview. The Function is responsible for returning Sanity-truth `price`, `id`, and `stock` to mitigate Pitfall 2 (DevTools price tampering).
- **Plan 05-07 (Snipcart cart drawer CSS)** — the cart drawer styling is independent of this plan; the Add-to-Cart button itself uses Tailwind classes (`bg-accent hover:bg-accent-highlight`) and is intentionally NOT scoped under `src/css/snipcart.css` (PATTERNS line 277).
- **Plan 05-08 (UAT + owner-prep)** — manual smoke needs at least one published `product` in Sanity (Plan 05-01 owner-prep). With that satisfied, `/shop` → click a card → `/shop/{slug}` should paint immediately. Mobile sticky bar verifies on viewports `<768px`.

## Threat Surface Status

The plan's `<threat_model>` enumerated five threats (T-05-05-01..06). All `mitigate` dispositions are honored in implementation:

- **T-05-05-02 (data-item-url SPA-route silent validation failure):** Mitigated. AddToCartButton constructs `${origin}/.netlify/functions/snipcart-validate-product?slug=${slug}` exclusively. Verified in bundled output.
- **T-05-05-03 (data-item-categories separator):** Mitigated. `processes?.join('|')` in source + `join("|")` in bundled output. Comma form would be a Rule 1 bug; `grep -q "processes\.join(',')" src/components/shop/AddToCartButton.jsx` returns nothing.
- **T-05-05-05 (XSS via portable-text body):** Mitigated. `renderBody()` walks `block.children` and renders the joined text via JSX (auto-escaped). No `dangerouslySetInnerHTML`. Sanity-published bold/italic marks are silently dropped — acceptable per CONTEXT (rich text is a v2 enhancement).

`accept` dispositions (T-05-05-04 Snipcart-side description escaping, T-05-05-06 inventory race) remain as accepted trades per the threat model — no action required this plan.

No new threat surface was introduced. AddToCartButton emits attributes consumed by Snipcart's external CDN-loaded JS, but the trust boundary (Snipcart owns its drawer + checkout pages) is unchanged from CONTEXT D-01 / D-14.

## Self-Check: PASSED

**Files claimed created — verified present:**
- `src/components/shop/ProductHeader.jsx` — FOUND
- `src/components/shop/AddToCartButton.jsx` — FOUND
- `src/components/shop/ProductSpecTable.jsx` — FOUND
- `src/components/shop/StickyMobileAddToCart.jsx` — FOUND
- `src/components/shop/ProductInfo.jsx` — FOUND
- `src/pages/ShopSingle.jsx` — FOUND

**Commits claimed — verified present in git log:**
- `81f8c9f feat(05-05): add /shop/:slug detail-page leaf components` — FOUND
- `e5348ad feat(05-05): compose ProductInfo + ShopSingle and register /shop/:slug` — FOUND

---
*Phase: 05-pre-made-goods-shop*
*Completed: 2026-05-09*
