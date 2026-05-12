# Stack Research

**Domain:** Maker-studio service site — laser cutting + 3D printing — adding a new service surface, file-upload quote tool, and pre-made-goods shop on top of an existing CRA + Sanity + Netlify SPA.
**Researched:** 2026-05-02
**Confidence:** HIGH for additions to the existing stack; MEDIUM for the slicer/pricing path (genuinely fragmented ecosystem); MEDIUM for the e-commerce choice (informed by inventory size, which is unknown).

This document covers ONLY the new additions. The existing core (React 18, CRA 5, Tailwind 3, `@sanity/client`, Netlify Forms, `framer-motion`, `react-router-dom` 6) is untouched and out of scope per the milestone constraints.

---

## TL;DR — One Sentence Per Bundle

| Bundle | Recommendation |
|--------|----------------|
| **Bundle 1 — Spruce + 3D printing launch** | Add `@sanity/image-url@^2.1` for responsive Sanity images; that's it. No new runtime dependencies. |
| **Bundle 2 — Auto-pricing quote** | `react-dropzone` + `three@^0.169` (with `STLLoader` from `three/examples/jsm`) + `@react-three/fiber@^8.18` + `@react-three/drei@^9.122` for STL preview; `dxf@^5.3` for DXF parsing/SVG render; native `DOMParser` for SVG; **a Netlify Function with custom volume math** for ballpark pricing (NOT cura-wasm, NOT Slant3D). Files <6 MB go through the function directly; larger files go via S3 pre-signed URL → Netlify Function processes the URL. |
| **Bundle 3 — Shop** | **Snipcart** if inventory ≤ ~50 SKUs and you want to stay on CRA with zero CMS rework. **Shopify Storefront API Client** if you expect to scale past that or want first-class shipping/tax/inventory tooling. **Stripe Checkout via Netlify Functions + Sanity** is the third option but only if products are exclusively managed in Sanity and the catalog is small. Don't use Shopify Buy SDK — deprecated Jan 2025. |
| **Cross-cutting** | **Plausible** for analytics ($9/mo, single script tag, SPA-aware). Image pipeline already lives in Sanity — just use `@sanity/image-url`. |

---

## Recommended Stack

### Bundle 1 — Spruce + 3D printing launch (NEW DEPENDENCIES)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@sanity/image-url` | `^2.1.1` | Build responsive, on-the-fly resized image URLs from Sanity image refs | Already implied by the existing Sanity stack; the placeholder→real-photo transition will be much smoother with `width()/height()/dpr()/quality()` URL chaining than rolling your own. The current code uses `asset->url` raw, which ships full-size CDN originals — fine for placeholders but expensive once real photography lands. ([npm](https://www.npmjs.com/package/@sanity/image-url), [docs](https://www.sanity.io/docs/apis-and-sdks/image-urls)) |

**That's it.** No new framework, no new state lib, no new router. The "spruce" is design + a new Sanity content type + a refactor (kill imperative modal, move dark-theme out of render). All those land within the existing dependency surface.

### Bundle 2 — Auto-pricing quote (NEW DEPENDENCIES)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `react-dropzone` | `^15.0.0` (latest is 15.0.0; works back to React 16.8) | Drag-and-drop file picker | De-facto standard for React file uploads. Hooks API (`useDropzone`), works with any backend, accepts MIME + extension filters (so we can gate to `.stl,.3mf,.svg,.dxf`). Note: it does NOT upload — we own the POST, which is what we want anyway. ([npm](https://www.npmjs.com/package/react-dropzone), [docs](https://react-dropzone.js.org/)) |
| `three` | `^0.169.0` (or any version ≥0.137 that R3F v8 supports; latest at writing is 0.184) | STL/3MF parsing + WebGL rendering | The actively maintained official package owns all the loaders we need: `STLLoader` (from `three/examples/jsm/loaders/STLLoader.js`), `ThreeMFLoader`, and `SVGLoader`. **Do NOT** install separate npm packages like `three-stl-loader` (last update 9 years ago) or `three-stl-net-loader` (6 years). The official three.js loaders ship as ES modules in the same package. ([three docs](https://threejs.org/docs/pages/STLLoader.html)) |
| `@react-three/fiber` | `^8.18.0` (the last v8 line, peer-pinned to `react@>=18 <19`) | React renderer for three.js | **Critical version pin:** v9.x requires React 19, which conflicts with our React 18 constraint. The 8.x line is mature, stable, and exactly compatible with our setup. Lets us write `<Canvas>` and `<mesh>` in JSX instead of imperative three.js. ([npm versions](https://www.npmjs.com/package/@react-three/fiber)) |
| `@react-three/drei` | `^9.122.0` (the last v9; v10 requires React 19 + R3F 9) | High-level R3F helpers (`OrbitControls`, `Bounds`, `Center`, `Stage`) | Saves writing camera/lighting boilerplate. **Same v8/v9 pinning rule as fiber** — drei 10.x is React 19 only. v9.122.0 is the last patch on the R3F v8 / React 18 line. |
| Netlify Functions (built-in) | — | Server-side STL volume math, price calculation, S3 pre-signed URL minting | Lets us keep the SPA static while moving CPU-bound work (volume integration on a binary STL, signature minting) off the client. No Next.js migration needed. The free tier (125k invocations/mo) is more than enough for a marketing-site quote tool. |

### Bundle 3 — Pre-made-goods shop (PRIMARY RECOMMENDATION + ALTERNATIVES)

Three viable paths, ordered by fit-for-this-codebase. Pick ONE during the shop bundle's discovery phase, after counting SKUs and deciding how much owner-operations work is acceptable.

#### Path A — Snipcart (recommended default)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Snipcart v3 (script tag) | current | Cart, checkout, inventory, taxes, shipping all-in-one | Designed exactly for "static SPA + I have HTML for products." You add `class="snipcart-add-item"` plus `data-item-id/name/price/url` to a button anywhere in the React tree, and it Just Works. No backend, no server functions. Plays nicely with Sanity-managed product catalogues — products live in Sanity, the buy button is a thin React component. ([install docs](https://docs.snipcart.com/v3/setup/installation), [products docs](https://docs.snipcart.com/v3/setup/products)) |

**Cost:** 2% transaction fee on top of Stripe/PayPal fees, with a $20/mo minimum if monthly sales <$1k. ([Snipcart vs Stripe Checkout](https://snipcart.com/blog/stripe-checkout-form-integration-vs-snipcart))

**Lock-in:** Low — products are in Sanity, only cart/checkout is Snipcart. Migrate by replacing the buy button.

#### Path B — Shopify Storefront API Client (recommend if catalog grows)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@shopify/storefront-api-client` | `^1.0.10` | GraphQL client for Shopify products + cart + checkout | This is Shopify's CURRENT recommended JS client. **Do NOT use `shopify-buy` — the JS Buy SDK was deprecated January 2025 and reaches end-of-life Jan 1 2026.** ([deprecation notice](https://shopify.dev/changelog/js-buy-sdk-deprecation-notice)) The Storefront API Client is a thin GraphQL wrapper; the cart and checkout flows are now built around the Cart API, not the deprecated Checkout API. |

**Cost:** Shopify Starter plan is $5/mo; transaction fees apply on top. Best if the studio plans to scale, wants Shopify's shipping/inventory/tax tooling, and doesn't mind that Shopify (not Sanity) becomes the product source-of-truth.

**Lock-in:** Higher — products live in Shopify admin, not Sanity. Switching providers requires data migration.

#### Path C — Stripe Checkout via Netlify Function + Sanity products (only if catalog is tiny + curated)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `stripe` (in a Netlify Function only) | latest | Server-side Checkout Session creation | Stripe Checkout itself is hosted; the only "server" code is a Netlify Function that creates the session and returns the URL. Stripe redirects users to its own page for card capture — no PCI scope. ([example](https://www.netlify.com/blog/2021/06/30/e-commerce-checkout-with-angular-netlify-functions-and-the-stripe-api/)) |
| `@stripe/stripe-js` | latest | `redirectToCheckout()` helper on the client | Tiny client-side shim that does nothing except push the user to Stripe's hosted page after the function returns the session ID. |

**Cost:** Stripe fees only (no SaaS markup). Cheapest of the three, but you build cart/inventory/email logic yourself.

**Why not as default:** No native cart UI, no inventory tracking, no tax automation. Forces us to build cart state ourselves, which violates the "small marketing site" disposition. Only worth it if the shop is, say, 5–20 hand-curated products that rarely change.

#### What NOT to use for shop

| Avoid | Why |
|-------|-----|
| `shopify-buy` (JS Buy SDK) | **Deprecated January 2025**, EOL January 2026. Even if you ship before EOL, you'd be wiring up a dead library. ([changelog](https://changelog.shopify.com/posts/discontinued-support-for-javascript-buy-sdk)) |
| Shopify Hydrogen | Hydrogen is a full-stack React framework (Remix-based). It would force a Next.js-class migration off CRA, which is explicitly out of scope. |
| Foxy.io | Viable but smaller community, less documentation than Snipcart for the React-on-static use case. Not enough differentiation to justify the discovery cost. |
| Self-hosted Medusa / Saleor / Shopify CLI on Node | All require running an actual backend. The whole point of staying on CRA + Netlify is "no servers to operate." |

### Cross-cutting additions

| Tool | Purpose | Notes |
|------|---------|-------|
| **Plausible Analytics** | Privacy-first marketing analytics | $9/mo for 10k pageviews, single script tag in `public/index.html` `<head>`, automatic SPA pushState support — no manual route tracking needed for `react-router-dom`. ([SPA support docs](https://plausible.io/docs/spa-support)) Critical for "is the marketing actually working" — the whole reason for the relaunch. **Recommended over Fathom** because it's ~50% cheaper at the same traffic tier. **Recommended over GA4** because GA4's setup is heavy, requires cookie-consent banners under most jurisdictions, and the data is sampled at the free tier. |
| Netlify Functions (Bundle 2) | Server-side STL math + (later) Stripe session minting | Keeps everything serverless. No `netlify.toml` exists today; one will need to be added at the first function. Free tier covers 125k invocations/mo. Hard limit: **6 MB request body** for synchronous functions ([source](https://docs.netlify.com/build/async-workloads/limitations/)) — relevant for the file-upload flow. |
| AWS S3 (or Cloudinary or Netlify Blobs) | Direct browser→storage uploads when files exceed 6 MB | Pattern: client requests a pre-signed upload URL from a Netlify Function, browser PUTs directly to S3 / Cloudinary, then a second Function reads from storage to do the volume calc. Avoids routing 50+ MB STLs through Netlify Functions. ([example](https://www.bennadel.com/blog/3887-proxying-amazon-aws-s3-pre-signed-url-uploads-using-netlify-functions.htm)) Netlify Blobs is the simplest of the three if you don't already have AWS — ships built-in to Netlify, no separate signup. |

---

## Detailed Recommendations by Question

### 1. File-upload preview UX (STL / 3MF / SVG / DXF)

**Recommendation:** `react-dropzone` for the picker; `three` (with its bundled `STLLoader`, `ThreeMFLoader`, `SVGLoader`) wrapped by `@react-three/fiber@^8.18` and `@react-three/drei@^9.122` for the live 3D preview; `dxf@^5.3` for DXF (which doesn't have a three.js loader).

**Why this combination:**

- **React 18 + R3F v8 is a hard pin.** R3F v9 and drei v10 require React 19. Don't be tempted by latest-version-numbers — they don't apply to us.
- **Use the loaders that ship inside `three`.** The standalone `three-stl-loader` and `three-stl-net-loader` packages are abandoned (6–9 years old). The official `STLLoader` lives at `three/examples/jsm/loaders/STLLoader.js` and is maintained as part of three.js itself. ([three docs](https://threejs.org/docs/pages/STLLoader.html))
- **`react-stl-viewer`** (the most-Googled prebuilt component) hasn't seen a release in 12+ months ([snyk advisor](https://snyk.io/advisor/npm-package/react-stl-viewer)) — skip it. R3F + drei gives you `<Canvas><Bounds><Center>...<mesh geometry={geom} /></Center></Bounds><OrbitControls /></Canvas>` in ~30 lines, and you control every behavior.
- **DXF has no three.js loader,** so `dxf@^5.3.1` (npm package name is just `dxf`, by skymakerolof) is the active path. v5 is the most recent, ~7 months old at time of research. It can render to native SVG, which means the same DXF parser doubles as the laser-cut preview render path. ([npm](https://www.npmjs.com/package/dxf))
- **SVG needs nothing.** Just use the browser's built-in `DOMParser` → inline the parsed SVG → measure with `getBBox()`. For per-path length math (used to estimate laser-cut time), three.js's `SVGLoader` exposes `Path.getLength()` if needed.
- **3MF** is loaded via three.js's `ThreeMFLoader` (also in `three/examples/jsm/loaders/`). For pure parsing without three.js, `three-mf@^5.3` is an option, but since we're already pulling three for STL there's no reason to add a second 3MF library.

**Confidence:** HIGH. R3F + drei is the standard React-on-three.js stack with millions of weekly downloads and is what every contemporary "STL viewer" tutorial recommends in 2024–2026.

### 2. Slicer / pricing estimation

**Recommendation:** Roll your own ballpark math in a Netlify Function. **Do NOT integrate cura-wasm or use Slant3D for pricing.**

**Reasoning:**

- **Cura-WASM is deprecated.** The original `cura-wasm` npm package (Cloud-CNC) is marked deprecated by its author. There's a fork at `@toybox-labs/cura-wasm@1.5.4` but it's unmaintained-feeling, and slicing in-browser with WebAssembly is heavy: bundle size (~10–20 MB of WASM), slow on mid-range mobile, and doing real slicing for a ballpark price is overkill. ([cura-wasm npm](https://www.npmjs.com/package/cura-wasm), [@toybox-labs fork](https://www.npmjs.com/package/@toybox-labs/cura-wasm))
- **Slant3D's API** is for outsourcing the actual print to their print farm — not for getting a price quote you'd then fulfill yourself on a Bambu H2D. Free tier is "no API fees" but you only pay when ordering a real part from them. It would be the right answer if the studio wanted to drop-ship through Slant3D, but that's not the model here. ([Slant3D API](https://www.slant3d.com/slant-3d-printing-api))
- **`node-stl@^0.7.3`** — the npm package for STL volume parsing — is 3 years stale ([npm](https://www.npmjs.com/package/node-stl)). The math is, however, simple enough to write in ~50 lines: parse the binary STL header, iterate triangles, sum signed tetrahedron volumes from the origin. The same loop yields bounding box and surface area, all needed for ballpark pricing.

**Pricing formula (server-side, in a Netlify Function):**

```
ballpark_price = base_setup_fee
                 + (volume_cm3 × material_density × $/g)         // material cost
                 + (estimated_print_hours × $/hr_machine_rate)   // machine time
                 + markup
```

Where `estimated_print_hours` is a heuristic from volume + bounding box height + a typical-infill assumption (e.g., ~25 cm³/hour at 0.2 mm layer height for FDM). This is **a ballpark, not a slicer-accurate quote** — and the contact form makes it crystal clear that the studio owner will confirm before booking. That's the right product trade-off; users get instant feedback without us shipping a 20 MB WASM slicer.

For laser cutting, the math is even simpler: total path length (from `dxf` library or `SVGLoader.Path.getLength()`) × cut speed → minutes × machine rate, plus material cost (sheet area × $/cm²).

**If higher accuracy is needed later:** Run real Cura-Engine in a Netlify Background Function (15-min timeout) using a Linux binary; takes the slicer off the critical path. That's a Bundle-2-v2 problem, not a Bundle-2-v1 problem.

**Confidence:** MEDIUM. The pricing-formula approach is well-documented by hobby calculators (calculator.academy, stl-estimator-nodejs reference impls), but every shop calibrates differently. Plan to expose the rate constants in Sanity or env vars so the owner can tune them without redeploying code.

### 3. Sanity schema patterns for `print-style`

**Recommendation:** Mirror the existing `laser-style` schema as `print-style`, plus add a shared `service` reference field if the studio later wants a unified quote engine over both.

**Specifics (since the owner will edit Sanity Studio themselves):**

- New document type `print-style` with the same field shape as `laser-style`: `title`, `slug`, `description`, `coverImage`, `gallery[]`, `materials[]` (reference to existing `material` docs), `order` for sorting, plus 3D-specific fields like `defaultLayerHeight`, `compatiblePrinters`.
- The existing `material` schema doesn't need a parallel `print-material` — just add a `serviceCategories[]` enum field (`["laser", "3d-print"]`) so a single material document can apply to one or both services. Filament PLA is 3d-print only; ¼" plywood is laser only; the field handles both cleanly without schema duplication.
- Mirror the `ProjectsContext` pattern from the existing codebase: create `src/context/PrintStylesContext.jsx` and `src/context/SinglePrintStyleContext.jsx`. The `PROJECT.md` Active section already mandates this and the new STACK.md doesn't change that direction.

No new Sanity dependencies needed — `@sanity/client` already handles GROQ queries.

**Confidence:** HIGH. The `laser-style` pattern is right there in the codebase to copy.

### 4. Form-to-email infrastructure with file uploads

**Recommendation:** **Don't bend Netlify Forms to handle large quote uploads.** Use a Netlify Function + direct-to-storage flow.

**Why Netlify Forms is wrong for the quote feature:**
- Hard 8 MB request limit. ([Netlify support](https://answers.netlify.com/t/the-form-request-has-a-maximum-size-limit-of-8-mb/112079)) STLs from a hobbyist's CAD are routinely 10–50 MB.
- Free tier total storage is 10 MB *per billing period* — you'd burn through it on a single quote. Paid tiers exist but the per-submission cost compounds.
- Single-file-per-field constraint plus 30-second upload timeout. ([same forum thread](https://answers.netlify.com/t/file-upload-limits-on-forms/136798))

**Why Formspree/Web3Forms aren't a good answer either:**
- Formspree puts file uploads behind paid tiers ([alternatives comparison](https://web3forms.com/alternatives/formspree-alternative)).
- Both are still "submit-the-file-to-the-form-service" — same large-file headache, different vendor.

**Recommended flow:**

1. User picks a file with `react-dropzone`.
2. Browser POSTs file metadata (name, size, type) to a Netlify Function `mint-upload-url`.
3. Function returns a pre-signed S3 (or Netlify Blobs) URL valid for one PUT.
4. Browser PUTs the file directly to storage (bypasses the 6 MB function payload limit entirely).
5. Browser POSTs `{ uploadKey, material, options, customerEmail }` to a second Netlify Function `submit-quote`.
6. `submit-quote` reads the file from storage, runs volume math, computes price, emails the studio owner via SendGrid / Resend / Postmark, and returns the quote to the UI.
7. Keep the existing simple Netlify Form flow for the spruce-bundle contact form (Bundle 1) — it works fine for plaintext.

**Storage choice:**
- **Netlify Blobs** — easiest if you're already on Netlify; no AWS account, no signing to think about. New-ish (announced 2024) but stable. Recommend this.
- **Cloudinary** — overkill unless you also want image transformations on the uploaded file (we don't).
- **S3** — most flexible but requires AWS account + IAM + signed URL implementation. Use only if Netlify Blobs proves limiting.

**Email sending:** Resend is the simplest 2026 choice (free tier: 3k emails/mo, simple SDK, deliverability is on par with Postmark). SendGrid still works but the developer experience is heavy.

**Confidence:** HIGH on the architecture; MEDIUM on Netlify Blobs specifically (newer than S3, less battle-tested).

### 5. Image optimization for the placeholder→real-photo transition

**Recommendation:** `@sanity/image-url@^2.1.1` + a thin `<SanityImage>` component that sets `srcSet`, `sizes`, and `loading="lazy"`.

**Why:**
- Sanity's image CDN already does on-the-fly resize/quality/DPR; we just need to ask for the right URLs.
- The current code reads `asset->url` raw, which always returns the full-size original. Once real photography lands (5–15 MB raw camera images for hero shots), this will tank LCP.
- `@sanity/image-url` is the official builder — chainable methods (`.width(800).height(600).dpr(2).quality(80).auto('format').url()`). v2.1.1 is current as of April 2026.
- Sanity also auto-serves AVIF/WebP via `.auto('format')` — no per-format work needed.

**Component pattern:**
```js
const builder = imageUrlBuilder(sanityClient);
const url = (img, w) => builder.image(img).width(w).auto('format').url();
// then in JSX:
<img
  src={url(coverImage, 800)}
  srcSet={`${url(coverImage, 400)} 400w, ${url(coverImage, 800)} 800w, ${url(coverImage, 1200)} 1200w`}
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="lazy"
/>
```

**Don't reach for `next-sanity-image`** — it requires Next.js (out of scope), and CRA doesn't have an `<Image>` equivalent worth wrapping.

**Confidence:** HIGH.

### 6. Lightweight analytics

**Recommendation:** **Plausible**, $9/mo for 10k pageviews.

**Why over GA4:**
- GA4 setup is multi-page-property-stream-tag-conversion-event hell. For a marketing site whose goal is "did the relaunch work", GA4 is overkill.
- GA4 free tier has data sampling, slow processing, and (in most jurisdictions) requires a cookie-consent banner because it sets identifying cookies. Plausible doesn't.
- "Free" GA4 has hidden costs in implementation time. Plausible is one script tag and a dashboard.

**Why over Fathom:**
- Fathom is similar quality but ~50% pricier at the same traffic ($14 vs $9 entry tier). ([comparison](https://allisonseboldt.com/replacing-universal-analytics-plausible-vs-fathom-vs-simple-analytics/))
- Fathom has slightly better goal funnels, but for a 5-page marketing site the difference is academic.

**Why over self-hosted (Umami, Matomo):**
- Defeats the "no backend" constraint.

**Setup:**
- Add Plausible's script tag to `public/index.html` `<head>`.
- Plausible auto-detects `pushState` so SPA route changes are tracked without code changes.
- A custom event for "quote submitted" can be fired from the Bundle 2 quote handler with `window.plausible('Quote Submitted', { props: { service: '3d-print' }})`.

**Confidence:** HIGH.

---

## Installation

```bash
# Bundle 1 — Spruce + 3D printing launch
pnpm add @sanity/image-url

# Bundle 2 — Auto-pricing quote (when bundle starts)
pnpm add react-dropzone three @react-three/fiber@^8 @react-three/drei@^9 dxf
# Note: pin R3F to ^8 and drei to ^9 to stay compatible with React 18

# Bundle 2 — Server side (Netlify Functions, no client deps)
# In netlify/functions/, add a package.json with:
pnpm add --filter ./netlify/functions @netlify/blobs resend
# (or aws-sdk if using S3 instead of Netlify Blobs)

# Bundle 3 — Path A (Snipcart) — script tag in public/index.html, no npm dep needed
# Bundle 3 — Path B (Shopify) — only if Shopify path is chosen
pnpm add @shopify/storefront-api-client
# Bundle 3 — Path C (Stripe) — only if Stripe path is chosen
pnpm add @stripe/stripe-js
# (server side, in netlify/functions/, add: stripe)

# Cross-cutting
# Plausible — script tag in public/index.html, no npm dep needed
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `three` + R3F v8 + drei v9 | `react-stl-viewer` | Never — last npm release is 2+ years stale; if you want a one-line solution, accept the staleness, but you'll lose the ability to control camera/lighting/measurement readout. |
| `@react-three/fiber@^8` | `@react-three/fiber@^9` | Only if you migrate the codebase to React 19 — at which point the migration cost is significant and out of scope. |
| Custom Netlify Function for STL volume math | `@toybox-labs/cura-wasm` (the maintained Cura-WASM fork) | Use cura-wasm only if a ballpark formula proves too inaccurate AND the studio is willing to ship a ~15 MB WASM bundle to clients. Run it server-side in a Netlify Background Function (15-min timeout), not in-browser. |
| Custom Netlify Function for STL volume math | `Slant3D API` | Use Slant3D only if the studio decides to drop-ship orders to Slant3D's print farm rather than print on the Bambu in-house. Different business model entirely. |
| Snipcart | Shopify Storefront API Client | Use Shopify when SKU count >50, when shipping/inventory complexity grows, or when the owner wants Shopify's mobile admin app for fulfillment workflow. |
| Snipcart | Stripe Checkout + Sanity products + Netlify Function | Use Stripe direct only when the shop is 5–20 hand-curated SKUs that change rarely, AND the owner is willing to forgo cart UX (Stripe Checkout is single-product unless you build the cart yourself). |
| `dxf` (skymakerolof) | `dxf-parser` (gdsestimating) | `dxf-parser` is 4 years stale; reach for it only if `dxf` lacks a feature you need (it shouldn't — `dxf` is the actively-maintained successor). |
| Plausible | Self-hosted Umami | Use Umami only if you have an existing VPS and care about $9/mo. Operating a database for marketing analytics on a one-person studio site is a poor trade. |
| Plausible | GA4 | Use GA4 only if the studio runs paid ad campaigns at scale and needs the Google Ads integration. Not the case here. |
| Netlify Blobs | AWS S3 + presigned URLs | Use S3 if you already have AWS infrastructure or expect to grow beyond Netlify's quota model. For "store quote uploads for a week then forget them," Netlify Blobs is simpler. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `shopify-buy` (JS Buy SDK) | Deprecated Jan 2025, EOL Jan 1 2026. ([changelog](https://changelog.shopify.com/posts/discontinued-support-for-javascript-buy-sdk)) | `@shopify/storefront-api-client` if going the Shopify route. |
| `cura-wasm` (Cloud-CNC, original) | Deprecated by author. ([npm](https://www.npmjs.com/package/cura-wasm)) | Custom Netlify Function with volume integration formula; or `@toybox-labs/cura-wasm` fork only if real slicing is required. |
| `three-stl-loader`, `three-stl-net-loader` | Both 6–9 years stale. | Use the loaders bundled inside `three` itself: `three/examples/jsm/loaders/STLLoader.js`. |
| `react-stl-viewer` | No releases in 12+ months; abandoned-feeling. | Compose your own with R3F + drei (~30 lines, full control). |
| `node-stl` | 3 years stale, last v0.7.3. | Hand-write the volume formula (signed tetrahedron sum). It's ~50 lines and removes a dependency. |
| `dxf-parser` (gdsestimating) | 4 years since last npm release; superseded by `dxf` from skymakerolof. | `dxf@^5.3` |
| Netlify Forms with file uploads | 8 MB hard request limit, 10 MB free-tier total storage; will fail on real STLs. | Direct-to-Netlify-Blobs (or S3) with presigned URLs minted by a Netlify Function. |
| Hydrogen (Shopify React framework) | Requires a Remix-based SSR framework migration off CRA — explicitly out of scope. | `@shopify/storefront-api-client` if going the Shopify route stays inside CRA. |
| `next-sanity-image` | Requires Next.js — out of scope. | Roll a 20-line `<SanityImage>` component using `@sanity/image-url`. |
| GA4 | Heavy, sampled, requires consent banners, hidden implementation cost. | Plausible. |
| `styled-components` (already a stale dep in package.json) | Currently unused at runtime — and Tailwind covers our styling needs. | Remove from `package.json` during the spruce bundle. |

---

## Stack Patterns by Variant

**If the SKU count for the shop is ≤ ~50 and the owner wants to ship fast:**
- Use **Snipcart**.
- Products live in Sanity, the buy button is one React component with `data-item-*` attrs.
- No Netlify Functions needed.

**If the studio wants the Shopify mobile admin app for fulfillment:**
- Use **Shopify Storefront API Client** (NOT JS Buy SDK).
- Products live in Shopify admin (so Sanity becomes content-only, not commerce).
- Plan a small refactor of any "current product" UI to read from Shopify GraphQL instead of Sanity.

**If the studio insists on Sanity-as-product-source-of-truth for accounting/marketing parity:**
- Use **Stripe Checkout + Netlify Function**.
- Build a thin cart in React Context (similar to existing `ProjectsContext`).
- Accept the trade-off: no built-in inventory tracking, no built-in tax automation.

**If quote files are routinely <6 MB (e.g., simple keychain STLs):**
- Skip the presigned-URL flow.
- POST file straight to Netlify Function as `multipart/form-data`.
- Simpler, fewer moving parts.

**If quote files commonly exceed 6 MB:**
- Use the presigned-URL → Netlify Blobs → Function flow described above.
- Don't try to chunk uploads — just go direct to storage.

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `react@18.x` | `@react-three/fiber@^8.18` only | R3F v9 requires `react@^19`. Critical pin. |
| `@react-three/fiber@^8.18` | `@react-three/drei@^9.122` only | drei v10 requires R3F v9 + React 19. Last v9 patch is 9.122.0. |
| `@react-three/fiber@^8.18` | `three@>=0.133` | Any modern `three` works (latest is 0.184.0). Use `three@^0.169` or higher for the latest STLLoader fixes. |
| `react-router-dom@^6.x` (existing) | `react@^18` | No change. |
| `@sanity/client@^6.x` (existing) | Anything | No JS framework coupling. v6 is current. |
| `react-dropzone@^15` | `react@>=16.8` | Compatible with React 18; uses hooks API. |
| `dxf@^5.3` | Browser + Node | ESM-first; CRA 5's webpack handles it fine. |
| `@shopify/storefront-api-client@^1` | Any modern JS env | GraphQL-over-fetch wrapper; agnostic. |
| Node `18+` (for Netlify Functions runtime) | Existing client `--openssl-legacy-provider` flag | Functions run on Netlify's Node 18+ runtime regardless of client build flags; the OpenSSL legacy provider only affects CRA's webpack. No conflict. |

---

## Trade-offs: Hosted SaaS vs Roll-Your-Own

| Concern | Recommendation | Trade-off |
|---------|----------------|-----------|
| **STL pricing** | Roll-your-own formula in a Netlify Function | Saves $0–∞/mo (vs Slant3D fees) and avoids a 15 MB WASM bundle, in exchange for "ballpark, not slicer-accurate" prices. Acceptable because the page wording sets that expectation. |
| **E-commerce** | Hosted (Snipcart or Shopify) | Saves weeks of implementation time on cart, checkout, inventory, taxes — at the cost of 2% per transaction (Snipcart) or $5/mo + transaction fees (Shopify). Worth it for a one-person studio. |
| **Email delivery** | Hosted (Resend) | Free tier covers expected volume; rolling your own SMTP is not worth it for <1k emails/mo. |
| **File storage** | Hosted (Netlify Blobs) | Built into the existing platform; one less account to manage. |
| **Analytics** | Hosted (Plausible) | $9/mo replaces ~half a day of integration + ongoing maintenance. Worth it. |
| **Slicer (if ballpark formula proves insufficient)** | Self-hosted Cura-Engine binary in a Netlify Background Function | Avoids per-print API fees; runs offline; the studio owner controls the pricing logic. |

---

## Sources

- [Context7 / threejs.org](https://threejs.org/docs/pages/STLLoader.html) — STLLoader, ThreeMFLoader, SVGLoader official three.js docs (HIGH confidence)
- [npm @react-three/fiber](https://www.npmjs.com/package/@react-three/fiber) + `npm view` confirmed: latest 8.x is `8.18.0`; 9.x requires React 19 (HIGH)
- [npm @react-three/drei](https://www.npmjs.com/package/@react-three/drei) + `npm view` confirmed: last React-18-compatible version is `9.122.0` (HIGH)
- [npm three](https://www.npmjs.com/package/three) — current `0.184.0` (HIGH)
- [npm @sanity/image-url](https://www.npmjs.com/package/@sanity/image-url) — current `2.1.1` (HIGH)
- [Sanity Image URLs docs](https://www.sanity.io/docs/apis-and-sdks/image-urls) — official transformation reference (HIGH)
- [npm dxf (skymakerolof)](https://www.npmjs.com/package/dxf) — current `5.3.1`, ~7 months ago at writing (HIGH)
- [npm cura-wasm](https://www.npmjs.com/package/cura-wasm) — deprecated by author (HIGH)
- [npm @toybox-labs/cura-wasm](https://www.npmjs.com/package/@toybox-labs/cura-wasm) — current `1.5.4`, fork of deprecated cura-wasm (MEDIUM, low usage)
- [Slant 3D API docs](https://www.slant3d.com/slant-3d-printing-api) — confirms drop-ship-only model (HIGH)
- [Shopify JS Buy SDK deprecation notice](https://shopify.dev/changelog/js-buy-sdk-deprecation-notice) — Jan 2025 deprecation, Jan 2026 EOL (HIGH)
- [npm @shopify/storefront-api-client](https://www.npmjs.com/package/@shopify/storefront-api-client) — current `1.0.10`, official replacement (HIGH)
- [Snipcart installation docs](https://docs.snipcart.com/v3/setup/installation) and [products docs](https://docs.snipcart.com/v3/setup/products) (HIGH)
- [Snipcart vs Stripe Checkout comparison](https://snipcart.com/blog/stripe-checkout-form-integration-vs-snipcart) — Snipcart-authored, but pricing facts verifiable (MEDIUM)
- [Netlify Forms file upload limits](https://answers.netlify.com/t/the-form-request-has-a-maximum-size-limit-of-8-mb/112079) — 8 MB request, 10 MB free-tier storage (HIGH)
- [Netlify Functions payload limits](https://docs.netlify.com/build/async-workloads/limitations/) — 6 MB sync function body limit (HIGH)
- [Plausible SPA support docs](https://plausible.io/docs/spa-support) — auto-detects pushState (HIGH)
- [Plausible installation docs](https://plausible.io/docs/integration-guides) (HIGH)
- [Plausible vs Fathom vs GA4 2026 comparison](https://thebomb.ca/blog/website-analytics-ga4-alternatives-2026/) — pricing tiers and feature matrix (MEDIUM, third-party blog)
- [Stripe Checkout + Netlify Functions example](https://www.netlify.com/blog/2021/06/30/e-commerce-checkout-with-angular-netlify-functions-and-the-stripe-api/) — Netlify-authored, dated but still valid pattern (MEDIUM)
- [react-dropzone](https://www.npmjs.com/package/react-dropzone) + `npm view` confirmed: `15.0.0`, React 16.8+ compatible (HIGH)
- [S3 presigned URL via Netlify Function pattern](https://www.bennadel.com/blog/3887-proxying-amazon-aws-s3-pre-signed-url-uploads-using-netlify-functions.htm) (MEDIUM)

---

*Stack research for: maker-studio service site additions (3D printing surface, file-upload quote, pre-made-goods shop) on existing CRA + Sanity + Netlify*
*Researched: 2026-05-02*
