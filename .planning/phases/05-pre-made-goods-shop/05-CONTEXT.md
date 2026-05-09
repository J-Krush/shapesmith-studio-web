# Phase 5: Pre-Made Goods Shop - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Open `/shop` for real — a catalog of pre-made laser-cut and 3D-printed pieces with end-to-end Snipcart checkout, orders flowing to the owner via Snipcart's default email plus a custom Resend webhook email, owner manually fulfilling each order (USPS Click-N-Ship for labels, ~10 min per order), inventory tracked manually as an integer field on the Sanity `product` document. Phase 5 = REQUIREMENTS.md SHOP-03..07 in full. The platform-decision discovery (SHOP-03) is satisfied by this CONTEXT.md — no separate `PLATFORM-DECISION.md` artifact.

**In scope (whole phase):**
- SHOP-03..07 as written in `.planning/REQUIREMENTS.md`
- New Sanity `product` schema (owner-edits-only) and a written spec the owner applies in Sanity Studio before SHOP-04+ plans run
- A real `/shop` route replacing the existing Coming Soon page (with auto-fallback to the Coming Soon view when `count(*[_type=='product']) == 0`)
- A `/shop/:slug` detail page reusing the `ServiceGallery` component pattern from Phase 2
- Snipcart cart integration with custom dark-theme CSS for the cart drawer (checkout pages stay near-default)
- A `netlify/functions/snipcart-order-webhook` that validates Snipcart's signature, then sends a custom Resend email to the owner (reuses Phase 3 infra)
- Service-tag filter (All / Laser / 3D printed) + featured-first sort on the grid
- Manual inventory model: integer `stockQuantity` on each product, owner edits in Sanity Studio after each sale; storefront derives display state (>threshold = normal, 1≤n≤threshold = "Only N left", 0 = "Sold out + grayed-out card + disabled Add to Cart")

**Out of scope (Phase 5):**
- **SHOP-08** — Customer order history / tracking pages (requires accounts; v2 only per `.planning/REQUIREMENTS.md` §v2 + `.planning/PROJECT.md` §Out of Scope)
- **SHOP-09** — Configurable products (size/material/engraving variants); v2 only
- **Tax automation** — Stripe Tax / TaxJar integration; manual home-state-only handling at launch
- **Shipping automation** — Shippo / EasyPost / weight-based carrier rates; flat-rate-by-region in Snipcart dashboard at launch
- **Restock-notify feature** — sold-out items show "Sold out" cleanly, no per-product email signup; customers use the existing `/contact` form
- **Auto-decrement inventory** — webhook-driven Sanity stock decrement; owner does this manually in Sanity Studio
- **Snipcart v3 inline `<snipcart-checkout>` Web Components** — using Snipcart's hosted checkout pages instead
- **Light mode** (per Phase 1 dark-only commitment)
- **TypeScript / Next.js migration** (per `.planning/PROJECT.md` §Out of Scope)

</domain>

<decisions>
## Implementation Decisions

### Platform + discovery framing (SHOP-03)

- **D-01:** Platform = **Snipcart**. Chosen over Stripe+Sanity and Shopify Storefront. Rationale: 5–15 SKUs at launch with slow growth, $0/month until $500/month revenue (then 2% on top of Stripe's 2.9%+30¢), products live in Sanity (not Snipcart) so a future migration to Shopify Storefront stays reversible. Stripe+Sanity rejected because it requires hand-rolling cart state, checkout UI, and webhook handling we'd otherwise get free from Snipcart. Shopify Storefront rejected because $29/month from day 1 doesn't pencil at this catalog scale and bundles inventory tooling we don't need yet.
- **D-02:** Catalog scale = **5–15 SKUs at launch, slow growth, manual/curated drops**. This is the dominant input to D-01 and D-03; if catalog grows past ~50 SKUs, revisit platform choice.
- **D-03:** Ops model = **Minimal**. *[informational — operational; no code surface, no plan must_have tracks this]* Snipcart owns cart, checkout, payment processing, and customer order-confirmation email. Owner handles physical fulfillment manually: USPS Click-N-Ship for labels (~3 min per label), packaging, dropping off / pickup arrangement, and emailing tracking when applicable. No tax/shipping automation at launch (Stripe Tax + Shippo deferred until 10+ orders/month makes the per-order time savings real).
- **D-04:** Shipping = **Flat-rate by region in Snipcart dashboard** (US, Canada, international "contact us") + **Local pickup at studio** as alternate $0 option at checkout. Rate values are owner discretion; recommend US $9 flat as a starting point.
- **D-05:** SHOP-03 discovery artifact = **this CONTEXT.md**. *[informational — meta-decision about this document; satisfied by the existence of the D-01..D-04 block above; no separate PLATFORM-DECISION.md will be written]* The Snipcart-vs-alternatives rationale, ops model, and shipping model captured in D-01..D-04 satisfy the SHOP-03 acceptance criterion ("a written platform decision exists, backed by SKU-count and ops-preference inputs"). No separate `PLATFORM-DECISION.md` will be written. Plan 05-01 starts on schema work directly.

### Sanity `product` schema (SHOP-04)

- **D-06:** Inventory = **integer `stockQuantity` field** on `product`, owner edits manually in Sanity Studio after each sale. Storefront derives display state: `> low_stock_threshold` = normal display, `1 ≤ n ≤ threshold` = "Only N left" tag near price, `0` = "Sold out" badge + grayed/desaturated card + disabled Add to Cart button. Threshold value is planner discretion (recommend `3`). Choice was deliberate over Snipcart Pro inventory (avoids $20/month) and over a no-tracking model (would break SHOP-07). Auto-decrement-via-webhook explicitly rejected because manual updates match the catalog scale and ops cadence.
- **D-07:** Images = **`images: array of {asset, alt, caption?}`** with 1–6 images per product. **First image is hero**, used by Snipcart's `data-item-image` attribute and as the grid card thumbnail. Detail page reuses the existing `src/components/services/ServiceGallery.jsx` component pattern (or a thin shop-specific wrapper around the same image-gallery primitive). Alt text is required per Phase 2 D-18 (no empty alts, no filename fallbacks).
- **D-08:** Optional fields included on `product`:
  - `dimensions`: string field, owner-formatted (e.g., `"120 × 80 × 30 mm"` or `"4.7 × 3.1 × 1.2 in"`)
  - `materials`: reference array → existing `material` documents (cross-links to materials sections on `/styles` and `/3d-printing`; SEO + educational benefit)
  - `leadTime`: per-product string (e.g., `"Ships in 2–3 business days"`); falls back to a global `studio-info.shippingLeadTime` (Phase 2 D-13 pattern) if empty
  - `featured`: boolean, pins the product to the top of the `/shop` grid
- **D-09:** Service tag = **`processes: array<reference to process>`**, mirroring the Phase 2 `material.processes` pattern (Phase 2 D-06). Supports `[laser]`, `[print]`, or `[laser, print]` for hybrid pieces. GROQ filter pattern: `*[_type=='product' && 'laser' in processes[]->key]`. Keeps the data model consistent with materials — one `process` enum doc serves both `material` and `product` schemas.

### Catalog + detail UX (SHOP-05)

- **D-10:** Card content on `/shop` grid = **image + name + price + sold-out/low-stock badge**. Standard e-commerce shop card. Hero image fills the card, name + price below, availability badge overlays the image when relevant. The card click-target spans the entire card, navigating to `/shop/:slug`.
- **D-11:** Filter + sort = **service-tag filter (All / Laser / 3D printed)** at the top of the grid, defaulting to "All". **Sort = featured-first (D-08 boolean), then `_createdAt` descending**. No price sort, no availability sort, no faceted filtering — over-engineered for catalog scale.
- **D-12:** Detail page (`/shop/:slug`) = **image gallery left, info column right with sticky "Add to Cart" on mobile**. Layout structure:
  - Left/top: `ServiceGallery`-pattern image gallery (or thin shop-specific reuse) showing the `images` array; first image as primary, thumbnails for the rest.
  - Right/below: `name` (display heading) → `price` (large, prominent) → availability badge → short `description` (Snipcart's `data-item-description`, ~200 chars max) → **Add to Cart button** (`<button class="snipcart-add-item" data-item-*>...`) → portable text `body` (rich description) → `dimensions` / `materials` / `leadTime` rendered as a small spec table at the bottom.
  - Sticky behavior: on mobile, the "Add to Cart" button stays visible at the bottom of the viewport when scrolled past.
- **D-13:** Empty state = **if `count(*[_type=='product']) == 0`, `/shop` renders the existing Coming Soon page + `shop-notify` form** (Phase 2 D-23). When 1+ products are published, the page auto-flips to the catalog grid. The Coming Soon view stays committed in the codebase as the empty-state fallback; the `shop-notify` Netlify Form (declared in `index.html` per Phase 2 D-28, post-Phase 4 it's at the repo root not `public/`) stays active as a "still no products on launch day" signup capture.

### Checkout + inventory + order flow (SHOP-06/07)

- **D-14:** Snipcart cart styling = **custom dark-theme CSS for cart drawer** (right-side slide-out), **checkout pages stay near-default Snipcart styling**. Snipcart exposes BEM-style class hooks (`.snipcart-cart-button`, `.snipcart-summary-fees__amount`, etc.) overridable via a separate stylesheet (`src/css/snipcart.css` or a new `@layer` in `src/css/tailwind.css`). Match existing palette tokens (`primary-dark`, `accent`, `accent-highlight`) and GeneralSans / Proxima Nova typography. Checkout pages run on Snipcart's hosted domain — minor visual mismatch acceptable for launch.
- **D-15:** Owner notification = **Snipcart default email** (from Snipcart dashboard config) **+ custom Resend email via `netlify/functions/snipcart-order-webhook`**. The Function:
  - Receives Snipcart's `order.completed` event POST
  - **Validates the Snipcart webhook signature** (Snipcart sends an `x-snipcart-requesttoken` header that must be verified against Snipcart's API per their docs — DO NOT trust raw payloads)
  - Builds a custom-formatted owner email (line items, customer info, shipping address, total, link to Snipcart dashboard) and sends via Resend (reuses Phase 3 Resend account + `RESEND_API_KEY` server env var)
  - Returns 200 to acknowledge; idempotent against retries
  Reuses Phase 3's Netlify Function + Resend infrastructure pattern. ~30–80 LOC in the Function.
- **D-16:** Sold-out display = **badge + grayed-out card + disabled Add to Cart**. Low-stock display = **subtle "Only N left" tag near the price** (no urgency animations, no countdown timers — clean text). Sold-out detail pages still render (good for inbound links + SEO); the Add to Cart button is replaced with a static "Sold out" label in the same spot.
- **D-17:** No restock-notify feature in Phase 5. Sold-out items show "Sold out" cleanly. Customers asking about restocks use the existing `/contact` form. Avoids per-product Netlify Form proliferation and the "restock signup that owner forgets to follow up on" UX failure mode.

### Claude's Discretion

- **Snipcart `data-item-*` attribute mapping** (planner judgment, recommend): `data-item-id` = product slug (stable across name edits), `data-item-name` = `name`, `data-item-price` = `price`, `data-item-url` = `https://shapesmith.studio/shop/{slug}` (Snipcart re-fetches this URL to verify product data — must be publicly reachable on the live site or deploy preview), `data-item-image` = first `images[]` CDN URL via `@sanity/image-url`, `data-item-description` = `description` short string (≤200 chars), `data-item-categories` = comma-joined `processes[]->key` (e.g., `"laser,print"` for hybrid).
- **Description model** (planner judgment, recommend): `description: string` (short, ≤200 chars, Snipcart's cart line-item description) + `body: portable text` (rich detail-page description). Standard pattern.
- **Low-stock threshold value** (D-06) — recommend `3`, planner judges.
- **Snipcart account env var name** — recommend `VITE_SNIPCART_PUBLIC_KEY` (matches Phase 4 env-var convention) for the public API key, set in Netlify dashboard. Server-side webhook validation token (if Snipcart provides one) goes server-side as `SNIPCART_API_SECRET` — NOT prefixed.
- **Cart drawer custom-styling scope** — planner judges which Snipcart class hooks to override; recommend a focused diff against the cart drawer + Add to Cart button only, not the entire cart system.
- **Empty-state implementation** — planner judges whether the "products exist?" check is a build-time GROQ count or a runtime fetch. Runtime fetch is more correct (handles owner publishing a product post-deploy without rebuild) and matches the existing Sanity-fetch idiom (`useSanityQuery`).
- **`ShopContext` shape** — Phase 2 D-04 hard rule: shop gets its own context, NOT a branch in `ServicesContext`. Recommend `ShopContext` (list view) + `SingleProductContext` (detail page) mirroring the Phase 2 `ServicesContext` / `SingleServiceContext` pair, both using `useSanityQuery`.
- **Plan structure / wave count** — planner judgment within natural shipping boundaries. Suggested shape: schema spec → ShopContext + grid + filter → detail page + Snipcart wiring → cart drawer custom CSS → webhook Function → owner-prep + deploy verification. Webhook can ship after the storefront if owner-side Snipcart account setup is the gating item.
- **Dev/test mode → live mode** — Snipcart has a test-mode public key. Planner should structure execution so all wiring happens in test mode first; switching to live mode is an owner-prep / deploy-time toggle, not a code change.
- All decisions D-01..D-17 may be adjusted by the planner if a concrete obstacle is found in the codebase — flag in PLAN.md deviations.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level requirements & roadmap
- `.planning/PROJECT.md` §Active (Bundle 3 description), §Out of Scope (no accounts, no configurable products), §Constraints — tech-stack lock (CRA→Vite-as-of-Phase-4 + React 18 + JS, no TS, no Next), Sanity-anonymous-CDN-reads pattern, Netlify-only hosting + Functions, "looks legit" core value
- `.planning/REQUIREMENTS.md` §Shop (Pre-Made Goods) — SHOP-03..07 (in scope) and §v2 Requirements §Shop Enhancements — SHOP-08, SHOP-09 (explicitly deferred)
- `.planning/ROADMAP.md` §Phase 5 — goal statement and 4 success criteria the planner verifies against
- `.planning/STATE.md` — Phase 4 just-completed (Vite migration); current phase entry

### Phase 1 (foundational patterns to reuse)
- `.planning/phases/01-foundation-refactor-env-pinning/01-CONTEXT.md` — `useSanityQuery` hook contract (every Sanity fetch in Phase 5 MUST use this), `SERVICES` constant shape, dark-only commitment, file-naming conventions

### Phase 2 (load-bearing patterns + hard rules to honor)
- `.planning/phases/02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub/02-CONTEXT.md`:
  - **D-04 hard rule**: shop gets its own `ShopContext` — DO NOT add `if (service === 'shop')` branches inside `ServicesContext`
  - **D-06**: `process` enum doc shape — Phase 5 reuses for `product.processes`
  - **D-11**: photography placeholder strategy — `/shop` cards must degrade gracefully when `images[]` is empty
  - **D-13**: `studio-info` singleton — `leadTime` falls back here per D-08
  - **D-18**: image alt text rules — `product.images[].alt` is required, no empty fallbacks
  - **D-23**: existing `/shop` Coming Soon page + `shop-notify` form — Phase 5 D-13 keeps this as the empty-state fallback
  - **D-28**: Netlify form prerender pattern — `shop-notify` form declaration in `index.html` (post-Phase 4 root, not `public/`); SHOULD STAY
- `.planning/phases/02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub/02-SCHEMA-SPEC.md` — Sanity schema rollout pattern; same approach when `product` schema lands as owner-prep

### Phase 3 (Netlify Function + Resend pattern reused for D-15)
- `.planning/phases/03-auto-pricing-quote-tool/` — Netlify Function structure (`netlify/functions/submit-quote/`), Resend integration, `RESEND_API_KEY` server env var, request validation patterns
- `netlify/functions/submit-quote/submit-quote.js` — concrete reference; the Snipcart order webhook follows the same shape (validate signature → build email payload → POST to Resend)

### Phase 4 (Vite migration — env var conventions)
- `.planning/phases/04-vite-migration/04-CONTEXT.md` does not exist (Phase 4 ran without CONTEXT). Use:
- `.planning/phases/04-vite-migration/04-RESEARCH.md` — env var rename pattern (`process.env.REACT_APP_*` → `import.meta.env.VITE_*`); Snipcart public key follows this convention as `VITE_SNIPCART_PUBLIC_KEY`
- `.planning/phases/04-vite-migration/04-VERIFICATION.md` — current build/runtime baseline

### Codebase ground truth
- `.planning/codebase/STACK.md` — Vite 7 + React 18 + pnpm 9 + Node 20; Vitest for tests
- `.planning/codebase/ARCHITECTURE.md` — current routing layer in `src/App.js`; `/shop` slot exists via lazy route; SPA shape
- `.planning/codebase/INTEGRATIONS.md` — Sanity client config (anonymous CDN, hardcoded projectId), Netlify Forms wiring, Functions directory
- `.planning/codebase/CONVENTIONS.md` — `.jsx` for components/hooks, `.js` for plain modules; `ternary` not `tertiary` token name; existing dark-pair Tailwind convention
- `.planning/codebase/STRUCTURE.md` — file/directory layout; new `src/components/shop/*` and `src/context/Shop*Context.jsx` follow the existing per-feature directory pattern

### External docs (Snipcart-specific)
- Snipcart v3 docs (https://docs.snipcart.com) — buy-button data attributes, cart drawer customization, webhook signature validation, test mode → live mode toggle. Planner / executor reads these directly during implementation; pin specific URLs in PLAN.md as needed.

### Out-of-scope guardrails
- `.planning/REQUIREMENTS.md` §v2 §Shop Enhancements — SHOP-08 (order history; needs accounts), SHOP-09 (configurable products) — NOT in this phase
- `.planning/PROJECT.md` §"Out of Scope" — TypeScript, Next.js, accounts, configurable shop products
- Phase 6+ — anything that automates inventory or scales the catalog past ~50 SKUs

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`src/hooks/useSanityQuery.jsx`** (Phase 1) — `{ data, loading, error, refetch }` + `AbortController` cancellation. Every Sanity fetch in Phase 5 MUST use this hook (`product` list query for `/shop`, single-product query for `/shop/:slug`, empty-state count query).
- **`src/data/services.js`** (Phase 1) — `SERVICES` array. The shop is NOT a service (Phase 2 D-04 hard rule); do NOT add a shop entry. The service-tag filter on `/shop` reads from `product.processes[]->key` directly, not `SERVICES`.
- **`src/components/services/ServiceGallery.jsx`** (Phase 2) — image gallery component used on service detail pages. The `/shop/:slug` detail page should reuse this pattern (D-12). Either import directly or extract a shared `src/components/shared/ImageGallery.jsx` primitive — planner judges based on whether shop-specific behavior diverges (e.g., zoom, lightbox).
- **`src/context/ServicesContext.jsx` + `SingleServiceContext.jsx`** (Phase 2) — the architectural template for `ShopContext` + `SingleProductContext` per D-04 hard rule. Mirror the file structure and the `useSanityQuery`-driven shape; do NOT generalize across services + shop.
- **`src/components/services/ServicesGrid.jsx`** (Phase 2) — pattern for grid layout, responsive breakpoints, card hover states. The `/shop` grid (D-10) should mirror this visual rhythm but with price + availability prominence.
- **`src/components/shared/SEOHead.jsx`** (Phase 2) — per-page SEO. `/shop` and `/shop/:slug` need SEO meta (title, description, og:image from product hero or fallback to `/og-default.png`).
- **`src/utilities/encodeFormData.jsx`** (Phase 2) — used by `Shop.jsx` Coming Soon `shop-notify` form. Stays in scope as long as the empty-state fallback ships.
- **`netlify/functions/submit-quote/submit-quote.js`** (Phase 3) — concrete Netlify Function template; the Snipcart order webhook (D-15) mirrors its shape: read body → validate → call Resend → return 200.
- **`@sanity/image-url`** package (already in `package.json` from Phase 2 D-19) — generate optimized image URLs for `data-item-image`, grid card thumbnails, detail page hero.
- **`react-helmet-async`** (Phase 2) — already wired for SEO on existing routes; reuse on `/shop` and `/shop/:slug`.

### Established Patterns

- **Dark-only theme** (Phase 1): Theme is hard-locked to `dark` class on `<html>` in `src/App.js`. All shop styling uses dark palette tokens (`primary-dark`, `secondary-dark`, `ternary-dark`, `accent`, `accent-highlight`). The `dark:` Tailwind variant prefix is mostly unused (Phase 1 stripped light tokens); honor that convention.
- **`.jsx` for components/hooks, `.js` for plain modules.** New shop files: `src/pages/Shop.jsx` (replaces existing), `src/pages/ShopSingle.jsx` (new), `src/components/shop/*.jsx` (new), `src/context/ShopContext.jsx` + `src/context/SingleProductContext.jsx` (new).
- **Sanity-anonymous-CDN-reads** — `src/utilities/sanityClient.jsx` is the single client; `useCdn: true`; no auth token. Product data MUST come through this path.
- **Token typo `ternary` not `tertiary`** — preserve in any new Tailwind classes.
- **Vite env vars** (Phase 4) — `import.meta.env.VITE_*` for client-exposed; server-side keys (no prefix) read from Netlify Function context. `VITE_SNIPCART_PUBLIC_KEY` follows this convention.
- **Netlify Function pattern** (Phase 3) — `netlify/functions/<feature>/<feature>.js` with `RESEND_API_KEY` available server-side; Function returns plain object with `{ statusCode, body }`. The Snipcart webhook follows this shape.
- **Netlify Form prerender in `index.html`** (Phase 2 D-28, Phase 4-moved to repo root) — `shop-notify` form declaration stays. NO new Netlify Forms added in Phase 5.

### Integration Points

- **`src/App.js`** — `/shop` lazy route exists (Phase 2). Add `/shop/:slug` lazy route. Both wrapped in `<ShopContextProvider>` (or per-page providers — planner judges).
- **`src/components/shared/AppHeader.jsx`** — "Shop" nav link exists (Phase 2). No header changes needed for Phase 5.
- **`index.html`** (repo root post-Phase 4) — Snipcart's JS is loaded here via `<script>` tag with the public key; Snipcart-rendered cart drawer is mounted to a `<div hidden id="snipcart">` element. This is the only HTML-level change Phase 5 makes.
- **`src/css/tailwind.css`** — Snipcart CSS overrides go here (D-14) as a `@layer components` block, OR a new `src/css/snipcart.css` imported once in `src/index.js`. Planner judges.
- **Sanity Studio** — owner-side. The `product` schema spec is owner-prep (Phase 2 D-07 pattern). Plan must include: written `PRODUCT-SCHEMA-SPEC.md` for the owner, a planning checkpoint that confirms the owner has applied the schema before downstream plans run.
- **Netlify dashboard** — env vars: `VITE_SNIPCART_PUBLIC_KEY` (client-exposed, public key from Snipcart dashboard) + `SNIPCART_API_SECRET` (server-side, for webhook validation if Snipcart provides one). `RESEND_API_KEY` already exists from Phase 3.
- **Snipcart dashboard** — owner-prep. Account creation, public key copy, shipping rate configuration (D-04: US flat, Canada flat, international "contact us"; local pickup $0), test mode toggle. Plan must include: a written checkpoint for these owner-prep steps.

</code_context>

<specifics>
## Specific Ideas

- **Catalog scale anchor:** 5–15 SKUs at launch. This is the dominant input that justified Snipcart over Shopify. Decisions D-01, D-03, D-06, D-10, D-11, D-14, D-17 all defer to this scale; if it changes materially, revisit.
- **"Looks legit" core value carries forward** — the cart drawer custom CSS (D-14) is non-negotiable for matching Phase 1's polish bar. A default-styled Snipcart drawer over a dark site would visibly damage the relaunch narrative.
- **Plan 03-03 owner-prep parity** — Plan 04-06 deferred the Netlify dashboard env var rename + Resend domain verification to whenever the dev branch ships. Phase 5's Snipcart owner-prep + `VITE_SNIPCART_PUBLIC_KEY` env var rename can ride on the same dev-branch push, OR happen independently — the planner should call this out in the owner-prep checkpoint.

</specifics>

<deferred>
## Deferred Ideas

- **Restock-notify per-product email signup** — D-17 explicitly defers. Customers use `/contact`. Could ship as a future polish phase if owner sees real demand.
- **Stripe Tax / TaxJar** — D-03 defers tax automation. Revisit when 10+ orders/month makes the per-order time savings real.
- **Shippo / EasyPost weight-based shipping** — D-04 defers carrier-rate automation. Revisit when shipping rate variance per product matters.
- **Snipcart Pro inventory + auto-decrement webhook** — D-06 defers. Adds $20/month and webhook complexity for marginal benefit at this catalog scale.
- **Custom Snipcart v3 `<snipcart-checkout>` Web Components** — D-14 explicitly defers. Snipcart hosted checkout is good enough.
- **Customer order history pages (SHOP-08)** — needs accounts (out of project scope).
- **Configurable products (SHOP-09)** — explicitly v2 only.
- **Light mode** (THEME-01) — Phase 1 dark-only commitment carries forward.
- **`@tailwindcss/forms` plugin string-vs-`require` bug** in `tailwind.config.js:61` — Phase 4 deferred. Probably should be fixed as part of any Phase 5 form work that surfaces it, but doesn't block.
- **Pre-existing CRA-residue follow-ups from Phase 4** — `README.md:16` `--openssl-legacy-provider` mention, `netlify/functions/submit-quote/submit-quote.js:18` stale env-var comment, `CLAUDE.md` GSD-managed-blocks regen. Trivial; can ride on a Phase 5 chore commit if convenient, otherwise stays deferred.

</deferred>

---

*Phase: 05-pre-made-goods-shop*
*Context gathered: 2026-05-08*
