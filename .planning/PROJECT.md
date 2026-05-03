# Shapesmith Studio

## What This Is

The web presence for Shapesmith Studio — a one-person creative studio offering laser cutting and (newly) 3D printing services to local hobbyists and small businesses. The site shows what the studio can make, lets people see materials and example styles, and routes them into a contact/quote flow. It's a marketing surface and lead-generation tool — not a transactional storefront yet.

## Core Value

The site has to look legit enough that the owner feels comfortable marketing it again — visual confidence first, features second.

## Requirements

### Validated

<!-- Existing capabilities inferred from the codebase. -->

- ✓ Sanity-backed `/styles` (laser-cutting service surface) with grid + slug-based detail pages — existing
- ✓ Sanity-backed `/materials` page (single-list materials catalog) — existing
- ✓ `/about` page driven by Sanity `profile` document — existing
- ✓ `/contact` page with Netlify Forms + honeypot submission — existing
- ✓ Home page with hero, projects grid, "our process", quick specs, collaborations — existing
- ✓ React Router v6 SPA shell with shared header/footer + scroll behaviors — existing
- ✓ Tailwind-based dark-themed visual language with custom palette and self-hosted GeneralSans/Proxima Nova fonts — existing

### Active

<!-- Current scope. Building toward these. Hypotheses until shipped. -->

**Bundle 1 — Spruce + 3D printing launch (highest priority, ASAP)**

- [ ] Add `/3d-printing` top-level route mirroring the `/styles` pattern (grid + slug detail pages, Sanity-driven; placeholder media OK)
- [ ] Move materials off `/materials` and embed as a section within each service page (`/styles` and `/3d-printing`); link from each service page to its own materials section via scroll anchor
- [ ] Refresh homepage hero + nav to feature both services equally (laser cutting + 3D printing)
- [ ] Replace the imperative `document.getElementById` modal in `ProjectGallery` with proper React state-driven rendering
- [ ] Move the force-dark theme out of `App.js` render side-effect (no visual change; correctness fix)
- [ ] Ship the `/shop` route — wire it in with a real "Coming Soon" page so the door is open for the planned shop phase
- [ ] Pre-fill the contact form's "service interested in" from the referrer page (`/3d-printing` → 3D printing; `/styles` → laser cutting); user can change

**Bundle 2 — Auto-pricing quote feature**

- [ ] Visitors can upload a file (STL/3MF for 3D, SVG/DXF for laser), pick material/options, and get an instant ballpark quote
- [ ] Quote calculation: file → estimated material + machine time × rate → ballpark price displayed in the UI
- [ ] Submitted quotes flow to the studio owner for manual confirmation/booking

**Bundle 3 — Real shop (pre-made goods)**

- [ ] Inventory-driven catalog of finished pre-made pieces (laser-cut + 3D-printed)
- [ ] Customer can purchase + check out; payments and inventory handled by a chosen platform (TBD — Shopify, Stripe, Snipcart all in play)
- [ ] Order fulfillment notifications to the studio owner

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- TypeScript migration — explicit user decision; the JS codebase is fine and a TS migration would burn time without serving the core value
- Next.js / framework migration — staying on Create React App; the current SPA is sufficient for a marketing site and migration cost outweighs benefit at this stage
- User accounts / auth — site is fully public read-only; no logged-in experiences are needed for any of the planned bundles
- Blog / article content — not part of any current bundle; can be revisited later if marketing strategy shifts
- Customizable / configurable shop products — when shop ships, it sells pre-made goods only (configurable products would be a separate scope expansion)
- Splitting `/materials` into separate routes (`/materials/laser`, `/materials/3d-print`) — superseded by the in-page section approach
- Replacing the contact form with a dedicated quote form for the spruce bundle — the larger auto-pricing quote feature in Bundle 2 supersedes this; minimal contact-form change for now

## Context

**Returning to a paused project.** The site was built a few years ago and has been sitting. Current owner is coming back to actually drive revenue from the laser cutter and a newly purchased Bambu Labs H2D 3D printer. The original demotivator was marketing fatigue, not product/build problems — so a refresh that *feels* legit is the unlock.

**Codebase state (from `.planning/codebase/`):**
- React 18 + JavaScript (no TS), Create React App 5, Tailwind v3 with a custom palette and `@tailwindcss/forms`
- Sanity CMS as the read-only content source (`projectId: qx9kep1e`, `dataset: production`, hardcoded — no env vars, no auth token, anonymous CDN reads)
- Existing Sanity schemas: `laser-style`, `profile`, `maker-process`, `laser-specs`, `material`, `collaboration`
- Routes: `/`, `/styles`, `/styles/:capability`, `/materials`, `/about`, `/contact`. `Shop.jsx` exists as "Coming Soon" but is not currently routed.
- Hosting: Netlify (static SPA), Netlify Forms for contact submissions
- Two parallel Sanity-fetch idioms coexist: Context providers (`ProjectsContext`, `AboutMeContext`, `SingleProjectContext`) and inline `useEffect` calls in leaf components — the new `/3d-printing` flow should follow the Context-provider pattern (mirroring `ProjectsContext` / `SingleProjectContext`)
- Theme is hard-locked to dark via a render-time side-effect in `App.js`; `useThemeSwitcher` exists but is dead
- `App.test.js` is the only test and is currently broken (looks for "learn react"); no other testing infrastructure
- Known anti-patterns (will be addressed by spruce): imperative DOM modal in `ProjectGallery`, dead `src/data/*` files (legacy pre-Sanity), visible honeypot in contact form, force-dark side effect

**Sanity studio access:** Owner has access and will handle adding the new `print-style` (or equivalent) schema and any other content-type changes themselves, given a written spec from the plan.

**Audience:** Local customers — hobbyists and small businesses near the studio. Tone is friendly, simple, photo-driven. Not a designer/maker spec sheet.

## Constraints

- **Tech stack**: Stay on Create React App + React 18 + JavaScript — no TS, no Next.js. Why: scope discipline; migration cost > value for a marketing site. The build flag `--openssl-legacy-provider` (Node 17+) is the implicit Node-version pin.
- **CMS**: All structured content goes through Sanity, anonymous CDN reads only. Why: established pattern, owner has studio access, no backend to operate.
- **Hosting**: Netlify (static SPA + Netlify Forms). Why: existing deployment, free tier sufficient, no serverless/SSR appetite right now.
- **Lead capture**: Reuse the existing Netlify contact form for the spruce bundle. Why: a richer dedicated quote feature is its own bundle (#2), so spruce should ship without blocking on it.
- **Visual identity**: Targeted spruce only, not a full redesign — same dark theme, same fonts, same overall identity, with hero + nav refresh. Why: core value is "looks legit, ship fast"; a full redesign delays launch.
- **Timeline**: Bundle 1 (spruce + 3D printing) wants to ship ASAP. Bundles 2 and 3 follow when Bundle 1 is live.
- **Photography**: No 3D-print photos exist yet — UI must degrade gracefully to placeholder blocks where Sanity returns no images.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mirror `/styles` for the new `/3d-printing` route (own Sanity content type, own Context provider, own grid + detail pages) | Pattern is established and proven; minimizes net-new architecture; user explicitly chose "Mirror /styles" | — Pending |
| Materials become an in-page section on each service page (no longer top-level `/materials` route) | Materials are most relevant in the context of the service that uses them; reduces nav clutter | — Pending |
| Bundle the visual spruce with the 3D printing launch | Core value is "looks legit"; relaunching with both fresh visuals and the new service feels like a new chapter rather than an incremental change | — Pending |
| Defer real shop platform choice (Shopify vs Stripe+Sanity vs Snipcart) to the shop bundle's discovery phase | Insufficient information now; choice should be informed by inventory size and operational preferences once we get there | — Pending |
| Auto-pricing quote feature is its own bundle (not bundled with spruce) | Real complexity (slicer integration, time/cost estimation); shouldn't block the simpler spruce launch | — Pending |
| Ship `/shop` as "Coming Soon" during the spruce bundle (don't delete it) | Sets expectation with visitors that a shop is coming; aligns with planned Bundle 3 | — Pending |
| Out of scope: TypeScript migration and Next.js migration | Owner explicitly excluded — focus is on shipping new value, not changing foundations | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-02 after initialization*
