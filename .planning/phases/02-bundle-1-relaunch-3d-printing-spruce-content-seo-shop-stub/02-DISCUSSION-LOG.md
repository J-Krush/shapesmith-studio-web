# Phase 2: Bundle 1 Relaunch — 3D printing + spruce + content + SEO + shop stub - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub
**Areas discussed:** Context architecture, Visual spruce direction, Trust copy & content schemas, SEO + shop stub depth

---

## Context architecture

### Q1 — Which context shape for the new /3d-printing surface?

| Option | Description | Selected |
|--------|-------------|----------|
| Generalized ServicesContext (Recommended) | One ServicesContext + SingleServiceContext parameterized by serviceKey. +2 files, pattern proves itself for Bundle 2/3. Migration sequence keeps laser working throughout. | |
| Parallel PrintsContext | PrintsContext + SinglePrintContext mirroring existing project contexts. +4 files, lowest risk. Bundle 2/3 each invent own pattern. | |
| You decide | Claude's discretion under "lowest risk + Bundle 2 leverage" brief. | ✓ |

**User's choice:** "You decide" — granted Claude's discretion. Claude will default to generalized ServicesContext (D-01) unless the planner finds a concrete obstacle in the codebase.

### Q2 — ProjectsContext compat shim or clean rip?

| Option | Description | Selected |
|--------|-------------|----------|
| Clean rip in this phase (Recommended) | Delete src/context/ProjectsContext.jsx + SingleProjectContext.jsx in same phase. | ✓ |
| Compat shim (re-export from new context) | Keep old import paths working via one-line shim. | |
| You decide | Claude picks based on grep of consumers. | |

**User's choice:** Clean rip in this phase. Captured as D-03.

### Q3 — material.processes shape (Sanity owner-prep) handling?

| Option | Description | Selected |
|--------|-------------|----------|
| Plan against 'reference array', flag as owner pre-req (Recommended) | Plan assumes reference-array shape; ships with written schema spec for owner Studio prep. Falls back to free-text if migration cost is too high. | ✓ |
| Defer until owner confirms current shape | Block MAT-01/02 planning until owner reports back. | |
| Free-text strings for now | Skip migration; use 'laser'/'print'/'both' string tags. | |

**User's choice:** Plan against reference array, flag as owner pre-req. Captured as D-06, D-07.

### Q4 — Boundary structure for shop's eventually-divergent data shape?

| Option | Description | Selected |
|--------|-------------|----------|
| Generalize what's identical, leave the rest separate (Recommended) | ServicesContext only generalizes laser+print. Shop gets its own ShopContext when Bundle 3 lands. Avoids 'if (service === ...)' anti-pattern. | ✓ |
| Single Context for all three | Force shop into ServicesContext from the start with optional fields. | |
| You decide | Claude makes the call when Bundle 3 lands. | |

**User's choice:** Generalize what's identical, leave the rest separate. Captured as D-04.

---

## Visual spruce direction

### Q1 — How aggressive is the spruce within the dark identity?

| Option | Description | Selected |
|--------|-------------|----------|
| Layout + composition only (Recommended) | Keep palette (#348bd8 accent), fonts, accent. Refresh hero composition, nav structure, component spacing. No color/typography changes. | ✓ |
| Layout + targeted palette refresh | Plus tweak accent and add secondary accent within same dark identity. | |
| Layout + palette + motion/depth | Plus subtle gradients, hover/transition states, framer-motion polish. | |
| You decide | Claude defaults to layout + composition only. | |

**User's choice:** Layout + composition only. Captured as D-08.

### Q2 — Photography placeholder strategy until H2D photo session?

| Option | Description | Selected |
|--------|-------------|----------|
| Stylized placeholder blocks with caption (Recommended) | Solid-fill colored card with caption '3D print example coming soon'. Sanity-driven — placeholder when image field is empty. | ✓ |
| Hide print cards entirely until photos exist | Don't render any /3d-printing styles until owner has photos. | |
| Reuse laser photos with explicit labeling | Borrow laser-style images with overlay. | |
| SVG illustration placeholders | Generated abstract SVG geometry. | |

**User's choice:** Stylized placeholder blocks with caption. Captured as D-11.

### Q3 — Where does the spruce 'definition' live?

| Option | Description | Selected |
|--------|-------------|----------|
| Token-first in tailwind.config.js + route checklist (Recommended) | Define spruce as diff in tailwind.config.js before component work. Sweep every route on a checklist. | ✓ |
| Component-by-component, no central token doc | Sweep each component as touched for other reasons. | |
| Hybrid: tokens for palette only, ad-hoc for layout/composition | Token diff for color/spacing changes; layout per-route. | |

**User's choice:** Token-first + route checklist. Captured as D-09.

### Q4 — Hero refresh structural shape?

| Option | Description | Selected |
|--------|-------------|----------|
| Split-or-stacked dual service framing (Recommended) | Both services with equal visual weight: 50/50 split desktop, stacked mobile, or single composition with dual CTAs. | ✓ |
| Single compelling shot + two CTAs below | One large hero image, two CTA buttons. | |
| Owner has a specific reference in mind | Surface a site/example to mirror. | |

**User's choice:** Split-or-stacked dual-service framing. Captured as D-10.

---

## Trust copy & content schemas

### Q1 — How to model trust facts in Sanity?

| Option | Description | Selected |
|--------|-------------|----------|
| New `studio-info` singleton + per-service overrides (Recommended) | Singleton holds shared facts; service docs extend with per-service fields. | ✓ |
| Extend `profile` doc with everything | Add fields to existing profile doc. | |
| All per-service on `laser-style`/`print-style` | Every fact lives on service doc. | |
| You decide | Claude picks based on natural read pattern. | |

**User's choice:** studio-info singleton + per-service overrides. Captured as D-13, D-14.

### Q2 — FAQ schema shape and count?

| Option | Description | Selected |
|--------|-------------|----------|
| New `faq` schema, service-tagged, 5–8 per service (Recommended) | New faq doc type: question, answer (portable text), service (reference array), order. | ✓ |
| FAQ items embedded inline on service docs | faqs array directly on laser-style/print-style. | |
| Start with 3–5 items, grow over time | Lower initial copy burden. | |

**User's choice:** New faq schema, 5–8 per service. Captured as D-15.

### Q3 — Who writes the initial trust copy?

| Option | Description | Selected |
|--------|-------------|----------|
| Owner writes during planning | Owner drafts BEFORE plans execute. Risk: blocks execution if not ready. | |
| Plan ships with placeholder copy, owner replaces in Sanity (Recommended) | Plan writes structural placeholders. Owner edits in Studio when ready. | ✓ |
| Hybrid: response-time + service-area real, FAQ + won't-make as placeholders | Real for one-line items, placeholders for longer-form. | |

**User's choice:** Plan ships placeholder copy. Captured as D-16.

### Q4 — Materials section UX on each service page?

| Option | Description | Selected |
|--------|-------------|----------|
| Anchor link from service hero → in-page Materials section, per-service filter (Recommended) | 'See materials' anchor link to #materials lower on page. Section filtered by service tag. /materials redirects with friendly notice. | ✓ |
| Tabs on a single Materials section showing both services | Tab switcher to peek at other service's materials. | |
| Materials as a separate route per service | Sub-route per service. (PROJECT.md explicitly rejects this.) | |

**User's choice:** Anchor link + in-page Materials section + per-service filter. Captured as D-17.

---

## SEO + shop stub depth

### Q1 — Where do per-page SEO meta tags get sourced from?

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid: hardcoded defaults + Sanity overrides for service pages (Recommended) | Static routes get hardcoded title/description; service routes read from Sanity seo block. | ✓ |
| All hardcoded in route components | Simplest. No Sanity coupling. | |
| Fully Sanity-driven (every route) | Even / and /about pull from a Sanity page-seo doc. | |

**User's choice:** Hybrid sourcing. Captured as D-19.

### Q2 — og:image strategy without H2D photos?

| Option | Description | Selected |
|--------|-------------|----------|
| Studio-branded fallback + per-service override (Recommended) | Single branded fallback for routes without their own; per-service override when image exists. | ✓ |
| Per-route generated with Vercel/Netlify OG | Generate og:images dynamically at build time. | |
| No og:image until photos exist | Skip og:image meta entirely. | |

**User's choice:** Studio-branded fallback + per-service override. Captured as D-20.

### Q3 — LocalBusiness JSON-LD field set?

| Option | Description | Selected |
|--------|-------------|----------|
| Core local fields, owner-tunable in Sanity (Recommended) | name, description, url, telephone, address, geo, sameAs, openingHours, areaServed, makesOffer. From studio-info doc. | ✓ |
| Minimum viable: name + url + areaServed only | Bare-minimum JSON-LD. | |
| Full schema.org LocalBusiness + Service offerings | Plus per-service Service entries linked to LocalBusiness. | |

**User's choice:** Core local fields, owner-tunable. Captured as D-21.

### Q4 — /shop Coming Soon depth and email-capture promise?

| Option | Description | Selected |
|--------|-------------|----------|
| Lean: heading + 1–2 sentences + email field (Recommended) | One promise sentence + single email + 'Notify me' button via Netlify shop-notify form. | ✓ |
| Tease + email capture | Plus 2–3 example product types or category teasers. | |
| Bare 'Coming Soon' — no email capture | Just placeholder. (Violates SHOP-02.) | |

**User's choice:** Lean version with email field. Captured as D-23.

---

## Claude's Discretion

The user explicitly granted Claude discretion on:
- The context architecture choice (Q1 of Area 1) — defaults to generalized ServicesContext per the discretion brief.

The CONTEXT.md `<decisions>` block also documents Claude-discretion items not explicitly asked but noted in D-32 and the Claude's Discretion subsection (specific Tailwind token diff content, hero composition specifics within the dual-service constraint, sitemap generation approach, exact Sanity field naming where no convention conflict exists, whether the per-route sweep checklist is a literal `.md` file).

## Deferred Ideas

See CONTEXT.md `<deferred>` for the full list. Highlights raised during this discussion or carried forward from prior phases:

- Reusable `<Modal>` / `<Gallery>` extraction at N=2 — only if abstraction is clean.
- Tailwind `dark:` prefix flattening — possible during route sweep, not required by D-08.
- Sanity env-driven config — best paired with Phase 4 Vite migration.
- Per-route test coverage beyond Phase 1 smoke — revisit alongside Bundle 2 quote tool.
- Real H2D photography session — owner-side, not blocking; placeholder strategy covers gap.
- Customer reviews / testimonials — flagged for v2 once owner accumulates real material.
- Plausible Analytics — research recommended; not in REQ-XX, no Phase 2 dependency.
