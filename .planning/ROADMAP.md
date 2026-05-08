# Roadmap: Shapesmith Studio

## Overview

The studio is returning from a multi-year pause to actually drive revenue from the laser cutter and a new Bambu H2D 3D printer. The relaunch hinges on a single core value: the site has to look legit enough that the owner feels comfortable marketing it again. This roadmap delivers that in a tight, coarse-grained sequence — first lock the foundation so net-new work doesn't land on rot, then ship one big relaunch covering the new 3D printing surface plus the visual + content + SEO sweep that makes the site look real, then add the auto-pricing quote tool, then exit Create React App via Vite while the site is in a low-stakes window, and finally open the pre-made-goods shop. Five phases, three bundles, every requirement mapped.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation — refactor + env pinning** - Cheap, high-leverage, non-visual unblocks for every later phase  *(completed 2026-05-04)*
- [ ] **Phase 2: Bundle 1 Relaunch — 3D printing + spruce + content + SEO + shop stub** - The big visible relaunch; ships everything required for the studio to feel ready to market
- [ ] **Phase 3: Auto-Pricing Quote Tool** - File upload → ballpark estimate → manual confirmation gate
- [ ] **Phase 4: Vite Migration** - Exit Create React App between revenue features, no user-visible change
- [ ] **Phase 5: Pre-Made Goods Shop** - Catalog + checkout for finished pieces; platform decided in discovery

## Phase Details

### Phase 1: Foundation — refactor + env pinning
**Goal**: Stabilize the codebase substrate so Phase 2's relaunch and every later phase land on a clean, pinned foundation rather than on Create React App rot, render-time side effects, and inline-fetch anti-patterns
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06
**Success Criteria** (what must be TRUE):
  1. Every Sanity fetch in the codebase goes through a single `useSanityQuery` hook with consistent `{ data, loading, error }` semantics — no inline `useEffect` + `sanityClient.fetch` patterns remain
  2. The dark theme is applied without a render-time side effect, `useThemeSwitcher` is fully removed, and the site visibly behaves identically to before (dark-only, committed)
  3. The `ProjectGallery` image modal opens and closes via React state — no `document.getElementById` `classList` manipulation in the codebase
  4. `pnpm install && pnpm build` succeeds on a clean checkout against the pinned Node version (`.nvmrc` + `netlify.toml` + committed `pnpm-lock.yaml`)
  5. `pnpm test` runs a passing smoke test that mounts `<App />` — the broken legacy `App.test.js` is gone
**Plans**: 6 plans across 5 waves
Plans:

**Wave 1**
- [x] 01-01-PLAN.md — FOUND-05: pin Node 20 + pnpm 9, write netlify.toml, commit pnpm-lock.yaml

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md — FOUND-01: useSanityQuery hook + migrate 6 inline fetch sites

**Wave 3** *(blocked on Wave 1 completion; plans run in parallel — zero file overlap)*
- [x] 01-03-PLAN.md — FOUND-03: dark theme via <html class="dark">, remove useThemeSwitcher and -light tokens
- [x] 01-04-PLAN.md — FOUND-04: state-driven ProjectGallery modal, fix _id key bug

**Wave 4** *(blocked on Plan 01-03 — App.js + AppHeader.jsx file conflict)*
- [x] 01-05-PLAN.md — FOUND-02: SERVICES constant replaces capabilitiesTitle in 4 consumers

**Wave 5** *(blocked on all preceding plans — regression sentinel)*
- [x] 01-06-PLAN.md — FOUND-06: smoke test that mounts <App /> with mocked Sanity client

**Cross-cutting constraints:**
- `--openssl-legacy-provider` flag retained in `package.json` scripts until Phase 4 Vite migration (D-20)
- `src/data/projects.js` legacy arrays preserved — VIS-05 (Phase 2) owns dead-data purge (D-15)
- No new test dependencies introduced — stay on CRA-bundled Jest + RTL (D-17)
- README NOT rewritten in this phase — SEO-04 (Phase 2) owns it (D-22)

**UI hint**: no

### Phase 2: Bundle 1 Relaunch — 3D printing + spruce + content + SEO + shop stub
**Goal**: Ship the relaunch — a refreshed homepage and nav, a new `/3d-printing` service surface mirroring `/styles`, materials moved into per-service in-page sections, the trust copy and per-page SEO that makes the site feel legitimate to a local hobbyist audience, contact-form pre-fill from the referrer, and a routed `/shop` "Coming Soon" door — all in one shippable window that the owner can confidently start marketing.

**Open decision deferred to this phase's plan:** ServicesContext-vs-parallel-PrintsContext. The trade-off table from `research/SUMMARY.md` (parallel = lower risk, +4 files, easier rollback; generalized = pattern proves itself for Phase 3/5, +2 files, touches existing laser screens) is the input. The phase plan weighs the actual file diff and chooses; the roadmap does not pre-decide.

**Depends on**: Phase 1
**Requirements**: SVC-01, SVC-02, SVC-03, SVC-04, SVC-05, MAT-01, MAT-02, MAT-03, VIS-01, VIS-02, VIS-03, VIS-04, VIS-05, SHOP-01, SHOP-02, CTC-01, CTC-02, CTC-03, CTC-04, CNT-01, CNT-02, CNT-03, CNT-04, SEO-01, SEO-02, SEO-03, SEO-04
**Success Criteria** (what must be TRUE):
  1. A visitor can navigate to `/3d-printing` and `/3d-printing/:slug`, see a grid + detail pages backed by the new `print-style` Sanity content type, and the existing `/styles` flow works without regressions; both services appear with equal visual weight in the nav on mobile and desktop
  2. Every route — `/`, `/styles`, `/styles/:slug`, `/3d-printing`, `/3d-printing/:slug`, `/about`, `/contact`, `/shop`, `/404` — shows the spruced visual language with no half-spruced surfaces and no dead `src/data/*` legacy files in the production bundle; Sanity images load via `@sanity/image-url` with responsive `srcSet` + lazy loading
  3. Each service page displays an in-page Materials section filtered by service, plus turnaround/pickup/service-area copy, a "what we won't make" scope policy, and 5–8 FAQ items — all sourced from Sanity so the owner can edit without a redeploy; the legacy `/materials` route redirects or shows a friendly moved notice
  4. A visitor landing on `/contact` from `/3d-printing` (or via `?service=3d-printing`) sees the service field pre-filled to "3D Printing"; the honeypot is visually hidden; the response-time promise is shown and is editable in Sanity; the Netlify hidden form recognizes the new `service` field at deploy time
  5. `/shop` is a live route showing a Coming Soon page with a working email-capture form; every route has a per-page `<title>`, `<meta description>`, `og:` tags via `react-helmet-async`; the homepage embeds `LocalBusiness` JSON-LD; `sitemap.xml` is generated at build and `robots.txt` references it; the README is replaced with a project-specific quickstart
**Plans**: 5 plans across 5 waves
Plans:

**Wave 1**
- [x] 02-01-PLAN.md — Foundations: schema spec doc, packages install (@sanity/image-url + react-helmet-async), HelmetProvider mount, ServicesContext + SingleServiceContext clean rip, projects/ → services/ rename, page generalization, SanityImage/Placeholder/SEOHead/JsonLdLocalBusiness scaffolds (SVC-04, SVC-05, VIS-04, CNT-04, SEO-01)  *(completed 2026-05-06)*

**Wave 2** *(blocked on Wave 1)*
- [x] 02-02-PLAN.md — 3D printing surface: MaterialsSection + FAQ + WontMake + TrustCopyBlock components; SanityImage adoption in ServiceCard/ServiceGallery/MaterialSingle; section composition into ProjectSingle + Projects pages; /materials → /styles#materials redirect (Navigate + public/_redirects) (SVC-01, SVC-02, MAT-01, MAT-02, MAT-03, CNT-01, CNT-02, CNT-03)  *(completed 2026-05-06)*

**Wave 3** *(blocked on Waves 1+2)*
- [x] 02-03-PLAN.md — Visual spruce sweep: AppBanner dual-service hero, AppHeader peer-equal nav with active-state, NotFound /404 page, /shop route added, indigo→accent template-residue swap across 4 sites, target="__blank" typo + rel=noopener fixes, AboutMe + QuickInfo touch (VIS-01, VIS-02, VIS-03, SVC-03)  *(completed 2026-05-06)*

**Wave 4** *(blocked on Wave 3)*
- [x] 02-04-PLAN.md — Trust copy + SEO: SEOHead mounted on every route; JsonLdLocalBusiness on Home; sitemap.xml postbuild script + robots.txt; public/index.html static SEO defaults + og-default.png; theme-color #291c30 (SEO-01, SEO-02, SEO-03)

**Wave 5** *(blocked on Wave 4)*
- [x] 02-05-PLAN.md — Contact + shop + cleanup + README: ContactForm pre-fill + CSS-hidden honeypot + relative URL + response-time promise + accent submit + no alert(); Shop Coming Soon page with shop-notify form; public/index.html hidden-form prerender extended (service field + shop-notify form); VIS-05 dead-code purge (13 files); styled-components removal; useScrollToTop listener-leak fix; encodeFormData extraction; README.md replacement (SHOP-01, SHOP-02, CTC-01, CTC-02, CTC-03, CTC-04, VIS-05, SEO-04)
**UI hint**: yes

### Phase 3: Auto-Pricing Quote Tool
**Goal**: Let visitors upload a file (STL/3MF for 3D, SVG/DXF for laser), pick a material and quantity, see an instant ballpark price *range* with a visible "estimate, final price subject to confirmation" disclaimer, and submit it to the studio owner who manually confirms before anything binds
**Depends on**: Phase 2
**Requirements**: QTE-01, QTE-02, QTE-03, QTE-04, QTE-05, QTE-06, QTE-07, QTE-08, QTE-09, QTE-10
**Success Criteria** (what must be TRUE):
  1. A visitor can reach `/quote` from each service page and from a top-level CTA, drop or pick a file with stated size/format constraints visible before they touch the file, and see the upload validated client-side with friendly error messages on bad files
  2. Once a file is accepted, the visitor picks a material and quantity from data-driven options (Sanity `material` filtered by service) and sees the price range update live; the displayed number is always a range, never a single point, and is accompanied by a visible disclaimer that the word "quote" is not used until the owner confirms
  3. The visitor can submit the estimate and the studio owner receives an email (via Netlify Function + Resend) containing the metadata they need to manually reply with a real quote — there is no path from upload to a binding order without owner review
  4. The submission is server-side spam-protected (reCAPTCHA v3 token verified inside the Function); user-uploaded SVG content is sanitized via DOMPurify before any DOM render; STL/DXF parsing is memory-bounded so an oversized file degrades gracefully rather than locking the browser
  5. A `pricing-rule` Sanity schema exposes per-material rate, machine-time multiplier, setup fee, and density so the owner can tune pricing without a deploy; form state persists across page reloads via `localStorage`
**Plans**: 4 plans across 4 waves
Plans:

**Wave 1**
- [x] 03-01-PLAN.md — Stub: /quote route + tabs + dropzone + STL/OBJ/SVG parsers + geometry readouts (no submission, no pricing) (QTE-01, QTE-02, QTE-03, QTE-09 partial — memory-bounded parsing)

**Wave 2** *(blocked on Wave 1)*
- [ ] 03-02-PLAN.md — Pricing: pricing-rule Sanity schema spec + MaterialPicker + QuantityInput + PriceRange + calculatePrice (QTE-04, QTE-05, QTE-06)

**Wave 3** *(blocked on Wave 2)*
- [ ] 03-03-PLAN.md — Submission: Netlify Function + Resend + reCAPTCHA v3 server verify + QuoteSubmitForm (QTE-07, QTE-08, QTE-09 server-side)

**Wave 4** *(blocked on Wave 3 — last-mile polish)*
- [ ] 03-04-PLAN.md — localStorage form-state persistence + restore banner (QTE-10)
**UI hint**: yes

### Phase 4: Vite Migration
**Goal**: Replace `react-scripts` with Vite as the build tool while the site is in a low-stakes window between revenue features, so Phase 5's shop work doesn't land on a deprecated foundation and no Netlify Node bump can silently break the production build
**Depends on**: Phase 3
**Requirements**: VITE-01, VITE-02, VITE-03
**Success Criteria** (what must be TRUE):
  1. `pnpm build` produces a deployable bundle via Vite (not `react-scripts`); the static SPA output behaves identically to the CRA build from any user's perspective on a deploy preview
  2. All `REACT_APP_*` environment variables have been renamed to `VITE_*` with code references updated; `--openssl-legacy-provider` is no longer needed anywhere
  3. `netlify.toml` reflects the new build command and publish directory; the deploy preview confirms parity with production before merge
**Plans**: TBD
**UI hint**: no

### Phase 5: Pre-Made Goods Shop
**Goal**: Open `/shop` for real — a catalog of pre-made laser-cut and 3D-printed pieces with end-to-end checkout via the platform chosen in this phase's discovery sub-phase, orders flowing to the owner with everything they need to fulfill and ship
**Depends on**: Phase 4
**Requirements**: SHOP-03, SHOP-04, SHOP-05, SHOP-06, SHOP-07
**Success Criteria** (what must be TRUE):
  1. A written platform decision (Snipcart / Stripe+Sanity / Shopify Storefront) exists, backed by SKU-count and ops-preference inputs gathered in the discovery sub-phase; default is Snipcart unless the decision overrides
  2. The owner can add `product` documents in Sanity Studio per the finalized schema spec — the schema and admin UX support the chosen platform without ongoing developer involvement to publish a product
  3. A visitor can browse `/shop`, see a grid of pre-made goods (laser-cut + 3D-printed), click into `/shop/:slug` for detail, and complete a purchase end-to-end through the chosen platform's checkout
  4. The owner receives orders with all info needed to fulfill and ship; inventory state (sold-out, low stock) is reflected accurately in the storefront
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation — refactor + env pinning | 6/6 | Complete | 2026-05-04 |
| 2. Bundle 1 Relaunch — 3D printing + spruce + content + SEO + shop stub | 5/5 | Complete | 2026-05-06 |
| 3. Auto-Pricing Quote Tool | 1/4 | In Progress|  |
| 4. Vite Migration | 0/TBD | Not started | - |
| 5. Pre-Made Goods Shop | 0/TBD | Not started | - |

---
*Roadmap created: 2026-05-02*
