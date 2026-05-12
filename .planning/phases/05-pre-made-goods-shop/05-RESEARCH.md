# Phase 5: Pre-Made Goods Shop — Research

**Researched:** 2026-05-08
**Domain:** E-commerce integration on a Vite + React SPA via Snipcart v3 + Sanity CMS
**Confidence:** HIGH on Snipcart API surface, integration patterns, and codebase fit. MEDIUM on exact current Snipcart CDN version and Pricing FAQ "free below $X" specifics. LOW on nothing material to the plan.

## Summary

CONTEXT.md has already locked the platform (Snipcart), the ops model (manual fulfillment + Sanity-tracked inventory + custom Resend webhook email), and almost the entire UX (UI-SPEC.md is approved). The research goal here is therefore narrow: **answer every Snipcart-integration question the planner needs to write tasks against, and confirm every assumption in CONTEXT.md / UI-SPEC.md is technically achievable on this exact codebase (Vite 7 + React 18 + JSX + Netlify static SPA with no SSR).**

The headline findings:

1. **Snipcart loads as a global script in `index.html`** (after the `#root` mount, before the closing `</body>` is fine; Snipcart auto-creates its own `#snipcart` div and slide-out drawer in our DOM — it is NOT hosted in an iframe). The CDN exposes versioned URLs; v3.7.1 is documented as a pinnable version, but the planner should verify the highest stable version before commit. `[VERIFIED: docs.snipcart.com/v3/setup/installation, docs.snipcart.com/v3/setup/customization]`
2. **`data-item-url` for SPAs MUST point to a JSON endpoint, not the SPA route.** Snipcart's order-validation crawler does an HTTP GET to `data-item-url` before confirming any order; if the response is `Content-Type: application/json` it uses the JSON validator instead of the HTML one. A SPA route returns `index.html` with no product data, which the HTML crawler can't parse. **Recommendation:** ship a `netlify/functions/snipcart-validate-product` Function that takes a slug, fetches the product from Sanity, and returns the JSON shape Snipcart expects — and set `data-item-url` to `/.netlify/functions/snipcart-validate-product?slug={slug}`. This is the Snipcart-blessed pattern for React SPAs. `[VERIFIED: docs.snipcart.com/v3/setup/order-validation, docs.snipcart.com/v2/configuration/json-crawler]`
3. **Custom cart drawer is fully supported via CSS variables** (Snipcart's drawer is rendered into our DOM by Vue under the hood). UI-SPEC's `src/css/snipcart.css` plan with `:root`-scoped CSS custom props is the right shape — but the Snipcart-published variable names are slightly different from what UI-SPEC §6 lists. Use the official names: `--color-buttonPrimary`, `--bgColor-buttonPrimary`, `--color-default`, `--bgColor-default`, `--bgColor-modal`, etc. (full list below). The planner should patch UI-SPEC §6's variable map. `[VERIFIED: docs.snipcart.com/v3/setup/theming, docs.snipcart.com/v3/themes/default/reference]`
4. **Webhook validation is a token-callback (NOT HMAC).** Snipcart sends an `X-Snipcart-RequestToken` header. The Function GETs `https://app.snipcart.com/api/requestvalidation/{token}` and checks `response.ok`. Token is valid for 1 hour. No API key required for the validation endpoint. CONTEXT.md D-15 calls out that the webhook MUST validate this — research confirms the exact pattern. `[VERIFIED: hookdeck.com/webhooks/platforms/guide-to-snipcart-webhooks, docs.snipcart.com/v3/webhooks]`
5. **Inventory: the CONTEXT D-06 manual model is correct.** Snipcart DOES have a built-in "Stock on hand" inventory feature in its dashboard (no Pro tier required as of 2026 per public sources), but using it would create a two-write problem (Sanity stockQuantity vs. Snipcart stock) and contradict CONTEXT D-06's "manual update in Sanity Studio" decision. Stay with the Sanity-only model: render sold-out / low-stock from `product.stockQuantity`, and use `data-item-max-quantity={stockQuantity}` so Snipcart enforces the cap on the cart side too (cheap belt-and-suspenders against double-purchase races).
6. **CRA-residue caveats are gone.** Phase 4 already migrated to Vite + Vitest. `import.meta.env.VITE_*` is the env-var path. There is no `--openssl-legacy-provider` flag anywhere active. `index.html` is at the repo root (NOT `public/`). Netlify Functions are wired via `netlify.toml` `[functions]`. The Phase 3 `submit-quote` function is a copy-paste-friendly precedent for the Snipcart webhook.

**Primary recommendation:** Plan 5 should land in approximately this shape across waves: (W1) `product` schema spec doc + Snipcart account env-var plumbing + `index.html` script tags. (W2) `ShopContext` + `SingleProductContext` + grid + filter + auto-flip empty state. (W3) `/shop/:slug` detail page + `AddToCartButton` + sticky mobile bar + spec table. (W4) `src/css/snipcart.css` cart-drawer theming + cart-count badge in header (optional). (W5) `netlify/functions/snipcart-validate-product` (JSON crawler endpoint — REQUIRED for any non-trivial test buy) + `netlify/functions/snipcart-order-webhook` (Resend email per D-15). (W6) Owner-prep checkpoint + deploy-preview test-mode buy + flip to live.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Render `/shop` catalog | Browser (React SPA) | Sanity CDN | Same pattern as `/styles` — runtime GROQ fetch, no SSR |
| Render `/shop/:slug` detail | Browser (React SPA) | Sanity CDN | Same pattern as `/styles/:slug` |
| Cart drawer UI | Browser (Snipcart Vue inside our DOM) | — | Snipcart owns drawer DOM + state; we own the CSS theme via `:root` vars |
| Add-to-Cart button | Browser (React) | Snipcart JS SDK | React renders `<button class="snipcart-add-item" data-item-*>`; Snipcart's click handler intercepts |
| Cart-count badge in header (optional) | Browser (React) | Snipcart JS SDK | `Snipcart.events.on('item.added', ...)` + `Snipcart.store.getState()` — pure browser |
| Checkout flow | Snipcart hosted (off-domain) | — | CONTEXT D-14: hosted checkout, near-default styling |
| Payment processing | Stripe (under Snipcart) | — | Snipcart proxies Stripe — never our concern |
| **Order validation crawler** | **Netlify Function** | **Sanity** | **JSON crawler endpoint MUST be a server route — `data-item-url` cannot point at the SPA index.html (HTML crawler can't parse it)** |
| Order-completed notification email | Netlify Function | Resend + Snipcart webhook | CONTEXT D-15: webhook validates token → builds custom email → sends via Resend |
| Owner default email confirmation | Snipcart dashboard | — | CONTEXT D-15 explicitly keeps Snipcart's default email AS WELL — no code |
| Inventory truth | Sanity (`product.stockQuantity`) | — | CONTEXT D-06 — manual update by owner; storefront re-renders on next fetch |
| Inventory enforcement at cart | Snipcart | Browser | `data-item-max-quantity={stockQuantity}` — Snipcart enforces the cap mid-checkout |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Snipcart v3 JS + CSS | pin to a specific minor; verify `3.7.x` or higher current stable at planning time via `https://docs.snipcart.com/v3/release-notes` | Cart + checkout + payment platform | CONTEXT D-01 locked. CSS-variable theming requires v3.2.0+ — anything pinned ≥3.5 is safe `[VERIFIED: docs.snipcart.com/v3/setup/theming]` |
| `@sanity/client` | already on project (`^6.1.7` resolved 6.29.1) | GROQ queries for `product` + `studio-info` docs | All Sanity reads in Phase 5 MUST go through `useSanityQuery` (Phase 1 D-15) |
| `@sanity/image-url` | already on project (`^2.1.1`) | Build optimized image URLs for `data-item-image` and grid cards | Already used by `SanityImage.jsx` |
| `react-helmet-async` | already on project (`^2.0.5` — Phase 2 D-19 pin) | `<SEOHead>` on `/shop` and `/shop/:slug` | Already mounted at `App.js:38` |
| `react-icons/fi` | already on project | `FiShoppingCart` for the (optional) header cart-badge icon | Already used by `AppHeader.jsx`, `ContactDetails.jsx` |
| `resend` (Function-local) | match Phase 3 (`netlify/functions/submit-quote/package.json`) | Send custom owner email from `snipcart-order-webhook` | Phase 3 precedent — copy the install pattern verbatim |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Custom `useSanityQuery` hook | already at `src/hooks/useSanityQuery.jsx` | All Sanity fetches | Mandatory — DO NOT inline `sanityClient.fetch` in any Phase 5 component |
| `framer-motion` | already on project (`^10.18.0`) | Optional fade-in on the catalog grid | OPTIONAL — UI-SPEC permits but doesn't require; matches existing `ServiceCard` `motion.div` pattern |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla `<button class="snipcart-add-item">` | `use-snipcart` npm package (colbyfayock) | `use-snipcart` is unmaintained (last release ~3 years ago per npm `[VERIFIED: npmjs.com/package/use-snipcart]`); brings React-context wiring we don't need. Vanilla data-attributes work fine on Vite SPAs as long as Snipcart's script is loaded — **stay vanilla**. |
| `react-snipcart` npm package | — | Same maintenance concern; adds dependency for no measurable win |
| HTML crawler (default) for `data-item-url` | JSON crawler via Netlify Function | HTML crawler hits SPA route → gets `index.html` → no product data → order validation fails. **JSON crawler is the only viable choice for this codebase** `[VERIFIED: docs.snipcart.com/v3/setup/order-validation]` |
| Snipcart built-in "Stock on hand" | Sanity `stockQuantity` field | CONTEXT D-06 locked: Sanity is the truth; avoid two-write problem |

**Installation:**

No new top-level npm packages required for the storefront layer. The Snipcart JS SDK loads from Snipcart's CDN. For the webhook Function:

```bash
# Inside netlify/functions/snipcart-order-webhook/ — same pattern as submit-quote/
cd netlify/functions/snipcart-order-webhook
npm init -y
npm install resend
# (or pnpm install resend if function-local lockfile is preferred — match Phase 3 precedent)
```

Verify the chosen Snipcart version is current at planning time:

```bash
# Spot-check the latest CDN version. CDN URL pattern: https://cdn.snipcart.com/themes/v{X.Y.Z}/default/snipcart.js
curl -I https://cdn.snipcart.com/themes/v3.7.1/default/snipcart.js
# Or check release notes page:
# https://docs.snipcart.com/v3/release-notes
```

**Version verification note:** I cited v3.7.1 from one Snipcart docs page `[CITED: docs.snipcart.com/v3/setup/installation example snippet — "version: '3.7.1'"]` and saw v3.3.0 / v3.3.2 referenced in older third-party tutorials. The exact "highest stable" version moves; the planner MUST visit https://docs.snipcart.com/v3/release-notes immediately before locking the pin. Treat the version number as a parameter the planner sets, not a literal copy from this doc.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Visitor Browser (Vite SPA)                          │
│                                                                       │
│  index.html (loaded once):                                            │
│    ├─ <script type="module" src="/src/index.js">  (React app)        │
│    ├─ <link rel="preconnect" href="https://app.snipcart.com" />      │
│    ├─ <link href="cdn.snipcart.com/themes/v3.x.y/.../snipcart.css">  │
│    ├─ <script async src="cdn.../snipcart.js">                        │
│    └─ <div hidden id="snipcart" data-api-key="${VITE_SNIPCART_PUBLIC_KEY}"> │
│                                                                       │
│  React tree:                                                          │
│    /            → Home                                                │
│    /styles      → ServicesContext + grid                              │
│    /shop        → ShopContext (NEW) → ShopComingSoon | ShopCatalog    │
│    /shop/:slug  → SingleProductContext (NEW) → ShopSingle             │
│                                                                       │
│  Cart drawer: rendered by Snipcart's Vue runtime INTO our DOM         │
│    Themed by src/css/snipcart.css (CSS variables on #snipcart)        │
└────────┬────────────────────────────────────┬───────────────────────┘
         │                                    │
         │ GROQ fetches                       │ click "Add to Cart"
         │ via useSanityQuery                 │ (Snipcart intercepts
         │                                    │  data-item-* attrs)
         ▼                                    ▼
┌────────────────────┐                ┌──────────────────────────────┐
│   Sanity CDN        │                │  Snipcart cart drawer        │
│  apicdn.sanity.io   │                │  (in-DOM, Vue-rendered)      │
│  qx9kep1e/production│                │   ↓ click "Checkout"         │
│  Schemas:           │                │   ↓                           │
│   - product (NEW)   │                │  Snipcart hosted checkout    │
│   - studio-info     │                │  pages (off-domain)          │
│   - process         │                │   ↓                           │
│   - material        │                │   ↓ Stripe                    │
└─────────────────────┘                └────────────┬─────────────────┘
                                                    │
                                       order paid   │  Snipcart server emits:
                                                    │   1. order.completed webhook
                                                    │      → x-snipcart-requesttoken
                                                    │   2. JSON-crawler validation
                                                    │      hits data-item-url
                                                    ▼
                              ┌──────────────────────────────────────────┐
                              │          Netlify Functions                │
                              │  netlify/functions/                       │
                              │   ├─ snipcart-validate-product/           │
                              │   │   GET /?slug=… → fetches Sanity →     │
                              │   │   returns JSON {id, price, url, …}    │
                              │   │   (called BEFORE order confirm)        │
                              │   │                                        │
                              │   └─ snipcart-order-webhook/                │
                              │       POST → validate token via            │
                              │       app.snipcart.com/api/                │
                              │       requestvalidation/{token} → Resend   │
                              │       email to owner                       │
                              └────────────────────┬─────────────────────┘
                                                   │
                                                   ▼
                                       ┌──────────────────────┐
                                       │  Resend API           │
                                       │  RESEND_API_KEY       │
                                       │  (Phase 3 precedent)  │
                                       │  → owner inbox        │
                                       └──────────────────────┘
```

### Recommended Project Structure

```
src/
├── pages/
│   ├── Shop.jsx                     # REPLACE existing — branches on count
│   └── ShopSingle.jsx               # NEW — /shop/:slug
├── components/
│   ├── shop/                        # NEW directory
│   │   ├── ShopComingSoon.jsx       # extracted from current Shop.jsx (preserve byte-for-byte)
│   │   ├── ShopCatalog.jsx
│   │   ├── ShopFilter.jsx
│   │   ├── ProductGrid.jsx
│   │   ├── ProductCard.jsx
│   │   ├── ProductHeader.jsx
│   │   ├── ProductInfo.jsx
│   │   ├── ProductSpecTable.jsx
│   │   ├── AddToCartButton.jsx      # wraps the snipcart-add-item button + sold-out swap
│   │   ├── StickyMobileAddToCart.jsx
│   │   ├── SoldOutBadge.jsx
│   │   └── LowStockTag.jsx
│   └── shared/
│       └── ImageGallery.jsx         # NEW — extracted from ServiceGallery.jsx (refactor target per UI-SPEC §2)
├── context/
│   ├── ShopContext.jsx              # NEW — mirrors ServicesContext shape
│   └── SingleProductContext.jsx     # NEW — mirrors SingleServiceContext shape
└── css/
    └── snipcart.css                 # NEW — cart drawer theme (CSS vars on #snipcart)

netlify/functions/
├── submit-quote/                    # existing (Phase 3)
├── snipcart-validate-product/       # NEW — JSON crawler endpoint
│   ├── snipcart-validate-product.js
│   └── package.json                 # NO deps; uses native fetch + @sanity/client OR raw HTTP
└── snipcart-order-webhook/          # NEW — order.completed → Resend
    ├── snipcart-order-webhook.js
    ├── formatOrderEmail.js          # helper, unit-testable
    └── package.json                 # depends on resend (match submit-quote pattern)

index.html                           # repo root — add Snipcart preconnect + script tags + #snipcart div

src/index.js                         # add `import './css/snipcart.css';` after `./index.css`

src/App.js                           # add /shop/:slug lazy route + lazy import (/shop already exists)

src/components/shared/AppHeader.jsx  # OPTIONAL — add cart-count badge that reads Snipcart store state
```

### Pattern 1: Snipcart Script Loading (Vite + Static SPA)

**What:** Load Snipcart's JS + CSS from CDN once globally in `index.html`. Snipcart's script auto-creates the cart drawer DOM and intercepts clicks on `.snipcart-add-item` buttons anywhere in the page. The `data-api-key` attribute on the `#snipcart` div is read by Snipcart on init.

**When to use:** This is the only viable approach for a Vite SPA — there's no SSR layer to inject the script per-route, and loading Snipcart per-page-mount would require ugly script-tag dance with race conditions.

**Example:**

```html
<!-- index.html (repo root) — add inside <body>, AFTER the #root mount and BEFORE the React entry script -->

<!-- ... existing <div id="root"></div> ... -->
<!-- ... existing two Netlify form prerenders (contact-form, shop-notify) ... -->

<!-- Snipcart cart drawer mount + API key (D-14, planner judgment on env-var inlining mechanism) -->
<div hidden id="snipcart" data-api-key="%VITE_SNIPCART_PUBLIC_KEY%"></div>
<link rel="preconnect" href="https://app.snipcart.com" />
<link rel="preconnect" href="https://cdn.snipcart.com" />
<link rel="stylesheet" href="https://cdn.snipcart.com/themes/v3.7.1/default/snipcart.css" />
<script async src="https://cdn.snipcart.com/themes/v3.7.1/default/snipcart.js"></script>

<!-- existing React entry (LAST) -->
<script type="module" src="/src/index.js"></script>
```

**Vite env-var injection caveat:** Vite does NOT do `%VITE_FOO%` substitution in `index.html` by default the way CRA did with `%PUBLIC_URL%`. There are three viable approaches and the planner picks one:

1. **Hardcode the test-mode public key in `index.html`** for local dev + test-mode deploys, swap to live key on launch via a single edit. Simplest. The Snipcart "public key" IS public (intentionally browser-exposed) so checking it into the repo is not a secret leak. `[VERIFIED: docs.snipcart.com/v3/setup/installation - "public API key"]` (Tradeoff: live-key swap requires a code commit.)
2. **Use Vite's `transformIndexHtml` plugin hook** in `vite.config.js` to interpolate `import.meta.env.VITE_SNIPCART_PUBLIC_KEY` into the HTML at build time. More config but matches Phase 4's env-var convention. `[CITED: vite.dev/guide/api-plugin#transformindexhtml]`
3. **Set `data-api-key` from a tiny inline `<script>` that reads `import.meta.env`** — won't work because `index.html` is plain HTML (no module env access).

**Recommendation:** Approach 1 for Phase 5 — the public key is public, the code-commit trade is honest, and it avoids a vite.config.js change in the same window we're shipping the storefront. Add a comment in `index.html` documenting the test↔live swap procedure. Approach 2 can be a Phase 5.1 polish if it bothers anyone.

`[VERIFIED: docs.snipcart.com/v3/setup/installation, docs.snipcart.com/v3/setup/customization]`

### Pattern 2: ShopContext + SingleProductContext (Mirror Phase 2 Services)

**What:** Two React contexts, one per render shape, both backed by `useSanityQuery`. Phase 2 D-04 hard rule (per CONTEXT canonical_refs): shop gets its OWN contexts, NOT a branch in `ServicesContext`.

**When to use:** Mandatory — this is the codebase's established Sanity-data idiom (`ServicesContext` + `SingleServiceContext` is the template).

**Example:**

```jsx
// src/context/ShopContext.jsx — NEW
import { createContext, useContext } from 'react';
import useSanityQuery from '../hooks/useSanityQuery';

const ShopContext = createContext();

const PRODUCTS_QUERY = `*[_type == "product" && !(_id in path("drafts.**"))]
  | order(featured desc, _createdAt desc){
    _id,
    name,
    "slug": slug.current,
    description,
    body,
    price,
    stockQuantity,
    featured,
    dimensions,
    leadTime,
    "processes": processes[]->key,
    "materials": materials[]->{ _id, name, slug, services },
    images[]{
      altText,
      caption,
      asset->{ _id, url, altText }
    },
    seo{ metaTitle, metaDescription, ogImage{ asset->{ _id, url, altText } } }
  }`;

export const ShopProvider = ({ children }) => {
  const { data, loading, error, refetch } = useSanityQuery(PRODUCTS_QUERY);
  return (
    <ShopContext.Provider value={{ products: data ?? [], loading, error, refetch }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
export default ShopContext;

// Source: mirrors src/context/ServicesContext.jsx verbatim, swapping query + value shape.
```

```jsx
// src/context/SingleProductContext.jsx — NEW
import { createContext, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ShopContext from './ShopContext';

const SingleProductContext = createContext();

export const SingleProductProvider = ({ children }) => {
  const { slug } = useParams();
  const { products, loading, error } = useContext(ShopContext);
  const product = useMemo(
    () => products.find((p) => p.slug === slug),
    [products, slug]
  );
  return (
    <SingleProductContext.Provider value={{ product, loading, error }}>
      {children}
    </SingleProductContext.Provider>
  );
};

export const useSingleProduct = () => useContext(SingleProductContext);
export default SingleProductContext;

// Source: mirrors src/context/SingleServiceContext.jsx
```

**Note on `slug` shape:** `SingleServiceContext.jsx:12-17` carries a defensive fallback for `slug.current` vs raw string from an old query shape — Phase 5's GROQ projects `"slug": slug.current` as a string (matching `generate-sitemap.cjs:30`), so `SingleProductContext` does NOT need that fallback.

### Pattern 3: Add-to-Cart Button (Snipcart data-attributes from React)

**What:** A plain `<button>` with `class="snipcart-add-item"` and `data-item-*` attributes. Snipcart's global click handler intercepts the click, reads the attributes, validates the order against the `data-item-url` JSON crawler endpoint, and adds to cart.

**When to use:** Every product page + (optionally) grid card "quick add". UI-SPEC §8 already specifies the detail-page variant.

**Example:**

```jsx
// src/components/shop/AddToCartButton.jsx — NEW
import { urlAt } from '../../utilities/sanityImage';

const AddToCartButton = ({ product, variant = 'detail' }) => {
  const { slug, name, price, description, stockQuantity, processes, images } = product;
  const isSoldOut = stockQuantity === 0;

  if (isSoldOut) {
    // D-16 — replace button with static span so the slot doesn't reflow
    return (
      <span
        className={
          variant === 'sticky'
            ? 'bg-secondary-section-dark text-ternary-light px-5 py-2.5 rounded-md cursor-not-allowed font-general-medium flex-shrink-0'
            : 'inline-block bg-secondary-section-dark text-ternary-light px-6 py-3 rounded-md cursor-not-allowed font-general-medium text-base sm:text-lg'
        }
        aria-disabled="true"
      >
        Sold out
      </span>
    );
  }

  const heroImage = images?.[0];
  const imageUrl = heroImage?.asset
    ? urlAt(heroImage, 800)
    : 'https://shapesmith.studio/og-default.png';

  // CRITICAL: data-item-url MUST be the JSON crawler endpoint (Pattern 4 below),
  // NOT the SPA route — Snipcart's order-validation crawler hits this URL and
  // expects JSON when Content-Type is application/json. A SPA route returns
  // index.html and validation fails. See Pitfall 1.
  const validateUrl = `${window.location.origin}/.netlify/functions/snipcart-validate-product?slug=${slug}`;

  const baseClasses =
    variant === 'sticky'
      ? 'snipcart-add-item bg-accent hover:bg-accent-highlight text-white font-general-medium px-5 py-2.5 rounded-md flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed'
      : 'snipcart-add-item bg-accent hover:bg-accent-highlight text-white font-general-medium px-6 py-3 rounded-md text-base sm:text-lg duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto';

  return (
    <button
      className={baseClasses}
      data-item-id={slug}
      data-item-name={name}
      data-item-price={Number(price).toFixed(2)}
      data-item-url={validateUrl}
      data-item-image={imageUrl}
      data-item-description={description ?? ''}
      data-item-categories={processes?.join('|') ?? ''}
      data-item-max-quantity={stockQuantity}
      data-item-stackable={stockQuantity > 1 ? 'auto' : 'never'}
    >
      Add to Cart
    </button>
  );
};

export default AddToCartButton;

// Source: data-item-* attribute names verified against
// docs.snipcart.com/v3/setup/products. data-item-categories uses pipe separator
// (NOT comma — UI-SPEC §8 uses comma; planner should patch UI-SPEC).
```

**Key data-attribute confirmations** `[VERIFIED: docs.snipcart.com/v3/setup/products]`:

- `data-item-id` — STRING, required, must be unique per product. Use the slug. **If two buttons on the page share an id but differ in price, validation fails — relevant only if you ever render the same product twice with different state.**
- `data-item-price` — NUMBER, required, decimal separator MUST be `.` (not locale-dependent).
- `data-item-url` — STRING, optional since v3.2.2 BUT effectively required for any non-trivial test buy because Snipcart's crawler validates against it before confirming order. **Defaults to `window.location.href` if omitted — this would point at the SPA route and break validation.** Always set it explicitly to the JSON crawler endpoint.
- `data-item-image` — STRING, full absolute URL. Sanity CDN URLs work.
- `data-item-description` — STRING, displayed in cart line item. ≤200 chars per UI-SPEC.
- `data-item-categories` — STRING, **pipe-separated** (`"laser|print"`), NOT comma. UI-SPEC §8 line uses comma — planner should fix.
- `data-item-max-quantity` — INTEGER, Snipcart prevents adding more than this to cart. Pairing with `stockQuantity` gives belt-and-suspenders inventory enforcement.
- `data-item-stackable` — `"auto"` (default, stack identical items), `"never"` (always-separate lines), or `"always"`. With no variants in v1, `"auto"` is correct.
- `data-item-weight` — INTEGER grams. CONTEXT D-04 says flat-rate shipping in dashboard, so weight is NOT required. Add it if/when shipping rules ever depend on weight (out of scope).
- `data-item-taxable` — BOOLEAN, default `true`. Leave default.
- `data-item-shippable` — BOOLEAN, default `true`. Leave default unless we add a digital good.

### Pattern 4: JSON Crawler Validation Endpoint (Required for SPA)

**What:** A Netlify Function that takes a `slug` query param, fetches the product from Sanity, and returns a JSON object Snipcart's order-validation crawler can verify the cart against.

**When to use:** ALWAYS for this codebase. The HTML crawler can't read `index.html` and find the product data — the data is fetched after JS runs.

**Example:**

```js
// netlify/functions/snipcart-validate-product/snipcart-validate-product.js — NEW
//
// Snipcart JSON crawler endpoint. Called by Snipcart's order-validation server
// BEFORE confirming any order. Snipcart compares the response JSON against the
// data-item-* attributes that came from the cart; if they don't match, the order
// is rejected. This is the SPA-safe alternative to the HTML crawler.
//
// Set Content-Type: application/json so Snipcart routes to the JSON validator
// (NOT the HTML crawler).
//
// Required JSON fields per docs.snipcart.com/v3/setup/order-validation:
//   id    — must equal data-item-id from the buy button
//   price — must equal data-item-price
//   url   — must equal data-item-url
//   (name + image optional but recommended for parity)
//
// This Function does NOT require auth — it's intentionally public-readable;
// Sanity's own anonymous CDN access is what's protecting the data anyway.

const SANITY_PROJECT = 'qx9kep1e';
const SANITY_DATASET = 'production';
const API_VERSION = '2023-06-16';

exports.handler = async (event) => {
  const slug = event.queryStringParameters?.slug;
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return { statusCode: 400, body: 'Missing or invalid slug' };
  }

  const groq = encodeURIComponent(
    `*[_type=="product" && slug.current==$slug][0]{
      "id": slug.current,
      name,
      price,
      description,
      stockQuantity,
      "image": images[0].asset->url
    }`
  );
  const params = encodeURIComponent(JSON.stringify({ slug }));
  const url =
    `https://${SANITY_PROJECT}.apicdn.sanity.io/v${API_VERSION}/data/query/${SANITY_DATASET}` +
    `?query=${groq}&%24slug=%22${encodeURIComponent(slug)}%22`;

  let result;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { statusCode: 502, body: 'Sanity fetch failed' };
    }
    const json = await res.json();
    result = json.result;
  } catch (e) {
    console.error('Sanity fetch failed:', e);
    return { statusCode: 502, body: 'Sanity unreachable' };
  }

  if (!result) {
    // Product was unpublished after the customer added it to cart — refuse the order.
    return { statusCode: 404, body: 'Product not found' };
  }

  // Snipcart REQUIRES `url` field in the JSON response to match the data-item-url
  // sent in the cart. We reconstruct it.
  const baseUrl = process.env.URL || `https://${event.headers.host}`;
  const productUrl = `${baseUrl}/.netlify/functions/snipcart-validate-product?slug=${slug}`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: result.id,
      name: result.name,
      price: Number(result.price),
      url: productUrl,
      description: result.description ?? '',
      // image is non-required but parity helps Snipcart's catalog views
      ...(result.image && { image: result.image }),
      // Stock guard — if the product is sold out, refuse purchase by setting
      // stock to 0 in the response. (Belt-and-suspenders with data-item-max-quantity;
      // catches the race where stock changed in Sanity between cart-add and checkout.)
      stock: result.stockQuantity,
    }),
  };
};

// Source: docs.snipcart.com/v3/setup/order-validation, docs.snipcart.com/v2/configuration/json-crawler
```

**Why this matters more than it sounds:** Without this endpoint, you can wire up a perfectly-styled storefront, customer adds to cart, customer clicks "Checkout" — and Snipcart silently fails order validation because the HTML crawler hits `/shop/some-thing` and gets back the index.html shell with no `<button class="snipcart-add-item" data-item-id="some-thing">`. The customer experience is "checkout button does nothing" with no clear error. Plan this Function in W1 or W2 — DO NOT defer to a later wave.

### Pattern 5: Webhook Signature Validation (Order-Completed Email)

**What:** When an order completes, Snipcart POSTs to our webhook URL with `X-Snipcart-RequestToken` header. Function validates by GETting `https://app.snipcart.com/api/requestvalidation/{token}` — `response.ok` (2xx) means valid. No HMAC, no API key required for this validation endpoint.

**When to use:** CONTEXT D-15 — every order generates a custom Resend email to the owner. Without token validation, anyone could POST a fake order to our webhook.

**Example:**

```js
// netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js — NEW
//
// CONTEXT D-15: order.completed → validate token → build owner email → Resend.
// Mirrors netlify/functions/submit-quote/submit-quote.js shape.

const { Resend } = require('resend');
const formatOrderEmail = require('./formatOrderEmail');

const resend = new Resend(process.env.RESEND_API_KEY);
const FETCH_TIMEOUT_MS = 5000;
const MAX_BODY_BYTES = 50 * 1024; // 50KB ceiling for an order payload

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  if (event.body && event.body.length > MAX_BODY_BYTES) {
    return { statusCode: 400, body: 'Payload too large' };
  }

  // 1. Validate Snipcart token. Header is lowercased by Netlify.
  const token = event.headers['x-snipcart-requesttoken'];
  if (!token) {
    return { statusCode: 401, body: 'Missing token' };
  }
  try {
    const verifyRes = await fetchWithTimeout(
      `https://app.snipcart.com/api/requestvalidation/${encodeURIComponent(token)}`
    );
    if (!verifyRes.ok) {
      return { statusCode: 401, body: 'Invalid token' };
    }
  } catch (e) {
    console.error('Token verify failed:', e);
    // Fail-closed — if Snipcart is unreachable we'd rather drop the email than
    // accept forged payloads. Snipcart retries webhooks on non-2xx responses,
    // so an outage replays the email send when it recovers.
    return { statusCode: 502, body: 'Verification unavailable' };
  }

  // 2. Parse + filter event types. We only care about order.completed.
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }
  if (payload.eventName !== 'order.completed') {
    // Acknowledge other event types but don't email — Snipcart sends many event
    // types; we only opted into order.completed in dashboard config, but be
    // defensive in case dashboard is misconfigured.
    return { statusCode: 200, body: 'OK (ignored event)' };
  }

  // 3. Send Resend email to owner with full order info.
  try {
    await Promise.race([
      resend.emails.send({
        from: 'Shapesmith Studio <orders@shapesmith.studio>',
        to: ['jkrush@shapesmith.studio'],
        reply_to: payload.content?.email ?? 'noreply@shapesmith.studio',
        subject: `[Order ${payload.content?.invoiceNumber ?? '???'}] ${payload.content?.itemsCount ?? '?'} item(s) — $${payload.content?.finalGrandTotal ?? '?'}`,
        text: formatOrderEmail(payload.content),
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Resend timeout')), FETCH_TIMEOUT_MS)
      ),
    ]);
  } catch (e) {
    console.error('Resend send failed:', e);
    // Snipcart retries on 5xx — return 200 + log to avoid email storm if Resend
    // is intermittently flaky. (Trade: a single send failure means missed email;
    // mitigated by Snipcart's own default email which CONTEXT D-15 keeps active.)
    console.error('Order received but email failed — Snipcart dashboard has full record:', payload.content?.invoiceNumber);
    return { statusCode: 200, body: 'OK (email send failed; logged)' };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  };
};

// Source: hookdeck.com/webhooks/platforms/guide-to-snipcart-webhooks (validation pattern),
//   docs.snipcart.com/v3/webhooks (header name, validation endpoint URL).
```

```js
// netlify/functions/snipcart-order-webhook/formatOrderEmail.js — NEW
// Pure function — unit-testable. Builds plain-text email body from the order payload.

const formatOrderEmail = (order) => {
  if (!order) return 'Order data missing — see Snipcart dashboard.';

  const lines = [];
  lines.push(`New order: ${order.invoiceNumber}`);
  lines.push(`Total: $${order.finalGrandTotal} (${order.itemsCount} item${order.itemsCount === 1 ? '' : 's'})`);
  lines.push('');
  lines.push('Customer:');
  lines.push(`  ${order.billingAddress?.fullName ?? 'unknown'}`);
  lines.push(`  ${order.email ?? 'no email'}`);
  if (order.phone) lines.push(`  ${order.phone}`);
  lines.push('');
  lines.push('Ship to:');
  const ship = order.shippingAddress ?? order.billingAddress ?? {};
  lines.push(`  ${ship.fullName ?? ''}`);
  lines.push(`  ${ship.address1 ?? ''}${ship.address2 ? ` ${ship.address2}` : ''}`);
  lines.push(`  ${ship.city ?? ''}, ${ship.province ?? ''} ${ship.postalCode ?? ''}`);
  lines.push(`  ${ship.country ?? ''}`);
  lines.push('');
  lines.push(`Shipping method: ${order.shippingMethod ?? 'n/a'} ($${order.shippingFees ?? 0})`);
  lines.push('');
  lines.push('Items:');
  for (const item of order.items ?? []) {
    lines.push(`  - ${item.quantity}× ${item.name} — $${item.totalPrice}`);
    if (item.description) lines.push(`      ${item.description}`);
  }
  lines.push('');
  lines.push(`Dashboard: https://app.snipcart.com/dashboard/orders/${order.token}`);
  return lines.join('\n');
};

module.exports = formatOrderEmail;
```

**Owner-prep for the webhook (planner must include in checkpoint):**
1. Snipcart dashboard → Webhooks → Add endpoint: `https://shapesmith.studio/.netlify/functions/snipcart-order-webhook`
2. Subscribe to: `order.completed` only (avoid noise from other events).
3. Owner enables Snipcart's default order email in dashboard so they get TWO emails (default + custom). CONTEXT D-15 explicitly keeps both — the custom one has the studio's preferred formatting, the default is a safety net.

`[VERIFIED: docs.snipcart.com/v3/webhooks (header + validation URL); hookdeck.com guide (sample Node.js code, response.ok check)]`

### Pattern 6: Snipcart Cart-Drawer Theme via CSS Variables

**What:** Snipcart v3.2.0+ exposes a comprehensive set of CSS custom properties scoped under `#snipcart`. Override them in `src/css/snipcart.css` to theme the drawer. UI-SPEC §6 has the right intent but the wrong variable names.

**When to use:** CONTEXT D-14 — cart drawer dark-themed, checkout pages near-default.

**The official Snipcart variable names** `[VERIFIED: docs.snipcart.com/v3/setup/theming]`:

```css
/* src/css/snipcart.css — NEW. Imported once in src/index.js after './index.css'. */

#snipcart {
  /* ─── Global ─── */
  --color-default: #f6f7f8;          /* body text inside the cart */
  --color-alt: #94989c;              /* secondary text (timestamps, sub-totals labels) */
  --color-icon: #f6f7f8;             /* SVG icon fill */
  --color-success: #22c55e;
  --color-error: #f87171;
  --color-info: #348bd8;             /* matches accent */
  --bgColor-default: #1E3851;        /* ternary-dark — primary drawer surface */
  --bgColor-alt: #102D44;            /* secondary-dark — header + summary fees block */
  --bgColor-modal: #291c30;          /* primary-dark — overlay backdrop */
  --bgColor-modalVeil: rgba(41, 28, 48, 0.85);

  /* ─── Buttons (Primary = checkout / Add-to-Cart on Snipcart side) ─── */
  --color-buttonPrimary: #ffffff;
  --bgColor-buttonPrimary: #348bd8;             /* accent */
  --borderColor-buttonPrimary: transparent;

  --color-buttonPrimary-hover: #ffffff;
  --bgColor-buttonPrimary-hover: #3c6eb1;       /* accent-highlight */
  --borderColor-buttonPrimary-hover: transparent;

  --color-buttonPrimary-active: #ffffff;
  --bgColor-buttonPrimary-active: #3c6eb1;

  --color-buttonPrimary-focus: #ffffff;
  --bgColor-buttonPrimary-focus: #348bd8;
  --shadow-buttonPrimary-focus: 0 0 0 2px rgba(52, 139, 216, 0.4);

  --color-buttonPrimary-disabled: #f6f7f8;
  --bgColor-buttonPrimary-disabled: #94989c;

  /* ─── Buttons (Secondary = "Continue shopping") ─── */
  --color-buttonSecondary: #f6f7f8;
  --bgColor-buttonSecondary: transparent;
  --borderColor-buttonSecondary: #94989c;
  --color-buttonSecondary-hover: #f6f7f8;
  --bgColor-buttonSecondary-hover: #102D44;
  --borderColor-buttonSecondary-hover: #94989c;

  /* ─── Inputs (cart-side qty stepper, coupon code) ─── */
  --color-input: #f6f7f8;
  --bgColor-input: #291c30;
  --borderColor-input: #94989c;
  --color-inputLabel: #94989c;
  --color-inputIcon: #f6f7f8;

  /* ─── Links inside cart ─── */
  --color-link: #348bd8;
  --color-link-hover: #3c6eb1;

  /* Font family — match the rest of the site */
  font-family: 'GeneralSans-Regular', sans-serif;
}

/* ─── Element-level overrides where CSS variables don't reach ─── */
/* Snipcart's heading element doesn't use a variable for font-family; override directly. */
#snipcart .snipcart-cart-header h1,
#snipcart .snipcart-cart-header h2 {
  font-family: 'Proxima Nova', 'GeneralSans-Regular', sans-serif;
  font-weight: 900;
}

/* SVG icons that Snipcart inlines with hard-coded fills require !important. */
#snipcart .snipcart__icon--blue,
#snipcart .snipcart__icon--gray {
  color: var(--color-default) !important;
}
```

**UI-SPEC §6 corrections the planner must apply:**

| UI-SPEC §6 says | Actual Snipcart variable name | Source |
|----------------|------------------------------|--------|
| `--snipcart-color-primary` | `--color-buttonPrimary` (or `--color-link` depending on context) | docs.snipcart.com/v3/setup/theming |
| `--snipcart-color-default` | `--color-default` | same |
| `--snipcart-bgcolor-default` | `--bgColor-default` (camelCase, no `snipcart-` prefix) | same |
| `--snipcart-bgcolor-modal` | `--bgColor-modal` | same |
| `--snipcart-font-default` | (no variable — use the parent element rule on `#snipcart`) | same |

This is ONLY a variable-naming patch. The UI-SPEC color values + scope decision (drawer + Add-to-Cart only, checkout near-default) are correct and stay locked.

`[VERIFIED: docs.snipcart.com/v3/setup/theming, support.snipcart.com/t/theming-via-css-variables-is-not-applying-changes-to-my-cart]`

### Pattern 7: Optional Cart-Count Badge in Header

**What:** Subscribe to Snipcart events to show a count next to a `FiShoppingCart` icon in `AppHeader.jsx`.

**When to use:** OPTIONAL polish — UI-SPEC doesn't require it. If the planner adds it, do so in a small late-wave plan.

**Example:**

```jsx
// Inside AppHeader.jsx — additive, optional
import { useEffect, useState } from 'react';
import { FiShoppingCart } from 'react-icons/fi';

const useSnipcartCart = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.Snipcart) {
      // Snipcart hasn't loaded yet — register a one-shot ready listener.
      const onReady = () => {
        setCount(window.Snipcart.store.getState().cart.items.count);
        const unsub = window.Snipcart.store.subscribe(() => {
          setCount(window.Snipcart.store.getState().cart.items.count);
        });
        return unsub;
      };
      document.addEventListener('snipcart.ready', onReady);
      return () => document.removeEventListener('snipcart.ready', onReady);
    }
    setCount(window.Snipcart.store.getState().cart.items.count);
    return window.Snipcart.store.subscribe(() => {
      setCount(window.Snipcart.store.getState().cart.items.count);
    });
  }, []);
  return count;
};

const CartButton = () => {
  const count = useSnipcartCart();
  return (
    <button
      className="snipcart-checkout relative"
      aria-label={`Cart (${count} items)`}
    >
      <FiShoppingCart className="text-xl" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
          {count}
        </span>
      )}
    </button>
  );
};
```

**Note:** `class="snipcart-checkout"` on a button is Snipcart's documented way to open the cart drawer — Snipcart's global click handler picks it up. Alternatively, programmatic open: `window.Snipcart.api.theme.cart.open()`. `[VERIFIED: docs.snipcart.com/v3/sdk/api]`

### Anti-Patterns to Avoid

- **Inline `useEffect + sanityClient.fetch` for product data.** Phase 1 D-15 / FOUND-01 closed this anti-pattern. ALL Sanity reads in Phase 5 go through `useSanityQuery`.
- **Setting `data-item-url` to the SPA route (`/shop/{slug}`).** This will silently break order validation in production. Always point at the JSON crawler endpoint. (Pitfall 1.)
- **Loading the Snipcart script via `useEffect` on a single page.** Race conditions with the cart drawer outliving page unmounts; complicates the cart-count subscription. Load globally in `index.html`.
- **Storing cart state in React Context.** Snipcart owns cart state. Reading it via `Snipcart.store` is fine; mirroring it into our state is duplication that drifts.
- **Using `react-snipcart` or `use-snipcart` npm packages.** Both unmaintained as of 2025-2026 per npm registry. Vanilla data-attribute pattern works without them.
- **Branching `ServicesContext` to include products.** Phase 2 D-04 hard rule. Shop has its own context.
- **Skipping the JSON crawler endpoint and assuming "test buys work without it".** Test buys in Snipcart's test mode DO crawl the URL. Skipping the Function will surface as silent test-buy failures during W6 verification, blocking launch.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cart UI (drawer, line items, qty steppers) | A custom React drawer with focus-trap + ARIA dialog | Snipcart's drawer — themed via CSS variables | Snipcart's drawer is built (v3.2+), accessible, and free. Custom drawer = at least 2-3 days of focus-trap + scroll-lock + ARIA work for parity. |
| Checkout UI (address forms, payment) | Custom forms backed by Stripe SDK | Snipcart hosted checkout | Stripe Elements + tax calc + address validation + saved cards = weeks of work. CONTEXT D-01 already locked this. |
| Cart state management | React Context syncing line items | `window.Snipcart.store.getState()` + `.subscribe()` | Snipcart's Vuex-like store IS the source of truth. Mirroring it into React state guarantees drift. |
| Webhook signature validation | HMAC verification (it's not HMAC anyway) | Token-callback to `app.snipcart.com/api/requestvalidation/{token}` | Snipcart specifically uses token-callback — there's no shared secret to HMAC against. |
| Product image responsive `srcSet` | Custom resize endpoint | Existing `SanityImage.jsx` + `@sanity/image-url` | Already in production for `/styles` and `/3d-printing` — Phase 2 D-19. |
| Email sending | SMTP / SES / sendgrid | Resend (Phase 3 precedent) | Already vetted, account exists, `RESEND_API_KEY` already in Netlify env. |
| Inventory tracking | Database / Snipcart Pro / build-time JSON | Sanity `product.stockQuantity` integer | CONTEXT D-06 locked. Owner-friendly, no DB to operate. |
| Tax calc | Stripe Tax / TaxJar | Snipcart dashboard manual rules | CONTEXT D-03 explicitly defers tax automation. |
| Carrier shipping rates | Shippo / EasyPost | Flat-rate in Snipcart dashboard + `$0` "Local pickup" method | CONTEXT D-04 explicitly defers carrier rates. Snipcart supports a $0 flat-rate method by leaving weight ranges empty `[VERIFIED: docs.snipcart.com/v3/setup/shipping]`. |
| OG-image generation per product | Cloudinary / dynamic OG image API | Sanity image at `width(1200)` via `@sanity/image-url` | UI-SPEC §12 already specifies this. |

**Key insight:** the only "ecommerce thing" we're hand-rolling in Phase 5 is the JSON-crawler endpoint and the order-completed Resend email. Everything else (cart, checkout, payment, customer email, dashboard, refunds, abandoned cart) is Snipcart. That's the entire reason CONTEXT D-01 chose Snipcart over Stripe+Sanity.

## Common Pitfalls

### Pitfall 1: SPA `data-item-url` validation failure

**What goes wrong:** You wire up `<button class="snipcart-add-item" data-item-url={`https://shapesmith.studio/shop/${slug}`} ...>`. Test mode in DevTools "works" — item lands in cart. Customer clicks "Checkout" in Snipcart's drawer. Snipcart's order-validation server fetches `https://shapesmith.studio/shop/some-slug`, gets back the SPA's `index.html` (no product data, no `<button class="snipcart-add-item" data-item-id="some-slug">`), and rejects the order. Customer sees a confusing "We couldn't validate this order" message, you can't reproduce locally because dev-mode skips validation.

**Why it happens:** Snipcart's HTML crawler scans the response for an element matching `data-item-id`. SPA responses are post-JS-render — the crawler doesn't execute JS. `[VERIFIED: docs.snipcart.com/v3/setup/order-validation]`

**How to avoid:** Ship `netlify/functions/snipcart-validate-product` (Pattern 4). Set `data-item-url` to the Function URL. Snipcart sees `Content-Type: application/json` and uses the JSON validator. The JSON shape (id, price, url, ...) must match the data-item-* values from the cart.

**Warning signs:** Test-mode buys in Netlify deploy preview that "succeed" client-side but show "Order validation failed" in Snipcart dashboard order log; live-mode buys that fail silently; cart drawer button greys out without a clear error message.

`[VERIFIED: docs.snipcart.com/v3/setup/order-validation, docs.snipcart.com/v2/configuration/json-crawler]`

### Pitfall 2: Snipcart price tampering (browser DevTools)

**What goes wrong:** A visitor opens DevTools, edits `data-item-price` from `45.00` to `0.01` on the Add-to-Cart button, clicks Add. The cart shows the tampered price. They check out for $0.01 + shipping.

**Why it happens — and why it doesn't matter once Pattern 4 is shipped:** The JSON crawler endpoint returns the SERVER-SIDE truth (price from Sanity). Snipcart compares the cart's `data-item-price` to the JSON crawler's returned `price`. Mismatch → order rejected at validation step. **Without the JSON crawler endpoint, with `data-item-url` pointed at the SPA route, the tamper succeeds.** This ties Pitfall 1 and Pitfall 2 together: shipping the JSON crawler endpoint mitigates both.

**How to avoid:** Pattern 4. The JSON crawler endpoint is the price-truth boundary. Sanity is the data source, the Function projects price into the JSON crawler response, Snipcart re-validates on every cart confirm.

**Warning signs:** Same as Pitfall 1 — successful test-mode purchases at unexpected prices visible only in Snipcart dashboard.

`[VERIFIED: docs.snipcart.com/v3/setup/order-validation - "we will scan the HTML output ... [or] use the JSON validator"]`

### Pitfall 3: Snipcart token-validation latency on every webhook

**What goes wrong:** Snipcart's webhook validation requires a network round-trip to `app.snipcart.com/api/requestvalidation/{token}` for EACH webhook (no HMAC). Your Function is a sync function (10s Netlify ceiling). If Snipcart's API is slow (or down for 30s mid-deploy), every webhook 502s; Snipcart retries; eventually your Function logs are full of timeouts.

**Why it happens:** Token-callback is by design — there's no shared secret. `[VERIFIED: hookdeck.com/webhooks/platforms/guide-to-snipcart-webhooks - "every webhook your endpoint receives requires an additional HTTP request"]`

**How to avoid:** Use `AbortController` + `setTimeout` (5s timeout, mirrors Phase 3 Pitfall 10) on the validation fetch. Fail-closed (return 401 if validation can't complete) so forged payloads can't slip through during an outage. Snipcart retries failed webhooks for ~24h, so a 30s outage replays once recovered.

**Warning signs:** Function timeout errors in Netlify logs; missed owner emails; delayed but eventually-sent emails when Snipcart catches up retries.

### Pitfall 4: Vite env-var injection into `index.html` is not automatic

**What goes wrong:** You write `<div id="snipcart" data-api-key="%VITE_SNIPCART_PUBLIC_KEY%">`, expecting Vite to substitute. Vite doesn't — it has its own `transformIndexHtml` API for that, and CRA's `%PUBLIC_URL%` precedent doesn't carry over. The `data-api-key` literally contains the string `%VITE_SNIPCART_PUBLIC_KEY%` in production, Snipcart fails to initialize, cart silently doesn't work.

**Why it happens:** Vite's HTML processing is opt-in via `transformIndexHtml`. `[CITED: vite.dev/guide/api-plugin#transformindexhtml]`

**How to avoid:** Pattern 1 Approach 1 — hardcode the public key in `index.html` (it's public-by-design), with a comment explaining the test↔live swap. Document this in the owner-prep checkpoint. Approach 2 (vite plugin) is fine but adds a vite.config.js change in the same window we're shipping the storefront — defer to a polish phase.

**Warning signs:** Snipcart drawer renders empty / "Invalid API key" in the browser console; the literal `%VITE_SNIPCART_PUBLIC_KEY%` string appearing in the rendered page source.

### Pitfall 5: Inventory race between cart-add and check-out

**What goes wrong:** Owner has 1 unit of "stockQuantity 1" in Sanity. Two visitors land on `/shop/some-thing` and click Add to Cart simultaneously — each one's `data-item-max-quantity={1}` ALLOWS the add (qty=1 each). Both proceed to checkout. The JSON crawler endpoint doesn't currently return the second visitor "stock=0" until owner manually decrements in Sanity. Both orders complete; owner has to refund one.

**Why it happens:** CONTEXT D-06 chose manual decrement. The JSON crawler endpoint can return `stock` based on Sanity's current value, but that value doesn't auto-decrement on order.

**How to avoid:** This is an accepted CONTEXT-D-06 trade. At 5–15 SKUs and slow growth, dual-purchases-of-1-unit are rare; owner refunds and apologizes. Mitigation if it becomes a pain: the `snipcart-order-webhook` Function can patch Sanity stockQuantity (requires a Sanity write token + auth, which CONTEXT D-06 explicitly defers as Snipcart-Pro-tier-equivalent complexity). NOT in Phase 5 scope; flag in the post-Phase-5 deferred-ideas list.

**Warning signs:** Owner reporting needing to refund duplicate buys; only an issue at higher catalog velocity than CONTEXT D-02 scopes for.

### Pitfall 6: Snipcart pinned version goes stale; CDN URL 404s

**What goes wrong:** You pin `https://cdn.snipcart.com/themes/v3.7.1/default/snipcart.js` in `index.html`. Two years later, Snipcart removes that CDN version (their CDN policy). Site breaks for everyone.

**Why it happens:** Snipcart support has confirmed individual CDN versions can be retired. `[CITED: support.snipcart.com/t/cdn-for-v3-3-0-returning-404]` — there's a forum thread of v3.3.0 returning 404.

**How to avoid:** Document the version pin in `index.html` with a comment ("Pinned 2026-05-08 to v3.7.x; check release notes annually") and set a calendar reminder for the owner to revisit yearly. Alternative: pin to a major (`v3.x.x`) — Snipcart's docs USE this pattern but it gives up reproducibility.

**Warning signs:** "Snipcart is undefined" errors in the browser console; cart drawer never appears.

### Pitfall 7: `data-item-categories` separator confusion

**What goes wrong:** UI-SPEC §8 specifies `processes.join(',')` (comma). Snipcart docs say pipe (`|`). The categories show up as a single category named `"laser,print"` instead of two categories `["laser", "print"]`. Order analytics in Snipcart dashboard miscategorize; not user-visible but messes up reporting.

**Why it happens:** Comma is a natural choice but Snipcart's parser splits on `|`. `[VERIFIED: docs.snipcart.com/v3/setup/products - "data-item-categories='cat1|cat2|cat3'"]`

**How to avoid:** Use `.join('|')` in `AddToCartButton.jsx`. Patch UI-SPEC §8 in the same plan.

**Warning signs:** Snipcart dashboard category filter doesn't separate orders by laser vs 3d-print.

### Pitfall 8: ImageGallery refactor scope creep

**What goes wrong:** UI-SPEC §2 recommends extracting `ServiceGallery.jsx` → `ImageGallery.jsx` shared primitive. The refactor touches `ServiceGallery.jsx`, the two pages that use it, and the new `ShopSingle.jsx`. If executed mid-storefront-wave, a regression in `/styles/:slug` or `/3d-printing/:slug` reads as "Phase 5 broke the existing site." Scope contagion blocks the storefront wave's success criteria.

**How to avoid:** The planner should sequence the ImageGallery refactor as its OWN small plan, EITHER (a) early in Phase 5 before the detail-page wave so `ShopSingle.jsx` consumes the new primitive natively, OR (b) as a follow-up polish AFTER the detail page ships using a copy of the gallery code (accepting one round of duplication). Option (a) is cleaner; option (b) is lower-risk. Planner judges based on appetite for touching `/styles` regression risk in a shop window.

**Warning signs:** A wave plan that simultaneously refactors `ServiceGallery.jsx` AND ships the storefront detail page — high coupling, hard to roll back if either breaks.

### Pitfall 9: Snipcart event subscription before script loads

**What goes wrong:** You import `Snipcart` directly in a React component and try to subscribe to events on first render. `window.Snipcart` is undefined because the async script hasn't loaded. Cart-count badge shows 0 forever.

**Why it happens:** `<script async>` doesn't block render; React tree mounts before Snipcart finishes initializing.

**How to avoid:** Listen for the `document.addEventListener('snipcart.ready', ...)` event before subscribing to the store, OR check `window.Snipcart` truthiness in a polled `useEffect`. Pattern 7 above shows the correct shape. `[VERIFIED: docs.snipcart.com/v3/sdk/events - "snipcart.initialized"]`

**Warning signs:** Cart badge stuck at 0; console errors `Cannot read properties of undefined (reading 'store')`.

### Pitfall 10: Stale Phase 4 deferred — README + comment cleanup

**What goes wrong:** CONTEXT.md `<deferred>` lists three Phase 4 carry-overs (`README.md:16` `--openssl-legacy-provider` mention, `submit-quote.js:18` stale env-var comment, `CLAUDE.md` GSD-managed-blocks regen). They're "trivial" but if shipped in a Phase 5 chore commit, they touch files unrelated to the storefront and pollute the diff. If NOT shipped, they linger and a future onboarder is confused.

**How to avoid:** Planner discretion — either (a) bundle them in a single chore commit at end of Phase 5 with explicit `[chore]` prefix, OR (b) leave deferred and explicitly call out in Phase 5 SUMMARY.md "Pre-existing CRA-residue still deferred." Don't sneak them into a feature commit.

## Code Examples

### Example 1: `index.html` Snipcart additions

```html
<!-- index.html (repo root) — ADD AFTER existing <div id="root"></div> and AFTER both
     existing Netlify form prerenders. BEFORE the React entry script. -->

<!-- Snipcart cart drawer mount + public API key.
     Pinned to v3.7.1 (verified 2026-05-08 via docs.snipcart.com/v3/release-notes;
     re-verify on annual revisit per Pitfall 6).
     The data-api-key is intentionally public — Snipcart's "public API key" is
     browser-exposed by design. Live-mode key replaces the test-mode key here at
     launch (see owner-prep checkpoint). -->
<div hidden id="snipcart" data-api-key="REPLACE_WITH_TEST_MODE_PUBLIC_KEY"></div>
<link rel="preconnect" href="https://app.snipcart.com" />
<link rel="preconnect" href="https://cdn.snipcart.com" crossorigin />
<link rel="stylesheet" href="https://cdn.snipcart.com/themes/v3.7.1/default/snipcart.css" />
<script async src="https://cdn.snipcart.com/themes/v3.7.1/default/snipcart.js"></script>

<!-- Existing React entry — STAYS LAST -->
<script type="module" src="/src/index.js"></script>
```

### Example 2: Sanity GROQ for `/shop` list

```js
// Inside src/context/ShopContext.jsx — see Pattern 2 above for full file.
//
// Filter draft documents (`!(_id in path("drafts.**"))`) — defensive, Sanity's
// public CDN already returns published-only by default but this projection is
// explicit and matches the existing services pattern.
//
// Order: featured DESC (true first), then _createdAt DESC (newest first) per D-11.

const PRODUCTS_QUERY = `*[_type == "product" && !(_id in path("drafts.**"))]
  | order(featured desc, _createdAt desc){
    _id,
    name,
    "slug": slug.current,
    description,
    body,
    price,
    stockQuantity,
    featured,
    dimensions,
    leadTime,
    "processes": processes[]->key,
    "materials": materials[]->{ _id, name, "slug": slug.current, services },
    images[]{
      altText,
      caption,
      asset->{ _id, url, altText }
    },
    seo{ metaTitle, metaDescription, ogImage{ asset->{ _id, url, altText } } }
  }`;

// Source: shape mirrors src/context/ServicesContext.jsx SERVICES_QUERY (lines 10-17)
// with product-specific fields. asset->{_id, url, altText} dereference matches
// existing SanityImage compatibility.
```

### Example 3: `Shop.jsx` empty-state branch

```jsx
// src/pages/Shop.jsx — REPLACE existing
import { lazy, Suspense } from 'react';
import { ShopProvider, useShop } from '../context/ShopContext';
import SEOHead from '../components/shared/SEOHead';

const ShopComingSoon = lazy(() => import('../components/shop/ShopComingSoon'));
const ShopCatalog = lazy(() => import('../components/shop/ShopCatalog'));

const ShopRouter = () => {
  const { products, loading } = useShop();
  // Loading state — match site convention (UI-SPEC §10): render null while
  // useSanityQuery's data === null. Once products is an array (even empty),
  // we know the fetch resolved.
  if (loading) return null;
  return products.length === 0 ? <ShopComingSoon /> : <ShopCatalog products={products} />;
};

const Shop = () => (
  <ShopProvider>
    <SEOHead
      title="Shop"
      description="Pre-made laser-cut and 3D-printed pieces from Shapesmith Studio, ready to take home."
      ogUrl="https://shapesmith.studio/shop"
      ogImage={{ url: '/og-default.png', altText: 'Shapesmith Studio' }}
    />
    <Suspense fallback={null}>
      <ShopRouter />
    </Suspense>
  </ShopProvider>
);

export default Shop;

// Source: composition pattern mirrors src/pages/Projects.jsx + UI-SPEC §9 auto-flip rule.
// SEO mounts at the route level so both branches inherit; no SEO duplication.
```

### Example 4: `ShopSingle.jsx` route addition + `App.js` patch

```jsx
// src/App.js — patches around the existing /shop route (line ~77)

// Add lazy import at top alongside others:
const ShopSingle = lazy(() => import('./pages/ShopSingle'));

// Replace the existing /shop route block with:
<Route path="/shop" element={<Shop />} />
<Route path="/shop/:slug" element={<ShopSingle />} />

// Source: lazy import + Suspense wrapping pattern matches lines 15-22; ShopProvider
// stays inside Shop.jsx (NOT lifted to App.js) because /shop/:slug ALSO mounts its
// own ShopProvider in ShopSingle.jsx — see Pattern 2 / SingleProductContext gets
// products from ShopContext.
```

### Example 5: `ShopSingle.jsx` shape

```jsx
// src/pages/ShopSingle.jsx — NEW
import { ShopProvider } from '../context/ShopContext';
import { SingleProductProvider, useSingleProduct } from '../context/SingleProductContext';
import SEOHead from '../components/shared/SEOHead';
import ProductHeader from '../components/shop/ProductHeader';
import ProductInfo from '../components/shop/ProductInfo';
import ImageGallery from '../components/shared/ImageGallery';
import StickyMobileAddToCart from '../components/shop/StickyMobileAddToCart';
import { urlAt } from '../utilities/sanityImage';

const ShopSingleInner = () => {
  const { product, loading } = useSingleProduct();
  if (loading) return null;
  if (!product) return null; // 404-equivalent; route catch-all in App.js handles real /shop/typo

  const ogImage = product.images?.[0]?.asset
    ? { url: urlAt(product.images[0], 1200), altText: product.images[0].altText ?? product.name }
    : { url: '/og-default.png', altText: 'Shapesmith Studio' };

  return (
    <>
      <SEOHead
        title={product.name}
        description={product.description}
        ogUrl={`https://shapesmith.studio/shop/${product.slug}`}
        ogImage={ogImage}
      />
      <section className="container mx-auto px-4 py-12 sm:py-24 mt-12 sm:mt-24">
        <div className="lg:flex lg:gap-12">
          <div className="lg:w-7/12">
            <ImageGallery
              images={product.images ?? []}
              placeholderCaption="Photo coming soon"
            />
          </div>
          <div className="lg:w-5/12 mt-8 lg:mt-0">
            <ProductHeader product={product} />
            <ProductInfo product={product} />
          </div>
        </div>
      </section>
      <StickyMobileAddToCart product={product} />
    </>
  );
};

const ShopSingle = () => (
  <ShopProvider>
    <SingleProductProvider>
      <ShopSingleInner />
    </SingleProductProvider>
  </ShopProvider>
);

export default ShopSingle;

// Source: provider-stack pattern mirrors src/pages/ProjectSingle.jsx.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Snipcart v2 templating (`templatesUrl`) | v3 CSS-variable theming | v3.2.0 (~2020) | UI-SPEC §6's approach is correct; just patch variable names |
| `react-snipcart` / `use-snipcart` npm wrappers | Vanilla data-attributes | npm community shifted ~2022 | Both packages are unmaintained; vanilla is simpler |
| Snipcart HTML crawler for SPAs | JSON crawler endpoint | Snipcart docs explicitly recommend this for React/Vue/Nuxt SPAs | Without it, SPA storefronts silently fail at order validation |
| HMAC webhook signing (Stripe convention) | Token-callback validation | Snipcart never used HMAC | Required network round-trip per webhook; document the timeout strategy |
| `--openssl-legacy-provider` Node flag | Native Node 20 (post-Phase 4 Vite) | Phase 4 commit 9c91c5d | Phase 5 is on the modern build; ignore the flag in research |

**Deprecated/outdated:**
- Snipcart v2 — fully deprecated; v3 is the current line. CONTEXT references "Snipcart v3" throughout.
- React Helmet (non-async) — Phase 2 D-19 already pinned `react-helmet-async@2.0.5`.
- `process.env.REACT_APP_*` — Phase 4 closed this; `import.meta.env.VITE_*` only.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Snipcart's "free below $X" tier exists with $1k/month threshold + $20/mo flat fallback | Summary — paragraph 5 | The pricing landing page returned 404 during research; cited from third-party recap. Owner needs to verify pricing in their Snipcart dashboard during account setup before committing. **Verify in W6 owner-prep checkpoint.** |
| A2 | The current stable Snipcart CDN version is v3.7.x | Pattern 1, Example 1 | Version moves frequently; use whatever is current per release-notes page at planning time. Mitigated by Pitfall 6's explicit verification step. |
| A3 | Snipcart's webhook validation endpoint does NOT require API-key auth (unauthenticated GET works) | Pattern 5 | Verified via third-party (hookdeck.com) blog post and Snipcart support forum, but not directly stated in docs.snipcart.com response shape. **First webhook test in W5 will fail loudly if wrong; cheap to fix.** |
| A4 | Snipcart's order-completed webhook payload puts the order data under `payload.content` with fields `invoiceNumber`, `finalGrandTotal`, `itemsCount`, `email`, `billingAddress`, `shippingAddress`, `items[]`, `token` | Pattern 5 (formatOrderEmail.js) | Field shape is documented across multiple Snipcart support threads but not pinned to a single canonical reference. **Test webhook in W5 will reveal exact shape; planner should check the first received webhook payload in Netlify logs and adjust formatOrderEmail.js if needed.** |
| A5 | The Snipcart "public API key" can safely be hardcoded in the committed `index.html` | Pattern 1 / Example 1 | Verified across Snipcart's installation docs (it's BROWSER-EXPOSED by design — distinct from "secret API key"). LOW risk. |
| A6 | `data-item-categories` uses `|` separator, NOT comma | Pattern 3 / Pitfall 7 | Verified in docs.snipcart.com/v3/setup/products. UI-SPEC §8 has the wrong separator — confirmed and called out. LOW risk. |
| A7 | Vite does NOT auto-substitute `import.meta.env.VITE_*` into `index.html` placeholders | Pitfall 4 | Vite's docs explicitly require `transformIndexHtml` plugin or `define` config. Verified. LOW risk; just need to call it out. |
| A8 | Snipcart's `Snipcart.store.subscribe` API exists and is the cart-state-subscription pattern | Pattern 7 | Mentioned in docs.snipcart.com/v3/sdk/api but not in detail in research output. Pattern 7 is OPTIONAL — if the API has changed, the cart-count badge feature can be skipped without affecting Phase 5 success criteria. LOW risk. |

## Open Questions (RESOLVED)

1. **Should the planner extract `ImageGallery.jsx` BEFORE the detail-page wave, or duplicate the gallery code now and refactor later?**
   - What we know: UI-SPEC §2 recommends extraction. `ServiceGallery.jsx` consumes `useSingleService()` context, which doesn't fit `/shop/:slug`.
   - What's unclear: whether the refactor risk to `/styles/:slug` and `/3d-printing/:slug` outweighs the duplication tax.
   - Recommendation: extract first. The ServiceGallery JSX is ~50 LOC, modal/lightbox state is local — no cross-cutting context coupling. A focused refactor plan with a smoke test against /styles/lattice and /3d-printing/{first-print-slug} keeps the regression cheap. Extract Wave 0 → consume in detail-page wave.
   - RESOLVED: Plan 02 extracts ImageGallery as Wave 1 refactor ahead of the detail-page wave; smoke-tested against /styles/:slug and /3d-printing/:slug.

2. **Test-mode → live-mode toggle: code commit or env-var swap?**
   - What we know: Snipcart provides separate test and live public API keys. CONTEXT D-17 (claude's discretion) recommends the toggle is "owner-prep + env-var swap, not a code change."
   - What's unclear: We chose Pattern 1 Approach 1 (hardcoded key in `index.html`) which makes the toggle a code commit. Compatible with CONTEXT but adds a commit step at launch.
   - Recommendation: hardcode the test key now, document the live-key swap as a single-line code edit + commit message in the W6 owner-prep checkpoint. If owner objects to "code commit at launch", planner ships approach 2 (`vite.config.js` `transformIndexHtml`) as a small follow-up.
   - RESOLVED: Plan 03 hardcodes the Snipcart TEST public key in index.html. The test↔live swap is a single-line code edit captured in Plan 08 §F launch checklist (owner-prep). vite.config.js transformIndexHtml deferred as a possible Phase 5.1 polish.

3. **OG image strategy — fall back to `/og-default.png` when product has no image, or use a generic shop-banner OG image?**
   - What we know: UI-SPEC §12 picks `/og-default.png` (Phase 2 wordmark) for `/shop` landing and per-product hero for `/shop/:slug` (with `/og-default.png` fallback for products with no image).
   - What's unclear: Nothing — UI-SPEC is locked.
   - Recommendation: ship as UI-SPEC §12 specifies.
   - RESOLVED: Ship as UI-SPEC §12 specifies — /og-default.png for the /shop landing; per-product hero with /og-default.png fallback on /shop/:slug. Implemented by Plans 04 (catalog) and 05 (detail).

4. **Should the cart-count badge in `AppHeader.jsx` be Phase 5 or a follow-up polish?**
   - What we know: UI-SPEC doesn't mention it. CONTEXT doesn't require it. Pattern 7 is "optional polish".
   - What's unclear: whether the owner cares about visible cart-state in the header.
   - Recommendation: defer to a follow-up plan after Phase 5 success criteria are met. Storefront-shipping is the bar; header polish is a quality-of-life improvement.
   - RESOLVED: Cart-count badge DEFERRED — not in any Phase 5 plan. Tracked as a possible follow-up polish after Phase 5 success criteria are met.

5. **Inventory "stock=0 in JSON crawler response" — is `stock` a Snipcart-honored field or just informational?**
   - What we know: Pattern 4's example includes `stock: result.stockQuantity` in the crawler JSON. Snipcart's docs list required fields (id/price/url) but `stock` is NOT in the documented JSON-validator schema.
   - What's unclear: whether Snipcart actually enforces a `stock` field in the JSON crawler response, or whether it ignores it and the only stock guard is `data-item-max-quantity` on the buy button.
   - Recommendation: include `stock` in the crawler response defensively. The primary stock enforcement is `data-item-max-quantity={stockQuantity}` on the button; the crawler-side check is secondary. If Pitfall 5 shows up in real usage, planner can revisit by adding a Sanity-write webhook in a Phase 6.
   - RESOLVED: Plan 06 includes `stock` in the snipcart-validate-product JSON crawler response defensively (UI-SPEC §12 + Plan 06 must_haves). Primary stock guard remains `data-item-max-quantity` on the AddToCartButton. Snipcart account pricing tier is verified during Plan 08 §F owner-prep account setup.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite + Netlify Functions | ✓ | 20 (per `.nvmrc` and `netlify.toml`) | — |
| pnpm | install + build | ✓ | 9.0.0 (per `packageManager` field) | — |
| Vite | dev server + build | ✓ | 7.3.3 (per package.json) | — |
| Vitest | tests | ✓ | 4.1.5 | — |
| `@sanity/client` | Sanity reads | ✓ | 6.29.1 (resolved) | — |
| `@sanity/image-url` | image URL builder | ✓ | 2.1.1 | — |
| `react-helmet-async` | SEO | ✓ | 2.0.5 (Phase 2 D-19 pin) | — |
| Resend Node SDK | webhook email | ✗ at root | — | Install function-locally inside `netlify/functions/snipcart-order-webhook/` (mirrors Phase 3 `submit-quote/`) |
| Netlify Functions runtime | webhook + JSON crawler | ✓ (configured in `netlify.toml` `[functions]`) | esbuild bundler | — |
| `RESEND_API_KEY` Netlify env var | webhook email | ✓ (Phase 3 owner-prep landed it; verify in W6 checkpoint) | — | — |
| `VITE_SNIPCART_PUBLIC_KEY` Netlify env var | client-side public key | ✗ — owner-prep gated | — | Hardcode in `index.html` per Pattern 1 Approach 1 (recommendation) |
| `SNIPCART_API_SECRET` Netlify env var | (NOT NEEDED — webhook validation endpoint requires no auth per A3) | n/a | — | — |
| Snipcart account + public/secret keys | the entire phase | ✗ — owner-prep gated | — | Without account, no test buys can complete; W6 owner-prep is the gate |
| Sanity Studio access | publishing `product` schema | ✓ owner already has access | — | — |

**Missing dependencies with no fallback:** Snipcart account (W6 owner-prep gate). Without it, no end-to-end test buy is possible; this is the phase's primary acceptance gate.

**Missing dependencies with fallback:** `VITE_SNIPCART_PUBLIC_KEY` env var → Pattern 1 Approach 1 hardcodes the test-mode key in `index.html` directly.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 + jsdom 25 (Phase 4 P-04-03) |
| Config file | `vite.config.js` `test` block (lines 21-26) |
| Quick run command | `pnpm test` (= `vitest run`) |
| Full suite command | `pnpm test` (same — there's no separate "full" suite distinction yet) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHOP-03 | Written platform decision exists (Snipcart) | doc-only | n/a — CONTEXT.md D-01 satisfies | ✓ (CONTEXT.md) |
| SHOP-04 | Owner can publish `product` documents in Sanity per schema | manual UAT | Owner publishes a test product, verifies it lands in `/shop` grid via deploy preview | ❌ Wave 1 schema-spec doc + owner-prep checkpoint |
| SHOP-05 | Visitor can browse `/shop` grid + click into `/shop/:slug` | unit (rendering) + manual UAT | `pnpm test` (App.test.js smoke covers route mount); manual click-through on deploy preview | partial — App.test.js mounts <App /> with mocked Sanity; new ShopCatalog.test.jsx + ShopSingle.test.jsx COULD be added but match site precedent of "minimal Vitest, manual UAT" |
| SHOP-06 | Visitor can complete purchase end-to-end | manual UAT (test mode) | Owner runs Snipcart test card on deploy preview | ❌ — UAT-only |
| SHOP-07 | Inventory state (sold-out, low-stock) is reflected accurately | unit (component renders) + manual UAT | `pnpm test` for ProductCard rendering at stockQuantity 0/2/5; manual: edit Sanity product to stockQuantity 0, refresh /shop, verify badge | ❌ Wave 0 — `ProductCard.test.jsx` for render branches |
| (cross) | JSON crawler endpoint returns valid product JSON | integration (curl) | `curl https://deploy-preview/.netlify/functions/snipcart-validate-product?slug={real-slug}` returns 200 + correct JSON shape | ❌ Wave 5 — manual integration test |
| (cross) | Webhook signature validation works | integration | Receive a real Snipcart test-mode order; check Netlify Function logs for "validation passed" + Resend send | ❌ Wave 5 — UAT-only end-to-end |

### Sampling Rate

- **Per task commit:** `pnpm test` (currently 8 test files / 43 tests; small phase additions keep this <10s)
- **Per wave merge:** `pnpm test` + `pnpm build` (verify Vite bundle still produces; sitemap regenerates including any new product slugs if owner has published)
- **Phase gate:** Full suite green AND a test-mode buy completes end-to-end on the deploy preview AND the owner's Resend inbox receives the custom email

### Wave 0 Gaps

- [ ] `src/components/shop/__tests__/ProductCard.test.jsx` — render branches: available / low-stock / sold-out
- [ ] (optional) `src/components/shop/__tests__/AddToCartButton.test.jsx` — sold-out branch returns `<span>` not `<button>`
- [ ] (optional) `netlify/functions/snipcart-order-webhook/formatOrderEmail.test.js` — Vitest can run this with `--include` extending to `netlify/**` if planner wants; matches Phase 3's `formatQuoteText.test.js` pattern
- [ ] No new framework install needed — Vitest already configured

*(For Phase 5, the codebase precedent is "manual UAT for user-flow validation, Vitest for pure-function and component-render assertions". Don't over-test buy-button DOM attributes — if Snipcart's selector finds the button, it works; the failure mode is at validation time, which test-mode buys cover.)*

## Security Domain

> Security enforcement is enabled (no `security_enforcement: false` flag in `.planning/config.json`).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Site is public; no logged-in users; Snipcart accounts are off-platform and not in our trust boundary |
| V3 Session Management | no | Same — no sessions in our app |
| V4 Access Control | yes (lightly) | Snipcart dashboard access (owner-only); Sanity Studio access (owner-only); Netlify dashboard access (owner-only). All three are existing, owner-managed, OUT of our code. |
| V5 Input Validation | yes | Slug query param to `snipcart-validate-product` — regex `^[a-z0-9-]+$/i`; webhook body size cap (50KB); JSON parse + structural validation |
| V6 Cryptography | yes (token-callback) | Webhook validation via `app.snipcart.com/api/requestvalidation/{token}` — Snipcart does the crypto, we just call their API |
| V7 Error Handling | yes | Functions log errors via `console.error`; return 4xx for client errors, 5xx for upstream failures; never leak stack traces to response body |
| V8 Data Protection | yes | Owner emails contain customer PII (name, address, phone). Resend domain verification is the existing safeguard. |
| V9 Communications | yes | All Snipcart + Sanity calls over HTTPS (CDN-enforced) |
| V13 API & Web Service | yes | Function endpoints follow Phase 3 precedent — POST/GET method whitelist, body-size cap, structured 4xx/5xx |
| V14 Configuration | yes | Public key in committed `index.html` is intentional (Snipcart's "public API key" is browser-exposed by design). Secret keys (none in Phase 5 — no `SNIPCART_API_SECRET` needed) would go in Netlify env vars only. |

### Known Threat Patterns for Snipcart-on-SPA Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Price tampering via DevTools (edit `data-item-price` to 0.01) | Tampering | JSON crawler endpoint (`snipcart-validate-product`) returns server-truth price from Sanity; Snipcart rejects mismatched orders. **THIS IS THE PRIMARY MITIGATION — see Pitfall 1+2.** |
| Forged webhook POST to `/snipcart-order-webhook` | Spoofing | `X-Snipcart-RequestToken` header validation via `app.snipcart.com/api/requestvalidation/{token}`. Fail-closed if validation API is unreachable. |
| Replay of valid webhook | Tampering / DoS | Token expires in 1 hour; idempotency on Resend send is best-effort (single failed send ≠ retryable email storm — see Function code, return 200 on Resend failure to suppress Snipcart retry storm). |
| Malicious slug query param (path traversal, GROQ injection) | Tampering / Injection | Slug regex `^[a-z0-9-]+$`; GROQ parameter binding via `$slug` (not string concat); response 400 on invalid slug. |
| DoS via large webhook body | DoS | 50KB body cap before parse; 100KB on submit-quote precedent — 50KB is correct for an order payload. |
| DoS via slow Snipcart validation API | DoS / Availability | 5s `AbortController` timeout (Phase 3 Pitfall 10 precedent); fail-closed = 401 on timeout. |
| PII leak in deploy logs | Information Disclosure | `console.error(payload.content?.invoiceNumber)` is the only intentional log of order metadata. Resend uses HTTPS. Don't log full address blocks unless debugging. |
| XSS via Sanity-published product description rendered in cart | XSS | Snipcart escapes `data-item-description` server-side. Our React rendering of `body` (portable text) goes through `<dangerouslySetInnerHTML>` only if we render rich HTML — UI-SPEC's "plain-text portable text" pattern (Phase 2 plan 02-02 precedent) avoids this. |
| Snipcart account compromise | Out of scope | Owner-managed; Snipcart account 2FA is the recommended control; flag in W6 owner-prep checkpoint. |
| Sanity write token leaked into client bundle | Information Disclosure | NOT in Phase 5 scope — we only do anonymous CDN reads. The Sanity write token would only enter the picture if Pitfall 5 / inventory-decrement-via-webhook ever ships (deferred). |
| Deno → Node runtime confusion in Netlify Functions | Configuration | Phase 3 precedent locks `node_bundler = "esbuild"` (`netlify.toml:9`). Both new Functions use `exports.handler = async (event) => ...` CommonJS. |

## Code-Level Recommendations Summary (planner shopping list)

Concrete, actionable items the planner converts to tasks:

1. **Pin Snipcart version** — verify current stable at `https://docs.snipcart.com/v3/release-notes` immediately before locking the version in `index.html`. Hardcode test-mode public key in `index.html`. Document the test↔live swap in the owner-prep checkpoint.
2. **`product` schema spec doc** — owner-applied in Sanity Studio. Schema fields per CONTEXT D-06..D-09: `name`, `slug`, `description` (≤200 char string), `body` (portable text), `images[]` (1–6, hero first, alt required), `price` (number, USD), `stockQuantity` (number, integer), `featured` (bool), `dimensions` (string), `materials` (ref array → `material`), `leadTime` (string, optional), `processes` (ref array → `process`), `seo` (block).
3. **Refactor `ImageGallery.jsx`** out of `ServiceGallery.jsx` BEFORE the detail page is wired (Pitfall 8). Smoke-test against `/styles/{first-slug}` and `/3d-printing/{first-slug}`.
4. **`ShopContext` + `SingleProductContext`** — copy Phase 2 `ServicesContext` shape verbatim, swap GROQ + value shape (Pattern 2).
5. **`Shop.jsx` route flip** — read products via `useShop()`, render `ShopComingSoon` (extracted) when count==0, `ShopCatalog` otherwise. SEO at the route level applies to both.
6. **`/shop/:slug` route + `ShopSingle.jsx`** — provider stack mirrors `ProjectSingle.jsx`. Mount `<ImageGallery>` (left) + `<ProductInfo>` (right) + `<StickyMobileAddToCart>` (mobile-only fixed footer).
7. **`AddToCartButton.jsx`** — Pattern 3. Pipe-separated categories (Pitfall 7), `data-item-url` to JSON crawler endpoint (Pitfall 1), sold-out branch returns `<span>` not `<button>`.
8. **`netlify/functions/snipcart-validate-product`** — Pattern 4. Slug regex validation; Sanity GROQ via raw HTTP (no `@sanity/client` dep needed function-locally; mirrors lightweight Function pattern). Returns `{ id, name, price, url, description, image, stock }`.
9. **`netlify/functions/snipcart-order-webhook`** — Pattern 5. Token-callback validation with 5s timeout; reject non-`order.completed` events with 200 OK; Resend send with 5s timeout; log invoice number on Resend failure.
10. **`src/css/snipcart.css`** — Pattern 6 with the corrected variable names (UI-SPEC §6 patch).
11. **`src/index.js` import** — `import './css/snipcart.css';` after `./index.css`.
12. **`index.html`** — Snipcart preconnect + stylesheet + script + `#snipcart` div. Test-mode public key hardcoded.
13. **`App.js`** — add `ShopSingle` lazy import + `/shop/:slug` route.
14. **`ShopFilter.jsx`** — UI-SPEC §7 segmented control (`role="radiogroup"`). Filter happens client-side on the `products` array — no per-filter GROQ refetch.
15. **`ProductCard.jsx`** — UI-SPEC §1 layout, `SoldOutBadge` + `LowStockTag` composition. `<Link to={/shop/${slug}}>` wraps the whole card.
16. **`SoldOutBadge.jsx`** + **`LowStockTag.jsx`** — small leaf components per UI-SPEC color/typography tables.
17. **`ProductSpecTable.jsx`** — UI-SPEC §11 `<dl>` definition list. Conditionally renders rows when fields are populated.
18. **`StickyMobileAddToCart.jsx`** — UI-SPEC §3, `IntersectionObserver` watches in-content button, `md:hidden`.
19. **(Optional)** Cart-count badge — Pattern 7, defer to a polish plan.
20. **W6 owner-prep checkpoint** — Snipcart account creation, public/secret key copy into `index.html` test-mode + Netlify env var (`VITE_SNIPCART_PUBLIC_KEY` if planner picks Approach 2 from Pitfall 4), Webhook URL configuration, default-email-on dashboard config, shipping rates entered (CONTEXT D-04: US flat $9 + Canada flat + international "contact us" + local pickup $0 method per `[VERIFIED: docs.snipcart.com/v3/setup/shipping]`).

## Sources

### Primary (HIGH confidence)

- [Snipcart v3 Installation Docs](https://docs.snipcart.com/v3/setup/installation) — script + #snipcart div pattern, `loadStrategy` option, public API key contract, version pin example.
- [Snipcart v3 Products / data-item-* attributes](https://docs.snipcart.com/v3/setup/products) — full data-item-* attribute reference, separator format (`|` for categories), `data-item-stackable` semantics, `data-item-max-quantity` purchase-cap behavior.
- [Snipcart v3 Order Validation / JSON Crawler](https://docs.snipcart.com/v3/setup/order-validation) — JSON validator triggered by `Content-Type: application/json`; required fields (id, price, url); SPA workaround recommendation.
- [Snipcart v2 JSON Crawler legacy doc (still authoritative on JSON shape)](https://docs.snipcart.com/v2/configuration/json-crawler) — explicit "for SPAs use JSON crawler" guidance.
- [Snipcart v3 Theming / CSS variables](https://docs.snipcart.com/v3/setup/theming) — full variable list including `--color-buttonPrimary`, `--bgColor-default`, etc.
- [Snipcart v3 Default Theme reference](https://docs.snipcart.com/v3/themes/default/reference) — element-level class names.
- [Snipcart v3 Customization](https://docs.snipcart.com/v3/setup/customization) — confirms cart drawer is rendered IN our DOM (not iframe), Vue-built.
- [Snipcart v3 Webhooks Introduction](https://docs.snipcart.com/v3/webhooks) — header name `X-Snipcart-RequestToken`, validation endpoint URL, 1-hour token expiry.
- [Snipcart v3 SDK / API reference](https://docs.snipcart.com/v3/sdk/api) — `Snipcart.api.theme.cart.open()` / `.close()` for programmatic drawer control.
- [Snipcart v3 SDK / Events reference](https://docs.snipcart.com/v3/sdk/events) — full event list (`item.added`, `item.removed`, `cart.confirmed`, `snipcart.initialized`, `theme.routechanged`).
- [Snipcart v3 Shipping](https://docs.snipcart.com/v3/setup/shipping) — flat-rate config + regional priority + zero-cost local pickup as a custom shipping method.
- [Snipcart v3 Taxes](https://docs.snipcart.com/v3/setup/taxes) — default = no tax until rules created; dashboard config + `data-item-has-taxes-included` markup pair.
- Internal Phase 1 / Phase 2 / Phase 3 / Phase 4 RESEARCH + CONTEXT artifacts (`useSanityQuery`, `ServicesContext`, `submit-quote` Function, Vite migration env-var rename) — codebase ground truth.
- Internal `tailwind.config.js`, `index.html`, `netlify.toml`, `package.json`, `vite.config.js`, `src/utilities/sanityClient.jsx`, `src/utilities/sanityImage.jsx`, `src/components/services/ServiceGallery.jsx`, `src/context/ServicesContext.jsx`, `src/context/SingleServiceContext.jsx`, `src/components/shared/SanityImage.jsx`, `src/components/shared/SEOHead.jsx`, `src/hooks/useSanityQuery.jsx`, `netlify/functions/submit-quote/submit-quote.js`, `scripts/generate-sitemap.cjs` — read directly during research.

### Secondary (MEDIUM confidence)

- [Hookdeck guide: Snipcart Webhooks Best Practices](https://hookdeck.com/webhooks/platforms/guide-to-snipcart-webhooks-features-and-best-practices) — sample Node.js code for token validation (`response.ok` check), confirmation that no API key is required for the validation endpoint, why HMAC isn't used (token-callback by design).
- [Snipcart support: Webhook Request validation fails](https://support.snipcart.com/t/webhook-request-validation-fails/169) — corroborates 1-hour token expiry and validation flow.
- [Snipcart support: CDN for v3.3.0 returning 404](https://support.snipcart.com/t/cdn-for-v3-3-0-returning-404/685) — confirms older CDN versions can be retired (Pitfall 6).
- [Snipcart blog: customizing the cart](https://snipcart.com/blog/customizing-snipcart-to-reflect-the-style-of-your-website) — corroborates CSS-variable approach + DevTools-driven class discovery.
- [Snipcart blog: React e-commerce tutorial](https://snipcart.com/blog/react-ecommerce-tutorial) — vanilla data-attribute pattern in React, no wrapper-package dependency.
- [Snipcart features](https://snipcart.com/features) — corroborates inventory-management feature without separate Pro tier.
- [Snipcart support: Customer Selection Between Pickup, Delivery, Shipping](https://support.snipcart.com/t/customer-selection-between-pickup-delivery-and-shipping/2429) and [Allowing in-store payment and pickup](https://support.snipcart.com/t/allowing-in-store-payment-and-pickup/667) — local-pickup-as-zero-cost-shipping-method workaround pattern.

### Tertiary (LOW confidence — verify in W6 owner-prep)

- Pricing tier specifics ($1k/month threshold + $20 flat fallback or 2% transaction fee) — `https://snipcart.com/pricing` returned 404 during research; cited from third-party SaaS-comparison sites. **A1 / W6 owner-prep verification.**
- Exact current Snipcart CDN version (`v3.7.x` — saw v3.7.1 mentioned but v3.3.x in some tutorials). **A2 / planner verifies at locking time.**

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Snipcart is the locked platform; codebase deps already on the project; only the version pin is dynamic.
- Architecture: HIGH — three distinct integration points (script load, JSON crawler, webhook), each individually verified against Snipcart docs and the existing Phase 1–4 codebase patterns.
- Pitfalls: HIGH on the Snipcart-side (1, 2, 3, 6, 7, 9 all directly verified); MEDIUM on Vite env-var (4 — verified via Vite docs but not exercised in this codebase yet); MEDIUM on inventory race (5 — accepted CONTEXT trade).

**Research date:** 2026-05-08
**Valid until:** 2026-06-08 (~30 days; Snipcart's API surface is stable but version pinning + docs URLs benefit from a re-check before any post-launch follow-up plan)
