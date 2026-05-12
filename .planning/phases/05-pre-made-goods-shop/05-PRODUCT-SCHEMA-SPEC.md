# Phase 5 — Sanity Studio `product` Schema Spec (Owner Prep)

> **Header note (read first).** This is the canonical Phase 5 owner-prep doc. Apply the `product` schema in Sanity Studio BEFORE Plan 05-08 (deploy verification) runs. Plans 05-03 through 05-07 can be coded against this spec in parallel — only end-to-end verification (real product cards rendering, real cart line items, real webhook payloads) blocks on the schema being live in production Sanity.
>
> All fields use Sanity Studio v3 `defineType` / `defineField` syntax. Field names are **camelCase** to match existing project conventions (Phase 2 §header note: `listImage`, `detailImages`, `cuttingSpecs`, `preferredMaterials`).
>
> **Status:** Specification complete, awaiting owner application to Sanity Studio.
> **Phase:** 05-pre-made-goods-shop
> **Date:** 2026-05-09
> **Owner-action gate:** Yes — the owner must apply this schema in the Sanity Studio repo and run `sanity deploy` before Plan 05-08 deploy-preview verification runs. Plans 05-03..07 can be implemented in parallel against this spec.

---

## 1. Overview

This document defines the new `product` Sanity document type used by Phase 5's Pre-Made Goods Shop. The schema is consumed by Plans 05-03..07:

- **Plan 05-03 (`ShopContext.jsx`)** — list-view GROQ projection (§5) renders the `/shop` grid.
- **Plan 05-04 (Grid + filter + card)** — card displays `images[0]`, `name`, `price`, sold-out / low-stock badges derived from `stockQuantity`.
- **Plan 05-05 (Detail page)** — every field above is rendered (gallery, price, description, body, spec table, Add to Cart with `data-item-*` attributes derived from this schema).
- **Plan 05-06 (`snipcart-validate-product` Netlify Function)** — single-product GROQ projection (§5) returns the Sanity-truth view used to validate Snipcart cart payloads.
- **Plan 05-07 (`snipcart-order-webhook` Netlify Function)** — does not query `product` directly; relies on Snipcart's order payload (which Snipcart populated via the JSON crawler endpoint above).

The `product` document type is owner-managed. Schema commits live in the Sanity Studio repo (separate from this web repo). Owner applies via `sanity dev` (local verify) → `sanity deploy` (push to production Sanity). The web repo here only consumes the deployed schema via anonymous CDN reads (`useCdn: true` on the Sanity client).

This spec mirrors the structure and rollout pattern of Phase 2's `02-SCHEMA-SPEC.md` (the established owner-prep convention).

---

## 2. `product` schema definition (Sanity v3 `defineType`)

```ts
// product.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'product',
  type: 'document',
  title: 'Product',
  fields: [
    // -------- Identity --------
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
      description: 'Product name shown on the grid card, detail page heading, and cart line item.',
      validation: (Rule) => Rule.required().min(2).max(100),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      description: 'URL segment for /shop/:slug. Stable identifier — used as Snipcart data-item-id, so do NOT change after a product has been ordered.',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),

    // -------- Description (D-08; Claude\'s Discretion: short + portable text) --------
    defineField({
      name: 'description',
      type: 'string',
      title: 'Short description',
      description: 'Short description for cart line items and SEO meta. Max 200 characters.',
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: 'body',
      type: 'array',
      title: 'Body (rich description)',
      description: 'Rich product description rendered on /shop/:slug detail page.',
      of: [{ type: 'block' }], // portable text
    }),

    // -------- Commerce (price + manual inventory per D-06) --------
    defineField({
      name: 'price',
      type: 'number',
      title: 'Price (USD)',
      description: 'USD price. Snipcart handles currency in checkout (single-currency v1).',
      validation: (Rule) => Rule.required().min(0).precision(2),
    }),
    defineField({
      name: 'stockQuantity',
      type: 'number',
      title: 'Stock quantity',
      description:
        'Integer stock count. Storefront derives sold-out (0), low-stock (≤3), and normal display states. Owner edits manually after each sale.',
      validation: (Rule) => Rule.required().integer().min(0),
    }),

    // -------- Display flags + optional metadata (D-08) --------
    defineField({
      name: 'featured',
      type: 'boolean',
      title: 'Featured',
      description: 'Pin to top of /shop grid. Sort: featured desc, then _createdAt desc.',
      initialValue: false,
    }),
    defineField({
      name: 'dimensions',
      type: 'string',
      title: 'Dimensions',
      description:
        'Owner-formatted, e.g. "120 × 80 × 30 mm" or "4.7 × 3.1 × 1.2 in". Rendered in the spec table on /shop/:slug. Optional.',
    }),
    defineField({
      name: 'leadTime',
      type: 'string',
      title: 'Lead time',
      description:
        'Per-product shipping lead time, e.g. "Ships in 2–3 business days". Falls back to studio-info.shippingLeadTime if empty. Optional.',
    }),

    // -------- Images (D-07) --------
    defineField({
      name: 'images',
      type: 'array',
      title: 'Images',
      description:
        '1–6 product photos. First image is hero (used by Snipcart data-item-image and grid card thumbnail). Required alt text per Phase 2 D-18 (no empty alts).',
      validation: (Rule) => Rule.required().min(1).max(6),
      of: [
        {
          type: 'object',
          name: 'productImage',
          title: 'Product image',
          fields: [
            defineField({
              name: 'asset',
              type: 'image',
              title: 'Image',
              options: { hotspot: true },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'altText',
              type: 'string',
              title: 'Alt text',
              description:
                'Required. Describe the image for screen readers and SEO. No empty fallbacks, no filename text (Phase 2 D-18).',
              validation: (Rule) => Rule.required().min(1),
            }),
            defineField({
              name: 'caption',
              type: 'string',
              title: 'Caption (optional)',
              description: 'Optional caption shown beneath the image in the detail-page gallery.',
            }),
          ],
          preview: {
            select: { media: 'asset', title: 'altText', subtitle: 'caption' },
          },
        },
      ],
    }),

    // -------- Cross-links (D-08, D-09) --------
    defineField({
      name: 'materials',
      type: 'array',
      title: 'Materials',
      description:
        'Cross-links to materials sections on /styles and /3d-printing for SEO + educational benefit. Optional.',
      of: [{ type: 'reference', to: [{ type: 'material' }] }],
    }),
    defineField({
      name: 'processes',
      type: 'array',
      title: 'Processes (service tag)',
      description:
        'Service tag: laser, print, or both. Pipe-separated for Snipcart data-item-categories at render time. Reuses the Phase 2 process enum docs.',
      of: [{ type: 'reference', to: [{ type: 'process' }] }],
      validation: (Rule) => Rule.required().min(1),
    }),

    // -------- SEO (mirrors print-style.seo from Phase 2 §4) --------
    defineField({
      name: 'seo',
      type: 'object',
      title: 'SEO',
      fields: [
        { name: 'metaTitle', type: 'string', title: 'Meta title' },
        { name: 'metaDescription', type: 'text', rows: 2, title: 'Meta description' },
        {
          name: 'ogImage',
          type: 'image',
          title: 'og:image',
          fields: [{ name: 'altText', type: 'string', title: 'Alt text' }],
        },
      ],
    }),
  ],

  // -------- Studio list view --------
  preview: {
    select: {
      title: 'name',
      price: 'price',
      stock: 'stockQuantity',
      media: 'images.0.asset',
    },
    prepare({ title, price, stock, media }) {
      const priceLabel = typeof price === 'number' ? `$${price.toFixed(2)}` : '—';
      const stockLabel =
        typeof stock !== 'number'
          ? 'no stock value'
          : stock === 0
            ? 'SOLD OUT'
            : stock <= 3
              ? `Only ${stock} left`
              : `${stock} in stock`;
      return {
        title,
        subtitle: `${priceLabel} · ${stockLabel}`,
        media,
      };
    },
  },

  orderings: [
    {
      name: 'featured-newest',
      title: 'Featured first, newest next (matches /shop grid)',
      by: [
        { field: 'featured', direction: 'desc' },
        { field: '_createdAt', direction: 'desc' },
      ],
    },
    {
      name: 'name-asc',
      title: 'Name (A → Z)',
      by: [{ field: 'name', direction: 'asc' }],
    },
  ],
});
```

After publishing the schema, register it in the Studio repo's `schemas/index.js` alongside the existing `material`, `process`, `studio-info`, `laser-style`, `print-style`, and `faq` types:

```ts
// schemas/index.js — ADD this line to the existing exports.
import product from './product';

export const schemaTypes = [
  // ...existing types...
  product,
];
```

---

## 3. Field-by-field rationale

| Field           | Type                       | Required? | Source decision           | Rationale |
|-----------------|----------------------------|-----------|---------------------------|-----------|
| `name`          | string (2–100)             | Yes       | Claude's Discretion        | Cart line items, grid cards, detail-page H1, og:title fallback. 2-char floor avoids accidental empty saves; 100-char ceiling keeps cart line items readable. |
| `slug`          | slug (source: name)        | Yes       | D-08, Snipcart contract   | URL segment for `/shop/:slug` AND Snipcart `data-item-id` (the stable order key). MUST NOT change after a product has been ordered — Snipcart treats id changes as a different SKU. |
| `description`   | string (≤200)              | Yes       | D-08, Snipcart contract   | Short blurb used in cart line items (`data-item-description`) and SEO meta. 200-char ceiling matches Snipcart's display constraint and keeps meta-description-friendly length. |
| `body`          | portable text (block array) | No        | Claude's Discretion        | Rich detail-page description. Optional — owner may use only `description` for short SKUs. |
| `price`         | number (≥0, .precision(2)) | Yes       | RESEARCH (Snipcart stack) | USD price in dollars (e.g., `35.00`). `.precision(2)` prevents fractional-cent typos. Single-currency v1 — no `currency` field; Snipcart dashboard owns currency config. |
| `stockQuantity` | integer (≥0)               | Yes       | D-06                      | Manual inventory. Storefront-derived display: `0` = Sold out + grayed-out card + disabled Add to Cart; `1–3` = "Only N left" tag; `>3` = normal. Owner edits manually after each sale (auto-decrement explicitly out of scope per D-06). |
| `featured`      | boolean (default false)    | No        | D-08, D-11                | Pins to top of `/shop` grid. Sort key: `featured desc, _createdAt desc`. |
| `dimensions`    | string                     | No        | D-08                      | Owner-formatted free-text (`"120 × 80 × 30 mm"`). Owner judges metric vs imperial per product. Rendered in the spec table on `/shop/:slug`. |
| `leadTime`      | string                     | No        | D-08                      | Per-product shipping copy (`"Ships in 2–3 business days"`). Falls back to `studio-info.shippingLeadTime` (Phase 2 D-13 pattern) when empty. |
| `images`        | array of object (1–6)      | Yes       | D-07                      | First image is hero (Snipcart `data-item-image`, grid card thumbnail). Each item has `asset` + required `altText` + optional `caption`. 1–6 ceiling caps gallery growth and keeps detail-page LCP predictable. |
| `images[].asset` | image (hotspot true)      | Yes       | D-07                      | Hotspot enabled so the owner can choose framing for the responsive crops generated by `@sanity/image-url`. |
| `images[].altText` | string (≥1)             | Yes       | Phase 2 D-18              | No empty alts, no filename fallbacks. Validation `Rule.required().min(1)` enforces at the schema level. |
| `images[].caption` | string                  | No        | D-07                      | Optional caption rendered in the detail-page gallery beneath the image. |
| `materials`     | reference[] → material     | No        | D-08                      | Cross-links a product to material docs already used by `/styles` and `/3d-printing`. SEO + educational benefit. |
| `processes`     | reference[] → process (≥1) | Yes       | D-09                      | Service tag — `[laser]`, `[print]`, or `[laser, print]` for hybrid pieces. Reuses the Phase 2 `process` enum docs (one source of truth across `material`, `faq`, and `product`). Pipe-joined into Snipcart `data-item-categories` at render time. |
| `seo`           | object                     | No        | Phase 2 pattern reuse     | Mirrors `print-style.seo` exactly so the same `SEOHead` component pattern applies on `/shop/:slug` without divergent code paths. |
| `seo.metaTitle` | string                     | No        | Phase 2                   | `<title>` override; falls back to `name`. |
| `seo.metaDescription` | text (rows 2)        | No        | Phase 2                   | Meta-description override; falls back to `description`. |
| `seo.ogImage`   | image with altText         | No        | Phase 2                   | og:image override; falls back to `images[0]` then `studio-info.ogImage`. |

---

## 4. GROQ examples (for the owner — sanity-check queries)

### List query — matches Plan 05-03 `ShopContext.jsx` `PRODUCTS_QUERY`

This is the projection consumed by every grid card on `/shop`. Schema field edits must propagate here first (key_link in 05-01-PLAN frontmatter).

```groq
*[_type == "product" && !(_id in path("drafts.**"))]
  | order(featured desc, _createdAt desc){
    _id, name, "slug": slug.current, description, body, price,
    stockQuantity, featured, dimensions, leadTime,
    "processes": processes[]->key,
    "materials": materials[]->{ _id, name, "slug": slug.current, services },
    images[]{ altText, caption, asset->{ _id, url, altText } },
    seo{ metaTitle, metaDescription, ogImage{ asset->{ _id, url, altText } } }
  }
```

Notes:
- `!(_id in path("drafts.**"))` excludes draft documents (Sanity's `useCdn: true` behavior, but defensive in case anonymous CDN reads ever surface drafts).
- `"processes": processes[]->key` derefs the `process` enum docs to flat strings (`"laser"`, `"print"`) — easier for the storefront filter and for joining into Snipcart's `data-item-categories` (see §6).
- `images[]{ ... asset->{ _id, url, altText } }` returns the per-item alt text alongside the asset URL — the storefront passes this into `@sanity/image-url` for sized variants.

### Single-product query — matches Plan 05-06 `snipcart-validate-product` Function

This is the trust-boundary projection the Netlify Function uses to validate Snipcart cart payloads against Sanity truth. Schema field edits must propagate here second (key_link in 05-01-PLAN frontmatter).

```groq
*[_type == "product" && slug.current == $slug][0]{
  "id": slug.current, name, price, description, stockQuantity,
  "image": images[0].asset->url
}
```

Notes:
- Returns a flat object matching the Snipcart JSON crawler contract: `id`, `name`, `price`, `description`, `stockQuantity`, `image`.
- `"image": images[0].asset->url` returns just the hero image URL (Snipcart only needs one thumbnail).
- `[0]` returns null if the slug doesn't exist — the Function returns 404 in that case (Plan 06 implementation detail).

---

## 5. Snipcart `data-item-*` attribute mapping

The schema is designed so the storefront's Add to Cart button can derive every Snipcart attribute from a single product document without additional Sanity queries. The mapping (consumed in Plan 05-05's `AddToCartButton`):

| Snipcart attribute       | Schema field                                    | Render-time transform                         |
|--------------------------|------------------------------------------------|-----------------------------------------------|
| `data-item-id`           | `slug.current`                                 | Use raw — kebab-case stable identifier.       |
| `data-item-name`         | `name`                                         | Use raw.                                      |
| `data-item-price`        | `price`                                        | `Number(price).toFixed(2)`.                   |
| `data-item-description`  | `description`                                  | Use raw (≤200 chars enforced at schema).      |
| `data-item-image`        | `images[0]`                                    | `urlFor(images[0]).width(800).url()` (CDN-sized). |
| `data-item-categories`   | `processes[]->key`                             | `processes.map(p => p.key).join('|')` — pipe separator (NOT comma; Snipcart docs verified). |
| `data-item-max-quantity` | `stockQuantity`                                | Use raw integer.                              |
| `data-item-url`          | (computed)                                     | `${origin}/shop/${slug.current}` — Snipcart re-fetches this URL to verify product data; must be publicly reachable on the live site or deploy preview. |

---

## 6. Owner Studio rollout checklist

Tick in order (mirrors Phase 2 §8):

- [ ] **1.** Add `schemas/product.js` (or `.ts` if Studio is TS) to the Sanity Studio repo's `schemas/` directory using the `defineType` block from §2.
- [ ] **2.** Register the new type in `schemas/index.js`:
      ```js
      import product from './product';
      export const schemaTypes = [/* ...existing... */, product];
      ```
- [ ] **3.** Run `sanity dev` locally. Verify:
      - "Product" appears in the schema list.
      - "Product" appears in the Studio "+ Create" menu.
      - Opening the create form shows all fields from §2 with the inline descriptions.
- [ ] **4.** Publish 1–2 test products. Suggested minimum payload:
      - `name`: any test name (e.g., "Test product 1").
      - `slug`: auto-generated from name.
      - `description`: any short string (≤200 chars).
      - `price`: any positive number with up to 2 decimals (e.g., `35.00`).
      - `stockQuantity`: `5`.
      - `images`: at least 1 image with required `altText`.
      - `processes`: pick `[laser]` OR `[print]` (any reference to an existing process doc).
      - Leave `featured`, `dimensions`, `leadTime`, `materials`, `body`, `seo` empty initially — verify those fall back gracefully on the storefront.
- [ ] **5.** Run `sanity deploy` to push the schema to production Sanity.
- [ ] **6.** In Sanity Vision (Studio sidebar → Vision plugin), run the **list query from §4** against the `production` dataset:
      ```groq
      *[_type == "product" && !(_id in path("drafts.**"))] | order(featured desc, _createdAt desc){ _id, name, "slug": slug.current, description, price, stockQuantity, "processes": processes[]->key, images[]{ altText, asset->{ url } } }
      ```
      Confirm the test product(s) are returned with all projected fields populated, including `images[0].asset.url` and `processes[0]` resolving to `"laser"` or `"print"`.
- [ ] **7.** Reply **"schema applied"** to resume Plans 05-03..07 verification, OR reply **"spec approved, schema deferred"** if you want Plans 05-03..07 to proceed in parallel with you applying the schema separately. (The plans themselves are coded against this spec — only the deploy-preview verification is gated on real product data.)

---

## 7. Constraints / hard rules

These are explicit non-goals for the v1 schema. Adding any of them later is a v2 concern (see §"Deviation log" below for change-tracking).

- **NO `customFields` block.** Snipcart variants (size/material/engraving choices) are out of scope per CONTEXT D-22 / SHOP-09 v2-deferred. Adding `customFields` later is additive and won't break existing data.
- **NO `weight` field.** Shipping is flat-rate-by-region in the Snipcart dashboard (D-04). Weight-based carrier rates (Shippo / EasyPost) are deferred per CONTEXT §deferred.
- **NO `currency` field.** Single-currency USD v1; Snipcart dashboard owns currency config. Multi-currency is a Snipcart-level toggle, not a schema-level field.
- **NO `seo.canonicalUrl` field.** Canonical URL is computed at render time as `https://shapesmith.studio/shop/${slug.current}` — the schema doesn't need to mirror it.
- **`images[].altText` is REQUIRED.** Phase 2 D-18 — no empty alts, no filename fallbacks. Validation `Rule.required().min(1)` enforces at the schema level. The owner cannot publish a product without alt text on every image.
- **`slug` is `slug` type, not `string`.** Gives the owner the standard Studio slug-from-name UX (auto-generate, manual override, validation).
- **`processes` references the existing `process` enum docs (Phase 2 §1).** Do NOT create a `product`-specific service-tag enum. One source of truth across `material`, `faq`, and `product`.
- **`materials` references the existing `material` docs.** Do NOT duplicate material info inline on the product. Cross-link only.
- **`stockQuantity` is owner-edited.** No webhook-driven auto-decrement (CONTEXT D-06 explicitly defers Snipcart Pro inventory + auto-decrement). Pitfall 5 (race conditions where two simultaneous orders both pass max-quantity validation against the same stock value) is accepted at this catalog scale; mitigated downstream in Plan 06's `snipcart-validate-product` Function (per the threat model in 05-01-PLAN).

---

## 8. Deviation log

*(Reserved for plan-execution deviations from this spec. Each entry mirrors the Phase 2 02-SCHEMA-SPEC.md §"Deviation from Plan 02-01 Task 4 Checkpoint" format.)*

> **No deviations recorded yet.** The first deviation, if any, lands here at the time of execution with date, decision authority, problem statement, owner-approved approach, and sections-affected list.

---

*Phase: 05-pre-made-goods-shop*
*Plan: 05-01*
*Schema spec authored: 2026-05-09*
