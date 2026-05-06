# Phase 2 — Sanity Studio Schema Spec (Owner Prep)

> **Header note (read first).** This is the canonical Phase 2 owner-prep doc. Apply schemas in Sanity Studio BEFORE the Plan-02 / Plan-04 executors run (per CONTEXT.md D-07). Each plan that depends on a Sanity content type names its blocking schemas:
>
> - Plan 02 (`MaterialsSection` / `FAQ` / `WontMake` / `TrustCopyBlock`) blocks on: `process` enum + 2 enum docs, `material.processes` migrated, `studio-info` singleton present, `print-style` + `laser-style` extension live, `faq` schema live.
> - Plan 04 (SEO meta + JSON-LD wiring) blocks on: `studio-info` populated with `name`, `description`, `url`, `address`, `sameAs`, `areaServed`, `makesOffer`, `ogImage`; `seo` block populated on `laser-style`/`print-style` docs.
>
> If owner cannot complete the schema migration in time, note the deviation in PLAN.md and use the **D-07 fallback** shape for `material.processes` (string array) — the GROQ fallback path is documented below.
>
> All schemas use Sanity Studio v3 `defineType` / `defineField` syntax. Field names are **camelCase** to match existing project conventions (`listImage`, `detailImages`, `cuttingSpecs`, `preferredMaterials`).

---

## 1. `process` enum (NEW — supporting doc)

```ts
// process.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'process',
  type: 'document',
  title: 'Process',
  fields: [
    defineField({
      name: 'key',
      type: 'string',
      title: 'Key',
      description: 'Stable identifier — "laser" or "print". Lowercase, no spaces.',
      options: { list: ['laser', 'print'] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'label', type: 'string', title: 'Display label' }),
  ],
  preview: { select: { title: 'label', subtitle: 'key' } },
});
```

**Owner action after publishing the schema:**

1. Create a `process` document with `key: "laser"`, `label: "Laser cutting"`.
2. Create a `process` document with `key: "print"`, `label: "3D printing"`.

Without these two docs the reference-array dereference in MaterialsSection / FAQ returns nothing and every section renders the empty state.

---

## 2. `material.processes` migration (D-06 target / D-07 fallback)

### D-06 target shape (preferred — reference array)

Add or replace the `processes` field on the existing `material` schema:

```ts
// material.ts — MODIFY existing schema
defineField({
  name: 'processes',
  type: 'array',
  title: 'Processes',
  description: 'Which services use this material? Add laser, print, or both.',
  of: [{ type: 'reference', to: [{ type: 'process' }] }],
  validation: (Rule) => Rule.min(1),
}),
```

**Owner migration steps:**

1. Publish the `process` schema and create the two enum docs (step 1 above).
2. Modify the `material.processes` field shape in Sanity Studio.
3. Re-tag every existing material doc — for each material set `processes` to `[laser]`, `[print]`, or `[laser, print]` reference values.
4. Verify in the Studio Vision tool (see §6 below).

**Resulting GROQ filter** (used in `src/components/services/MaterialsSection.jsx` Plan 02):

```groq
*[_type == "material" && $serviceKey in processes[]->key] | order(order asc){ ... }
```

### D-07 fallback (if ref-array migration is too painful)

Leave `processes` as a free-text string array. Use:

```ts
defineField({
  name: 'processes',
  type: 'array',
  title: 'Processes',
  description: 'Tag with "laser", "print", or "both".',
  of: [{ type: 'string' }],
  options: { list: ['laser', 'print', 'both'] },
  validation: (Rule) => Rule.min(1),
}),
```

**Resulting GROQ filter** (Plan 02 executor swaps to this if Outcome B in §6 below):

```groq
*[_type == "material" && $serviceKey in processes] | order(order asc){ ... }
```

If the owner reports the migration cost is prohibitive (a large existing material count making per-doc retagging painful), Plan 02-02's executor swaps to the fallback GROQ in `src/components/services/MaterialsSection.jsx`'s `MATERIALS_QUERY` constant (one-line change) and notes the deviation in `02-02-SUMMARY.md`.

---

## 3. `studio-info` singleton (NEW per D-13 + D-21)

```ts
// studio-info.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'studio-info',
  type: 'document',
  title: 'Studio Info',
  // Singleton — disable create/delete in studio structure (configure in structure.ts).
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Studio name',
      description: 'Used in <title> and JSON-LD.',
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Short description',
      rows: 3,
    }),
    defineField({
      name: 'serviceArea',
      type: 'string',
      title: 'Service area',
      description: 'e.g., "Greater Seattle area".',
    }),
    defineField({
      name: 'pickupAvailability',
      type: 'string',
      title: 'Pickup availability',
    }),
    defineField({
      name: 'responseTimePromise',
      type: 'string',
      title: 'Response-time promise',
    }),
    defineField({
      name: 'address',
      type: 'object',
      title: 'Address (for JSON-LD)',
      fields: [
        { name: 'streetAddress', type: 'string', title: 'Street (optional — leave empty for service-area-only)' },
        { name: 'addressLocality', type: 'string', title: 'City' },
        { name: 'addressRegion', type: 'string', title: 'State / region' },
        { name: 'postalCode', type: 'string', title: 'Postal code' },
        { name: 'addressCountry', type: 'string', title: 'Country code (e.g., "US")', initialValue: 'US' },
      ],
    }),
    defineField({ name: 'telephone', type: 'string', title: 'Phone (optional)' }),
    defineField({
      name: 'url',
      type: 'url',
      title: 'Site URL',
      initialValue: 'https://shapesmith.studio',
    }),
    defineField({
      name: 'sameAs',
      type: 'array',
      title: 'Social profile URLs',
      of: [{ type: 'url' }],
    }),
    defineField({
      name: 'openingHours',
      type: 'string',
      title: 'Opening hours / availability',
      description: 'Free text, e.g., "By appointment".',
    }),
    defineField({
      name: 'areaServed',
      type: 'array',
      title: 'Areas served (cities/regions)',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'makesOffer',
      type: 'array',
      title: 'Services offered (for JSON-LD)',
      of: [{ type: 'string' }],
      description: 'e.g., ["Laser cutting", "3D printing"].',
    }),
    defineField({
      name: 'ogImage',
      type: 'image',
      title: 'Default og:image',
      description: 'Studio-branded fallback image used when a route has no own image.',
      fields: [{ name: 'altText', type: 'string', title: 'Alt text' }],
    }),
  ],
});
```

**Singleton enforcement:** Only one document of this type should ever exist. The owner-side concern is to configure `structure.ts` so the Studio shows a single editor entry rather than a list — not the planner's responsibility.

**Placeholder copy to commit on the singleton (per D-16 — every Sanity-backed copy field must have at minimum a non-empty placeholder before relaunch).** The owner edits these in Studio whenever they prefer; the relaunch does not block on owner copy.

| Field | Placeholder copy |
|-------|------------------|
| `name` | `Shapesmith Studio` |
| `description` | `Local laser cutting and 3D printing for hobbyists and small businesses.` |
| `serviceArea` | `Serving the Greater [City] area. Pickup available by appointment.` |
| `pickupAvailability` | `Local pickup available — message us to arrange.` |
| `responseTimePromise` | `We reply within 1 business day.` |
| `address.addressCountry` | `US` |
| `url` | `https://shapesmith.studio` |
| `openingHours` | `By appointment` |
| `areaServed` | `["Greater [City] area"]` |
| `makesOffer` | `["Laser cutting", "3D printing"]` |

---

## 4. `print-style` (NEW per SVC-05)

Mirror of `laser-style` so the **shared GROQ projection** in `ServicesContext` works for both (D-05). Add new fields to `laser-style` (§5 below) so the schemas stay in sync — projection drift between the two is the named pitfall in RESEARCH §"Pitfall 3".

```ts
// print-style.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'print-style',
  type: 'document',
  title: '3D Print Style',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'order', type: 'number', title: 'Order (lower = first)' }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'description', type: 'text', rows: 4 }),
    defineField({ name: 'header', type: 'string', title: 'Detail-page header' }),
    defineField({ name: 'preferredMaterials', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'considerations', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'turnaround',
      type: 'string',
      title: 'Turnaround time',
      description: 'e.g., "1–2 weeks".',
    }),
    defineField({
      name: 'wontMakeScope',
      type: 'array',
      title: '"What we won\'t make" copy',
      of: [{ type: 'block' }], // portable text
    }),
    defineField({
      name: 'seo',
      type: 'object',
      title: 'SEO',
      fields: [
        { name: 'metaTitle', type: 'string' },
        { name: 'metaDescription', type: 'text', rows: 2 },
        {
          name: 'ogImage',
          type: 'image',
          fields: [{ name: 'altText', type: 'string' }],
        },
      ],
    }),
    defineField({
      name: 'listImage',
      type: 'image',
      title: 'Grid card image',
      fields: [{ name: 'altText', type: 'string' }],
    }),
    defineField({
      name: 'detailImages',
      type: 'array',
      of: [
        {
          type: 'image',
          fields: [{ name: 'altText', type: 'string' }],
        },
      ],
    }),
  ],
});
```

**Placeholder copy for first `print-style` entry (D-16 — non-empty so the grid renders).** The owner can publish a single bare-bones doc to satisfy the relaunch acceptance ("3D printing styles coming soon" empty state is also acceptable):

| Field | Placeholder |
|-------|-------------|
| `title` | `Functional prints` |
| `order` | `1` |
| `slug` | auto from title |
| `description` | `Functional pieces — brackets, jigs, replacement parts. We print in PLA, PETG, or TPU depending on use.` |
| `header` | `Functional 3D prints` |
| `preferredMaterials` | `["PLA", "PETG", "TPU"]` |
| `considerations` | `["Layer height affects finish.", "Larger prints take longer.", "We test-fit before final delivery."]` |
| `turnaround` | `Most prints ready in 1–2 weeks.` |
| `wontMakeScope` | (portable text) `We don't print food-contact items, gun parts, or copyrighted designs.` |
| `seo.metaTitle` | `Functional 3D prints` |
| `seo.metaDescription` | `Functional 3D-printed parts — brackets, jigs, replacement parts. PLA, PETG, TPU.` |
| `listImage` | (empty — `<Placeholder>` renders "3D print example coming soon") |

---

## 5. `laser-style` extension (NEW fields per D-14, D-19)

Owner adds these three NEW fields to the existing `laser-style` schema. Keep all existing fields intact.

```ts
// laser-style.ts — ADD these defineField entries to the existing schema's `fields` array.

defineField({
  name: 'turnaround',
  type: 'string',
  title: 'Turnaround time',
  description: 'e.g., "1–2 weeks".',
}),
defineField({
  name: 'wontMakeScope',
  type: 'array',
  title: '"What we won\'t make" copy',
  of: [{ type: 'block' }], // portable text
}),
defineField({
  name: 'seo',
  type: 'object',
  title: 'SEO',
  fields: [
    { name: 'metaTitle', type: 'string' },
    { name: 'metaDescription', type: 'text', rows: 2 },
    {
      name: 'ogImage',
      type: 'image',
      fields: [{ name: 'altText', type: 'string' }],
    },
  ],
}),
```

**Placeholder copy (D-16) for each existing `laser-style` doc:**

| Field | Placeholder |
|-------|-------------|
| `turnaround` | `Most jobs ready in 1–2 weeks.` |
| `wontMakeScope` | (portable text) `We don't cut PVC, vinyl, polycarbonate, ABS, or anything food-contact. We also pass on copyrighted designs and gun parts.` |
| `seo.metaTitle` | (use the doc `title` as default) |
| `seo.metaDescription` | (use the doc `description` as default, truncated to ~155 chars) |
| `seo.ogImage` | (leave empty — JSON-LD / SEOHead fall back to studio-info.ogImage) |

---

## 6. `faq` (NEW per CNT-03 / D-15)

```ts
// faq.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'faq',
  type: 'document',
  title: 'FAQ',
  fields: [
    defineField({
      name: 'question',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'answer',
      type: 'array',
      of: [{ type: 'block' }], // portable text
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'service',
      type: 'array',
      title: 'Applies to service(s)',
      description: 'Tag with laser, print, or both.',
      of: [{ type: 'reference', to: [{ type: 'process' }] }],
      validation: (Rule) => Rule.min(1),
    }),
    defineField({ name: 'order', type: 'number' }),
  ],
  preview: { select: { title: 'question' } },
});
```

**GROQ for service-filtered FAQ (used in Plan 02 `FAQ` component):**

```groq
*[_type == "faq" && $serviceKey in service[]->key] | order(order asc){
  _id, question, answer, order
}
```

**Placeholder copy skeleton (D-16, 5–8 items per service).** The owner refines in Studio:

1. **What file formats do you accept?** (laser + print) — common formats list, brief note on file-prep tips.
2. **What size can you make?** (laser + print) — bed/cut sizes, max print volume.
3. **How long does a job take?** (laser + print) — points at the `turnaround` field on each style; may differ per material.
4. **Do you offer pickup or shipping?** (laser + print) — references `pickupAvailability` from `studio-info`.
5. **What happens after I contact you?** (laser + print) — quick description of the manual quote-and-confirm flow.
6. **Do you offer design help?** (laser + print) — what we'll do, what's beyond scope.
7. **Can you do rush jobs?** (laser + print) — when yes, when not.
8. **What materials do you keep in stock?** (laser + print) — points at the in-page `MaterialsSection`.

---

## 7. Owner verification (Sanity Vision)

After publishing the schemas above and re-tagging materials, run this exact query in Sanity Vision (Studio sidebar → Vision plugin):

**Verify D-06 reference-array shape works:**

```
*[_type == "material" && "laser" in processes[]->key]
```

This should return at least one laser-tagged material. If it returns nothing AND the `process` enum docs (key: "laser", key: "print") exist AND materials have at least one reference set, the migration is incomplete.

**If the materials still use the D-07 fallback string-array shape:**

```
*[_type == "material" && "laser" in processes]
```

This should return at least one laser-tagged material when materials are tagged with the literal strings `"laser"` / `"print"` / `"both"`.

**Plan 02-01 Task 4 checkpoint** asks the owner to run `*[_type == "material"][0..2]{processes}` and report which shape the field is in (Outcome A — references, or Outcome B — strings). Plan 02-02's executor reads the recorded outcome from `02-01-SUMMARY.md` and updates the `MATERIALS_QUERY` accordingly.

---

## 8. Schema rollout checklist for the owner

Tick in order:

- [ ] Add `process` schema and publish.
- [ ] Create the two enum docs (`key: "laser"`, `key: "print"`).
- [ ] Modify `material.processes` to the D-06 ref-array shape (or accept D-07 fallback).
- [ ] Re-tag existing materials with their service references (or string tags for D-07).
- [ ] Add `studio-info` schema, publish, create the singleton doc, fill placeholder copy in §3.
- [ ] Add `print-style` schema, publish, create one starter doc with §4 placeholder copy.
- [ ] Extend `laser-style` with the 3 new fields in §5; fill placeholder copy on every existing doc.
- [ ] Add `faq` schema, publish, create 5–8 FAQ docs per service tagged with `process` references.
- [ ] Run the verification query in §7. Record the outcome in `02-01-SUMMARY.md` per the Plan 02-01 Task 4 checkpoint.
