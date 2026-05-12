# Phase 2: Bundle 1 Relaunch — Research

**Researched:** 2026-05-06
**Domain:** CRA 5 + React 18 SPA marketing site — adding new service surface, SEO infra, trust copy, image pipeline, contact pre-fill, and shop stub on top of a Phase-1-stabilized foundation.
**Confidence:** HIGH for stack additions and ServicesContext shape; HIGH for build/deploy concerns; MEDIUM for the exact Sanity schema field names (owner conventions not directly accessible — falls back to what existing GROQ projections use).

---

## Summary

Phase 2 ships the full visible relaunch (27 requirements) on an already-stabilized foundation: Phase 1 delivered `useSanityQuery`, `SERVICES` constant, dark-only theme, state-driven gallery modal, env pinning, and a smoke test. Phase 2 lands six concurrent streams — generalized service contexts, new `/3d-printing` surface, visual spruce sweep, trust-copy + SEO infrastructure, contact pre-fill + `/shop` stub, and the VIS-05 dead-code purge — all in one shippable window. The architecture is direct mirroring of the existing `/styles` flow with two new packages added: `@sanity/image-url@^2.1.1` (verified current via `pnpm view`) for responsive image URLs, and `react-helmet-async@^2.0.5` for per-page SEO meta. **`react-helmet-async@^3.0.0` was just released 2026-03-03** with a React 19 path; staying on `^2.0.5` is recommended because it is the version paired with React 18 in production for two years and v3 is so new there is no production track record yet [VERIFIED: npm `pnpm view react-helmet-async time --json`].

The decisive risk for this phase is **half-spruce** (Pitfall 4 from `.planning/research/PITFALLS.md`) — refreshing the homepage hero and nav while leaving `/about`, `/contact`, detail pages, footer untouched. The mitigation is locked in CONTEXT.md D-09 (token-first sweep) and the per-route checklist in `02-UI-SPEC.md` "Per-Route Spruce Checklist." Plans should treat each route as a discrete acceptance row, not an emergent property of "do the spruce."

The secondary risk is **owner-prep gating**: the `material.processes` schema migration, the new `print-style` / `studio-info` / `faq` schemas, and the per-service extension fields all live in Sanity Studio (owned by the studio owner, not the planner). The planner must produce a written schema spec the owner pastes into their Studio repo BEFORE any Sanity-dependent wave runs. Without that, the GROQ projections in `ServicesContext` and `MaterialsSection` would query empty document types or missing fields and silently render empty grids.

**Primary recommendation:** Plan in five waves matching CONTEXT.md D-32 — Foundational (schemas + ServicesContext + package install), 3D printing surface, Visual spruce, Trust copy + SEO, Contact + shop + cleanup. Each wave leaves the site deployable. Use `react-helmet-async@^2.0.5` (not v3 yet), `@sanity/image-url@^2.1.1`. Generate `sitemap.xml` via a custom `postbuild` script that imports `SERVICES` and queries Sanity for slugs (zero-dep approach). Use `LocalBusiness` JSON-LD as the schema-org type (not `ProfessionalService` — `LocalBusiness` is the canonical type for studios with a service area; subtypes apply only to vertical-specific schemas like `Dentist` or `LegalService` per [schema.org](https://schema.org/LocalBusiness)).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Context architecture (D-01..D-05):**
- D-01 Generalized `ServicesContext` parameterized by `serviceKey`, with parallel `SingleServiceContext` for slug detail pages. One pair of files covers both laser and print services. Default unless planner hits concrete obstacle, in which case fall back to parallel `PrintsContext`/`SinglePrintContext`.
- D-02 Migration sequence: copy existing project context files into new service files → wire new `/3d-printing` routes against new files → repoint existing `/styles` routes to new files → delete `src/context/ProjectsContext.jsx` + `SingleProjectContext.jsx`. Laser routes work uninterrupted throughout.
- D-03 Clean rip — no compat shim re-export from old context paths.
- D-04 Generalize only what's identical (laser ↔ print mirror). Shop gets its own `ShopContext` in Bundle 3 — do NOT add `if (service === 'shop')` branches inside `ServicesContext`.
- D-05 GROQ projection is shared between laser and print queries — schemas mirror each other; one projection serves both, parameterized by `_type`.

**`material.processes` schema (D-06, D-07):**
- D-06 Plan against the target shape — `material.processes` becomes a reference array pointing at a new `process` enum doc with values `laser`, `print`. GROQ filter pattern: `*[_type == "material" && "print" in processes[]->key]{...}`. Owner applies the schema change in Sanity Studio per a written spec produced during planning, before MAT-01/MAT-02-related plans execute.
- D-07 Plan must include: (a) clearly-marked Sanity Studio prep doc/section, (b) planning checkpoint that confirms the owner has applied the schema migration before MAT plans run. Fallback if cost is prohibitive: free-text string tags `processes: ['laser' | 'print' | 'both']`.

**Visual spruce (D-08..D-12):**
- D-08 Layout + composition only. No color/typography churn. Keep palette (`accent #348bd8`, `primary-dark #291c30`, `ternary-dark`, `accent-highlight`), keep GeneralSans + Proxima Nova typography, keep dark identity.
- D-09 Token-first sweep. Define spruce as diff in `tailwind.config.js` (or top-level CSS variables in `src/css/tailwind.css`) BEFORE component work begins. Sweep every route on a checklist: `/`, `/styles`, `/styles/:slug`, `/3d-printing`, `/3d-printing/:slug`, `/about`, `/contact`, `/shop`, `/404`. Half-spruce is research's named failure mode.
- D-10 Hero structural shape — split-or-stacked dual-service framing. 50/50 split desktop, stacked mobile. Equal visual weight.
- D-11 Photography placeholder — stylized solid-fill cards with caption like "3D print example coming soon." Sanity-driven graceful degradation. Branded, intentional.
- D-12 Owner photography session is parallel non-code work. Relaunch must NOT block on photos.

**Trust copy & content schemas (D-13..D-18):**
- D-13 New Sanity singleton `studio-info` holds shared facts: `serviceArea`, `pickupAvailability`, `responseTimePromise`, plus `LocalBusiness` JSON-LD field bundle (D-21).
- D-14 `laser-style` and `print-style` schemas extended with optional per-service fields: `turnaround` (string), `wontMakeScope` (portable text). Falls back to `studio-info` for shared facts.
- D-15 New `faq` Sanity schema: `{ question (string), answer (portable text), service (reference array → process enum, supports laser+print or both), order (number) }`. 5–8 items per service.
- D-16 Plan ships placeholder copy. Every Sanity-backed copy field has at minimum a non-empty placeholder string committed via Studio before the relaunch goes live.
- D-17 Materials section UX — anchor link from each service hero ("See materials") scrolls to `#materials`. Section lists materials filtered by service tag. Existing `MaterialSingle` reused. Legacy `/materials` route serves a 301 redirect (or `<Navigate>`) to `/styles#materials`.
- D-18 CNT-04 alt text — bind from existing/extended Sanity image alt field (`asset->altText` or per-image `alt`). No empty strings, no filename fallbacks.

**SEO + shop stub (D-19..D-23):**
- D-19 Per-page SEO via `react-helmet-async`. Hybrid sourcing: hardcoded defaults for static routes; Sanity-driven `seo` block (`metaTitle`, `metaDescription`, `ogImage`) on `laser-style`, `print-style`, `studio-info` for content-driven routes.
- D-20 og:image strategy — single studio-branded fallback image used for any route without its own image; per-service override when Sanity doc has an image.
- D-21 `LocalBusiness` JSON-LD on homepage — sourced from `studio-info`. Skip review aggregation until reviews exist.
- D-22 `sitemap.xml` generation — at build time from a static route list plus dynamic Sanity slugs. Concrete approach is planner judgment call. `robots.txt` references the sitemap.
- D-23 `/shop` Coming Soon — heading + 1–2 sentence promise + email field + "Notify me when it launches" button. Submitted via separate Netlify Form `shop-notify`. Confirmation message replaces the form on success. Hidden form declaration added to `public/index.html`.

**Contact form pre-fill (D-24..D-28):**
- D-24 Service pre-fill reads in order: (a) `?service=` query string, (b) `document.referrer` matched against known service-URL list, (c) blank otherwise. User can change.
- D-25 Pre-fill maps to existing contact-form "service interested in" field (`contactSubject` from `SERVICES`).
- D-26 Honeypot uses CSS-hidden (`aria-hidden`, `tabindex="-1"`, off-screen positioning) — NOT `display:none`.
- D-27 Response-time promise (CTC-04) rendered on contact page, sourced from `studio-info.responseTimePromise`.
- D-28 `public/index.html` Netlify hidden form prerender updated with new `service` field on contact-form; same pass adds `shop-notify` form declaration.

**Cleanup scope (D-29, D-30):**
- D-29 VIS-05 deletes: `src/data/projects.js` (other than already-removed `capabilitiesTitle`), `src/data/aboutMeData.js`, `src/data/materials.js`, `src/data/singleProjectData.js`, `src/data/images.js`, `src/components/contact/contact-form.js`, `src/components/HireMeModal.jsx`, `src/components/BackToTop.jsx`, `src/components/projects/ProjectsFilter.jsx`, `src/components/projects/ProjectRelatedProjects.jsx`, `src/components/about/AboutClients.jsx`, `src/components/about/AboutCounter.jsx` (if template-residue), `src/utilities/helpers.jsx` (`isProd`/`getImageUrl` dead code). Remove `styled-components` from `package.json`. Fold in `useScrollToTop` listener leak fix (one-liner: `[]` deps + remove duplicate module-level listener).
- D-30 External link safety — add `rel="noopener noreferrer"` to any `target="_blank"` links touched during sweep, fix `target="__blank"` typo. Scope-limited.

**README + content (D-31):**
- D-31 Replace CRA boilerplate `README.md` with: project overview (1 paragraph), tech stack (1–2 sentences), quickstart (`pnpm install` / `pnpm start` / `pnpm build` with `--openssl-legacy-provider` note), content-update guide, deploy notes (Netlify), links to `.planning/PROJECT.md`.

**Plan structure hint (D-32):**
- 27 requirements; structure plans around natural shipping boundaries:
  1. Foundational schema/data (studio-info, faq, print-style schema spec for owner; ServicesContext + SingleServiceContext + clean rip; @sanity/image-url + react-helmet-async install; SEO meta hardcoded defaults).
  2. /3d-printing surface (routes, components, GROQ, materials section per service, /materials redirect).
  3. Visual spruce (token diff, hero refresh, nav refresh, route-sweep checklist).
  4. Trust copy + SEO (CNT, SEO meta on Sanity-driven routes, JSON-LD, sitemap, og:image).
  5. Contact + /shop stub + cleanup (CTC pre-fill + honeypot + Netlify form updates; /shop page + shop-notify form; VIS-05 cleanup; README).
  Each wave SHOULD leave the site in a deployable state.

### Claude's Discretion
- Specific Tailwind token diff content (D-09 leaves the actual delta to the planner — no palette change is committed).
- Hero composition specifics within the dual-service constraint (D-10).
- Sitemap generation approach within CRA constraints (D-22).
- Exact Sanity schema field names where there's no convention conflict (snake-case vs camelCase for new fields — match existing project conventions).
- Whether the per-route sweep checklist is a literal `.md` file in the phase dir or just a planner-internal artifact.
- All decisions D-01..D-31 may be adjusted by the planner if a concrete obstacle is found in the codebase — flag in PLAN.md deviations.

### Deferred Ideas (OUT OF SCOPE)
- **Reusable `<Modal>` / `<Gallery>` extraction at N=2** — only extract if abstraction is clean; do NOT force.
- **Tailwind `dark:` prefix flattening** — possible during sweep but not required by D-08.
- **Sanity env-driven config** (`projectId`/`dataset` move to env vars) — best paired with Phase 4 Vite migration.
- **Per-route test coverage beyond smoke** — out of scope here.
- **Real H2D photography session** — owner-side parallel work; placeholder strategy covers the gap.
- **Phase 4 Vite migration prep** — bonus, not required.
- **Customer reviews / testimonials** — not in current REQ-XX; v2.
- **Slicer-grade pricing** (QTE-11) — Bundle 2 v2.
- **Plausible Analytics** — not in REQ-XX; cheap to add later.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SVC-01 | `/3d-printing` route with print-style grid; placeholder-graceful | ServicesContext shape (this doc §"Standard Stack" + §"Code Examples"); placeholder pattern (UI-SPEC §Color §"Photography placeholder") |
| SVC-02 | `/3d-printing/:slug` detail page mirroring `/styles/:capability` | Same as SVC-01; SingleServiceContext pattern (this doc §"Code Examples") |
| SVC-03 | Nav shows both services as peer entries with equal weight on mobile + desktop | UI-SPEC §"Nav refresh"; AppHeader.jsx restructure (this doc §"Architecture Patterns") |
| SVC-04 | `/styles` works without regression throughout migration | D-02 migration sequence (clean rip after parallel run); GROQ shared projection |
| SVC-05 | Owner can add `print-style` documents in Sanity Studio per written schema spec | This doc §"Sanity Schema Specifications" |
| MAT-01 | In-page Materials section per service, anchored link from page | This doc §"Architecture Patterns" §"MaterialsSection" |
| MAT-02 | Sanity `material.processes` supports per-service tagging | This doc §"Sanity Schema Specifications" §"`process` enum + `material.processes`" |
| MAT-03 | `/materials` redirects to `/styles#materials` | `<Navigate>` pattern with `replace` prop, react-router v6 (this doc §"Architecture Patterns" §"Routing changes") |
| VIS-01 | Homepage hero refreshed for both services equally | UI-SPEC §"Hero composition"; AppBanner.jsx refactor |
| VIS-02 | Site nav refreshed and accommodates services on mobile + desktop | UI-SPEC §"Nav refresh"; mobile + desktop blocks of AppHeader.jsx |
| VIS-03 | Spruce applied consistently across every route | UI-SPEC §"Per-Route Spruce Checklist" — 9 routes named explicitly |
| VIS-04 | Sanity images via `@sanity/image-url` with srcSet + lazy loading | This doc §"Standard Stack" §"@sanity/image-url"; §"Code Examples" §"`SanityImage`" |
| VIS-05 | Dead/legacy code removed | This doc §"Don't Hand-Roll" + §"Cleanup Scope" with line counts |
| SHOP-01 | `/shop` is a real route with Coming Soon page | Routing changes table; UI-SPEC §"Empty / pending states" |
| SHOP-02 | Coming Soon captures email signups via Netlify Forms | This doc §"Architecture Patterns" §"Multi-form prerender (`shop-notify`)" |
| CTC-01 | Service field pre-fills based on referrer + `?service=` | This doc §"Code Examples" §"Contact form pre-fill" |
| CTC-02 | `public/index.html` updated so `service` field is recognized | This doc §"Architecture Patterns" §"Multi-form prerender" |
| CTC-03 | Honeypot rendered visually hidden, not visible | This doc §"Code Examples" §"Honeypot CSS-hidden" |
| CTC-04 | Response-time promise from Sanity on contact page | `studio-info.responseTimePromise` (this doc §"Sanity Schema Specifications") |
| CNT-01 | Each service page shows turnaround, pickup availability, service area | `studio-info` + per-service `turnaround` (this doc §"Sanity Schema Specifications") |
| CNT-02 | Each service page shows "What we won't make" | `wontMakeScope` (this doc §"Sanity Schema Specifications") |
| CNT-03 | Each service page includes 5–8 FAQ items from `faq` schema | `faq` schema (this doc §"Sanity Schema Specifications") |
| CNT-04 | Image alt text from Sanity, not empty strings | This doc §"Code Examples" §"`SanityImage`" — `altText` always read from the image field |
| SEO-01 | Per-page `<title>`, meta description, og: tags via react-helmet-async | This doc §"Standard Stack" §"react-helmet-async"; §"Code Examples" §"`SEOHead`" |
| SEO-02 | Homepage `LocalBusiness` JSON-LD | This doc §"Code Examples" §"`JsonLdLocalBusiness`" |
| SEO-03 | `sitemap.xml` generated at build; `robots.txt` references it | This doc §"Architecture Patterns" §"Sitemap generation" |
| SEO-04 | README replaced with project-specific quickstart | D-31 spec; this is a docs deliverable, not a code one |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

The project's `CLAUDE.md` is the user-edit-controlled directives layer. The relevant binding directives for Phase 2 planning:

- **Tech stack lock:** CRA + React 18 + JavaScript only. No TypeScript, no Next.js, no framework migration. Build flag `--openssl-legacy-provider` stays. **The planner MUST NOT recommend Vite, Next.js, TypeScript, or any framework swap. Phase 4 owns the Vite migration.**
- **CMS:** Sanity, anonymous CDN reads only. **No write tokens, no auth tokens shipped client-side.**
- **Hosting:** Netlify (static SPA + Netlify Forms). **No serverless functions in Phase 2** (Bundle 2 introduces them).
- **Lead capture:** Reuse existing Netlify contact form. **Do NOT replace the contact form** (Bundle 2 owns the dedicated quote form).
- **Visual identity:** Targeted spruce only. No palette change, no font change, no full redesign. Hero + nav refresh only at the structural level.
- **Photography:** No 3D-print photos exist yet. **UI must degrade gracefully to placeholder blocks** (D-11 strategy).
- **GSD workflow enforcement:** Edits to source files happen through GSD commands. Research is non-edit; it produces this RESEARCH.md only.
- **Color-token typo (`ternary` not `tertiary`):** Preserve verbatim across all new files. The convention is intentional.
- **File extensions:** `.jsx` for components/hooks/contexts; `.js` for plain modules and the existing `App.js` / `index.js` (don't rename those). New utilities under `src/utilities/` use `.jsx` per existing convention.
- **Indentation:** Tabs in `.js`/`.jsx`; 2-space in JSON. Match the file you edit.
- **Memory hygiene:** Global instructions allow ChromaDB MCP for cross-project memory; not relevant to this phase since it's project-scoped.

These directives are LOCKED — research did not invent any approach that contradicts them.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Routing (`/3d-printing`, `/3d-printing/:slug`, `/shop`, `/materials` redirect) | App / Routing layer (`src/App.js`) | — | Single declaration site for all routes; lazy-loaded via `React.lazy` to match existing pattern |
| Service-list data fetching (laser/print) | Browser / Client (Context provider + `useSanityQuery`) | Sanity CMS (read) | Anonymous CDN reads happen in the browser — no backend, no SSR |
| Per-route SEO meta (title, description, og:) | Browser / Client (`react-helmet-async`) | Static `public/index.html` defaults | SPA crawler caveat: helmet rewrites the head client-side; static defaults catch crawlers that don't execute JS |
| `LocalBusiness` JSON-LD | Browser / Client (`<script type="application/ld+json">` injected via Helmet) | Sanity (`studio-info` doc) | Same SPA caveat; modern crawlers (Googlebot, Bingbot) execute JS, so client-side injection is acceptable for the homepage |
| Image responsiveness (srcSet, sizes, lazy) | Browser / Client (native `<img loading="lazy">` + `srcSet`) | Sanity image CDN (`@sanity/image-url` builder) | Sanity's CDN does the resize/format work; the browser picks the right URL from srcSet |
| Sitemap generation | Build-time / Node (`postbuild` script reading from Sanity) | Static asset (`build/sitemap.xml`) | Crawlers fetch a static `sitemap.xml`; generating it at build time avoids a server requirement |
| Contact form submission | Static asset / Netlify Forms | `public/index.html` hidden prerender | Netlify scans build output for `name="..."` forms; the React component must match field-for-field |
| Honeypot enforcement | Browser / Client (CSS-hidden field) | Netlify Forms (rejects submissions with `bot-field` populated) | CSS-hidden so style-aware bots still see and fill it; humans don't |
| Pre-fill from referrer | Browser / Client (`document.referrer` + `URLSearchParams` in `useEffect`) | — | Pure browser API; no SSR dependency |
| Schema migrations (`material.processes`, `print-style`, `studio-info`, `faq`, `process` enum) | Sanity Studio (owner-managed, separate repo) | Planning checkpoint | Owner-managed, not Phase 2 code; the planner produces a written spec the owner pastes into their Studio repo |

**Why this matters:** Each row is a sanity check the planner can use when writing tasks. A task that puts JSON-LD generation server-side, or sitemap generation in `useEffect`, is on the wrong tier.

---

## Standard Stack

### Core (already in place — Phase 1)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react` | `^18.2.0` (resolved 18.3.1) | UI framework | Locked per CLAUDE.md; do not bump |
| `react-router-dom` | `^6.12.0` (resolved 6.30.3) | Client-side routing — `<BrowserRouter>`, `<Routes>`, `<Route>`, `useParams`, `<Navigate>` | Locked; v6 covers MAT-03 redirect via `<Navigate to="/styles#materials" replace />` |
| `@sanity/client` | `^6.1.7` (resolved 6.29.1) | CMS reads via GROQ | Locked; phase 1's `useSanityQuery` wraps this — every Sanity fetch in this phase goes through that hook |
| `tailwindcss` | `^3.4.19` | Utility CSS with `darkMode: 'class'` | Locked |
| `framer-motion` | `^10.18.0` | `AnimatePresence` + `motion.*` wrappers | Locked |
| `react-icons` | `^4.12.0` | `react-icons/fi` (Feather subset only) | Locked — no new icon library |
| `react-scripts` | `5.0.1` | CRA build/dev/test wrapper | Locked until Phase 4 Vite migration |

### New for Phase 2

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@sanity/image-url` | `^2.1.1` | Build responsive Sanity image URLs (width/height/dpr/quality/format params) | Sanity-published official builder. Verified current 2026-05-06 via `pnpm view @sanity/image-url version` → `2.1.1` [VERIFIED: npm registry]. Replaces `asset->url` (full-size original) with on-the-fly resized URLs. |
| `react-helmet-async` | `^2.0.5` | Per-page `<title>`, `<meta>`, `og:` tags, JSON-LD | Industry standard for SPA SEO. v2.0.5 released 2024-05-07 and is the version paired with React 18 in production. v3.0.0 released 2026-03-03 adds React 19 support and is too new to verify zero-regression in production [VERIFIED: npm `pnpm view react-helmet-async time --json`]. v3 peer-deps include `react@^18.0.0`, so v3 *would* work — but v2.0.5 is the safer choice for "ship fast, look legit." |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `react-helmet-async@^2.0.5` | `react-helmet-async@^3.0.0` | v3 supports React 19 natively (not relevant for us; we're on 18). v3 is 2 months old as of writing — no production track record. The v2 line has been stable and StrictMode-compatible since 2023. **Pick v2.** |
| `react-helmet-async` | `@dr.pogodin/react-helmet` | A community fork; not significantly better; less adoption; no reason to deviate from the standard. |
| `react-helmet-async` | Native React 19 `<title>`, `<meta>` rendering | React 19 only; we're on React 18.3.1. Not available. |
| Custom `<SanityImage>` component using `@sanity/image-url` | `coreyward/sanity-image` (community React component) | Adds an unmaintained dep for what is ~30 lines of code. Roll our own — full control over sizes attribute and srcSet breakpoints. |
| `@sanity/image-url` | Manual URL string construction | The builder handles `?w=&h=&q=&auto=format&dpr=` correctly; manual concatenation drifts. Use the builder. |
| Custom postbuild sitemap script | `react-router-sitemap` / `react-router-sitemap-generator` | Both have spotty react-router v6 support per [GitHub issue #166](https://github.com/clh161/react-router-sitemap-generator/issues/166); Sanity slug pull is custom anyway. **Roll our own ~40 lines**. |
| `LocalBusiness` JSON-LD type | `ProfessionalService` subtype | `ProfessionalService` is a valid `LocalBusiness` subtype but is more often used for legal/medical/financial services per [schema.org/ProfessionalService](https://schema.org/ProfessionalService). For a creative maker studio, the parent `LocalBusiness` type is canonical. Subtype with no clear vertical fit (no `MakerStudio` exists) — stick with `LocalBusiness`. |

**Installation:**

```bash
pnpm add @sanity/image-url@^2.1.1 react-helmet-async@^2.0.5
pnpm remove styled-components
```

**Version verification:**
- `@sanity/image-url@2.1.1` — published per npm registry; peerDeps allow `react@^16 || ^17 || ^18 || ^19` [VERIFIED: `pnpm view @sanity/image-url peerDependencies`].
- `react-helmet-async@2.0.5` — published 2024-05-07; peerDeps `react@^16.6 || ^17 || ^18 || ^19`. Compatible with React 18.3.1 + CRA 5 + webpack 4 (no ESM-only artifacts; CommonJS export ships) [VERIFIED: `pnpm view react-helmet-async time` and `peerDependencies`].

---

## Architecture Patterns

### System Architecture Diagram

```text
┌──────────────────────────────────────────────────────────────────────┐
│  Browser (CRA SPA, React 18, dark-only)                              │
│                                                                      │
│  ┌────────────────┐    ┌─────────────────────────────────────────┐  │
│  │ public/        │    │ HelmetProvider (NEW — wraps <App />)     │  │
│  │  index.html    │    │  ↓                                      │  │
│  │  + class="dark"│    │  AnimatePresence ↓ Router               │  │
│  │  + Netlify     │    │   ↓                                     │  │
│  │    hidden forms│    │   AppHeader (nav refresh — peer-equal)  │  │
│  │    (contact-   │    │   ↓                                     │  │
│  │     form +     │    │   Suspense fallback={""} →             │  │
│  │     shop-      │    │     Routes:                              │  │
│  │     notify)    │    │       /  → Home                          │  │
│  └────────────────┘    │         + AppBanner (dual hero)         │  │
│           ↓            │         + <SEOHead /> + <JsonLd />      │  │
│         (build)        │       /styles → Projects (laser)         │  │
│           ↓            │       /styles/:slug → ProjectSingle      │  │
│   build/sitemap.xml ←──┤       /3d-printing → Projects (print)    │  │
│   (postbuild script    │       /3d-printing/:slug → ProjectSingle │  │
│    queries Sanity)     │       /materials → <Navigate /styles#…>  │  │
│                        │       /about, /contact, /shop, /404      │  │
│                        │   ↓                                     │  │
│                        │   AppFooter                              │  │
│                        └─────────────────────────────────────────┘  │
│                                       ↓                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Context layer (one ServicesProvider per service-page mount)  │   │
│  │  ServicesContext(serviceKey) → useSanityQuery(GROQ, params)  │   │
│  │  SingleServiceContext(serviceKey, slug) → derives from above │   │
│  │  AboutMeContext (kept as-is, Phase 1)                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                       ↓                              │
└──────────────────────────────────────────────────────────────────────┘
                                        ↓
                              ┌──────────────────────┐
                              │  Sanity CDN (read)   │
                              │  apicdn.sanity.io    │
                              │   docs:              │
                              │   - laser-style      │
                              │   - print-style NEW  │
                              │   - material         │
                              │     (.processes ref) │
                              │   - studio-info NEW  │
                              │   - faq NEW          │
                              │   - process NEW enum │
                              │   - profile, etc.    │
                              └──────────────────────┘
                                        +
                              ┌──────────────────────┐
                              │  Sanity Image CDN     │
                              │  cdn.sanity.io/images/│
                              │   served via          │
                              │   @sanity/image-url   │
                              │   builder w/ srcSet   │
                              └──────────────────────┘
                                        +
                              ┌──────────────────────┐
                              │ Netlify Forms (POST) │
                              │ - contact-form       │
                              │ - shop-notify NEW    │
                              └──────────────────────┘
```

### Recommended Project Structure

The new files this phase introduces follow Phase-1 + existing conventions exactly:

```
src/
├── App.js                          # MODIFIED — add /3d-printing routes, /shop, /materials Navigate, /404
├── components/
│   ├── projects/                    # RENAMED → services/  (D-01..D-05 clean rip)
│   ├── services/                    # NEW — generalized from projects/
│   │   ├── ServicesGrid.jsx
│   │   ├── ServiceCard.jsx          # generalized from ProjectSingle.jsx (the card)
│   │   ├── ServiceHeader.jsx
│   │   ├── ServiceGallery.jsx
│   │   ├── ServiceInfo.jsx
│   │   ├── MaterialsSection.jsx     # NEW — in-page materials list filtered by service
│   │   ├── FAQ.jsx                  # NEW — 5–8 items per service via <details>/<summary>
│   │   ├── WontMake.jsx             # NEW — portable text rendered "what we won't make"
│   │   └── TrustCopyBlock.jsx       # NEW — turnaround + pickup + serviceArea + response-time
│   ├── shared/
│   │   ├── AppHeader.jsx            # MODIFIED — peer-equal services nav, /shop link, drop /materials
│   │   ├── AppBanner.jsx            # MODIFIED — dual-service hero (D-10)
│   │   ├── AppFooter.jsx            # touched during sweep
│   │   ├── SEOHead.jsx              # NEW — react-helmet-async wrapper
│   │   ├── JsonLdLocalBusiness.jsx  # NEW — homepage JSON-LD block
│   │   └── Placeholder.jsx          # NEW — branded image placeholder (D-11)
│   └── contact/
│       └── ContactForm.jsx          # MODIFIED — service field + pre-fill + honeypot fix + accent button
├── context/
│   ├── ServicesContext.jsx          # NEW — generalized, parameterized by serviceKey
│   ├── SingleServiceContext.jsx     # NEW — generalized, parameterized by serviceKey + slug
│   ├── AboutMeContext.jsx           # KEPT (Phase 1)
│   ├── ProjectsContext.jsx          # DELETE in Wave 1 final step
│   └── SingleProjectContext.jsx     # DELETE in Wave 1 final step
├── data/
│   ├── services.js                  # KEPT (Phase 1) — print entry already declared
│   └── (everything else)            # DELETE per VIS-05 (D-29)
├── hooks/
│   ├── useSanityQuery.jsx           # KEPT (Phase 1)
│   └── useScrollToTop.jsx           # MODIFIED — fix listener leak as part of VIS-05
├── pages/
│   ├── Home.jsx                     # MODIFIED — new hero, dual-service framing
│   ├── Projects.jsx                 # MODIFIED — generalized to take serviceKey from URL or props
│   ├── ProjectSingle.jsx            # MODIFIED — generalized
│   ├── Materials.jsx                # DELETE — replaced by /materials redirect (MAT-03)
│   ├── Contact.jsx                  # MODIFIED — adds response-time block, mounts SEOHead
│   ├── Shop.jsx                     # MODIFIED — replace stub with Coming Soon page
│   ├── AboutMe.jsx                  # touched during sweep
│   └── NotFound.jsx                 # NEW — /404 route
├── utilities/
│   ├── sanityClient.jsx             # KEPT (Phase 1)
│   ├── sanityImage.jsx              # NEW — `imageUrlBuilder(sanityClient)` wrapper + helpers
│   ├── helpers.jsx                  # DELETE per VIS-05
│   └── encodeFormData.jsx           # NEW (optional) — extract `encode()` helper if used >1 place
└── ...
public/
├── index.html                       # MODIFIED — extend contact-form prerender, add shop-notify form,
│                                    #            add per-page SEO defaults, og:image, default
│                                    #            <title> shell that helmet overrides
└── robots.txt                       # MODIFIED — reference sitemap.xml
build/  (generated, gitignored)
└── sitemap.xml                      # NEW — written by postbuild script
scripts/
└── generate-sitemap.cjs             # NEW — postbuild script (CommonJS for Node compatibility)
```

### Pattern 1: Generalized `ServicesContext` parameterized by `serviceKey`

**What:** One pair of context files (`ServicesContext`, `SingleServiceContext`) covers BOTH laser and print services, parameterized by `serviceKey` from `SERVICES`.

**When to use:** Every service-data fetch (the `/styles` grid, the `/3d-printing` grid, the `/styles/:slug` detail page, the `/3d-printing/:slug` detail page).

**Why this shape (vs parallel `PrintsContext`):** Per CONTEXT.md D-01, the planner picks generalized as default. Phase 1 already lit up `SERVICES = [{ key, urlSegment, navLabel, sanityType, contactSubject }]` with a `print` entry. The generalized context resolves `sanityType` from `serviceKey` and runs one parameterized GROQ. Future Bundle 3 shop has its own `ShopContext` — D-04 forbids `if (service === 'shop')` branches inside `ServicesContext`.

**Concrete file diff (the existing `ProjectsContext` becomes `ServicesContext`):**

The Phase 1 `ProjectsContext.jsx` runs a hardcoded `*[_type == "laser-style"]` GROQ. The generalized version takes `serviceKey` as a prop and resolves to the service's `sanityType`:

```jsx
// src/context/ServicesContext.jsx — NEW [VERIFIED: pattern derived from existing ProjectsContext.jsx + Phase-1 useSanityQuery]
import { createContext, useContext } from 'react';
import useSanityQuery from '../hooks/useSanityQuery';
import { SERVICES } from '../data/services';

const ServicesContext = createContext();

// Shared GROQ projection — works for laser-style AND print-style because the schemas mirror (D-05).
// _type is parameterized via $sanityType so the same query string drives both services.
const SERVICES_QUERY = `*[_type == $sanityType] | order(order asc){
	_id,
	order,
	title,
	description,
	header,
	slug,
	preferredMaterials,
	considerations,
	turnaround,           // NEW per D-14, optional
	wontMakeScope,        // NEW per D-14, portable text
	seo{                  // NEW per D-19
		metaTitle,
		metaDescription,
		ogImage{ asset->{ _id, url, altText } }
	},
	listImage{
		altText,
		asset->{ _id, url, altText }
	},
	detailImages[]{
		altText,
		asset->{ _id, url, altText }
	}
}`;

export const ServicesProvider = ({ serviceKey, children }) => {
	const service = SERVICES.find((s) => s.key === serviceKey);
	if (!service) throw new Error(`Unknown serviceKey: ${serviceKey}`);

	const { data, loading, error, refetch } = useSanityQuery(
		SERVICES_QUERY,
		{ sanityType: service.sanityType },
		[service.sanityType]
	);

	return (
		<ServicesContext.Provider
			value={{
				serviceKey,
				service,                   // full SERVICES entry
				services: data ?? [],      // sorted-by-order array
				loading,
				error,
				refetch,
			}}
		>
			{children}
		</ServicesContext.Provider>
	);
};

export const useServices = () => useContext(ServicesContext);
export default ServicesContext;
```

```jsx
// src/context/SingleServiceContext.jsx — NEW
import { createContext, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ServicesContext from './ServicesContext';

const SingleServiceContext = createContext();

export const SingleServiceProvider = ({ children }) => {
	// :capability for laser routes, :slug for print routes — declare both possibilities,
	// take whichever matches. Or normalize the route segment in App.js to :slug.
	const params = useParams();
	const slug = params.slug ?? params.capability;
	const { services, loading, error } = useContext(ServicesContext);

	const singleService = useMemo(
		() => services.find((s) => s.slug?.current === slug || s.slug?.includes?.(slug)),
		[services, slug]
	);

	return (
		<SingleServiceContext.Provider value={{ singleService, loading, error }}>
			{children}
		</SingleServiceContext.Provider>
	);
};

export const useSingleService = () => useContext(SingleServiceContext);
export default SingleServiceContext;
```

**Note on slug shape:** Existing Phase-1 code does `projects.find((cap) => cap.slug.includes(capability))` (treats slug as a string). Sanity slugs are typically `{ current: "..." }`. This research **does not have access to Sanity Studio** so it cannot confirm the actual shape — the planner should verify in the first GROQ projection whether `slug` is selected as `slug` (the object) or `slug.current` (the string). The pattern above tries both forms defensively. **Plan should add a one-line comment: "TODO during Wave 1 spike: confirm `slug` shape returned by Sanity and remove the `includes` fallback."**

**Migration sequence per D-02 (clean rip — D-03):**
1. Wave 1: create `src/context/ServicesContext.jsx` and `src/context/SingleServiceContext.jsx` alongside the existing `ProjectsContext`/`SingleProjectContext`.
2. Wave 1: rename `src/components/projects/*` → `src/components/services/*`, generalize file contents (remove "laser-only" hardcoded copy in `ProjectsGrid.jsx`).
3. Wave 1: re-point `/styles` route in `App.js` to use `<ServicesProvider serviceKey="laser">` wrapping the existing components.
4. Wave 2: add `/3d-printing` routes using `<ServicesProvider serviceKey="print">`.
5. Wave 2 final: delete `src/context/ProjectsContext.jsx`, `src/context/SingleProjectContext.jsx`, and any orphaned `src/components/projects/` files (the rename in step 2 leaves the directory empty).

**File-by-file consumer list (verified by `rg -l "ProjectsContext|SingleProjectContext" src/`):**
- `src/pages/Home.jsx` — wraps `<ProjectsGrid />` in `<ProjectsProvider>` → becomes `<ServicesProvider serviceKey="laser">`
- `src/pages/Projects.jsx` — wraps in `<ProjectsProvider>` → becomes `<ServicesProvider serviceKey={'laser' or whatever resolves from URL}>`
- `src/pages/ProjectSingle.jsx` — nests `<ProjectsProvider>` + `<SingleProjectProvider>` → becomes `<ServicesProvider serviceKey={resolveFromURL}>` + `<SingleServiceProvider>`
- `src/components/projects/ProjectsGrid.jsx` — `useContext(ProjectsContext)` → `useServices()`
- `src/components/projects/ProjectGallery.jsx` — `useContext(SingleProjectContext)` → `useSingleService()`
- `src/components/projects/ProjectHeader.jsx` — `useContext(SingleProjectContext)` → `useSingleService()`
- `src/components/projects/ProjectInfo.jsx` — `useContext(SingleProjectContext)` → `useSingleService()`
- `src/components/projects/ProjectRelatedProjects.jsx` — orphaned, **deleted in VIS-05**, no migration needed [VERIFIED: `rg -l` confirms it self-references only]

### Pattern 2: `MaterialsSection` per service (in-page section, MAT-01..MAT-03)

**What:** A section component rendered on each service page below the grid. Anchor `id="materials"`. Filters `material` documents by service via the `processes` reference array.

**GROQ filter — primary form (per D-06 reference array):**

```groq
*[_type == "material" && $serviceKey in processes[]->key] | order(order asc){
	_id,
	order,
	title,
	cuttingSpecs,
	description,
	disclaimer,
	processes[]->{ key },        // for debugging/display, not strictly needed
	listImage{
		altText,
		asset->{ _id, url, altText }
	}
}
```

**GROQ filter — fallback form (per D-07 free-text strings):**

```groq
*[_type == "material" && $serviceKey in processes] | order(order asc){
	... same projection ...
}
```

**The two queries differ by ONE character:** `processes[]->key` (reference array dereferenced to enum doc's `key` field) vs `processes` (array of strings directly on the material doc). Plan should write both forms and pick at the first GROQ spike based on what the owner actually has. **The fallback query is one query string change in `MaterialsSection.jsx`** — no code architecture changes.

**Component shape:**

```jsx
// src/components/services/MaterialsSection.jsx — NEW
import useSanityQuery from '../../hooks/useSanityQuery';
import MaterialSingle from '../../materials/MaterialSingle';

const MATERIALS_QUERY = `*[_type == "material" && $serviceKey in processes[]->key] | order(order asc){
	_id, order, title, cuttingSpecs, description, disclaimer,
	listImage{ altText, asset->{ _id, url, altText } }
}`;

const MaterialsSection = ({ serviceKey }) => {
	const { data, loading } = useSanityQuery(MATERIALS_QUERY, { serviceKey });
	const materials = data ?? [];

	return (
		<section id="materials" className="py-12 sm:py-24">
			<div className="container mx-auto">
				<h2 className="font-display font-bold text-2xl sm:text-3xl text-ternary-dark dark:text-ternary-light mb-8">
					Materials
				</h2>
				{!loading && materials.length === 0 && (
					<p className="text-ternary-dark dark:text-ternary-light">
						Materials coming soon. <a href="/contact">Contact us</a> for special orders.
					</p>
				)}
				{materials.map((m) => (
					<MaterialSingle
						key={m._id}
						title={m.title}
						image={m.listImage?.asset?.url}
						description={m.description}
						materialThickness={m.cuttingSpecs}
						processes={[]}  /* per-service section — no need to badge */
						disclaimer={m.disclaimer}
					/>
				))}
			</div>
		</section>
	);
};

export default MaterialsSection;
```

### Pattern 3: Routing changes (App.js diff)

**Current `App.js` routes (Phase 1):**
- `/`, `/${laser.urlSegment}` (= `/styles`), `/${laser.urlSegment}/:capability`, `/materials`, `/about`, `/contact`

**Phase 2 routes (target):**

```jsx
// src/App.js — partial diff (illustrative; planner produces exact edit)
import { Navigate } from 'react-router-dom';
// ... existing imports ...
import { HelmetProvider } from 'react-helmet-async';
import { SERVICES } from './data/services';

const Home = lazy(() => import('./pages/Home'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectSingle = lazy(() => import('./pages/ProjectSingle'));
const About = lazy(() => import('./pages/AboutMe'));
const Contact = lazy(() => import('./pages/Contact'));
const Shop = lazy(() => import('./pages/Shop'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
	return (
		<HelmetProvider>
			<AnimatePresence>
				<div className="bg-secondary-light dark:bg-primary-dark transition duration-300">
					<Router>
						<ScrollToTop />
						<AppHeader />
						<Suspense fallback={""}>
							<Routes>
								<Route path="/" element={<Home />} />

								{SERVICES.map((s) => (
									<Route key={s.key}>
										<Route path={`/${s.urlSegment}`} element={<Projects serviceKey={s.key} />} />
										<Route path={`/${s.urlSegment}/:slug`} element={<ProjectSingle serviceKey={s.key} />} />
									</Route>
								))}

								{/* MAT-03: /materials → /styles#materials, 301-style on the SPA via Navigate replace */}
								<Route path="/materials" element={<Navigate to="/styles#materials" replace />} />

								<Route path="/about" element={<About />} />
								<Route path="/contact" element={<Contact />} />
								<Route path="/shop" element={<Shop />} />
								<Route path="*" element={<NotFound />} />
							</Routes>
						</Suspense>
						<AppFooter />
					</Router>
					<UseScrollToTop />
				</div>
			</AnimatePresence>
		</HelmetProvider>
	);
}
```

**Note 1:** `<Navigate replace />` is a client-side redirect, not a real 301. For inbound link preservation (existing Google index entries pointing at `/materials`) **also add a Netlify `_redirects` file at `public/_redirects`:**

```
# public/_redirects (NEW — Netlify reads this verbatim)
/materials  /styles#materials  301
```

Both are needed — Netlify's redirect handles direct hits and crawlers; React Router's `<Navigate>` handles client-side hops within the SPA.

**Note 2:** Phase 1 used `:capability` for the slug param (matching existing copy). Phase 2 should normalize to `:slug` because `<Routes>` re-uses the same `<ProjectSingle>` component for both services. The existing `useParams()` reading `capability` becomes `slug`. One-line edit per consumer.

### Pattern 4: `react-helmet-async` integration

**HelmetProvider placement:** Wrap `<App />`'s body. The pattern above puts `<HelmetProvider>` outside `<AnimatePresence>` because `framer-motion` does not interact with the head. Inside StrictMode (double-mount in dev) `react-helmet-async` is correct as of v2.0.4+; do not put it inside lazy boundaries that get torn down on route change.

**Per-route mount pattern:**

```jsx
// src/components/shared/SEOHead.jsx — NEW
import { Helmet } from 'react-helmet-async';

const SEOHead = ({
	title,
	description,
	ogImage,           // {url, altText} — defaults to studio-branded fallback
	ogUrl,             // canonical URL for this route
	noindex = false,   // /404 sets this true
}) => {
	const fullTitle = title ? `${title} — Shapesmith Studio` : 'Shapesmith Studio';
	return (
		<Helmet>
			<title>{fullTitle}</title>
			{description && <meta name="description" content={description} />}
			<meta property="og:title" content={fullTitle} />
			{description && <meta property="og:description" content={description} />}
			{ogImage?.url && <meta property="og:image" content={ogImage.url} />}
			{ogImage?.altText && <meta property="og:image:alt" content={ogImage.altText} />}
			{ogUrl && <meta property="og:url" content={ogUrl} />}
			<meta property="og:type" content="website" />
			{noindex && <meta name="robots" content="noindex" />}
		</Helmet>
	);
};

export default SEOHead;
```

**Static route example (`/about`):**

```jsx
<SEOHead
	title="About"
	description="Shapesmith Studio is a one-person creative studio offering laser cutting and 3D printing in [city]."
	ogUrl="https://shapesmith.studio/about"
/>
```

**Dynamic route example (`/styles/:slug`):**

```jsx
const { singleService } = useSingleService();
// ...
<SEOHead
	title={singleService?.seo?.metaTitle ?? singleService?.title}
	description={singleService?.seo?.metaDescription ?? singleService?.description}
	ogImage={singleService?.seo?.ogImage?.asset
		? { url: singleService.seo.ogImage.asset.url, altText: singleService.seo.ogImage.altText }
		: { url: '/og-default.png', altText: 'Shapesmith Studio' }}
	ogUrl={`https://shapesmith.studio/styles/${singleService?.slug?.current}`}
/>
```

**SPA crawler caveat (HIGH-priority planner note):** SPAs that mount meta via JavaScript only work for crawlers that execute JavaScript. As of 2026, **Googlebot, Bingbot, Twitterbot, and LinkedInBot all execute JavaScript**. Facebook crawlers historically did not, but as of late 2024 do execute basic JS. **This is fine for the "looks legit" bar.** [ASSUMED: claim about specific 2026 crawler behavior — Google's documentation confirms its crawler renders JS, but exact 2026 status of Twitterbot/Slackbot is not directly verified in this research.]

The planner should still set sensible **static defaults in `public/index.html`** so even no-JS crawlers see something:

```html
<!-- public/index.html — UPDATED <head> -->
<meta name="description" content="Shapesmith Studio — custom laser cutting and 3D printing for local hobbyists and small businesses." />
<meta property="og:title" content="Shapesmith Studio" />
<meta property="og:description" content="Custom laser cutting and 3D printing." />
<meta property="og:image" content="/og-default.png" />
<meta property="og:type" content="website" />
<meta name="theme-color" content="#291c30" />
<title>Shapesmith Studio</title>
```

When react-helmet-async runs in the browser, it overwrites these on a per-route basis. Crawlers that don't execute JS still see the static defaults — better than the current CRA boilerplate "Web site created using create-react-app."

### Pattern 5: Sitemap generation (D-22 — planner judgment)

**Recommended approach: custom postbuild script, zero new runtime deps.**

```js
// scripts/generate-sitemap.cjs — NEW
const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');

// Hardcoded routes (mirrored from src/App.js + src/data/services.js).
// Keep this list in sync with App.js when routes are added.
const STATIC_ROUTES = ['/', '/styles', '/3d-printing', '/about', '/contact', '/shop'];
const BASE_URL = 'https://shapesmith.studio';

const client = createClient({
	projectId: 'qx9kep1e',
	dataset: 'production',
	useCdn: true,
	apiVersion: '2023-06-16',
});

const QUERY = `{
	"laserSlugs": *[_type == "laser-style" && defined(slug.current)].slug.current,
	"printSlugs": *[_type == "print-style" && defined(slug.current)].slug.current
}`;

(async () => {
	const { laserSlugs = [], printSlugs = [] } = await client.fetch(QUERY);
	const dynamic = [
		...laserSlugs.map((s) => `/styles/${s}`),
		...printSlugs.map((s) => `/3d-printing/${s}`),
	];
	const today = new Date().toISOString().slice(0, 10);
	const urls = [...STATIC_ROUTES, ...dynamic].map(
		(u) => `	<url><loc>${BASE_URL}${u}</loc><lastmod>${today}</lastmod></url>`
	).join('\n');
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
	fs.writeFileSync(path.join(__dirname, '..', 'build', 'sitemap.xml'), xml);
	console.log(`sitemap.xml written with ${STATIC_ROUTES.length + dynamic.length} URLs`);
})();
```

**`package.json` scripts diff:**

```jsonc
{
	"scripts": {
		"start": "react-scripts start --openssl-legacy-provider",
		"build": "react-scripts build --openssl-legacy-provider",
		"postbuild": "node scripts/generate-sitemap.cjs",
		"test": "react-scripts test",
		"build:css": "postcss src/css/tailwind.css -o src/css/main.css"
	}
}
```

**Netlify behavior:** Netlify runs `pnpm build` per `netlify.toml`. `postbuild` is NOT run automatically by `pnpm build` itself, but **pnpm runs `postbuild` automatically after `pnpm build` completes** (npm/pnpm lifecycle hook). Verified in `netlify.toml`: `command = "pnpm build"` triggers `pnpm`'s lifecycle which fires `postbuild` [CITED: pnpm lifecycle hooks docs].

**`public/robots.txt` update:**

```
# public/robots.txt
User-agent: *
Disallow:

Sitemap: https://shapesmith.studio/sitemap.xml
```

**Why not the alternatives:**
- **`react-router-sitemap` / `react-router-sitemap-generator`:** Spotty React Router v6 support per [GitHub issue clh161/react-router-sitemap-generator#166](https://github.com/clh161/react-router-sitemap-generator/issues/166); also requires fetching Sanity slugs separately anyway. The 30-line custom script is no more code than configuring the lib.
- **Prebuild script writing to `public/sitemap.xml`:** would get committed to git and drift. `build/sitemap.xml` written postbuild is pristine.

### Pattern 6: Multi-form prerender (`shop-notify` + extended `contact-form`)

Netlify's hidden-form prerender mechanism: Netlify scans built HTML for `<form>` tags with `data-netlify` or the `netlify` attribute and registers them at deploy time. Multiple forms are supported as long as **each has a unique `name` attribute** [CITED: [Netlify docs — Forms setup](https://docs.netlify.com/manage/forms/setup/)].

**Diff to `public/index.html`:**

```html
<!-- Before <body> close, replace existing single-form block with two -->

<!-- contact-form: extended with `service` field per D-28 -->
<form name="contact-form" netlify netlify-honeypot="bot-field" hidden>
	<input type="text" name="bot-field" />
	<input type="text" name="name" />
	<input type="email" name="email" />
	<input type="text" name="service" />        <!-- NEW per CTC-02 -->
	<input type="text" name="subject" />
	<textarea name="message"></textarea>
	<input type="submit" value="Submit">
</form>

<!-- shop-notify: NEW per SHOP-02 / D-23 -->
<form name="shop-notify" netlify netlify-honeypot="bot-field" hidden>
	<input type="text" name="bot-field" />
	<input type="email" name="email" />
	<input type="submit" value="Submit">
</form>
```

**Field-name correspondence:** The React `<form>` posts URL-encoded `application/x-www-form-urlencoded` with the same field names. Any mismatch = Netlify silently drops the submission. The hidden form is the schema; the React component must match field-for-field.

### Anti-Patterns to Avoid

- **`if (service === 'shop') { … }` branches inside `ServicesContext`** — D-04 forbids this. Shop gets its own context in Bundle 3.
- **Hardcoded `#hex` values in JSX** — pitfall 4 (half-spruce) flag. Use Tailwind tokens (`bg-accent`, `dark:text-primary-light`) or arbitrary `bg-[#xxx]` only as last resort.
- **Inline `useEffect(() => sanityClient.fetch(GROQ).then(setX))` in components** — Phase 1 banned this; every fetch goes through `useSanityQuery`.
- **`document.getElementById` for modal open/close** — Phase 1 fixed this. New modal/lightbox uses React state.
- **`encode(...)` helper duplicated across files** — extract to `src/utilities/encodeFormData.jsx` if used in both `ContactForm.jsx` and `Shop.jsx` (the new shop-notify form needs the same encoder).
- **Hidden form prerender drift** — every field on the React form must appear on the hidden form. Lint manually during the per-route sweep.
- **`<Helmet>` mounted inside `<Suspense>` fallback** — would unmount on route change. Mount inside the page component itself, not in the lazy boundary.
- **JSON-LD structured data only injected via Helmet** — fine for Google (renders JS) but flag for Facebook/older crawlers. Belt-and-suspenders: also include the JSON-LD block in `public/index.html` for the homepage. The same JSON-LD content can live in both places without conflict; Helmet appends, not replaces.

---

## Sanity Schema Specifications

This section is the **owner-prep doc** referenced in CONTEXT.md D-07 and D-13–D-15. The owner pastes these into their Sanity Studio repo (a separate Git repo, not this web repo). They are written in `defineType`/`defineField` syntax — current Sanity Studio v3 idiom. Field names are **camelCase** to match observable conventions in existing GROQ projections (`listImage`, `detailImages`, `cuttingSpecs`, `preferredMaterials` — all camelCase).

### `process` enum (NEW — supporting doc)

```ts
// process.ts (Sanity Studio)
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

**Owner action:** create two `process` documents with `key: "laser"` and `key: "print"` after publishing the schema.

### `material.processes` migration (MAT-02 / D-06)

```ts
// material.ts — MODIFY existing schema (add or replace processes field)
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
1. Publish the `process` schema and create the two enum docs.
2. Modify `material.processes` field shape from current (per D-06 the planner doesn't know if existing is free-text or already reference — the owner verifies).
3. Re-tag every existing material doc — for each material, set `processes` to `[laser]`, `[print]`, or `[laser, print]` references.
4. Verify in the Studio Vision tool: `*[_type == "material" && "laser" in processes[]->key]` returns expected materials.

**Fallback per D-07:** if migration is too painful, leave `processes` as a string array `['laser' | 'print' | 'both']`. The planner switches the `MaterialsSection` GROQ to `$serviceKey in processes` (string-array form). Both forms are documented in `Pattern 2` above.

### `studio-info` singleton (NEW per D-13 + D-21)

```ts
// studio-info.ts (Sanity Studio)
import { defineType, defineField } from 'sanity';

export default defineType({
	name: 'studio-info',
	type: 'document',
	title: 'Studio Info',
	__experimental_actions: ['update', 'publish'],  // singleton — disable create/delete in studio structure
	fields: [
		defineField({ name: 'name', type: 'string', title: 'Studio name', description: 'Used in <title> and JSON-LD' }),
		defineField({ name: 'description', type: 'text', title: 'Short description', rows: 3 }),
		defineField({ name: 'serviceArea', type: 'string', title: 'Service area', description: 'e.g., "Greater Seattle area"' }),
		defineField({ name: 'pickupAvailability', type: 'string', title: 'Pickup availability' }),
		defineField({ name: 'responseTimePromise', type: 'string', title: 'Response-time promise' }),
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
		defineField({ name: 'url', type: 'url', title: 'Site URL', initialValue: 'https://shapesmith.studio' }),
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
			description: 'Free text, e.g., "By appointment"',
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
			description: 'e.g., ["Laser cutting", "3D printing"]',
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

**Singleton enforcement:** the planner notes "studio-info is a singleton — only one document of this type should ever exist." The Sanity Studio's `structure.ts` should configure this as a non-list editor entry; that's an owner-side concern, not the planner's.

### `print-style` (NEW per SVC-05)

Mirror of `laser-style` — same field names so the shared GROQ projection in `Pattern 1` works for both. The planner produces this exactly as below; the owner pastes into the Studio repo.

```ts
// print-style.ts (Sanity Studio)
import { defineType, defineField } from 'sanity';

export default defineType({
	name: 'print-style',
	type: 'document',
	title: '3D Print Style',
	fields: [
		defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
		defineField({ name: 'order', type: 'number', title: 'Order (lower = first)' }),
		defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (Rule) => Rule.required() }),
		defineField({ name: 'description', type: 'text', rows: 4 }),
		defineField({ name: 'header', type: 'string', title: 'Detail-page header' }),
		defineField({ name: 'preferredMaterials', type: 'array', of: [{ type: 'string' }] }),
		defineField({ name: 'considerations', type: 'array', of: [{ type: 'string' }] }),
		defineField({ name: 'turnaround', type: 'string', title: 'Turnaround time', description: 'e.g., "1–2 weeks"' }),
		defineField({
			name: 'wontMakeScope',
			type: 'array',
			title: '"What we won\'t make" copy',
			of: [{ type: 'block' }],   // portable text
		}),
		defineField({
			name: 'seo',
			type: 'object',
			title: 'SEO',
			fields: [
				{ name: 'metaTitle', type: 'string' },
				{ name: 'metaDescription', type: 'text', rows: 2 },
				{ name: 'ogImage', type: 'image', fields: [{ name: 'altText', type: 'string' }] },
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
			of: [{
				type: 'image',
				fields: [{ name: 'altText', type: 'string' }],
			}],
		}),
	],
});
```

### `laser-style` extension (NEW fields per D-14, D-19)

Owner adds these three fields to the existing `laser-style` schema:

- `turnaround` (string)
- `wontMakeScope` (portable text array)
- `seo` (object — same shape as `print-style.seo` above)

### `faq` (NEW per CNT-03 / D-15)

```ts
// faq.ts (Sanity Studio)
import { defineType, defineField } from 'sanity';

export default defineType({
	name: 'faq',
	type: 'document',
	title: 'FAQ',
	fields: [
		defineField({ name: 'question', type: 'string', validation: (Rule) => Rule.required() }),
		defineField({
			name: 'answer',
			type: 'array',
			of: [{ type: 'block' }],   // portable text
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

**GROQ for service-filtered FAQ:**

```groq
*[_type == "faq" && $serviceKey in service[]->key] | order(order asc){
	_id, question, answer, order
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-page SEO meta | Custom DOM `document.title` mutation in `useEffect` | `react-helmet-async@^2.0.5` | Helmet handles cleanup on route change, avoids dev StrictMode double-render bugs, supports JSON-LD + og: tags in one API |
| Responsive Sanity image URLs | Manual `?w=&h=&q=&dpr=` string concat | `@sanity/image-url@^2.1.1` builder | The builder URL-encodes correctly and supports `auto('format')` for AVIF/WebP; manual concat drifts |
| Sitemap generation | A `<sitemap>` route handler in React | A Node postbuild script writing to `build/sitemap.xml` | Crawlers fetch a static file; SPA routes don't serve XML correctly; build-time generation is canonical |
| Multi-form Netlify integration | Custom React form-detection logic | The hidden-prerender pattern in `public/index.html` | Netlify's deploy-time HTML scanner is the documented mechanism; field names must match exactly between hidden form and React form |
| FAQ accordion | Custom collapsible component with React state and animation | Native `<details>` + `<summary>` | Zero JS, zero a11y bugs, keyboard-accessible by default; UI-SPEC §"Component Inventory" recommends this |
| Light-mode toggle | Reviving `useThemeSwitcher` | Nothing — dark-only is committed (Phase 1 D-08, project-level) | THEME-01 is v2 only |
| Image lazy-load | IntersectionObserver wrapper component | Native `<img loading="lazy">` | Browser-native; sufficient for grid cards. Use `loading="eager"` for the hero LCP image on `/`. |
| Form encoding | Custom URLSearchParams / FormData re-implementation | Reuse the existing `encode(data)` helper from `ContactForm.jsx` | Already works; extract to `src/utilities/encodeFormData.jsx` if used in 2+ places |
| Slug regex | Hand-rolled string slugify | Sanity's `slug` field type with `options: { source: 'title' }` | Owner-side concern; the planner just queries `slug.current` |
| Container width / padding | New custom class | Existing `tailwind.config.js` `container.padding` scale | D-08 forbids palette/typography churn; the existing scale is sufficient |

**Key insight:** Phase 2's job is to USE the right hooks/libraries/patterns, not to invent any. The two new packages (`react-helmet-async`, `@sanity/image-url`) are both single-purpose with clean APIs; everything else is composition of Phase-1 primitives (`useSanityQuery`, `SERVICES`, Tailwind utility classes, framer-motion `motion.*`).

---

## Common Pitfalls

### Pitfall 1: Half-spruce — interior pages remain old after hero refresh

**What goes wrong:** Homepage hero refreshed, nav refreshed. `/about`, `/contact`, project detail pages, footer keep old typography rhythm and button styles. Visitor lands on a deep link from Google → sees inconsistent identity → bounces.

**Why it happens:** Component-by-component spruce inevitably misses pages that aren't on the planner's mental map. The token-first sweep (D-09) forces a centralized diff before any component work, but plans must explicitly visit each route.

**How to avoid:** UI-SPEC §"Per-Route Spruce Checklist" — 9 routes named explicitly: `/`, `/styles`, `/styles/:slug`, `/3d-printing`, `/3d-printing/:slug`, `/about`, `/contact`, `/shop`, `/404`, plus `/materials` (the redirect). PLAN.md should have one acceptance row per route.

**Warning signs:**
- Two routes use different shades of the same notional color
- A page hasn't been touched in the wave 3 commit log
- Button color is `indigo-500` somewhere (template residue) but `accent` elsewhere

### Pitfall 2: Wrong abstraction in `ServicesContext`

**What goes wrong:** Six months from now, plans add a third service or shop. The generalized `ServicesContext` grows `if (serviceKey === 'shop')` branches. Both services suffer from the conditional code.

**Why it happens:** Once an abstraction exists, the easy path is to extend it. Sandi Metz's "Wrong Abstraction" essay covers this exactly.

**How to avoid:** D-04 forbids `if (serviceKey === 'shop')` branches inside `ServicesContext`. Shop = its own `ShopContext`. The planner can enforce by having the discuss-phase doc for Bundle 3 reference D-04 explicitly.

**Warning signs:**
- Any function in `ServicesContext` takes `serviceKey` and switches on it for non-data concerns
- A bug fix in one service's context branch breaks the other

### Pitfall 3: GROQ projection drift between laser and print

**What goes wrong:** The planner copies `laser-style`'s fields into `print-style` but adds one field to laser later (e.g., `kerf`) without adding it to print. The shared GROQ projection in `ServicesContext` selects `kerf` and silently returns `undefined` for print docs.

**Why it happens:** D-05 commits to a shared projection. If the schemas drift, the projection drifts.

**How to avoid:** The shared GROQ in `Pattern 1` only projects fields that are mirrored in BOTH schemas. Service-specific fields (e.g., laser's `kerf` if added later) go in a per-service GROQ extension layered on top, not in the shared projection. **PLAN.md should treat `Pattern 1`'s GROQ as a contract: any field added to it must exist in both `laser-style` and `print-style`.**

**Warning signs:**
- One service-detail page renders empty fields the other doesn't
- The schema spec doc has fields in `print-style` not in `laser-style` (or vice versa)

### Pitfall 4: Netlify hidden-form drift

**What goes wrong:** React `ContactForm.jsx` adds a new field (`source`, `phone`, etc.) but `public/index.html` hidden form prerender doesn't get the field. Netlify silently drops every submission with that field. Owner doesn't see the form working.

**Why it happens:** The hidden form is invisible (literally — `hidden` attribute) and easy to forget.

**How to avoid:** PLAN.md acceptance criteria for any contact-form change includes "verify field appears in `public/index.html` hidden form." Add a one-line comment at the top of `ContactForm.jsx`:

```jsx
// CONTACT-FORM CONTRACT: every field below MUST also appear in `public/index.html`'s
// hidden `<form name="contact-form">` block. See D-28.
```

**Warning signs:**
- Owner reports submissions missing fields
- Netlify Forms dashboard shows submissions with `service: undefined` or similar

### Pitfall 5: `material.processes` migration failure → empty materials section

**What goes wrong:** Owner-prep checkpoint missed. The web code goes live with the new GROQ filter `$serviceKey in processes[]->key`, but the materials in Sanity still have `processes` as a string array (or as an empty field). Both `/styles#materials` and `/3d-printing#materials` render "Materials coming soon" with no error.

**Why it happens:** Silent failure mode. Sanity returns `[]`, code shows the empty state, no errors anywhere.

**How to avoid:**
- Wave 1's first task is the Sanity schema spec doc. The doc has an "Owner verification" section: "Run this query in Sanity Vision: `*[_type == 'material' && 'laser' in processes[]->key]` → should return at least one material." If it doesn't, the migration didn't complete.
- Wave 2's Materials section task has an acceptance criterion: "Open `/styles` in dev, scroll to materials section, verify at least one material renders." If it's empty, fall back to the string-array form (D-07).

**Warning signs:**
- `MaterialsSection` always renders "Materials coming soon"
- Sanity Studio shows `processes` field as red/missing

### Pitfall 6: SPA SEO meta lost to non-JS crawler

**What goes wrong:** Twitter share preview shows the static `<title>Shapesmith Studio</title>` from `public/index.html`, not the per-page title set by Helmet. Or LinkedIn truncates `og:description` because the static one is short.

**Why it happens:** Some crawlers don't run JS. SPAs rely on JS for per-page meta.

**How to avoid:** Set a sensible **static default in `public/index.html`** (per Pattern 4 above) so even no-JS crawlers see good copy. Per-page Helmet improves on the default; it doesn't have to carry the full burden alone.

**Warning signs:**
- Slack link unfurls show generic site description for all pages
- Twitter Card validator returns the index.html static meta even after deploy

### Pitfall 7: `react-helmet-async@v3` regression on React 18

**What goes wrong:** Planner upgrades to v3.0.0 (released 2026-03-03, 2 months old as of writing) for a future-proofing benefit. v3 introduced React 19's native head element rendering; on React 18 it falls back to legacy mode but the codepaths are new.

**How to avoid:** Pin `react-helmet-async@^2.0.5` (caret-pinned to allow patches but not v3). If the planner has a strong reason to use v3, **PLAN.md must include an explicit smoke-test checkpoint** that mounts the app in production-build mode and verifies `<title>` updates on route change.

**Warning signs:**
- `<title>` flickers or doesn't update on route change in dev StrictMode
- Github issues on `staylor/react-helmet-async` filed in 2026 mentioning React 18 + v3

---

## Code Examples

### Example 1: `<SanityImage>` component (VIS-04)

Replaces direct `asset.url` reads (full-size original) with responsive srcSet via `@sanity/image-url`.

```jsx
// src/utilities/sanityImage.jsx — NEW
import imageUrlBuilder from '@sanity/image-url';
import sanityClient from './sanityClient';

const builder = imageUrlBuilder(sanityClient);

// Returns a base builder for a Sanity image source — caller chains .width(), .height(), etc.
export const urlFor = (source) => builder.image(source);

// One-liner for "give me a default-quality URL at width N"
export const urlAt = (source, width) =>
	urlFor(source).width(width).auto('format').quality(80).url();
```

```jsx
// src/components/shared/SanityImage.jsx — NEW
import { urlFor } from '../../utilities/sanityImage';
import Placeholder from './Placeholder';

const DEFAULT_WIDTHS = [400, 800, 1200, 1600];

const SanityImage = ({
	source,                      // Sanity image source (the whole listImage object, includes asset)
	alt,                         // required — falls back to source.altText, then asset.altText, never empty
	sizes = '(max-width: 768px) 100vw, 50vw',
	loading = 'lazy',            // 'eager' for hero LCP only
	className = '',
	placeholderCaption,          // shown in <Placeholder /> when source.asset is missing
}) => {
	const altText = alt ?? source?.altText ?? source?.asset?.altText ?? '';

	if (!source?.asset) {
		return <Placeholder caption={placeholderCaption} className={className} />;
	}

	const srcSet = DEFAULT_WIDTHS
		.map((w) => `${urlFor(source).width(w).auto('format').quality(80).url()} ${w}w`)
		.join(', ');

	const fallbackSrc = urlFor(source).width(800).auto('format').quality(80).url();

	return (
		<img
			src={fallbackSrc}
			srcSet={srcSet}
			sizes={sizes}
			alt={altText}
			loading={loading}
			className={className}
		/>
	);
};

export default SanityImage;
```

```jsx
// src/components/shared/Placeholder.jsx — NEW (D-11)
import { FiImage } from 'react-icons/fi';

const Placeholder = ({ caption = 'Image coming soon', className = '' }) => (
	<div className={`flex flex-col items-center justify-center bg-secondary-section-dark aspect-square rounded-xl ${className}`}>
		<FiImage className="text-4xl text-ternary-section-dark opacity-50" aria-hidden="true" />
		<p className="text-sm font-general-medium text-ternary-section-dark opacity-80 mt-2">
			{caption}
		</p>
	</div>
);

export default Placeholder;
```

**Usage in `ServiceCard.jsx`:**

```jsx
<SanityImage
	source={service.listImage}
	alt={service.listImage?.altText ?? service.title}
	sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
	className="aspect-square object-cover rounded-xl"
	placeholderCaption={serviceKey === 'print' ? '3D print example coming soon' : 'Laser cut example coming soon'}
/>
```

**Hero LCP exception:** the homepage hero brand wordmark is the LCP. Pass `loading="eager"` for that image so it doesn't lazy-load.

### Example 2: `<JsonLdLocalBusiness>` component (SEO-02)

```jsx
// src/components/shared/JsonLdLocalBusiness.jsx — NEW
import { Helmet } from 'react-helmet-async';
import useSanityQuery from '../../hooks/useSanityQuery';

const STUDIO_INFO_QUERY = `*[_type == "studio-info"][0]{
	name, description, serviceArea, telephone, url,
	address{ streetAddress, addressLocality, addressRegion, postalCode, addressCountry },
	sameAs, openingHours, areaServed, makesOffer,
	ogImage{ asset->{ url } }
}`;

const JsonLdLocalBusiness = () => {
	const { data } = useSanityQuery(STUDIO_INFO_QUERY);
	if (!data) return null;

	const ld = {
		'@context': 'https://schema.org',
		'@type': 'LocalBusiness',
		name: data.name ?? 'Shapesmith Studio',
		description: data.description,
		url: data.url ?? 'https://shapesmith.studio',
		...(data.telephone && { telephone: data.telephone }),
		...(data.address && {
			address: {
				'@type': 'PostalAddress',
				...(data.address.streetAddress && { streetAddress: data.address.streetAddress }),
				addressLocality: data.address.addressLocality,
				addressRegion: data.address.addressRegion,
				postalCode: data.address.postalCode,
				addressCountry: data.address.addressCountry ?? 'US',
			},
		}),
		...(data.sameAs && data.sameAs.length > 0 && { sameAs: data.sameAs }),
		...(data.openingHours && { openingHours: data.openingHours }),
		...(data.areaServed && data.areaServed.length > 0 && {
			areaServed: data.areaServed.map((a) => ({ '@type': 'AdministrativeArea', name: a })),
		}),
		...(data.makesOffer && data.makesOffer.length > 0 && {
			makesOffer: data.makesOffer.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s } })),
		}),
		...(data.ogImage?.asset?.url && { image: data.ogImage.asset.url }),
	};

	return (
		<Helmet>
			<script type="application/ld+json">{JSON.stringify(ld)}</script>
		</Helmet>
	);
};

export default JsonLdLocalBusiness;
```

**Mount on homepage only (`src/pages/Home.jsx`):**

```jsx
import JsonLdLocalBusiness from '../components/shared/JsonLdLocalBusiness';
// ...
<>
	<SEOHead title={null} description="Shapesmith Studio — laser cutting and 3D printing." ogUrl="https://shapesmith.studio/" />
	<JsonLdLocalBusiness />
	<AppBanner />
	<QuickInfo />
	{/* ... */}
</>
```

**Validation:** after deploy, paste the homepage URL into Google's Rich Results Test (`search.google.com/test/rich-results`) and verify `LocalBusiness` parses without errors. Schema.org `LocalBusiness` required fields per [schema.org/LocalBusiness](https://schema.org/LocalBusiness): `name`, `address` recommended (use `PostalAddress` shape per [Google's structured data guidelines](https://schema.org/LocalBusiness)). Subtype `ProfessionalService` was considered and rejected — see Alternatives Considered above.

### Example 3: Contact form pre-fill (CTC-01)

```jsx
// src/components/contact/ContactForm.jsx — partial diff (the useEffect block + the FormInput)
import { useState, useEffect } from 'react';
import FormInput from '../reusable/FormInput';
import useSanityQuery from '../../hooks/useSanityQuery';
import { SERVICES } from '../../data/services';

// SERVICE_PREFILL_RULES — referrer URL pattern → service contactSubject.
// Each rule's `match` is a substring test on document.referrer.
const SERVICE_PREFILL_RULES = SERVICES.map((s) => ({
	match: `/${s.urlSegment}`,                  // e.g., '/styles' for laser, '/3d-printing' for print
	contactSubject: s.contactSubject,           // e.g., 'Laser cutting'
}));

const ContactForm = () => {
	const [formName, setFormName] = useState('');
	const [formEmail, setFormEmail] = useState('');
	const [formService, setFormService] = useState('');     // NEW per CTC-01
	const [formSubject, setFormSubject] = useState('');
	const [formMessage, setFormMessage] = useState('');
	const [formBotField, setFormBotField] = useState('');
	const [formSubmitted, setFormSubmitted] = useState(false);

	// Pre-fill the service field from ?service= query string OR document.referrer.
	useEffect(() => {
		const queryService = new URLSearchParams(window.location.search).get('service');
		if (queryService) {
			// Map the query value to the dropdown's `contactSubject` representation.
			const match = SERVICES.find((s) => s.key === queryService || s.urlSegment === queryService);
			if (match) { setFormService(match.contactSubject); return; }
		}
		const referrer = document.referrer ?? '';
		const rule = SERVICE_PREFILL_RULES.find((r) => referrer.includes(r.match));
		if (rule) setFormService(rule.contactSubject);
	}, []);

	const encode = (data) =>
		Object.keys(data).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(data[k])).join('&');

	const handleSubmit = (e) => {
		e.preventDefault();
		fetch('/', {                                    // CHANGED — relative URL (Pitfall 5 from PITFALLS.md)
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: encode({
				'form-name': 'contact-form',
				name: formName,
				email: formEmail,
				service: formService,                    // NEW per CTC-02
				subject: formSubject,
				message: formMessage,
				'bot-field': formBotField,
			}),
		})
			.then(() => setFormSubmitted(true))
			.catch((err) => {
				console.error('Contact form submit failed:', err);
				// inline error UI here, not alert()
			});
	};

	// Optional: surface response-time promise from Sanity (CTC-04 / D-27)
	const { data: studioInfo } = useSanityQuery(`*[_type == "studio-info"][0]{ responseTimePromise }`);

	if (formSubmitted) return /* thank-you panel */;

	return (
		<form className="..." onSubmit={handleSubmit}>
			<input type="hidden" name="form-name" value="contact-form" />

			{/* Honeypot — CSS-hidden per D-26. NOT display:none (some bots skip those). */}
			<div className="absolute left-[-10000px] top-auto w-px h-px overflow-hidden" aria-hidden="true">
				<label htmlFor="bot-field">Don't fill this out if you're human:</label>
				<input
					id="bot-field"
					name="bot-field"
					type="text"
					tabIndex={-1}
					autoComplete="off"
					value={formBotField}
					onChange={(e) => setFormBotField(e.target.value)}
				/>
			</div>

			{/* Service dropdown — pre-filled by useEffect above */}
			<div className="mt-6">
				<label className="block text-lg ..." htmlFor="service">Service</label>
				<select
					id="service"
					name="service"
					value={formService}
					onChange={(e) => setFormService(e.target.value)}
					className="..."
				>
					<option value="">Select a service…</option>
					{SERVICES.map((s) => (
						<option key={s.key} value={s.contactSubject}>{s.contactSubject}</option>
					))}
					<option value="Other">Other</option>
				</select>
			</div>

			{/* ...remaining fields... */}

			<button
				type="submit"
				className="font-general-medium w-40 px-4 py-2.5 text-white text-center font-medium tracking-wider bg-accent hover:bg-accent-highlight focus:ring-1 focus:ring-accent rounded-lg mt-6 duration-500"
			>
				Send
			</button>

			{studioInfo?.responseTimePromise && (
				<p className="mt-4 text-sm text-ternary-light">{studioInfo.responseTimePromise}</p>
			)}
		</form>
	);
};
```

### Example 4: Honeypot CSS-hidden utility (D-26)

The Tailwind `.sr-only` utility is `position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0`. That's CSS-hidden — visible to bots that parse styles, invisible to users. Use it OR the inline classes shown above (`absolute left-[-10000px] …`). Either works. **Do NOT use `display: none`** — D-26 explicitly forbids it.

### Example 5: Shop Coming Soon page (SHOP-01, SHOP-02)

```jsx
// src/pages/Shop.jsx — REPLACE existing 17-line stub
import { useState } from 'react';
import SEOHead from '../components/shared/SEOHead';

const encode = (data) =>
	Object.keys(data).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(data[k])).join('&');

const Shop = () => {
	const [email, setEmail] = useState('');
	const [bot, setBot] = useState('');
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = (e) => {
		e.preventDefault();
		fetch('/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: encode({ 'form-name': 'shop-notify', email, 'bot-field': bot }),
		})
			.then(() => setSubmitted(true))
			.catch((err) => console.error(err));
	};

	return (
		<>
			<SEOHead
				title="Shop — coming soon"
				description="Pre-made laser-cut and 3D-printed pieces, ready to take home."
				ogUrl="https://shapesmith.studio/shop"
			/>
			<section className="py-12 sm:py-24 mt-12 sm:mt-24">
				<div className="container mx-auto text-center max-w-xl">
					<h1 className="font-display font-black text-3xl sm:text-4xl text-primary-light mb-6">
						Shop — coming soon
					</h1>
					<p className="text-lg text-ternary-light mb-8">
						Pre-made laser-cut and 3D-printed pieces, ready to take home — coming soon.
					</p>
					{submitted ? (
						<p className="text-lg text-primary-light">Thanks — we'll let you know.</p>
					) : (
						<form onSubmit={handleSubmit}>
							<input type="hidden" name="form-name" value="shop-notify" />
							<div className="absolute left-[-10000px]" aria-hidden="true">
								<input name="bot-field" tabIndex={-1} autoComplete="off"
									value={bot} onChange={(e) => setBot(e.target.value)} />
							</div>
							<input
								type="email"
								name="email"
								required
								placeholder="you@example.com"
								className="w-full max-w-sm px-5 py-2.5 rounded-md mb-4 bg-ternary-dark text-primary-light"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								aria-label="Email"
							/>
							<button
								type="submit"
								className="font-general-medium px-5 py-2.5 text-white bg-accent hover:bg-accent-highlight rounded-md duration-500"
							>
								Notify me when it launches
							</button>
						</form>
					)}
				</div>
			</section>
		</>
	);
};

export default Shop;
```

---

## Cleanup Scope (VIS-05 — verified line counts and import-graph status)

All targets verified by `wc -l` and `rg` import-graph search 2026-05-06.

| File | Lines | Imported by anything? | Action |
|------|-------|------------------------|--------|
| `src/data/projects.js` | 265 | No (Phase 1 already removed `capabilitiesTitle` consumers) | DELETE |
| `src/data/aboutMeData.js` | 10 | Only commented-out import in `AboutMeContext.jsx:3` | DELETE; un-comment can stay commented or be removed in same edit |
| `src/data/materials.js` | 148 | No | DELETE |
| `src/data/singleProjectData.js` | 162 | No | DELETE |
| `src/data/images.js` | 193 | No | DELETE |
| `src/components/contact/contact-form.js` | 114 | No | DELETE |
| `src/components/HireMeModal.jsx` | 229 | No (self-references only) | DELETE |
| `src/components/BackToTop.jsx` | 13 | No (self-references only) | DELETE |
| `src/components/projects/ProjectsFilter.jsx` | 46 | No (self-references only) | DELETE |
| `src/components/projects/ProjectRelatedProjects.jsx` | 29 | No (self-references only) | DELETE |
| `src/components/about/AboutClients.jsx` | 26 | No | DELETE |
| `src/components/about/AboutCounter.jsx` | 41 | No | DELETE |
| `src/utilities/helpers.jsx` | 21 | Self-references only (`isProd`, `getImageUrl`, `getGoogleDriveLink`) | DELETE |

**Verification commands run during this research:**

```bash
$ rg -l "from ['\"].*data/(projects|aboutMeData|materials|singleProjectData|images)['\"]" src/
src/context/AboutMeContext.jsx     # only commented-out import on line 3 — safe to delete
$ rg -l "BackToTop|HireMeModal|ProjectsFilter|ProjectRelatedProjects|AboutClients|AboutCounter|isProd|getImageUrl|getGoogleDriveLink" src/
# All hits are inside the files themselves — none of these symbols are imported elsewhere.
$ rg -l "styled-components" src/
# (no output — no imports remain; safe to remove from package.json)
```

**`useScrollToTop` listener leak fix (folded into VIS-05):**

Current code (`src/hooks/useScrollToTop.jsx`):
- Line 10–15: `useEffect` without `[]` deps → re-runs every render
- Line 32: `window.addEventListener('scroll', scrollToTop)` AT MODULE TOP → another listener that never gets cleaned up

Fix:
1. Add `[]` deps to the `useEffect`
2. Delete line 32 entirely

One-line surgical fix; not a refactor.

**`encode()` helper extraction (recommended, not required):** Both the new `Shop.jsx` and the existing `ContactForm.jsx` have identical `encode()` helpers. Extract to `src/utilities/encodeFormData.jsx`:

```jsx
// src/utilities/encodeFormData.jsx — NEW
const encodeFormData = (data) =>
	Object.keys(data)
		.map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
		.join('&');

export default encodeFormData;
```

Then both components import `import encodeFormData from '../../utilities/encodeFormData';`. Trivial win, fits VIS-05 scope.

---

## Runtime State Inventory

> Phase 2 is a feature/refactor phase, not a rename/migration phase. Runtime state inventory is light:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Sanity dataset `production` — `material.processes` field shape change is the only Sanity-side data migration | OWNER: re-tag existing material docs after publishing the new schema. Documented in §"Sanity Schema Specifications". |
| Live service config | Netlify Forms config — `contact-form` already exists; new `shop-notify` form auto-detected from `public/index.html` at next deploy | None beyond extending `public/index.html`. The deploy itself triggers Netlify's form scan. |
| OS-registered state | None — no OS-level integrations | None — verified by `find . -name '*.plist' -o -name '*.service' -not -path '*/node_modules/*'` returning nothing |
| Secrets/env vars | No new secrets. Sanity remains anonymous read; Netlify Forms requires no secret. The hardcoded `projectId: "qx9kep1e"` in `sanityClient.jsx` stays (per CLAUDE.md / CONTEXT.md deferred to Phase 4) | None |
| Build artifacts | `pnpm-lock.yaml` will gain entries for `@sanity/image-url` and `react-helmet-async`. `build/sitemap.xml` is generated postbuild and gitignored. `node_modules/` regenerated on next install. | None — standard `pnpm install` flow |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node 20 | Build, postbuild script | ✓ (per `.nvmrc`, `netlify.toml`) | 20.x | — |
| pnpm 9 | Install, lifecycle scripts | ✓ (per `package.json#packageManager`) | 9.0.0 | — |
| `@sanity/client@^6` | Existing client + the postbuild sitemap script | ✓ (already in `package.json`) | 6.29.1 | — |
| `@sanity/image-url@^2.1` | New `<SanityImage>` component | NEW — install in Wave 1 | 2.1.1 | — |
| `react-helmet-async@^2.0.5` | New `<SEOHead>` + `<JsonLdLocalBusiness>` | NEW — install in Wave 1 | 2.0.5 | — |
| Sanity Studio access (owner) | Schema migration + content authoring | OWNER-PROVIDED — out of researcher scope | — | If owner cannot apply schemas in time, Phase 2 plans are blocked at Wave 2 (the materials section, the FAQ component, and the print-style grid all depend on owner content) |
| `--openssl-legacy-provider` flag | CRA 5 + webpack 4 + Node 17+ compatibility | ✓ (in `package.json` scripts) | — | — |
| Netlify build environment | Deploy + form detection | ✓ (per `netlify.toml`) | image current | — |

**Missing dependencies with no fallback:** None — all infrastructure is in place from Phase 1.

**Owner-prep blockers (NOT a missing dep, but a parallel non-code dependency):**
- `process` enum schema published in Sanity Studio + two enum docs created
- `material.processes` field migrated + materials re-tagged
- `studio-info` schema published + singleton doc created
- `print-style` schema published
- `faq` schema published
- `laser-style` extended with `turnaround`, `wontMakeScope`, `seo` fields
- `print-style` populated with at least 1–2 starter docs (so `/3d-printing` doesn't render the empty state at launch)

PLAN.md should put a "Sanity Studio prep checkpoint" gate between Wave 1 (schema spec) and Wave 2 (3D printing surface).

---

## Validation Architecture

> `workflow.nyquist_validation` is `false` in `.planning/config.json` — formal Nyquist-mode validation is OFF for this project. Section omitted per spec rule.

**Manual verification checklist for the planner (not formal Nyquist, just a sanity layer):**

| Acceptance | Verify how |
|------------|-----------|
| `/3d-printing` route resolves and renders grid | Open `/3d-printing` in deploy preview |
| `/3d-printing/:slug` resolves for at least one slug | Click into a card from the grid |
| `/styles` still works without regression | Open `/styles` and click into a slug |
| Both services appear with equal weight in nav | Visual inspection at `sm:` and `<sm:` breakpoints |
| `/materials` redirects to `/styles#materials` | Open `/materials` directly; URL changes |
| Materials section renders on each service page | Scroll to `#materials` on each |
| FAQ section renders 5–8 items | Scroll on each service page |
| Contact form pre-fills service from `?service=laser` | Open `/contact?service=laser` and inspect dropdown |
| Contact form pre-fills service from `/3d-printing` referrer | Click "Contact us" on `/3d-printing` and verify dropdown |
| Honeypot is invisible to humans | Tab through form — bot-field shouldn't receive focus |
| `<title>` updates per route | Open dev tools and watch `<head>` on route change |
| `og:image` renders in Twitter Card validator / Slack unfurl | Paste production URL into validators |
| `LocalBusiness` JSON-LD validates in Google Rich Results Test | Paste homepage URL into the test |
| `sitemap.xml` is reachable at `https://shapesmith.studio/sitemap.xml` | curl after deploy |
| `robots.txt` references the sitemap | curl after deploy |
| `/shop` shows Coming Soon page + email field | Open `/shop` |
| Email submission to `/shop` form arrives in Netlify Forms dashboard | Submit and check |
| No half-spruce — all 9 routes consistent | Visual sweep, deploy preview |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-helmet` (the original, by NFL) | `react-helmet-async` | NFL package abandoned mid-2010s; `react-helmet-async` by Steve Taylor is the active fork | NFL fork has known StrictMode incompatibilities; `react-helmet-async` is the modern standard |
| `asset->url` raw Sanity image (full-size original) | `@sanity/image-url` builder + `srcSet` | Sanity image builder GA since 2018; standard since 2020 | Saves 60–90% bandwidth on grid views |
| `react-router-sitemap` libraries for CRA | Custom postbuild Node script | React Router v6 broke many sitemap libs; custom is simpler | Zero new runtime dep; ~40 lines |
| `display: none` honeypot | CSS-hidden honeypot (off-screen + `aria-hidden`) | Bots have learned to skip `display:none` since ~2020 | Higher bot-catch rate without hurting humans |
| Per-component `useEffect` Sanity fetches | `useSanityQuery` hook | Phase 1 — already done | Single point for loading/error/cancellation |
| `class="dark"` set in render-time side effect | `class="dark"` on `<html>` in `index.html` | Phase 1 — already done | No render-time mutation; React-pure |
| `react-helmet-async@^3.0.0` (newest) | `react-helmet-async@^2.0.5` (this phase's pick) | v3 released 2026-03-03; too new for production | Stick with v2 for "ship fast, look legit" |

**Deprecated/outdated:**
- The old `react-helmet` (NFL fork) — abandoned. Don't reach for it.
- `react-stl-viewer`, `node-stl`, `cura-wasm`, `dxf-parser` — all listed as "do not use" by `.planning/research/STACK.md`. Bundle 2 concern, mentioned here for completeness.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The studio's `LocalBusiness` JSON-LD type is correct (vs `ProfessionalService` or another subtype) | §"Standard Stack" Alternatives Considered, §"Code Examples" Example 2 | Low — `LocalBusiness` validates everywhere; `ProfessionalService` would also validate but reads as legal/medical-vertical. Owner can change the `@type` value in Sanity if they prefer a subtype later. |
| A2 | Sanity `slug` field is returned as `{ current: "..." }` object | Pattern 1, SingleServiceContext | Medium — code defensively handles both forms. Plan should add a Wave 1 spike: log the actual shape in dev. |
| A3 | Field naming convention is camelCase | §"Sanity Schema Specifications" | Low — verified by inspection of existing GROQ projections (`listImage`, `detailImages`, `cuttingSpecs`, `preferredMaterials` all camelCase). |
| A4 | Modern crawlers (Googlebot, Bingbot, Twitterbot, LinkedInBot, Facebook, Slack) execute JS in 2026 | Pattern 4 SPA crawler caveat, Pitfall 6 | Medium — Google and Bing definitively do; Twitter/LinkedIn/Facebook/Slack status verified in vendor docs from 2024–2025 but not specifically 2026. Mitigation: static defaults in `public/index.html` cover the worst case. |
| A5 | `react-helmet-async@^2.0.5` is the right pick over v3.0.0 for this phase | §"Standard Stack" + Pitfall 7 | Low — v2 has 2+ years of production track record on React 18; v3 is 2 months old. Pin to ^2.0.5 to allow patches but block v3. |
| A6 | Owner will apply Sanity schema migrations on the timeline of Wave 2 | §"Environment Availability" + D-07 | Medium — if owner is delayed, Wave 2 plans block. Mitigation: D-07 specifies a planning checkpoint between Wave 1 and Wave 2. Plan should include owner sign-off as gate criterion. |
| A7 | `pnpm` runs `postbuild` lifecycle hook automatically after `pnpm build` | §"Architecture Patterns" Pattern 5 | Low — pnpm honors npm lifecycle hooks. Verifiable in dev: `pnpm build && ls build/sitemap.xml`. |
| A8 | The existing CRA build under `--openssl-legacy-provider` accepts `react-helmet-async` and `@sanity/image-url` without webpack errors | §"Standard Stack" version verification | Low — both packages ship CommonJS + ESM; CRA 5 webpack handles both. Verifiable in dev with `pnpm install && pnpm build`. |

**If any of these assumptions break,** PLAN.md must record the deviation and adjust the affected wave's tasks. None of these are showstoppers; all have documented mitigations.

---

## Open Questions (RESOLVED at execution time via Plan 02-01 checkpoint)

Q1 (material.processes shape) is execution-blocking and is resolved by the [CHECKPOINT] task in Plan 02-01 — owner runs `*[_type == "material"][0..2]{processes}` in Sanity Vision and records the outcome in 02-01-SUMMARY.md before Wave 2 progresses. Plan 02-02's MaterialsSection GROQ is then updated to match.

1. **What is the actual current shape of `material.processes` in Sanity Studio?** (RESOLVED via Plan 02-01 checkpoint task)
   - What we know: D-06 commits to the target shape (reference array → process enum). D-07 has a fallback (string array).
   - What's unclear: which form exists today.
   - Recommendation: PLAN.md Wave 1 task 1: the planner produces the schema spec. Wave 1 task 2: the owner verifies in Sanity Vision tool which shape exists today, reports back, and the plan picks the GROQ form. This adds ~10 minutes to Wave 1, prevents Wave 2 from going down a path that doesn't match reality.

2. **Does the studio owner already have content for the new schemas, or are placeholders sufficient?**
   - What we know: D-16 commits to placeholders being acceptable. Owner edits in Sanity post-launch without redeploy.
   - What's unclear: how aggressive the owner wants to be about real content vs placeholders at relaunch.
   - Recommendation: PLAN.md mentions D-16 explicitly and ships placeholders. Owner can override later.

3. **Does the homepage hero use the existing `brand-horizontal-multi-font.png` image, or is there a new asset coming from the owner photography session?**
   - What we know: D-12 says photography is parallel non-code work; relaunch must NOT block on photos.
   - What's unclear: whether the brand wordmark image is sufficient for the hero or whether a new hero image lands during Phase 2.
   - Recommendation: ship with the existing `brand-horizontal-multi-font.png`; if a new asset arrives during Phase 2, it's a one-line `<img>` change in `AppBanner.jsx`.

4. **Is there a clean Rule-of-Three extraction moment for `<Modal>` or `<Gallery>` at N=2 (laser + print)?**
   - What we know: CONTEXT.md "Deferred Ideas" + UI-SPEC §"Component Inventory" both say "only if clean."
   - What's unclear: whether the plan should attempt the extraction or duplicate.
   - Recommendation: per the wrong-abstraction guard (D-04), default to duplicate. Reconsider only if the planner finds an obvious clean shape during Wave 2 implementation. Don't force.

---

## Sources

### Primary (HIGH confidence)
- **Existing codebase (verified by `Read` tool 2026-05-06):**
  - `package.json` — confirms React 18.3.1, CRA 5.0.1, current `--openssl-legacy-provider` flag, Phase-1 `engines: node>=20`, `packageManager: pnpm@9.0.0`
  - `src/hooks/useSanityQuery.jsx` — Phase-1 hook contract (`{ data, loading, error, refetch }` + AbortController)
  - `src/data/services.js` — Phase-1 `SERVICES` array with `print` slot already declared
  - `src/context/ProjectsContext.jsx` — current GROQ projection shape (the basis for the shared projection)
  - `src/components/contact/ContactForm.jsx` — current encoder, current honeypot bug, current button styling, current submit URL
  - `public/index.html` — Phase-1 `class="dark"`, current Netlify hidden-form prerender, current static meta
  - `tailwind.config.js` — palette tokens, container padding scale
  - `netlify.toml` — Phase-1 build pin
- **`pnpm view` registry queries (run 2026-05-06):**
  - `@sanity/image-url@2.1.1` — current; peerDeps `react@^16 || ^17 || ^18 || ^19`
  - `react-helmet-async@2.0.5` — published 2024-05-07; peerDeps `react@^16.6 || ^17 || ^18 || ^19`
  - `react-helmet-async@3.0.0` — published 2026-03-03 (too new for production track record)
- **schema.org reference docs:** [LocalBusiness](https://schema.org/LocalBusiness), [PostalAddress](https://schema.org/PostalAddress), [ProfessionalService](https://schema.org/ProfessionalService) — for the JSON-LD pattern

### Secondary (MEDIUM confidence)
- [Netlify Forms setup docs](https://docs.netlify.com/manage/forms/setup/) — multi-form support, hidden prerender mechanism, `data-netlify` attribute, `name` attribute uniqueness
- [Sanity Image URLs official docs](https://www.sanity.io/docs/apis-and-sdks/image-urls) — `imageUrlBuilder` + `.auto('format')` for AVIF/WebP
- [react-helmet-async PR #260 release notes](https://github.com/staylor/react-helmet-async/pull/260) — v3 release scope (React 19 native head rendering, React 16–18 unchanged)
- WebSearch on "react-helmet-async StrictMode 2026" — v2 known compatible; v3 too new to verify
- WebSearch on "react-router-dom v6 sitemap CRA postbuild" — informed the postbuild-script approach
- `.planning/research/STACK.md`, `.planning/research/PITFALLS.md`, `.planning/research/SUMMARY.md` — already-conducted project research; this phase research builds on it

### Tertiary (LOW confidence — flagged in Assumptions Log)
- 2026 status of Twitter/LinkedIn/Facebook/Slack JS-execution behavior — assumed based on 2024–2025 vendor doc trajectory
- Owner-side Sanity Studio current state — researcher has no read access; assumptions documented

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — both new packages verified against npm registry; peer-deps confirmed; existing stack untouched
- Architecture: HIGH — direct mirror of Phase-1 patterns; Sanity GROQ projection idiom matches existing code; routing pattern matches existing `App.js` shape
- Sanity schemas: MEDIUM — schema syntax is current Sanity Studio v3 idiom; field names match existing convention; researcher cannot directly verify field-name conflicts without Studio access
- SEO patterns: HIGH for the code, MEDIUM for the SPA crawler claim (2026 specific)
- Pitfalls: HIGH — pulled directly from `.planning/research/PITFALLS.md` plus 4 new phase-specific ones derived from CONTEXT.md + codebase verification
- Cleanup scope: HIGH — every line count and import-graph status verified by tool calls in this session

**Research date:** 2026-05-06
**Valid until:** 2026-06-06 (30 days for stable, since stack is locked and owner-prep is the only volatile input)

---

*Research complete. Ready for `/gsd-plan-phase`.*
