# Phase 2 — Sanity Studio Schema Spec (Owner Prep)

> **Header note (read first).** This is the canonical Phase 2 owner-prep doc. Apply schemas in Sanity Studio BEFORE the Plan-02 / Plan-04 executors run (per CONTEXT.md D-07). Each plan that depends on a Sanity content type names its blocking schemas:
>
> - Plan 02 (`MaterialsSection` / `FAQ` / `WontMake` / `TrustCopyBlock`) blocks on: `material.services` field added + backfilled, `studio-info` singleton present, `print-style` + `laser-style` extension live, `faq` schema live, `process` enum + 2 enum docs (still required for `faq.service` references — see §6).
> - Plan 04 (SEO meta + JSON-LD wiring) blocks on: `studio-info` populated with `name`, `description`, `url`, `address`, `sameAs`, `areaServed`, `makesOffer`, `ogImage`; `seo` block populated on `laser-style`/`print-style` docs.
>
> All schemas use Sanity Studio v3 `defineType` / `defineField` syntax. Field names are **camelCase** to match existing project conventions (`listImage`, `detailImages`, `cuttingSpecs`, `preferredMaterials`).

---

## Deviation from Plan 02-01 Task 4 Checkpoint

**Date:** 2026-05-06
**Decision authority:** owner (resolves CONTEXT.md D-06 / D-07 ambiguity for `material`)

The Plan 02-01 Task 4 checkpoint asked the owner to verify the actual shape of `material.processes` in Sanity Studio. The Vision query returned values like:

```json
{ "processes": ["Cut", "engrave", "etch"] }
```

This is a **flat string array of laser-cutting operations** — NOT service-compatibility tags (`laser` / `print` / `both`). The plan's D-06 reference-array path and D-07 string-array fallback **both assumed** the field documented service compatibility. The actual semantics are different: `material.processes` documents which **laser operations** a material supports.

**Owner-approved approach:** Add a NEW field `services` to the `material` schema (string array of `laser` | `print` | `both`). The existing `processes` field is preserved as-is — it correctly documents laser operations and remains useful. Backfill: every existing `material` doc gets `services: ["laser"]` (current site is laser-only). The MaterialsSection GROQ filter becomes `$serviceKey in services` (a flat-string-array check — neither D-06 ref-deref nor D-07 process-string).

**Sections affected by this deviation:**
- §2 — Replaces the `material.processes` migration section with **§2 `material.services` field addition**.
- §7 — Owner verification query updated to query `services` (not `processes`).
- §8 — Rollout checklist updated to reflect the new field + backfill.
- §1 — `process` enum is **no longer required for `material`**. It is still required for `faq.service` references (see §6); kept in this doc on those grounds.

**Wave 2 executor notes:** `MaterialsSection.jsx` `MATERIALS_QUERY` filter must read `$serviceKey in services` — not `$serviceKey in processes[]->key` (D-06) and not `$serviceKey in processes` (D-07). Both prior paths are obsolete.

---

## 1. `process` enum (NEW — supporting doc, scope reduced by deviation)

> **Scope note (per Task 4 deviation):** This enum is no longer used by `material` (which adopts the simpler `services` string-array field — §2). It is still used by `faq.service` (§6) where the reference-array shape mirrors the editorial workflow naturally. If owner prefers, the same flat-string-array pattern could be adopted on `faq.service` later (deferred — not required for the relaunch).

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

Without these two docs the reference-array dereference in `faq` returns nothing and the FAQ section renders the empty state.

---

## 2. `material.services` field addition (RESOLVES Task 4 checkpoint)

> **Status:** Resolves CONTEXT.md D-06 / D-07 ambiguity. Replaces the prior "migrate `processes` field" guidance — `processes` is preserved as-is (it documents laser operations like `Cut`, `engrave`, `etch` — see deviation note above).

### What to add

Add a NEW `services` field to the existing `material` schema. **Do not modify, rename, or remove the existing `processes` field** — it documents laser operations and is still useful (and may be surfaced in the UI for laser materials in a later phase).

```ts
// material.ts — ADD this defineField entry to the existing schema's `fields` array.
defineField({
  name: 'services',
  type: 'array',
  title: 'Services',
  description: 'Which Shapesmith services use this material? Tag laser, print, or both.',
  of: [{ type: 'string' }],
  options: { list: ['laser', 'print', 'both'] },
  validation: (Rule) => Rule.min(1),
}),
```

### Backfill (one-time, all existing materials)

Every existing `material` doc must be backfilled with `services: ["laser"]` (the current site is laser-only — the existing materials are all laser-compatible). This is a one-time edit per doc in Studio (or a single Vision/CLI mutation if owner prefers a batch update).

**Suggested batch mutation in Sanity Vision** (Studio sidebar → Vision plugin → switch to "Mutate" mode):

```json
{
  "mutations": [
    {
      "patch": {
        "query": "*[_type == \"material\" && !defined(services)]",
        "set": { "services": ["laser"] }
      }
    }
  ]
}
```

After running, every laser material is tagged. New 3D-print materials added later get `services: ["print"]` (or `["laser", "print"]` for materials that work for both).

### Resulting GROQ filter

Used in `src/components/services/MaterialsSection.jsx` (Plan 02-02 implements):

```groq
*[_type == "material" && $serviceKey in services] | order(order asc){ ... }
```

**Important:** This is a flat-string-array `in` check on the new `services` field — not `$serviceKey in processes[]->key` (D-06, obsolete) and not `$serviceKey in processes` (D-07, obsolete). Both prior approaches are superseded by this deviation.

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

After adding the `material.services` field and backfilling, run this exact query in Sanity Vision (Studio sidebar → Vision plugin):

**Verify the `material.services` field is populated:**

```
*[_type == "material" && "laser" in services]
```

This should return at least one (likely all) laser-tagged material. If it returns nothing, the backfill is incomplete — re-run the patch mutation in §2.

**Verify a sample doc shape:**

```
*[_type == "material"][0..2]{title, services, processes}
```

Expected output: each material has both `services` (e.g., `["laser"]`) AND `processes` (e.g., `["Cut", "engrave", "etch"]`). The `processes` field is preserved as-is from before the deviation.

**FAQ verification** (after `faq` schema + docs are published per §6):

```
*[_type == "faq" && "laser" in service[]->key]
```

Should return the FAQ items tagged for laser. Requires the `process` enum docs from §1 to exist.

---

## 8. Schema rollout checklist for the owner

Tick in order:

- [ ] Add `process` schema (§1) and publish — required for `faq.service` references.
- [ ] Create the two `process` enum docs (`key: "laser"`, `key: "print"`).
- [ ] Add the new `services` field to `material` (§2) and publish.
- [ ] Backfill `services: ["laser"]` on every existing material (Vision patch mutation in §2, or per-doc edit in Studio).
- [ ] Add `studio-info` schema (§3), publish, create the singleton doc, fill placeholder copy.
- [ ] Add `print-style` schema (§4), publish, create one starter doc with placeholder copy.
- [ ] Extend `laser-style` with the 3 new fields (§5); fill placeholder copy on every existing doc.
- [ ] Add `faq` schema (§6), publish, create 5–8 FAQ docs per service tagged with `process` references.
- [ ] Run the verification queries in §7. Both `material.services` and `faq.service` should return populated rows.
