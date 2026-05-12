# Architecture Research

**Domain:** Marketing/lead-gen SPA evolving into a quote tool + small-catalog shop
**Researched:** 2026-05-02
**Confidence:** HIGH for Bundle 1 patterns (mirrors existing code), MEDIUM for Bundle 2/3 (forward-looking, deployment-shape decisions)

## Standard Architecture

This is a **subsequent-milestone** research note. The base architecture (CRA + React 18 + Sanity CDN + Netlify static + Netlify Forms) is fixed by `.planning/PROJECT.md` constraints. This document describes how three bundles slot into that base without breaking it.

### Target system at end of Bundle 3

```
                       Browser (CRA static SPA)
  ┌────────────────────────────────────────────────────────────────┐
  │  src/index.js → src/App.js (Router + lazy routes + chrome)     │
  │                                                                │
  │  Routes                                                        │
  │   /                  /styles  /styles/:capability              │
  │   /3d-printing       /3d-printing/:capability     [Bundle 1]   │
  │   /quote             /quote/result/:id            [Bundle 2]   │
  │   /shop              /shop/:productSlug           [Bundle 3]   │
  │   /about  /contact                                             │
  │                                                                │
  │  Context providers (data/)                                     │
  │   ServicesContext  ──► laser-style + print-style fetch         │
  │   SingleServiceContext  ──► current service from URL           │
  │   AboutMeContext (existing)                                    │
  │   QuoteContext      [Bundle 2]   CartContext  [Bundle 3]       │
  │                                                                │
  │  Hooks (hooks/)                                                │
  │   useSanityQuery   ──► unifies all reads (replaces inline      │
  │                        useEffect+fetch idiom)                  │
  └──────────┬──────────────┬───────────────┬────────────┬─────────┘
             │              │               │            │
             ▼              ▼               ▼            ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌─────────────┐
  │ Sanity CDN   │  │ Netlify Form │  │ Netlify  │  │ Shop platform│
  │ (anonymous,  │  │ (POST /)     │  │ Functions│  │ Snipcart  OR │
  │ useCdn:true) │  │              │  │ (Bundle 2│  │ Stripe Checkout│
  │              │  │              │  │ + 3 only)│  │ via Function │
  └──────────────┘  └──────────────┘  └──┬───────┘  └──────┬───────┘
                                         │                 │
                                         ▼                 ▼
                                  ┌──────────────┐  ┌─────────────┐
                                  │ Cloudinary/  │  │ Email to    │
                                  │ S3 upload +  │  │ studio owner│
                                  │ STL parser   │  │ (Resend/    │
                                  │ + email      │  │ Postmark)   │
                                  └──────────────┘  └─────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `src/App.js` | Route table, shared chrome | Add `/3d-printing`, `/3d-printing/:capability`, `/shop` (Coming Soon now); add `/quote`, `/shop/:slug` later. Move `classList.add('dark')` out of render. |
| `src/context/ServicesContext.jsx` | Single source for both `laser-style` and `print-style` documents, keyed by `serviceType` | New — generalized from `ProjectsContext`. See "Pattern 1." |
| `src/context/SingleServiceContext.jsx` | Resolve a single style by `:capability` slug, scoped to a `serviceType` | New — generalized from `SingleProjectContext`. |
| `src/hooks/useSanityQuery.jsx` | Wrap `sanityClient.fetch` with loading/error/data state | New utility hook to retire inline `useEffect` fetches in `OurProcess`, `QuickSpecs`, `Collaborations`, `Materials`. |
| `src/components/services/MaterialsSection.jsx` | In-page materials embed for either service page | New — replaces top-level `Materials.jsx`. Filters by `serviceType` via Sanity reference. |
| `src/components/contact/ContactForm.jsx` | Pre-fill `service` field from `useLocation().state` or URL param | Modify in Bundle 1 to read `service` from router state; fall back to `?service=` query param. |
| `src/components/quote/...` | File upload, material picker, price display | New folder, Bundle 2. Calls `/.netlify/functions/quote`. |
| `src/components/shop/...` | Product grid, single product, cart UI | New folder, Bundle 3. Reads from Sanity `product` documents; cart state in `CartContext` or delegated to Snipcart globals. |
| Netlify Function `quote.js` | Receive STL + options → estimate volume + price → email owner | Bundle 2. Synchronous (≤10s default, ≤26s on Pro). Falls back to background function if files exceed payload size. |
| Netlify Function `checkout.js` | Create Stripe Checkout session from cart | Bundle 3 (only if Stripe path chosen). |

## Recommended Project Structure

```
src/
├── App.js                              # Add new routes; remove dark side-effect
├── index.js
├── pages/
│   ├── Home.jsx                        # Update hero/feature both services
│   ├── Projects.jsx                    # Becomes generic "service grid" page (see Pattern 1)
│   ├── ProjectSingle.jsx               # Becomes generic "service detail" page
│   ├── ServiceLanding.jsx              # NEW (Bundle 1) — /styles & /3d-printing entry
│   ├── ServiceSingle.jsx               # NEW (Bundle 1) — /:service/:capability
│   ├── Shop.jsx                        # Bundle 1: Coming Soon. Bundle 3: real grid.
│   ├── ShopProductSingle.jsx           # NEW (Bundle 3)
│   ├── Quote.jsx                       # NEW (Bundle 2)
│   ├── QuoteResult.jsx                 # NEW (Bundle 2)
│   ├── AboutMe.jsx
│   ├── Contact.jsx
│   └── Materials.jsx                   # DELETE in Bundle 1 (becomes section)
├── context/
│   ├── ServicesContext.jsx             # NEW (Bundle 1) — generalized
│   ├── SingleServiceContext.jsx        # NEW (Bundle 1) — generalized
│   ├── AboutMeContext.jsx              # existing
│   ├── ProjectsContext.jsx             # DELETE after migration (Bundle 1)
│   ├── SingleProjectContext.jsx        # DELETE after migration (Bundle 1)
│   ├── QuoteContext.jsx                # NEW (Bundle 2) — quote draft state
│   └── CartContext.jsx                 # NEW (Bundle 3) — only if Stripe path
├── components/
│   ├── shared/                         # AppHeader (add /3d-printing nav, /shop)
│   ├── services/                       # NEW folder (Bundle 1)
│   │   ├── ServiceGrid.jsx             # generalized ProjectsGrid
│   │   ├── ServiceCard.jsx             # generalized ProjectSingle (component)
│   │   ├── ServiceHeader.jsx           # generalized ProjectHeader
│   │   ├── ServiceGallery.jsx          # generalized ProjectGallery (state-driven modal)
│   │   ├── ServiceInfo.jsx             # generalized ProjectInfo
│   │   ├── ServiceFilter.jsx           # generalized ProjectsFilter (if used)
│   │   └── MaterialsSection.jsx        # in-page materials embed
│   ├── projects/                       # DELETE after migration (Bundle 1)
│   ├── materials/                      # KEEP MaterialSingle.jsx; move under components/
│   ├── home/                           # update QuickSpecs/Collaborations to useSanityQuery
│   ├── about/
│   ├── contact/                        # ContactForm reads useLocation state
│   ├── quote/                          # NEW (Bundle 2)
│   │   ├── QuoteForm.jsx
│   │   ├── FileDropzone.jsx
│   │   ├── MaterialPicker.jsx
│   │   └── PriceDisplay.jsx
│   ├── shop/                           # NEW (Bundle 3)
│   │   ├── ProductGrid.jsx
│   │   ├── ProductCard.jsx
│   │   ├── ProductDetail.jsx
│   │   └── CartButton.jsx              # or thin Snipcart wrapper
│   ├── reusable/
│   ├── HireMeModal.jsx
│   └── ScrollToTop.jsx
├── hooks/
│   ├── useScrollToTop.jsx
│   ├── useSanityQuery.jsx              # NEW (Bundle 1) — unifies fetch idioms
│   └── useThemeSwitcher.jsx            # delete or revive (Bundle 1 cleanup)
├── utilities/
│   ├── sanityClient.jsx
│   ├── helpers.jsx
│   ├── pricing.js                      # NEW (Bundle 2) — shared price math
│   └── stl.js                          # NEW (Bundle 2) — STL volume parsing (browser side)
├── data/
│   └── services.js                     # NEW — replaces data/projects.js
│                                       #   exports SERVICES = [{ key, type, urlSegment,
│                                       #   navLabel }] for laser + print
└── netlify/
    └── functions/                      # NEW (Bundle 2+3) — colocated; configure
        ├── quote.js                    #   netlify.toml `[functions] directory`
        ├── quote-background.js         # for STL > ~5 MB or expected long compute
        └── checkout.js                 # Bundle 3 (Stripe path only)
```

### Structure Rationale

- **`src/components/services/`:** Replaces `src/components/projects/` and absorbs `src/materials/`. The "project" naming reflected the original laser-only world; the new code unifies laser and print under "service" so a single set of components covers both. This is the single biggest refactor in Bundle 1 — but it is a *rename + parameter add*, not a rewrite.
- **`src/data/services.js` constant:** Replaces the load-bearing `capabilitiesTitle` constant. Rather than two parallel constants (`stylesUrlSegment`, `printUrlSegment`), one config array drives nav labels and route segments for both services.
- **`netlify/functions/` at repo root (not under `src/`):** Netlify auto-discovers this path; CRA does not bundle it (so `react-scripts build` ignores it). This is the conventional layout. A `netlify.toml` should be added in Bundle 2 to pin the directory and Node version.
- **Hook `useSanityQuery` is Bundle 1 work, not optional:** Without it Bundle 2's quote page repeats the same anti-pattern. Unifying fetches now also makes loading/error states consistent across the spruce.

## Architectural Patterns

### Pattern 1 — Generalized `ServicesContext` (vs. parallel contexts)

**Decision: ONE generalized context, not two parallel.**

A parallel-context approach (`PrintsContext` + `SinglePrintContext` mirroring projects) is the lower-risk literal mirror but creates four context files where two would do, and forces every component (header, footer, home grid) to know which kind of service it's rendering. A generalized `ServicesContext` keyed by `serviceType` is one extra parameter and stays one set of components.

**Trade-offs:**

| | Parallel (`PrintsContext`) | Generalized (`ServicesContext`) |
|--|---|---|
| New files | 4 (2 contexts + 2 components) | 0 (rename-in-place) |
| Risk if rolled back | Low (additive) | Medium (touches existing screens) |
| Bundle 2/3 reuse | Have to triple it for "products" | Pattern proven, easier to extend |
| Sanity GROQ cost | 2 separate fetches per page | 1 combined fetch (or 2 conditionally) |
| Mental model | "two services, two paths" | "N services, one path" |

**Recommended shape:**

```javascript
// src/data/services.js
export const SERVICES = [
  {
    key: 'laser',
    sanityType: 'laser-style',
    urlSegment: 'styles',
    navLabel: 'Laser Cutting',
    contactSubject: 'laser cutting',
  },
  {
    key: 'print',
    sanityType: 'print-style',
    urlSegment: '3d-printing',
    navLabel: '3D Printing',
    contactSubject: '3D printing',
  },
];
export const getServiceByUrlSegment = (s) =>
  SERVICES.find((svc) => svc.urlSegment === s);

// src/context/ServicesContext.jsx
import { createContext, useState, useEffect } from 'react';
import sanityClient from '../utilities/sanityClient';
import { SERVICES } from '../data/services';

export const ServicesContext = createContext();

export const ServicesProvider = ({ serviceKey, children }) => {
  const [styles, setStyles] = useState([]);
  const service = SERVICES.find((s) => s.key === serviceKey);

  useEffect(() => {
    if (!service) return;
    sanityClient
      .fetch(
        `*[_type == $type]{
          order, title, description, header, slug,
          preferredMaterials, considerations,
          listImage{ altText, asset->{ _id, url } },
          detailImages[]{ altText, asset->{ _id, url } }
        }`,
        { type: service.sanityType }
      )
      .then(setStyles)
      .catch(console.error);
  }, [service]);

  return (
    <ServicesContext.Provider value={{ service, styles, setStyles }}>
      {children}
    </ServicesContext.Provider>
  );
};
```

The page wraps with `<ServicesProvider serviceKey="laser">` or `serviceKey="print"` — `useParams()` from the URL segment resolves it via `getServiceByUrlSegment`.

**Migration order for Bundle 1:**
1. Create `data/services.js`, `context/ServicesContext.jsx`, `context/SingleServiceContext.jsx`, `components/services/*` from copies of the existing project files.
2. Add `<Route path="/3d-printing">` and `<Route path="/3d-printing/:capability">` using the new generalized components.
3. Repoint `<Route path="/styles">` to the generalized components.
4. Delete `context/ProjectsContext.jsx`, `context/SingleProjectContext.jsx`, `components/projects/*`.
5. Delete `data/projects.js` (only `capabilitiesTitle` is consumed; replaced by `SERVICES`).

### Pattern 2 — `useSanityQuery` hook to retire the inline-fetch idiom

**Why this matters for the bundle ordering:** without it Bundle 2's quote tool will reinvent loading/error semantics. Getting it in Bundle 1 means the spruce work normalizes the codebase.

```javascript
// src/hooks/useSanityQuery.jsx
import { useEffect, useState } from 'react';
import sanityClient from '../utilities/sanityClient';

export default function useSanityQuery(query, params = {}) {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // params is serialized to a stable dependency
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    sanityClient.fetch(query, params)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); }})
      .catch((e) => { if (!cancelled) { setError(e); setLoading(false); }});
    return () => { cancelled = true; };
  }, [query, paramsKey]);  // eslint-disable-line react-hooks/exhaustive-deps

  return { data, error, loading };
}
```

Apply to: `OurProcess.jsx`, `QuickSpecs.jsx`, `Collaborations.jsx`, the new `MaterialsSection.jsx`, and any Bundle 2/3 component that reads Sanity. Context providers can also adopt it internally for consistency.

### Pattern 3 — Materials as in-page section, scoped by service

**Decision: query inside `<MaterialsSection>` itself; no top-level `MaterialsContext`.**

Why not a context: materials are only ever rendered inside a service page, never on Home or About. A context buys nothing and adds a wrapper. A direct `useSanityQuery` call inside the section keeps it self-contained and lets a future change (different filter, different ordering) live in one file.

**Anchor link:** Use a fragment, not router state.

```javascript
// src/pages/ServiceSingle.jsx (skeleton)
<ServicesProvider serviceKey={service.key}>
  <SingleServiceProvider>
    <ServiceHeader />
    <ServiceGallery />
    <ServiceInfo />
    <section id="materials">
      <MaterialsSection serviceKey={service.key} />
    </section>
  </SingleServiceProvider>
</ServicesProvider>

// Anywhere — link from ServiceInfo:
<a href="#materials">See materials we cut</a>
```

For cross-page links (e.g., from Home to "Materials we print"), use `<Link to={`/3d-printing#materials`} />`. React Router v6 does scroll-to-fragment via the `ScrollToTop` component or a small `useScrollToHash` helper — the existing `ScrollToTop` resets to top on route change, so add a sibling effect that honors `location.hash`.

```javascript
// src/components/ScrollToTop.jsx (extend)
useEffect(() => {
  if (location.hash) {
    const el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  window.scrollTo(0, 0);
}, [location.pathname, location.hash]);
```

### Pattern 4 — Service-aware contact form

**Decision: support both `useLocation().state` (preferred for in-app navigation) AND `?service=` query param (for deep links from email/ads). Both fall through to a default empty value.**

In-app: cards or CTAs that link to `/contact` pass state.

```javascript
// src/components/services/ServiceInfo.jsx (or a shared CTA)
import { Link, useLocation } from 'react-router-dom';

<Link
  to="/contact"
  state={{ service: 'laser cutting', from: location.pathname }}
>
  Get a quote
</Link>
```

External / deep-link: `https://shapesmith.studio/contact?service=3d-printing` — supports email signatures, social links, ads.

```javascript
// src/components/contact/ContactForm.jsx (new logic)
import { useLocation } from 'react-router-dom';

const location = useLocation();
const params = new URLSearchParams(location.search);
const initialService =
  location.state?.service ??
  params.get('service') ??
  '';
const [formService, setFormService] = useState(initialService);

// Render a <select> with options sourced from data/services.js + 'other'.
// Persist `service` in the Netlify Forms POST body.
```

**Update the hidden form** in `public/index.html`:
```html
<form name="contact-form" netlify netlify-honeypot="bot-field" hidden>
  <input type="text" name="name" />
  <input type="email" name="email" />
  <input type="text" name="subject" />
  <input type="text" name="service" />   <!-- NEW field -->
  <textarea name="message"></textarea>
</form>
```

Netlify Forms requires this hidden form to declare every field at deploy time, otherwise the new `service` field will silently drop on production submissions.

### Pattern 5 — Bundle 2 file upload + slicing topology

**Hard constraint:** Netlify Functions ([per Netlify docs](https://docs.netlify.com/build/functions/overview/)) — synchronous functions default to a 10-second timeout, and Pro/Enterprise can opt into 26 seconds. Background functions go up to 15 minutes but **return 202 immediately and cannot deliver a result back to the page** ([Netlify Background Functions docs](https://docs.netlify.com/build/functions/background-functions/)). Synchronous payload limit is 6 MB; background payload is 256 KB request/response.

Given a Bambu H2D-class user uploading STLs typically under 50 MB and the studio owner wanting "ballpark" pricing, the realistic shape is:

**Recommended: client-side STL parse + light server-side validation/email.**

```
Browser                          Netlify Function `quote.js`
─────────────────────────────    ──────────────────────────────────
1. User drops .stl into          
   FileDropzone
2. Parse STL with Three.js       
   STLLoader → mesh.geometry     
3. Compute volume from           
   triangle prism sum            
   (utilities/stl.js)            
4. Estimate weight =             
   volume × material.density     
5. Compute price =               
   weight × $/g + machine        
   time × $/hr + setup           
   fee (utilities/pricing.js)    
6. Show price in UI              
7. POST { service, fileMeta,     ───►  Validate, log to Sanity
   material, computedQuote,            (or just email), return
   contact } to                         { quoteId, ok: true }
   /.netlify/functions/quote     ◄───  ≤ 1 second typical
```

**Key point:** Heavy compute (mesh parsing) happens **in the browser**, not on Netlify. The function only persists/notifies. This keeps us inside the 10-second timeout trivially and avoids the 6 MB payload cap (we never upload the STL — only its metadata + computed estimate).

If the owner wants to **also receive the file** for inspection, two paths:
1. Direct upload from browser to Cloudinary (signed unsigned upload preset) or S3 (presigned URL via a Netlify Function), pass the URL to the email function. Files never traverse Netlify.
2. Skip the file. The owner gets dimensions, volume, and contact info; if interested, replies to the customer asking them to share the file by email or Drive.

Path 2 is dramatically simpler and a defensible MVP for Bundle 2.

**Libraries:**
- `three` (already JS, no Node-server dependency) for `STLLoader` — works in browser. ([sbcode.net STL loader tutorial](https://sbcode.net/threejs/loaders-stl/))
- `node-stl` only if we ever do server-side parsing ([johannesboyne/node-stl](https://github.com/johannesboyne/node-stl)). For Bundle 2 MVP this is not needed.
- For laser SVG/DXF: use `paper.js` or compute path length from raw SVG `<path>` `getTotalLength()` plus bounding-box area. Server-side not required for laser either.

**Quote persistence:** Two options.
- Sanity write API + a server-only token (stored as Netlify env var). Quote becomes a `quote-submission` document, owner sees it in Studio. This is the most consistent with the rest of the codebase — but it requires the *first* introduction of a Sanity write token, and that token must NEVER ship to the bundle. Keep all Sanity writes inside `netlify/functions/`.
- Email-only via Resend / Postmark / Netlify's built-in form. Simpler, no token, no schema.

Recommend email-only for Bundle 2 launch; Sanity write is a follow-up if volume warrants it.

### Pattern 6 — Bundle 3 shop integration shape

Three real candidates. The decision should be made at the start of Bundle 3, not now — but here is the **integration shape per platform** so the bundle's planning has concrete numbers.

| | Snipcart | Stripe Checkout + Sanity | Shopify Storefront |
|---|---|---|---|
| Where products live | Sanity (we tag `product` docs with HTML attrs Snipcart reads) | Sanity (canonical) | Shopify admin (canonical) |
| Cart state | Snipcart's global JS (window-scoped) | React Context + Stripe sessions | Shopify Buy SDK or your own Context |
| Server-side need | None | Netlify Function for `/checkout` (creates session) | Optional — Storefront API can run client-side |
| Payment processing | Through Snipcart (2% transaction fee, no monthly) | Stripe direct (Stripe fees only) | Shopify Lite ~$5/mo + 2% on external sites |
| Inventory | Snipcart dashboard or webhooks back to Sanity | Sanity-managed; you handle stock decrement on webhook | Shopify-managed |
| CRA/Sanity fit | Excellent — drop in 2 script tags + data attributes | Good — natural for the existing stack | Acceptable — but Sanity becomes secondary to Shopify |
| Migration if outgrown | Replace with Stripe direct or Shopify | Build more yourself | Already on Shopify |
| Code surface in this repo | Lowest — `<script>` tags + buttons | Medium — Context + 1 function | Medium-high — SDK + Context |

**Likely best fit given the constraints (small handmade catalog, no logged-in users, owner already in Sanity):**

Snipcart is the lowest-friction choice. Shape:

```
Sanity 'product' document
  → ShopProductSingle.jsx renders
      <button class="snipcart-add-item"
              data-item-id={product._id}
              data-item-name={product.title}
              data-item-price={product.price}
              data-item-url={`/shop/${product.slug.current}`}
              data-item-image={product.listImage.asset.url}>
        Add to cart
      </button>
  → Snipcart's global script picks it up; no Context needed
  → Studio owner gets order email; manages fulfillment in Snipcart dashboard
```

**Stripe + Sanity shape (if more control needed):**

```
src/context/CartContext.jsx
  - { items, addItem, removeItem, clear }
  - persists to localStorage

src/components/shop/CartButton.jsx
  - on "Checkout" click → POST cart to /.netlify/functions/checkout
  - function creates Stripe Checkout Session with line_items derived
    from cart + Sanity price lookup (re-validated server-side, never
    trusted from client)
  - returns session.url
  - browser redirects to Stripe-hosted checkout
  - on success Stripe redirects back to /shop/thank-you?session_id=…
  - webhook function /.netlify/functions/stripe-webhook records the
    paid order in Sanity (product.stock decrement)
```

[Stripe + Sanity reference patterns](https://www.sanity.io/answers/integrating-stripe-and-sanity-for-an-ecommerce-site-with-variable-ticket-prices-) and [Snipcart vs Stripe walkthrough](https://snipcart.com/blog/stripe-checkout-form-integration-vs-snipcart) confirm this is the standard shape; Snipcart's two-line embed is documented to work in any framework including React.

**Recommendation in the roadmap:** flag Bundle 3 as "platform decision pending — defer until Bundle 1 is live and we have a real product list." This matches the "Defer real shop platform choice" decision in PROJECT.md.

## Data Flow

### Bundle 1 — Service browse + contact pre-fill

```
User clicks "/3d-printing" nav link
    ↓
App.js route → <ServiceLanding />
    ↓
ServicesProvider serviceKey="print" wraps subtree
    ↓
ServicesProvider's useEffect runs:
  sanityClient.fetch('*[_type == "print-style"]{...}')
    ↓
ServiceGrid reads ctx.styles, sorts, renders ServiceCard list
    ↓
User clicks card → /3d-printing/:capability
    ↓
SingleServiceProvider .find()s by slug from already-loaded list
    ↓
ServiceHeader/Gallery/Info render
    ↓
User clicks "Get a quote" → <Link to="/contact" state={{ service: 'print' }}>
    ↓
ContactForm reads useLocation().state, pre-fills service select
    ↓
Submit → POST x-www-form-urlencoded to https://shapesmith.studio/
         body includes form-name=contact-form, name, email, service, message
    ↓
Netlify intercepts (matching public/index.html hidden form), records submission
```

### Bundle 2 — Quote (browser-heavy, server-light)

```
User on /quote
    ↓
QuoteForm renders: FileDropzone, MaterialPicker, contact fields
    ↓
User drops file (.stl)
    ↓
utilities/stl.js parses with Three.js STLLoader → volume
    ↓
useSanityQuery loads materials (filtered by serviceType)
    ↓
User picks material → utilities/pricing.js computes price
    ↓
PriceDisplay shows $$
    ↓
User clicks "Send to Studio"
    ↓
POST { quoteData, contact } → /.netlify/functions/quote
    ↓
Function validates, sends owner email (Resend), returns 200
    ↓
Browser navigates to /quote/result with success state
```

### Bundle 3 — Shop (Snipcart path shown; Stripe alternative noted)

```
User on /shop
    ↓
ProductGrid: useSanityQuery('*[_type == "product" && available == true]{...}')
    ↓
ProductCard list renders; "Add to cart" buttons have Snipcart data attrs
    ↓
User clicks → Snipcart global JS adds item, updates cart icon
    ↓
User clicks cart → Snipcart's hosted modal opens
    ↓
Checkout completes inside Snipcart's iframe
    ↓
Webhook from Snipcart → /.netlify/functions/snipcart-webhook
    ↓
Function records order to Sanity (or just sends owner email)
```

### State Management Summary

| Bundle | Scope | Tool |
|--------|-------|------|
| 1 | service catalog, single service, profile, materials | React Context (`ServicesContext`, `SingleServiceContext`, `AboutMeContext`) + `useSanityQuery` hook |
| 1 | UI ephemeral (modal open, form fields) | `useState` |
| 2 | quote draft (file, material, computed price) | Local `useState` in QuoteForm; or `QuoteContext` if multi-step |
| 3 | cart (Snipcart) | Snipcart globals (`window.Snipcart`) — no React state |
| 3 | cart (Stripe path) | `CartContext` + localStorage persistence |
| All | route-passed referrer state | `useLocation().state` |

Resist Redux / Zustand / React Query through Bundle 3. Sanity reads are simple enough that a 30-line `useSanityQuery` covers loading/error; cart state is small. If complexity grows past Bundle 3 (multi-step checkout, user accounts), revisit.

## Sanity Content Modeling

### `print-style` (mirror of `laser-style`)

Owner adds in Sanity Studio (the JS schema definition lives in the studio repo, not this web repo). Recommended fields, mirroring `laser-style` exactly so the same components render both:

```javascript
// sanity studio (separate repo) — schemas/print-style.js
export default {
  name: 'print-style',
  title: '3D Print Style',
  type: 'document',
  fields: [
    { name: 'order',       type: 'number' },
    { name: 'title',       type: 'string', validation: r => r.required() },
    { name: 'description', type: 'text' },
    { name: 'header',      type: 'string' },
    { name: 'slug',        type: 'slug',  options: { source: 'title' } },
    { name: 'preferredMaterials', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'material' }] }] },
    { name: 'considerations', type: 'array', of: [{ type: 'string' }] },
    { name: 'listImage',     type: 'image', fields: [
      { name: 'altText', type: 'string' }] },
    { name: 'detailImages',  type: 'array',
      of: [{ type: 'image', fields: [{ name: 'altText', type: 'string' }] }] },
  ],
};
```

Identical shape to `laser-style` so the GROQ in `ServicesContext` can be the *same projection* parameterized by `_type`.

### `material` — add a `processes` reference for cross-service availability

The current `material` schema already has a `processes` field (per the Materials.jsx GROQ projection). What I cannot verify without studio access is its current type — either a free-text array or already a reference. If it is free-text strings: that works for filtering by GROQ `match`, but it is fragile (typos, casing).

**Recommendation: model `processes` as a reference to a small `process` enum-document.**

```javascript
// schemas/process.js (new)
export default {
  name: 'process',
  type: 'document',
  fields: [
    { name: 'key',   type: 'string',  // 'laser' | 'print'
      validation: r => r.required() },
    { name: 'label', type: 'string' },
  ],
};

// schemas/material.js (modify)
{ name: 'processes',
  type: 'array',
  of: [{ type: 'reference', to: [{ type: 'process' }] }] },
```

GROQ filter for "materials available for 3D printing":

```groq
*[_type == "material" && "print" in processes[]->key]{
  _id, order, title, processes[]->{ key, label },
  cuttingSpecs, description, disclaimer,
  listImage{ altText, asset->{ _id, url } }
}
```

This is per Sanity's reference filter pattern — `processes[]->key` dereferences each ref then projects `key`, and `"print" in [...]` is the standard membership check ([GROQ operators](https://www.sanity.io/docs/specifications/groq-operators)).

If the owner doesn't want to migrate existing materials, the fallback is a string-match: `"print" in processes[]` against an existing string array. Acceptable for launch.

### Single `service` document — DON'T

A single Sanity document type with a discriminator field (`type: 'laser' | 'print'`) instead of two types feels DRY but loses a lot:
- Sanity Studio's "create new" UX gets worse (one type with a 50/50 dropdown).
- Cross-references from `material.processes` lose their type-safety target.
- Search and filter in studio mix unrelated documents.
- Deletes the option to give print and laser distinct fields later (e.g., `infillRange` on print only).

**Recommendation: two document types, one shared `process` enum, one shared `material` schema.** This matches what Sanity itself recommends for distinct content kinds and matches every public Sanity ecommerce reference example.

### `product` (Bundle 3, defer detailed schema)

Outline only — finalize during Bundle 3 planning:

```javascript
{
  name: 'product',
  type: 'document',
  fields: [
    { name: 'title' }, { name: 'slug' }, { name: 'price' },
    { name: 'currency', initialValue: 'USD' },
    { name: 'description' },
    { name: 'images' },
    { name: 'available', type: 'boolean' },
    { name: 'stock', type: 'number' },          // optional, drives sold-out badges
    { name: 'service', type: 'reference', to: [{ type: 'process' }] },  // 'laser' | 'print'
    { name: 'materials', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'material' }] }] },
    // platform-specific:
    //   if Snipcart: nothing extra needed
    //   if Stripe:   { stripeProductId, stripePriceId }
    //   if Shopify:  shop is canonical; Sanity not used
  ],
}
```

## Bundle Build Order & Dependencies

```
Bundle 1: Spruce + 3D printing launch
─────────────────────────────────────
  Foundation (must land first, in this order):
    F1. Move dark-theme out of App.js render → useEffect or static class
    F2. Create useSanityQuery hook
    F3. Create data/services.js + ServicesContext + SingleServiceContext
    F4. Create components/services/* (rename from projects/)
    F5. Convert ProjectGallery's imperative modal to state-driven

  Net-new (depends on F1–F5):
    N1. Add /3d-printing routes
    N2. Move Materials.jsx → MaterialsSection.jsx (with serviceKey filter)
    N3. Update Home hero/nav for both services
    N4. Add /shop "Coming Soon" route
    N5. Update ContactForm for service pre-fill
    N6. Update public/index.html hidden form to add `service` field

  Cleanup (after net-new):
    C1. Delete src/data/projects.js
    C2. Delete src/components/projects/
    C3. Delete src/context/ProjectsContext.jsx + SingleProjectContext.jsx
    C4. Delete src/pages/Materials.jsx
    C5. Delete dead useThemeSwitcher + commented-out code
    C6. Delete src/components/contact/contact-form.js

Bundle 2: Auto-pricing quote
────────────────────────────
  Depends on: Bundle 1 F2 (useSanityQuery), F3 (services context)
  Net-new:
    Q1. Add netlify.toml + netlify/functions/ scaffold
    Q2. utilities/stl.js (Three.js STLLoader + volume math)
    Q3. utilities/pricing.js (rate × volume × material density)
    Q4. components/quote/* (FileDropzone, MaterialPicker, PriceDisplay)
    Q5. pages/Quote.jsx + pages/QuoteResult.jsx + routes
    Q6. netlify/functions/quote.js (validate + email owner via Resend)
    Q7. Add CTA from /3d-printing and /styles to /quote with state

Bundle 3: Shop
──────────────
  Depends on: Bundle 1 (mature ServicesContext pattern, service tagging)
  Decision phase first:
    D1. Pick platform (Snipcart / Stripe+Sanity / Shopify) based on
        catalog size and operations preferences at that moment
  Net-new (Snipcart path):
    S1. Add Snipcart script + API key to public/index.html
    S2. Sanity 'product' schema (owner)
    S3. components/shop/ProductGrid + ProductDetail
    S4. pages/Shop.jsx (real) + pages/ShopProductSingle.jsx
    S5. netlify/functions/snipcart-webhook.js (record order to Sanity, optional)
  Net-new (Stripe+Sanity path adds, instead of S1–S5):
    S1'. context/CartContext.jsx (localStorage-backed)
    S2'. components/shop/CartButton.jsx + CartDrawer
    S3'. netlify/functions/checkout.js (create Stripe Checkout session,
         re-validate prices from Sanity server-side)
    S4'. netlify/functions/stripe-webhook.js (mark order paid in Sanity)
```

**Critical bundle-1 foundational refactors that unblock 2 and 3:**

1. **`useSanityQuery` hook** — without it Bundle 2's quote material picker reinvents loading/error.
2. **`netlify.toml` + `netlify/functions/` directory** — not strictly needed for Bundle 1, but adding an empty `netlify/functions/.gitkeep` and a minimal `netlify.toml` during Bundle 1 means Bundle 2 doesn't have to coordinate with the deploy config.
3. **`process` reference type on `material`** — enables MaterialsSection to filter by service in Bundle 1, AND will be re-used to tag `product` documents in Bundle 3.
4. **`services` constant** — replaces `capabilitiesTitle`. Bundle 2's Quote page reads this to know which services to offer; Bundle 3's product schema references it.
5. **State-driven modals** — Bundle 2's quote-result page and Bundle 3's cart drawer both want overlays; doing one correctly in Bundle 1 (`ProjectGallery` cleanup) sets the pattern.

If those five land in Bundle 1, Bundles 2 and 3 add only domain-specific code — no foundational rework.

## Scaling Considerations

This site's traffic ceiling for the foreseeable future is "local marketing" — hundreds of monthly visitors, dozens of quote submissions, dozens of orders. Scaling discussion is therefore minimal and centered on the only paths that have failure modes.

| Scale | What changes |
|-------|--------------|
| 0–500 visitors/mo | Current architecture handles trivially. Sanity CDN free tier covers it. Netlify Forms free tier (100 submissions/mo) is the first thing to watch. |
| 500–5k visitors/mo | Same architecture. Netlify Forms might hit the 100/mo cap; upgrade plan or move quote/contact to a Function that emails directly. |
| 5k+ visitors/mo, real shop | Cart abandonment analytics, inventory truth source matters. If Snipcart, switch to webhook-driven Sanity inventory; if Stripe, the function-based approach already does this. |

### First bottlenecks to expect

1. **Netlify Forms quota** (100/mo free, 1000/mo on Pro) — quote form contributes to this if it shares the contact form route. Solution: quote submissions go through a Function, not Netlify Forms.
2. **Sanity CDN read costs** at the free tier — only a real concern if uncached re-fetches happen on every page. The Context pattern already mitigates this; `useSanityQuery` keeps it that way.
3. **Function cold start** — Netlify Functions cold-start in 200–500ms typically. Quote response time should still feel instant (<2s end-to-end).

### Non-bottlenecks (premature)

- React rendering performance — the catalog will be tens, not thousands, of items.
- Bundle size — already acceptable with code splitting; adding Three.js (~150 KB gzipped) for Bundle 2 only on `/quote` via lazy import is fine.
- Database — there is no database. Sanity is the database.

## Anti-Patterns

### Anti-Pattern 1: Stripe secrets in the client bundle

**What people do:** Put `STRIPE_SECRET_KEY` in a `REACT_APP_*` env var thinking CRA env vars are private.
**Why it's wrong:** All `REACT_APP_*` vars are inlined at build time and shipped in the JS bundle. Anyone can extract the secret.
**Do this instead:** Server-side keys live exclusively in Netlify environment variables, accessed only inside `netlify/functions/*`. Public Stripe key (`pk_live_...`) is fine in the bundle. Same rule for Sanity write tokens, Resend API keys.

### Anti-Pattern 2: Trusting client-computed prices

**What people do:** Bundle 2 quote computes price client-side, ships it to a Function, function emails it as the official quote.
**Why it's wrong:** Client can manipulate price field before POST.
**Do this instead:** Function recomputes from material rate (queried from Sanity) + uploaded volume estimate (or even better, re-derives from the file's metadata in a follow-up if file persists). For Bundle 2 MVP where the price is "ballpark, owner confirms manually," it is acceptable to ship the client-side number — but the email must say "ballpark requested by visitor" not "official quote."

### Anti-Pattern 3: Two parallel materials/products fetches per page

**What people do:** ServiceSingle fetches its style data in a Context; MaterialsSection on the same page fires its own GROQ for materials; ProductDetail on a shop page fires three more for variants. Each is a separate roundtrip.
**Why it's wrong:** Slow page loads, brittle loading states.
**Do this instead:** Either combine into one GROQ projection (`*[_type == "print-style" && slug.current == $cap][0]{ ..., "materials": *[_type == "material" && ...]{...} }`) or accept two requests but handle loading uniformly via `useSanityQuery`. Combining into one is preferred for ServiceSingle since it's the only place both are rendered.

### Anti-Pattern 4: Renaming `capabilitiesTitle` and breaking everything

**What people do:** During Bundle 1 cleanup, search-replace `capabilitiesTitle` to something else without checking AppHeader and the route.
**Why it's wrong:** It's a load-bearing constant — `App.js`, `AppHeader.jsx`, `ProjectsFilter.jsx`, `ProjectsGrid.jsx` all consume it.
**Do this instead:** During Bundle 1, replace the single constant with `SERVICES` array everywhere it's used, then delete the constant in the cleanup phase.

### Anti-Pattern 5: Background functions for user-facing endpoints

**What people do:** Move slow operations to Netlify Background Functions to "avoid timeout."
**Why it's wrong:** Background functions return 202 immediately and never deliver a result back to the page ([Netlify Background Functions docs](https://docs.netlify.com/build/functions/background-functions/)). The user gets no quote.
**Do this instead:** Keep client-side compute heavy, server-side compute light. If we ever truly need long server work, use polling: synchronous function returns a `quoteId`, browser polls `GET /quote/:id` (another function) every 2s, background function writes the result to Sanity which the polling endpoint reads. For Bundle 2 this is overkill — keep it simple.

### Anti-Pattern 6: Snipcart cart state duplicated in React Context

**What people do:** Build a `CartContext` "just to be safe" alongside Snipcart's own global cart.
**Why it's wrong:** Two sources of truth; out of sync; one update path doesn't fire the other.
**Do this instead:** If Snipcart, use `window.Snipcart.api` exclusively. If you need React reactivity to cart events, subscribe to Snipcart's events (`Snipcart.events.on('cart.confirmed', ...)`) and surface them in a thin `useSnipcartCart` hook — but never store cart items in your own state.

## Integration Points

### External Services

| Service | Integration | Notes |
|---------|-------------|-------|
| Sanity (read) | `@sanity/client` `useCdn: true`, anonymous | Already in place. Continue. |
| Sanity (write) | `@sanity/client` with token, **only inside `netlify/functions/*`** | Bundle 2+. Token stored as Netlify env var, never in CRA bundle. |
| Netlify Forms | POST x-www-form-urlencoded to site root, hidden `<form>` in `public/index.html` | Already in place. Add `service` field for Bundle 1. |
| Netlify Functions | `netlify/functions/*.js` autodiscovered; configure with `netlify.toml` | New for Bundle 2. Pin Node version, set `[functions]` directory and `[functions.quote] timeout=26` if needed. |
| Resend / Postmark / SendGrid | HTTP API call from inside a Function | Bundle 2 for quote notifications. Resend is simplest. |
| Snipcart | `<script src="https://cdn.snipcart.com/...">` + data attributes on buttons | Bundle 3 (if chosen). |
| Stripe | Server-side: `stripe` Node SDK in a Function for Checkout sessions; client-side: `@stripe/stripe-js` only if using Elements (Checkout doesn't need it for redirect flow) | Bundle 3 (if chosen). |
| Cloudinary / S3 | Direct browser upload via signed URL from a Function | Bundle 2 (only if owner wants the file, not the metadata). |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Pages ↔ Contexts | Provider wrapping; `useContext` consumption | Standard React. Page mounts the provider for the data it needs. |
| Contexts ↔ Sanity | Through `sanityClient.fetch` (or via `useSanityQuery`) | Single client singleton, no per-context client variance. |
| Components ↔ Netlify Functions | `fetch('/.netlify/functions/<name>', { method: 'POST', ... })` | Same-origin, no CORS issue. |
| Browser ↔ Snipcart globals | `window.Snipcart.api`, custom data attributes on DOM | Avoid in tests; mock at integration boundary. |
| Components ↔ Router state | `useLocation()`, `useParams()`, `<Link state={...}>` | Use state for in-app referral; query params for deep links. |

## Sources

- [Netlify Functions overview](https://docs.netlify.com/build/functions/overview/) — synchronous timeout 10s default, 26s on Pro/Enterprise (HIGH confidence, official docs)
- [Netlify Background Functions](https://docs.netlify.com/build/functions/background-functions/) — 15-minute limit, 202 immediate response, no result delivery (HIGH)
- [React Router v6 useLocation hook](https://reactrouter.com/en/main/hooks/use-location) — `state` prop pattern for passing referrer data (HIGH)
- [Sanity GROQ specifications](https://www.sanity.io/docs/specifications/groq-operators) — reference dereferencing, `in` membership, filter patterns (HIGH)
- [Sanity reference filter docs](https://www.sanity.io/docs/studio/reference-type) — reference field schema and filter behavior (HIGH)
- [Three.js STL Loader](https://sbcode.net/threejs/loaders-stl/) — browser-side STL parsing (HIGH)
- [johannesboyne/node-stl](https://github.com/johannesboyne/node-stl) — alternative server-side STL volume parsing if needed (MEDIUM)
- [Snipcart vs Stripe comparison](https://snipcart.com/blog/stripe-checkout-form-integration-vs-snipcart) — integration shape, when each fits (MEDIUM, vendor blog so naturally biased; cross-checked against StackShare and ecomm.design)
- [Sanity + Stripe ecommerce guide](https://www.sanity.io/guides/building-ecommerce-sites-with-the-stripe-api) — canonical integration pattern (HIGH)
- [Snipcart Sanity integration page](https://www.sanity.io/exchange/integration=snipcart) — confirms standard pattern (HIGH)
- [Shopify vs Snipcart comparison](https://ecomm.design/shopify-vs-snipcart/) — cost and architecture differences (MEDIUM)
- Internal: `.planning/PROJECT.md` (decisions, constraints) — HIGH
- Internal: `.planning/codebase/ARCHITECTURE.md` (current state, anti-patterns) — HIGH
- Internal: `.planning/codebase/STRUCTURE.md` (file conventions, where to add) — HIGH

---

*Architecture research for: Shapesmith Studio — Bundle 1 (3D printing surface + spruce), Bundle 2 (auto-pricing quote), Bundle 3 (pre-made-goods shop)*
*Researched: 2026-05-02*
