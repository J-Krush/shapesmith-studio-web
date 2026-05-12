# Phase 5: Pre-Made Goods Shop - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-08
**Phase:** 05-pre-made-goods-shop
**Areas discussed:** Platform + discovery framing (SHOP-03), Sanity `product` schema (SHOP-04), Catalog + detail UX (SHOP-05), Checkout + inventory + order flow (SHOP-06/07)

---

## Platform + discovery framing (SHOP-03)

### Q1 — SKU count at launch

| Option | Description | Selected |
|--------|-------------|----------|
| Small — 5–15 SKUs at launch, slow growth | Snipcart's flat-fee model wins; Sanity is the right product DB | ✓ |
| Medium — 15–50 SKUs at launch, monthly drops | Snipcart still works but Stripe+Sanity becomes viable; Shopify Storefront overkill | |
| Large — 50+ SKUs or unknown / aspirational | Shopify Storefront's inventory + order management starts paying off | |
| Tiny — 1–5 SKUs, manual / curated drops | Almost gallery-style; Snipcart wildly overkill | |

**User's choice:** Small (5–15 SKUs at launch, slow growth)
**Notes:** Sets the dominant constraint that justified Snipcart over Shopify and shaped most downstream decisions.

### Q2 — Ops model

User asked for a recommendation rather than choosing from options. Claude recommended Option 1 (Minimal — Snipcart, you handle shipping manually) with explicit reasoning:
- Per-order time at this scale ~10 min (USPS Click-N-Ship is free); not worth automating
- Snipcart $0/month until $500/mo revenue vs Shopify $29/month from day 1
- Tax usually moot at this volume due to state economic-nexus thresholds
- Decision is reversible — products live in Sanity, not Snipcart

**User's choice:** Option 1 (Minimal platform — just take payment, you handle the rest)
**Notes:** Explicit endorsement of the recommendation: "Ok this sounds good! I like the snipcart option."

### Q3 — Shipping model

| Option | Description | Selected |
|--------|-------------|----------|
| Flat-rate shipping by region + local pickup option | 2–3 flat rates (US/Canada/intl) + local pickup $0 | ✓ |
| US-domestic only, single flat rate, no pickup option | Cleanest UX, smaller market | |
| "We'll calculate at packing time" — no shipping cost shown at checkout | Confusing UX, abandons frictionless promise | |
| Per-product shipping weight + carrier API integration | Most accurate, over-engineered for 5–15 SKUs | |

**User's choice:** Flat-rate shipping by region + local pickup option

### Q4 — Discovery shape

| Option | Description | Selected |
|--------|-------------|----------|
| This CONTEXT.md IS the discovery artifact | Cleanest, fastest, no separate write-up needed | ✓ |
| Keep Phase 5 monolithic, but make Plan 05-01 a `PLATFORM-DECISION.md` write-up | More ceremony, useful for handoff/rationale doc | |
| Split Phase 5 into 5a (discovery) + 5b (build) via /gsd-phase --insert | Cleanest separation per ROADMAP intent, adds phase boundary | |

**User's choice:** This CONTEXT.md IS the discovery artifact

---

## Sanity `product` schema (SHOP-04)

### Q1 — Inventory model

| Option | Description | Selected |
|--------|-------------|----------|
| Integer stock count in Sanity, owner edits manually | Simple, no integration code, matches catalog scale | ✓ |
| Availability enum (in-stock / low-stock / sold-out), no count | Simpler for owner, no math, can't show "only 2 left" | |
| Snipcart Pro inventory + webhook back to Sanity | Most automated, $20/mo + webhook complexity | |
| No inventory tracking — products always available until unpublished | Breaks SHOP-07 acceptance | |

**User's choice:** Integer stock count, manually edited

### Q2 — Image model

| Option | Description | Selected |
|--------|-------------|----------|
| Image gallery array — 1–6 images, first is hero | Photo-driven shops sell better, reuse ServiceGallery | ✓ |
| Single hero image only | Simpler schema, less owner work, less rich detail page | |
| Single hero + optional 360° / video | Premium feel, overkill for laser/print pre-mades | |

**User's choice:** Image gallery array (1–6 images per product)

### Q3 — Optional fields (multi-select)

| Option | Description | Selected |
|--------|-------------|----------|
| Dimensions (W × D × H) | Useful for size selection, matches CAD-native context | ✓ |
| Materials list (refs to existing material docs) | Cross-link to materials sections, SEO benefit | ✓ |
| Lead time (per-product string) | Useful for variable stock-vs-made-to-order | ✓ |
| Featured / pinned flag | Pin to top of grid for promotion | ✓ |

**User's choice:** All four optional fields included

### Q4 — Service tag

| Option | Description | Selected |
|--------|-------------|----------|
| Reference array to existing `process` enum, supports both | Mirrors Phase 2 `material.processes` pattern | ✓ |
| Single reference to `process` enum, exactly one | Simpler schema, forces hybrid pieces to pick a primary | |
| String enum on the product itself | Diverges from Phase 2 pattern, two ways to encode same concept | |

**User's choice:** Reference array (matches Phase 2 D-06 pattern)

---

## Catalog + detail UX (SHOP-05)

### Q1 — Card content

| Option | Description | Selected |
|--------|-------------|----------|
| Image + name + price + sold-out/low-stock badge | Standard e-commerce card, reads as "buyable" | ✓ |
| Image + name only on grid, price on hover/detail | More gallery-like, adds click before purchase intent | |
| Image + name + price + service-tag badge | Service tag emphasis instead of availability | |
| Image-only on hover-reveal | Pure gallery feel, too sparse for small catalog | |

**User's choice:** Image + name + price + availability badge

### Q2 — Filter / sort

| Option | Description | Selected |
|--------|-------------|----------|
| Service-tag filter (All / Laser / 3D printed) + Featured-first then newest sort | Mirrors site's dual-service framing | ✓ |
| No filter, single grid — rely on Featured ordering | Cleanest UX, lowest friction | |
| Service-tag filter + price ascending/descending toggle | Adds price sort, overkill at small scale | |
| Tag-based multi-select (Service + Material + Featured) | Faceted filtering, way too much for 15 SKUs | |

**User's choice:** Service-tag filter + Featured-first then newest

### Q3 — Detail layout

| Option | Description | Selected |
|--------|-------------|----------|
| Image gallery left, info column right with sticky Add to Cart | Classic e-commerce, reads as "for sale" | ✓ |
| Full-width hero image, info + Add to Cart below, gallery further down | Photo-first, gallery / portfolio feel | |
| Mirror /styles/:slug exactly, just add price + Add to Cart bar | Lowest implementation, weaker buyable cues | |

**User's choice:** Image gallery left, info column right with sticky Add to Cart

### Q4 — Empty state

| Option | Description | Selected |
|--------|-------------|----------|
| Empty state shows existing Coming Soon page + shop-notify form | Auto-flips to catalog when 1+ products published | ✓ |
| Replace Coming Soon with slimmer empty-state message, keep shop-notify | Cleaner narrative, less reuse | |
| Hard launch — no empty state, deploy gates on owner publishing 3+ products | Cleanest customer experience, owner-prep dependency | |
| Empty state shows fallback message, archive shop-notify form | Removes infrastructure, no signups | |

**User's choice:** Existing Coming Soon page + shop-notify form as empty-state fallback

---

## Checkout + inventory + order flow (SHOP-06/07)

### Q1 — Cart styling

| Option | Description | Selected |
|--------|-------------|----------|
| Custom dark-theme CSS for cart drawer + minimal checkout polish | Reasonable scope, big visual payoff | ✓ |
| Full custom cart + custom checkout via Snipcart v3 Web Components | Most polished, most work, over-scope for Phase 5 | |
| Use Snipcart defaults entirely | Zero work, visually inconsistent | |

**User's choice:** Custom dark-theme CSS for cart drawer (checkout pages near-default)

### Q2 — Order alerts

| Option | Description | Selected |
|--------|-------------|----------|
| Snipcart default email + dashboard | Simplest, no glue code | |
| Snipcart default + custom Resend email via webhook | Reuses Phase 3 infra, ~30 LOC + webhook validation | ✓ |
| Snipcart default + webhook auto-decrements Sanity stockQuantity | Conflicts with manual D-06, adds Sanity write-token complexity | |
| Both: custom email + auto stock decrement | Most automated, biggest scope add, v2 polish | |

**User's choice:** Snipcart default + custom Resend email via webhook

### Q3 — Stock display

| Option | Description | Selected |
|--------|-------------|----------|
| Sold-out: badge + grayed-out card + disabled Add to Cart. Low-stock: subtle "Only N left" tag | Standard e-commerce conventions | ✓ |
| Sold-out: hide from grid entirely. Low-stock: "Only 2 left" tag | Cleaner grid, loses SEO + restock signal | |
| Sold-out: badge + clickable card. Low-stock: no display difference | Avoids urgency tactics | |
| Sold-out and low-stock: identical "Limited availability" tag | Soft messaging, less informative | |

**User's choice:** Sold-out badge + grayed card + disabled CTA; low-stock "Only N left" tag

### Q4 — Restock notify

| Option | Description | Selected |
|--------|-------------|----------|
| Skip restock notify — sold-out just shows "Sold out" | Simplest, matches catalog scale | ✓ |
| Single "Notify me when this is back" button → opens /contact pre-filled | Light touch, reuses contact form | |
| Per-product Netlify form for restock signup | More infrastructure for an edge feature | |

**User's choice:** Skip restock notify

---

## Claude's Discretion

Items where the user did not pick a specific value and downstream agents (researcher / planner) have flexibility:

- Specific Snipcart `data-item-*` attribute mapping (recommended in CONTEXT.md §Claude's Discretion)
- Description model: short string (cart) + portable text body (detail page) — standard pattern
- Low-stock threshold value (recommend `3`)
- Snipcart env var name (`VITE_SNIPCART_PUBLIC_KEY` recommended, follows Phase 4 convention)
- Exact Snipcart cart drawer CSS class hooks to override
- Empty-state implementation: build-time count vs runtime fetch (runtime fetch recommended)
- Plan structure / wave count for Phase 5
- Dev/test mode → live mode workflow

## Deferred Ideas

Captured in CONTEXT.md `<deferred>` section. Highlights:

- Restock-notify feature (out of scope this phase)
- Tax automation (Stripe Tax / TaxJar)
- Carrier-rate shipping automation (Shippo / EasyPost)
- Snipcart Pro inventory + auto-decrement webhook
- Custom Snipcart v3 `<snipcart-checkout>` Web Components
- SHOP-08 (customer order history)
- SHOP-09 (configurable products)
- Light mode (THEME-01)
- `@tailwindcss/forms` plugin string-vs-`require` bug (Phase 4 deferred)
- Pre-existing CRA-residue follow-ups (README, server-side comment, CLAUDE.md regen)
