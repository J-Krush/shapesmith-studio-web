# Requirements: Shapesmith Studio

**Defined:** 2026-05-03
**Core Value:** The site has to look legit enough that the owner feels comfortable marketing it again — visual confidence first, features second.

## v1 Requirements

Requirements for the relaunch and Bundle 1–3 buildout. Each maps to roadmap phases.

### Foundation

<!-- Codebase refactors and environment pinning that unblock subsequent work. -->

- [x] **FOUND-01**: Sanity data fetching is unified through a single `useSanityQuery` hook with consistent `{ data, loading, error }` and request cancellation; existing inline `useEffect` fetch sites are migrated to use it
- [x] **FOUND-02**: A single `SERVICES` constant in `src/data/services.js` is the source of truth for service `key`, `urlSegment`, `navLabel`, Sanity content type, and contact-form subject; the existing load-bearing `capabilitiesTitle` is removed
- [x] **FOUND-03**: The dark-theme application no longer happens as a render-time side effect (moved into `useEffect` or set on `<html>` in `index.html`); `useThemeSwitcher` and any unused `dark:` Tailwind variants are stripped — committing to dark-only for now
- [x] **FOUND-04**: The image-modal in `ProjectGallery` (and its eventual `/3d-printing` equivalent) renders from React state — the `document.getElementById` `classList` manipulation is removed
- [x] **FOUND-05**: Node version is pinned via `.nvmrc` (Node 20 LTS), `netlify.toml` declares `NODE_VERSION` and the build image, and `pnpm-lock.yaml` is committed (currently untracked)
- [x] **FOUND-06**: `App.test.js` is replaced with a smoke test that actually passes; broken legacy test removed

### Services (3D Printing Surface)

<!-- New /3d-printing surface mirroring /styles. -->

- [x] **SVC-01**: Visitors can navigate to `/3d-printing` and see a grid of 3D printing styles backed by a new `print-style` Sanity content type; the page works with placeholder/blank visuals when Sanity returns no images
- [x] **SVC-02**: Visitors can click into a single print style at `/3d-printing/:slug` and see a detail page mirroring the existing `/styles/:capability` shape (header + gallery + info), again degrading gracefully without photography
- [x] **SVC-03**: The site nav shows both "Laser Cutting" and "3D Printing" as peer entries with equal visual weight on every page (mobile + desktop)  *(completed 2026-05-06 — Plan 02-03; AppHeader.jsx NAV_ITEMS via SERVICES.map iterated in both desktop + mobile blocks; pretty-printed "styles" → "Laser Cutting"; active-state border-b-2 border-accent + aria-current="page")*
- [x] **SVC-04**: The existing `/styles` and `/styles/:capability` routes continue to work without regressions throughout the migration  *(completed 2026-05-06 — Plan 02-01; smoke test passes; route param normalized to `:slug` per RESEARCH §Pattern 3)*
- [x] **SVC-05**: The owner can add `print-style` documents in Sanity Studio per a written schema spec produced during planning (no app deploy needed to publish content)  *(completed 2026-05-06 — Plan 02-01; `02-SCHEMA-SPEC.md` shipped covering process enum, material.services field deviation, studio-info, print-style, laser-style extension, faq schemas in defineType syntax)*

### Materials Sections

<!-- Materials move from a top-level route to in-page sections on each service page. -->

- [x] **MAT-01**: Each service page (`/styles` and `/3d-printing`) contains an in-page Materials section listing materials available for that specific service, with a scroll-anchor link from elsewhere on the page (e.g., "See materials")
- [x] **MAT-02**: The Sanity `material` schema supports tagging which service(s) each material applies to (laser, print, both) so the in-page filter is data-driven, not code-driven; owner adds the schema field per planning spec
- [x] **MAT-03**: The old top-level `/materials` route either redirects to the laser materials section anchor or returns a friendly "moved" notice; no broken link

### Visual Spruce

<!-- Targeted homepage refresh and visual sweep — not a full redesign. -->

- [x] **VIS-01**: The homepage hero is refreshed to feature both laser cutting and 3D printing equally, with copy and visual treatment appropriate to a returning relaunch  *(completed 2026-05-06 — Plan 02-03; AppBanner dual-service hero, brand wordmark + H1 "Maker Studio — Custom Laser Cutting & 3D Printing" + 50/50 cards driven by SERVICES.map + single shared accent CTA)*
- [x] **VIS-02**: The site nav (header) is visually refreshed and accommodates the new services entries cleanly on mobile and desktop  *(completed 2026-05-06 — Plan 02-03; peer-equal SERVICES.map nav with active-state, /shop added, /materials dropped, hamburger cleaned up)*
- [x] **VIS-03**: The visual refresh is applied consistently across every route — `/`, `/styles`, `/styles/:slug`, `/3d-printing`, `/3d-printing/:slug`, `/about`, `/contact`, `/shop`, `/404` — no half-spruced surfaces remain  *(completed 2026-05-06 — Plan 02-03; static-inspection sweep verified, indigo synthesis check empty, /404 + /shop routes live, NotFound has inline Helmet noindex)*
- [ ] **VIS-04**: Sanity images are served via `@sanity/image-url` with responsive `srcSet` and lazy loading; full-size CDN originals are no longer used for thumbnails
- [x] **VIS-05**: Dead/legacy code (`src/data/materials.js`, `src/data/aboutMeData.js`, `src/data/singleProjectData.js`, `src/data/images.js`, `src/components/contact/contact-form.js`, unused `styled-components` dependency) is removed in the same window

### Shop Stub

<!-- Shop is wired in as Coming Soon during Bundle 1; real shop is Phase 5. -->

- [x] **SHOP-01**: `/shop` is a real route in the router with a "Coming Soon" page reachable from the nav; no dead link
- [x] **SHOP-02**: The Coming Soon page captures email signups via Netlify Forms so visitors who want notification can opt in

### Contact + Lead Capture

<!-- Contact form gets a service pre-fill; honeypot and dead-form bugs fixed. -->

- [x] **CTC-01**: The contact form's "service interested in" field pre-fills based on referrer page (`/3d-printing` → 3D Printing; `/styles` → Laser Cutting) and `?service=` query string; user can change the value
- [x] **CTC-02**: The Netlify hidden form declaration in `public/index.html` is updated so the new `service` field is recognized at deploy time
- [x] **CTC-03**: The honeypot field is rendered visually hidden (CSS or `hidden` attribute), not visible to humans
- [x] **CTC-04**: The contact page displays a response-time promise ("We reply within 1 business day") sourced from Sanity so the owner can adjust without a redeploy

### Content (Local-Customer Trust)

<!-- "Looks legit" copy work — table-stakes for the local-hobbyist audience. -->

- [x] **CNT-01**: Each service page (`/styles`, `/3d-printing`) shows turnaround time, pickup availability, and service area; copy lives in Sanity (extended `profile` or new `studio-info` schema)
- [x] **CNT-02**: Each service page surfaces a "What we won't make" / scope policy block sourced from Sanity
- [x] **CNT-03**: Each service page includes 5–8 FAQ items backed by a new `faq` Sanity schema (per-service)
- [ ] **CNT-04**: Image alt text on Sanity-backed images uses the existing/extended Sanity alt field, not empty strings or filename fallbacks

### SEO

<!-- Per-page meta + structured data so local search and link previews work. -->

- [x] **SEO-01**: Every route renders a per-page `<title>`, `<meta name="description">`, `og:title`, `og:description`, `og:image`, and `og:url`, driven by `react-helmet-async` (or equivalent) with copy sourced from Sanity per page where appropriate
- [x] **SEO-02**: The homepage embeds Schema.org `LocalBusiness` JSON-LD (business name, location, hours/turnaround, services, contact) so local search can index the studio correctly
- [x] **SEO-03**: A `sitemap.xml` is generated at build time including all routes (including detail pages); `robots.txt` is updated to reference it
- [x] **SEO-04**: README is replaced (currently CRA boilerplate) with a project-specific quickstart and content-update guide

### Quote Tool (Auto-Pricing)

<!-- Bundle 2: instant ballpark estimate via file upload. Manual confirmation required. -->

- [x] **QTE-01**: Visitors can navigate to a Quote page from each service page and from a top-level CTA
- [x] **QTE-02**: Visitors can upload a file (STL/3MF for 3D printing; SVG/DXF for laser cutting) via drag-and-drop or file picker, with stated size/format constraints surfaced before they touch a file
- [x] **QTE-03**: The uploaded file is parsed in the browser (Three.js STLLoader for STL; `dxf` library for DXF; SVG parsing via DOM) and validated client-side; bad files give friendly error messages
- [x] **QTE-04**: Visitors can pick a material and quantity from data-driven options (Sanity `material` filtered by service) and see live updates to the estimate
- [x] **QTE-05**: The estimate is displayed as a price *range* with a visible disclaimer ("Estimate, final price subject to confirmation"); the word "quote" is not used until the owner confirms; a 15–25% markup buffer is applied at the formula level
- [x] **QTE-06**: A `pricing-rule` Sanity schema exposes per-material rate, machine-time multiplier, setup fee, and density so the owner can tune pricing without a deploy
- [ ] **QTE-07**: On submit, the estimate metadata (NOT the file itself by default) is POSTed to a Netlify Function, which validates the input and emails the owner via Resend (or equivalent); the owner manually confirms by replying with a real quote
- [ ] **QTE-08**: The submission form includes server-verified spam protection (reCAPTCHA v3 token verification or equivalent)
- [ ] **QTE-09**: User-uploaded SVG content is sanitized via DOMPurify before being rendered in the DOM; STL/DXF parsing is memory-bounded to prevent oversized-file DoS
- [x] **QTE-10**: Form state persists across page reloads via `localStorage` so visitors who close their tab can resume

### Vite Migration

<!-- Bundle 1.5: between quote feature and shop. CRA exit while site is in a low-stakes window. -->

- [x] **VITE-01**: The build tool migrates from `react-scripts` to Vite with the existing static-SPA output unchanged from a user's perspective; `pnpm build` produces a deployable bundle
- [x] **VITE-02**: All `REACT_APP_*` environment variables are renamed to `VITE_*` and code references updated
- [ ] **VITE-03**: The Netlify build configuration (`netlify.toml`) reflects the new build command and publish directory; deploy preview verifies the migrated site behaves identically to the CRA build

### Shop (Pre-Made Goods)

<!-- Bundle 3: real catalog + checkout for finished pieces. Platform decided in discovery. -->

- [ ] **SHOP-03**: A discovery sub-phase produces a written platform decision (Snipcart / Stripe+Sanity / Shopify Storefront) backed by SKU-count and ops-preference inputs; default is Snipcart unless decision overrides
- [ ] **SHOP-04**: A `product` Sanity schema is finalized in discovery and supports the chosen platform; owner adds product documents per the schema spec
- [ ] **SHOP-05**: Visitors can browse `/shop` and see a grid of pre-made goods (laser-cut + 3D-printed), with detail pages at `/shop/:slug`
- [ ] **SHOP-06**: Visitors can purchase one or more items end-to-end through the chosen platform's checkout flow; orders are received by the owner with all info needed to fulfill and ship
- [ ] **SHOP-07**: Inventory state (sold-out, low stock) is reflected in the storefront in a way that's accurate for the chosen platform

## v2 Requirements

Acknowledged but deferred — not in the current roadmap.

### Quote Enhancements

- **QTE-11**: Real slicer integration (Cura-Engine in a Netlify Background Function or hosted slicer API) for tighter ballpark accuracy
- **QTE-12**: Customer dashboard for tracking submitted estimates and their owner-confirmed quotes
- **QTE-13**: STL preview rendering in the quote UI (using R3F + drei) so visitors see what they uploaded

### Shop Enhancements

- **SHOP-08**: Customer order history / tracking pages (requires accounts — currently out of scope)
- **SHOP-09**: Configurable products (size/material/engraving variants) — explicitly deferred per current scope

### Light Mode

- **THEME-01**: Reintroduce a real light-mode design pass with proper Tailwind tokens — out of "targeted spruce" scope

## Out of Scope

Explicitly excluded for this project. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| TypeScript migration | Owner decision: stay on JavaScript; migration cost > value for a marketing site |
| Next.js / framework migration | Owner decision: stay on CRA (Vite migration is the only build-tool exit on the roadmap) |
| User accounts / authentication | Site is fully public; no logged-in experiences are needed for any planned bundle |
| Blog / article content | Not part of any current bundle; revisit later if marketing strategy shifts |
| Configurable shop products | Shop sells pre-made goods only; configurators are a separate scope expansion |
| Splitting `/materials` into separate routes | Superseded by the in-page section approach |
| Dedicated quote form replacing the contact form (in Bundle 1) | Auto-pricing quote feature in Bundle 2 supersedes this; minimal contact-form change for now |
| Live chat / chat widget | Adds friction and ongoing maintenance for a one-person studio |
| Newsletter popups | Anti-pattern for the local-hobbyist audience; hurts conversion |
| Real-time inventory before shop ships | Not relevant — inventory shows up with shop in Bundle 3 |
| Stock photography filler | Local trust depends on real work; placeholders > stock until photos exist |
| Multi-state tax automation at shop launch | Defer until volume justifies it; chosen platform's defaults at launch |

## Traceability

Populated by the roadmapper on 2026-05-02. Maps every v1 requirement to exactly one phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Validated |
| FOUND-02 | Phase 1 | Validated |
| FOUND-03 | Phase 1 | Validated |
| FOUND-04 | Phase 1 | Validated |
| FOUND-05 | Phase 1 | Validated |
| FOUND-06 | Phase 1 | Validated |
| SVC-01 | Phase 2 | Validated (Plan 02-02) |
| SVC-02 | Phase 2 | Validated (Plan 02-02) |
| SVC-03 | Phase 2 | Validated (Plan 02-03) |
| SVC-04 | Phase 2 | Validated (Plan 02-01) |
| SVC-05 | Phase 2 | Validated (Plan 02-01) |
| MAT-01 | Phase 2 | Validated (Plan 02-02) |
| MAT-02 | Phase 2 | Validated (Plan 02-02) |
| MAT-03 | Phase 2 | Validated (Plan 02-02) |
| VIS-01 | Phase 2 | Validated (Plan 02-03) |
| VIS-02 | Phase 2 | Validated (Plan 02-03) |
| VIS-03 | Phase 2 | Validated (Plan 02-03) |
| VIS-04 | Phase 2 | Partial (service surfaces complete via SanityImage; 4 home/about components — OurProcess, Collaborations, QuickSpecs, AboutMeBio — still use asset.url; non-blocking per verifier) |
| VIS-05 | Phase 2 | Complete |
| SHOP-01 | Phase 2 | Complete |
| SHOP-02 | Phase 2 | Complete |
| CTC-01 | Phase 2 | Complete |
| CTC-02 | Phase 2 | Complete |
| CTC-03 | Phase 2 | Complete |
| CTC-04 | Phase 2 | Complete |
| CNT-01 | Phase 2 | Validated (Plan 02-02) |
| CNT-02 | Phase 2 | Validated (Plan 02-02) |
| CNT-03 | Phase 2 | Validated (Plan 02-02) |
| CNT-04 | Phase 2 | Partial (SanityImage uses asset.altText fallback chain across service surfaces; one hardcoded `alt="Effigy build"` in Collaborations.jsx remains; non-blocking per verifier) |
| SEO-01 | Phase 2 | Complete |
| SEO-02 | Phase 2 | Complete |
| SEO-03 | Phase 2 | Complete |
| SEO-04 | Phase 2 | Complete |
| QTE-01 | Phase 3 | Complete |
| QTE-02 | Phase 3 | Complete |
| QTE-03 | Phase 3 | Complete |
| QTE-04 | Phase 3 | Complete |
| QTE-05 | Phase 3 | Complete |
| QTE-06 | Phase 3 | Complete |
| QTE-07 | Phase 3 | Pending |
| QTE-08 | Phase 3 | Pending |
| QTE-09 | Phase 3 | Pending |
| QTE-10 | Phase 3 | Complete |
| VITE-01 | Phase 4 | Complete |
| VITE-02 | Phase 4 | Complete |
| VITE-03 | Phase 4 | Pending |
| SHOP-03 | Phase 5 | Pending |
| SHOP-04 | Phase 5 | Pending |
| SHOP-05 | Phase 5 | Pending |
| SHOP-06 | Phase 5 | Pending |
| SHOP-07 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 51 total
- Mapped to phases: 51
- Unmapped: 0 ✓

**Per-phase counts:**
- Phase 1 (Foundation): 6 requirements (FOUND-01..06)
- Phase 2 (Bundle 1 Relaunch): 27 requirements (SVC-01..05, MAT-01..03, VIS-01..05, SHOP-01..02, CTC-01..04, CNT-01..04, SEO-01..04)
- Phase 3 (Quote Tool): 10 requirements (QTE-01..10)
- Phase 4 (Vite Migration): 3 requirements (VITE-01..03)
- Phase 5 (Pre-Made Goods Shop): 5 requirements (SHOP-03..07)

---
*Requirements defined: 2026-05-03*
*Last updated: 2026-05-04 — Phase 1 (FOUND-01..06) validated*
