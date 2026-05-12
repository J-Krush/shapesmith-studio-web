# Phase 3 — Sanity Studio Schema Spec (Owner Prep)

> **Header note (read first).** This is the canonical Phase 3 owner-prep doc. Apply the `pricing-rule` schema in Sanity Studio BEFORE Plan 03-02 frontend testing exercises real data. Per CONTEXT.md D-19, the schema lands in this plan and the owner publishes it without a code deploy. Each later Phase 3 plan that depends on a Sanity content type names its blocking schemas:
>
> - Plan 03-02 (`MaterialPicker` / `PriceRange` / `calculatePrice`) blocks on: `pricing-rule` schema published + at least one `pricing-rule` doc per existing material (laser + 3D-print). The frontend ships with a graceful empty-state path so the owner can backfill rules at their own pace — see §4 below.
> - Plan 03-03 (Netlify Function + Resend submission) does NOT block on schema work — it depends on Plan 03-02's wired UI but consumes no new Sanity types.
>
> All schemas use Sanity Studio v3 `defineType` / `defineField` syntax. Field names are **camelCase** to match the existing project conventions (`ratePerCm3`, `markupBufferLow`, `setupFee`).

---

## 1. Status & Decisions

| Item | Value |
|------|-------|
| Phase | 3 — Auto-Pricing Quote Tool |
| Plan introducing this schema | 03-02 |
| Date authored | 2026-05-08 |
| Decision authority | owner (resolves CONTEXT.md D-19 — owner-edited pricing without app deploy) |
| Cardinality | **One `pricing-rule` document per `material` document** (1:1 reference from rule → material) |
| Existing schemas changed | **None** — `material` is unchanged from Phase 2; this spec adds a new doc type only |

### Decisions log

- **D-19 (CONTEXT.md, owner-approved):** A `pricing-rule` Sanity schema is owner-edited so the owner can tune rates, setup fees, and markup buffers without an app deploy. The schema fields and exact GROQ join are pinned in §3 + §6 below.

- **D-cardinality (this spec, RESEARCH.md Pattern 6):** ONE `pricing-rule` doc per `material` doc, with the rule referencing the material (NOT embedded inside the material). Rationale:
  1. Keeps the existing `material` schema (Phase 2) **unchanged** — zero risk of breaking `MaterialsSection` or `/styles` / `/3d-printing` rendering.
  2. Lets the owner publish/unpublish pricing without unpublishing the underlying material (a material can exist as a stocked option even when its pricing isn't yet configured).
  3. Mirrors Phase 2's separation-of-concerns pattern (`faq.service` → `process` ref; `material.services` flat-string-array; each schema concerned with one thing).

- **D-naming (this spec):** Field names are camelCase: `ratePerCm3`, `ratePerMm`, `machineTimeMultiplier`, `setupFee`, `density`, `markupBufferLow`, `markupBufferHigh`. This matches the existing project conventions (`listImage`, `cuttingSpecs`, `preferredMaterials`).

- **D-rollout (this spec, mirrors Phase 2 `02-SCHEMA-SPEC.md`):** Frontend ships with a graceful empty-state path — when `pricing-rule` returns null for a material, the picker shows `(pricing not configured)` next to the option name and the price-range component renders a helpful note instead of a $X – $Y figure. This means Plan 03-02 frontend can land BEFORE the owner has filled out every rule; the empty-state UX is exercised legitimately while the owner backfills pricing.

- **D-units (this spec):** All money values are USD (the studio's market is local — single-currency for v1). All linear/volume rates are SI: `ratePerCm3` (USD per cm³, 3D printing), `ratePerMm` (USD per mm of cut path, laser). Rationale: parsers in `src/utilities/quote/{parseStl,parseObj,parseSvg}.js` already emit `volumeCm3` and `pathLengthMm` — the rate fields multiply directly without a unit-conversion step in `calculatePrice`.

---

## 2. Schemas in this spec

| Schema | Status | Notes |
|--------|--------|-------|
| `pricing-rule` | NEW | New doc type; references existing `material`. See §3. |
| `material` | UNCHANGED | Phase 2 spec is preserved verbatim. NO new fields, NO renames. |

**Out of scope for this spec:**
- Slicer-grade pricing fields (per-layer time, support estimation) — REQUIREMENTS.md QTE-11, v2.
- Per-quantity volume discounts beyond the linear `× quantity` term — owner can encode discount via `markupBufferLow`/`markupBufferHigh` adjustments, but no first-class discount field is added.
- A `studio-info.laserBedSize` field for bbox-vs-bed comparison — see Open Question 5 in §8 (deferred unless cheap to add now).

---

## 3. `pricing-rule` schema definition (NEW per D-19)

```ts
// pricing-rule.ts (Sanity v3 defineType syntax)
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'pricing-rule',
  type: 'document',
  title: 'Pricing Rule',
  fields: [
    defineField({
      name: 'material',
      type: 'reference',
      to: [{ type: 'material' }],
      validation: (Rule) => Rule.required(),
      description: 'Which material does this rule price? Each material should have one rule.',
    }),
    defineField({
      name: 'ratePerCm3',
      type: 'number',
      title: 'Rate per cm³ (USD) — 3D printing',
      description: 'For 3D printing materials. Multiplied by signed-tetrahedra volume.',
    }),
    defineField({
      name: 'ratePerMm',
      type: 'number',
      title: 'Rate per mm of cut length (USD) — laser',
      description: 'For laser materials. Multiplied by total path length.',
    }),
    defineField({
      name: 'machineTimeMultiplier',
      type: 'number',
      title: 'Machine time multiplier',
      description: 'Adjusts for slow / fast geometry. Default 1.0.',
      initialValue: 1.0,
    }),
    defineField({
      name: 'setupFee',
      type: 'number',
      title: 'Setup fee (USD)',
      description: 'Flat cost added per submission regardless of size.',
    }),
    defineField({
      name: 'density',
      type: 'number',
      title: 'Density (g/cm³) — 3D only',
      description: 'For sanity-checking part weight (optional).',
    }),
    defineField({
      name: 'markupBufferLow',
      type: 'number',
      title: 'Range low markup (%)',
      description: 'e.g., 15 = price low end is 15% above formula.',
      initialValue: 15,
    }),
    defineField({
      name: 'markupBufferHigh',
      type: 'number',
      title: 'Range high markup (%)',
      description: 'e.g., 25 = price high end is 25% above formula.',
      initialValue: 25,
    }),
  ],
  preview: {
    select: {
      title: 'material.title',
      ratePerCm3: 'ratePerCm3',
      ratePerMm: 'ratePerMm',
      setupFee: 'setupFee',
    },
    prepare({ title, ratePerCm3, ratePerMm, setupFee }) {
      const rate = ratePerCm3
        ? `$${ratePerCm3}/cm³`
        : ratePerMm
        ? `$${ratePerMm}/mm`
        : '(no rate)';
      const setup = setupFee ? ` + $${setupFee} setup` : '';
      return {
        title: title ? `Pricing — ${title}` : 'Pricing rule (no material linked)',
        subtitle: `${rate}${setup}`,
      };
    },
  },
});
```

**Field semantics — which rate field applies per service:**

| Service | Rate field | Multiplied by | Setup fee | Markup buffers |
|---------|-----------|---------------|-----------|----------------|
| 3D printing (`material.services` includes `'print'`) | `ratePerCm3` | `geometry.volumeCm3` | yes (`setupFee`) | yes (`markupBufferLow` / `markupBufferHigh`) |
| Laser cutting (`material.services` includes `'laser'`) | `ratePerMm` | `geometry.pathLengthMm` | yes (`setupFee`) | yes (`markupBufferLow` / `markupBufferHigh`) |
| Both (`material.services` is `['laser', 'print']`) | populate BOTH `ratePerCm3` AND `ratePerMm` on the same rule doc | (consumer picks the relevant one based on `geometry.mode`) | yes | yes |

**`density` is informational only.** It does not enter the price formula. It exists so the owner can sanity-check part weight (mass = `volumeCm3 * density`) when reviewing a customer's submitted file. The frontend does not display density to visitors.

**`machineTimeMultiplier` defaults to 1.0** so a rule without a deliberate multiplier simply means "no time-based adjustment." Set to `>1.0` for materials that print/cut more slowly (e.g., `1.3` for a slow-curing resin); set to `<1.0` for fast geometry-friendly materials.

---

## 4. Backfill / migration notes

**No existing data structure changes.** The existing `material` schema is preserved verbatim from Phase 2 — neither `material.services` nor `material.processes` nor any other field is touched. No data migration is required on existing material docs.

**What the owner needs to do BEFORE Plan 03-02 frontend rendering against real data:**

For every existing `material` document the owner wants to price automatically, create one `pricing-rule` document referencing that material with the appropriate rate fields populated. Materials WITHOUT a sibling `pricing-rule` doc will still render in the picker — they just appear with `(pricing not configured)` after the title and the price-range component shows the helpful note (see §6 GROQ + §7 verification + Plan 03-02 `<behavior>` block).

**Order of operations doesn't matter** — the frontend is empty-state-tolerant:

- Owner can ship the schema first, frontend land next, and rules be backfilled gradually.
- Alternatively the owner can pre-fill all rules before frontend lands (cleaner UX).
- Either order works; nothing breaks if rules are missing for some materials.

**Materials in both services (`services: ['laser', 'print']`):** create ONE `pricing-rule` doc per material and populate BOTH `ratePerCm3` AND `ratePerMm` on it. The `calculatePrice` consumer reads the relevant field based on `geometry.mode`.

---

## 5. Owner rollout checklist

Tick in order. Apply in the studio sub-repo (separate from the SPA repo).

- [ ] Add `pricing-rule.js` (or `.ts` if studio is TS) to studio `schemas/` and register in `schemas/index.js` (or `.ts`).
- [ ] `npx sanity deploy` from the studio sub-repo to publish the schema.
- [ ] In Sanity Studio: create one **Pricing Rule** document per existing **Laser** material (set `ratePerMm` + `setupFee` + `markupBufferLow` + `markupBufferHigh`; leave `ratePerCm3` empty unless this material also serves 3D-print).
- [ ] In Sanity Studio: create one **Pricing Rule** document per existing **3D Printing** material (set `ratePerCm3` + `setupFee` + `markupBufferLow` + `markupBufferHigh`; leave `ratePerMm` empty unless this material also serves laser; optionally set `density`).
- [ ] For any material whose `services` is `['laser', 'print']` (or just both individually): populate BOTH `ratePerCm3` AND `ratePerMm` on the same rule doc.
- [ ] Verify via Sanity Vision (Studio sidebar → Vision plugin) using the §6 query — every material should resolve a non-null `pricing` field.
- [ ] Reply in the execution thread with one of:
  - `"schema deployed, N rules created"` — backfill complete; Plan 03-02 frontend renders against real data.
  - `"schema deployed, will backfill rules later — proceed with empty-state UX testing"` — frontend lands now; rules trickle in over time. Plan 03-02 frontend exercises the loading + empty-state paths during this window.

---

## 6. GROQ queries planned for consumers

The Plan 03-02 `MaterialPicker.jsx` consumes this query verbatim. It extends the existing `MaterialsSection.MATERIALS_QUERY` shape (`$serviceKey in services` filter) with a sub-query join to fetch the matching `pricing-rule` doc, if any.

```groq
*[_type == "material" && $serviceKey in services] | order(order asc){
  _id, title,
  "pricing": *[_type == "pricing-rule" && references(^._id)][0]{
    ratePerCm3, ratePerMm, machineTimeMultiplier, setupFee, density,
    markupBufferLow, markupBufferHigh
  }
}
```

**Result shape per material:**

```js
{
  _id: '...',
  title: '...',
  pricing: {
    ratePerCm3: 0.5,
    ratePerMm: null,
    machineTimeMultiplier: 1.0,
    setupFee: 5,
    density: 1.24,
    markupBufferLow: 15,
    markupBufferHigh: 25,
  } // OR null if no rule references this material
}
```

The consumer (`MaterialPicker.jsx`) renders an empty-state container when `materials.length === 0` AND a per-option `(pricing not configured)` suffix when `material.pricing == null`. The price-range component (`PriceRange.jsx`) renders a helpful contact-us note instead of a $X – $Y figure when a material is picked but its pricing is null.

**Example of the price formula consuming this shape (from `calculatePrice.js`):**

```js
// 3D printing path — geometry.mode === '3d'
base = (geometry.volumeCm3 * pricing.ratePerCm3 + pricing.setupFee)
       * pricing.machineTimeMultiplier
       * quantity;

// Laser path — geometry.mode === 'laser'
base = (geometry.pathLengthMm * pricing.ratePerMm + pricing.setupFee)
       * pricing.machineTimeMultiplier
       * quantity;

low  = base * (1 + pricing.markupBufferLow  / 100);
high = base * (1 + pricing.markupBufferHigh / 100);

return { low, high }; // QTE-05 lock — ALWAYS two numbers, never a single point.
```

---

## 7. Verification checklist

This list is the truth-table for `must_haves.truths` in `03-02-PLAN.md` frontmatter. Each item maps directly to a verification observable in the running app.

**Schema spec doc itself (Task 1 — automated grep gates per `03-02-PLAN.md` Task 1 `<verify>` block):**

- [ ] `.planning/phases/03-auto-pricing-quote-tool/03-SCHEMA-SPEC.md` exists.
- [ ] Contains the literal token `pricing-rule`.
- [ ] Contains the literal field name `ratePerCm3`.
- [ ] Contains the literal field name `ratePerMm`.
- [ ] Contains the literal field name `markupBufferLow`.
- [ ] Contains the literal heading `Owner rollout checklist`.
- [ ] §1..§8 sections are present and follow the Phase 2 `02-SCHEMA-SPEC.md` rollout pattern.

**Owner-side (after rolling out per §5):**

- [ ] Sanity Vision query `*[_type == "pricing-rule"]` returns at least one document.
- [ ] Sanity Vision query in §6 returns one entry per material with a non-null `pricing` field for every material the owner wants to auto-price.

**Frontend-side (Plan 03-02 Task 2 — runs after the owner ships rules OR exercises the empty-state path):**

- [ ] After a valid file lands and `GeometrySummary` renders, `MaterialPicker` appears below it.
- [ ] `MaterialPicker` queries Sanity via `useSanityQuery` filtered by the active service (`$serviceKey in services`).
- [ ] `MaterialPicker` shows an empty-state with a `/contact` link when Sanity returns `[]` for the active service.
- [ ] After a material is picked, `QuantityInput` appears (default `1`, min `1`, max `999`).
- [ ] After material+quantity are present AND the chosen material has a published `pricing-rule`, a Ballpark estimate appears as `$low – $high` — never a single point.
- [ ] If the chosen material has NO `pricing-rule`, the picker option shows `(pricing not configured)` and the price range is hidden, replaced by a helpful note linking to `/contact` for a manual quote.
- [ ] The price-range numeric value is the ONLY non-CTA content use of accent color (`text-accent`) in the codebase.
- [ ] Updates to material or quantity recompute the range live (within one render tick).
- [ ] An always-visible disclaimer ("This is an estimate. Final price comes after we review your file — not a binding quote.") sits directly below the range — never dismissable, never moved into a tooltip or modal.
- [ ] The word "quote" is not used anywhere in the UI for the visitor's own number — only in the framing of the next step (CTA copy) and in the disclaimer's "not a binding quote" phrase.

---

## 8. Open questions

### Open Question 5 (carried forward from `03-RESEARCH.md`) — extend `studio-info` with `laserBedSize`?

**Question:** Should `studio-info` be extended with a `laserBedSize` field (e.g., `"600 × 400 mm"` or a structured `{ widthMm, heightMm }` object) so `GeometrySummary.jsx` can compare a laser SVG's bbox against the studio's actual bed and emit a "won't fit on the bed" warning before the visitor tries to price it?

**Recommendation (this spec):** **Defer to a later plan.** Cost-benefit:

- Cost: tiny — one `defineField` addition to `studio-info` schema (Phase 2 spec) + one extra value in the `useSanityQuery` shape used by `Quote.jsx` + a comparison check in `GeometrySummary.jsx` or `QuoteTabs.jsx`.
- Benefit: visible — visitors with oversized designs get a clear warning instead of a misleading price.
- Why defer: Plan 03-02's surface area is already large (schema + 4 frontend files + Sanity rollout + TDD on `calculatePrice`). Adding a Phase-2-schema extension here mixes scopes (Phase 2 schema spec changes vs. Phase 3 plan deliverables) and risks the owner-prep checkpoint pulling in two unrelated migrations. If real usage shows visitors hitting the bed-size confusion, a small follow-up plan (Phase 3 add-on or Phase 4 ride-along) wires it in cleanly.

**If the owner wants it now:** treat it as a Rule-2 deviation in Plan 03-02 execution — add the `laserBedSize` field to the existing Phase 2 `studio-info` schema (mirroring `responseTimePromise` shape), populate it once, and surface a warning in `GeometrySummary.jsx`'s laser-mode rendering. Document as a deviation in `03-02-SUMMARY.md`.

### Open Question 6 (this spec) — what happens if the owner accidentally publishes TWO `pricing-rule` docs for the same material?

**Question:** The cardinality decision is "one rule per material" but Sanity does not enforce 1:1 references on schema. If the owner duplicates a rule (or an old draft slips into production), the GROQ join `*[_type == "pricing-rule" && references(^._id)][0]` deterministically picks the FIRST match — but "first" is undefined ordering, so the visible price could change if the owner publishes a second rule.

**Recommendation:** Accept this as an owner-side discipline issue rather than encoding a uniqueness constraint in schema. Sanity v3 supports `validation: (Rule) => Rule.unique()` on simple fields but not cross-document uniqueness on references. Adding a custom uniqueness validator (querying the dataset on save) is over-engineering for a single-owner studio. Document the expectation in §5's checklist (one rule per material) and rely on the `preview.prepare` hook in §3 to surface the linked material's title in the document list — which makes a duplicate stand out visually in the studio sidebar.

**If it bites in practice:** revisit and add an `order(_createdAt desc)` to the GROQ join so the most-recently-created rule wins, with a docstring explanation.
