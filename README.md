# Shapesmith Studio

The web presence for **Shapesmith Studio** — a one-person creative studio
offering laser cutting and 3D printing services to local hobbyists and
small businesses. The site shows what the studio can make, lets people
see materials and example styles, and routes them into a contact / quote
flow. It is a marketing surface and lead-generation tool, not a
transactional storefront yet.

## Tech stack

Create React App 5 + React 18 + JavaScript (no TypeScript). Tailwind
CSS for styling, Sanity for CMS-backed content (anonymous CDN reads),
and Netlify for hosting + Forms. Per-route SEO + sitemap come from
`react-helmet-async` and a postbuild Node script. The build flag
`--openssl-legacy-provider` is the implicit Node-version pin for
Node 17+; Node 20 LTS + pnpm 9 are the committed runtime via `.nvmrc`
and `package.json#packageManager`.

## Quickstart

Prereqs:

- Node 20 (use `nvm use` if you have nvm — `.nvmrc` selects 20)
- pnpm 9 (`corepack enable pnpm` if needed)

Local dev:

```bash
pnpm install
pnpm start            # dev server on http://localhost:3000
```

Production build:

```bash
pnpm build            # outputs build/ — also writes build/sitemap.xml via postbuild
```

Run the smoke test:

```bash
pnpm test
```

## Content updates (Sanity Studio)

Owner content lives in Sanity, not in this repo. Edits propagate to
production via Sanity's CDN within ~1 minute — no app deploy required.

Schemas in use (see
`.planning/phases/02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub/02-SCHEMA-SPEC.md`
for the canonical spec):

- **`studio-info`** (singleton) — studio-wide facts: serviceArea,
  pickupAvailability, `responseTimePromise` (rendered on the contact
  page), address, social links, openingHours, makesOffer (services
  list), and the homepage `LocalBusiness` JSON-LD field bundle.
- **`laser-style`** / **`print-style`** — one document per service
  style; mirror schemas covering title, description, slug, listImage,
  detailImages, preferredMaterials, considerations, turnaround,
  wontMakeScope (portable text), and a per-doc `seo` block
  (`metaTitle`, `metaDescription`, `ogImage`).
- **`material`** — material entries with a `processes` reference array
  tagging each material with the laser operations it applies to, and a
  `services` string array (`laser`, `print`, or both) for the in-page
  Materials filter.
- **`faq`** — per-service FAQ items (5–8 per service is the target);
  fields: question, answer (portable text), service (reference array),
  order.
- **`process`** — supporting enum doc with two entries: `key: "laser"`
  and `key: "print"`. Drives the references on `material.processes` and
  `faq.service`.

Common content updates:

- **Add a new style.** Create a new `laser-style` or `print-style`
  document, fill in title + slug + description + images, optionally
  fill the `seo` block. Visible immediately on `/styles` or
  `/3d-printing`.
- **Update the response-time promise.** Edit the singleton `studio-info`
  document. The promise displays on the contact page beneath the
  submit button.
- **Add an FAQ entry.** Create a new `faq` document, tag it with the
  `process` reference(s) for the relevant service(s).
- **Update studio facts (address, social links, opening hours).** Edit
  the singleton `studio-info` document. The homepage `LocalBusiness`
  JSON-LD picks up the change on the next page load.

## Deploy

Hosted on Netlify. `netlify.toml` (committed) drives the build:

- `pnpm build` runs the CRA build to `build/`.
- `postbuild` runs `node scripts/generate-sitemap.cjs`, writing
  `build/sitemap.xml` from a static route list + a Sanity slug query.
- Netlify scans `build/index.html` for `<form name="..." netlify ...>`
  blocks at deploy time; both `contact-form` and `shop-notify` are
  declared via the hidden-form prerender in `public/index.html`.
- `public/_redirects` ships a real 301 from `/materials` to
  `/styles#materials` for direct hits + crawlers; React Router's
  `<Navigate>` handles SPA hops.

Form submissions land in the Netlify Forms dashboard.

## Project context

- `.planning/PROJECT.md` — project core value, constraints, and
  decision log.
- `.planning/ROADMAP.md` — phase plan.
- `.planning/REQUIREMENTS.md` — requirement-by-requirement breakdown.
