# Phase 2: Bundle 1 Relaunch — 3D printing + spruce + content + SEO + shop stub - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the visible relaunch in one window: a new `/3d-printing` service surface mirroring `/styles`, materials moved from a top-level route into per-service in-page sections, a refreshed homepage hero + nav giving both services equal weight, the trust copy and per-page SEO that makes the site feel legitimate to a local hobbyist audience, contact-form pre-fill from the referrer, and a routed `/shop` "Coming Soon" door with email capture. 27 requirements covering SVC-01..05, MAT-01..03, VIS-01..05, SHOP-01..02, CTC-01..04, CNT-01..04, SEO-01..04.

**In scope:** the 27 REQ-XX items exactly as written in `.planning/REQUIREMENTS.md` and the success criteria in `.planning/ROADMAP.md` §Phase 2.

**Out of scope:**
- The auto-pricing quote tool (Bundle 2 / Phase 3) — including `/quote`, file upload, slicer integration, `pricing-rule` schema. Service-page CTAs to a future `/quote` page are NOT added in this phase.
- The real shop catalog and checkout (Bundle 3 / Phase 5) — only the stubbed `/shop` Coming Soon ships here.
- Vite migration (Phase 4) — `--openssl-legacy-provider` flag stays in scripts.
- TypeScript or framework migration (project-wide out-of-scope per `.planning/PROJECT.md` §Out of Scope).
- A real light-mode design pass (committed dark-only in Phase 1; THEME-01 is v2 only).
- Splitting `/materials` into per-service routes — superseded by the in-page section approach.
- Replacing the contact form with a dedicated quote form — Bundle 2 supersedes; only pre-fill + honeypot fix here.
- Slicer-grade pricing or any "quote" language — explicit Bundle 2 boundary.

</domain>

<decisions>
## Implementation Decisions

### Context architecture (architectural deferral from ROADMAP.md)
- **D-01:** Generalized `ServicesContext` parameterized by `serviceKey`, with a parallel `SingleServiceContext` for slug detail pages. One pair of files covers both laser and print services. Decision granted to Claude's discretion under a "lowest risk + Bundle 2 leverage" brief — default generalized unless the planner hits a concrete obstacle in the codebase, in which case fall back to parallel `PrintsContext`/`SinglePrintContext`.
- **D-02:** Migration sequence: copy existing project context files into new service files → wire new `/3d-printing` routes against the new files → repoint existing `/styles` routes to new files → delete `src/context/ProjectsContext.jsx` + `SingleProjectContext.jsx`. Laser routes work uninterrupted throughout.
- **D-03:** Clean rip — no compat shim re-export from old context paths. Phase 1 already replaced the load-bearing `capabilitiesTitle` constant with `SERVICES`; finishing the rename in this phase keeps the context layer one shape, not two-shapes-in-flight.
- **D-04:** Generalize only what's identical (laser ↔ print mirror). When Bundle 3 lands, shop gets its own `ShopContext` — do NOT add `if (service === 'shop')` branches inside `ServicesContext`. Wrong-abstraction trap is research's named pitfall.
- **D-05:** GROQ projection is shared between laser and print queries — the schemas mirror each other, so one projection serves both, parameterized by `_type`.

### `material.processes` schema (Sanity owner-prep)
- **D-06:** Plan against the target shape — `material.processes` becomes a reference array pointing at a new `process` enum doc with values `laser`, `print`. GROQ filter pattern: `*[_type == "material" && "print" in processes[]->key]{...}`. Owner applies the schema change in Sanity Studio per a written spec produced during planning, before MAT-01/MAT-02-related plans execute.
- **D-07:** STATE.md flagged this as owner-prep. The plan must include: (a) a clearly-marked Sanity Studio prep doc/section, (b) a planning checkpoint that confirms the owner has applied the schema migration before MAT plans run. If the owner reports the migration cost is prohibitive (existing material count is large enough that retagging is painful), fall back to free-text string tags `processes: ['laser' | 'print' | 'both']` on each material doc — note this in the plan's deviation log.

### Visual spruce direction
- **D-08:** Layout + composition only. Keep the existing palette (accent `#348bd8`, primary-dark `#291c30`, ternary-dark, `accent-highlight`), keep the GeneralSans + Proxima Nova typography, keep the dark identity. No color or typography churn in this phase. Visual lift comes from hero composition, nav structure, component spacing/rhythm, and the new dual-service framing.
- **D-09:** Token-first sweep. Define the spruce as a diff in `tailwind.config.js` (or a top-level CSS variables block in `src/css/tailwind.css`) BEFORE component work begins. Then sweep every route on a checklist: `/`, `/styles`, `/styles/:slug`, `/3d-printing`, `/3d-printing/:slug`, `/about`, `/contact`, `/shop`, `/404`. Half-spruce (hero refreshed but interior pages left old) is research's named failure mode for this phase.
- **D-10:** Hero structural shape — split-or-stacked dual-service framing. Both services appear with equal visual weight; 50/50 split on desktop, stacked on mobile. Matches VIS-01 + SVC-03 acceptance criteria. The exact composition (split panels vs single composition with dual CTAs) is a planner/UI judgment call within this constraint.
- **D-11:** Photography placeholder strategy — stylized solid-fill cards with a short caption like "3D print example coming soon." Sanity-driven graceful degradation: when the image field is empty, render the placeholder; when populated, render the photo. PROJECT.md commits to this; the placeholder must look intentional (branded), not "broken image."
- **D-12:** Owner photography session is parallel non-code work flagged in STATE.md. The relaunch must NOT block on photos — `/3d-printing` ships with placeholders for any styles that don't have images yet.

### Trust copy & content schemas
- **D-13:** New Sanity singleton `studio-info` holds shared facts: `serviceArea`, `pickupAvailability`, `responseTimePromise`, plus the `LocalBusiness` JSON-LD field bundle (D-21). One doc, owner-edits-once.
- **D-14:** `laser-style` and `print-style` schemas are extended with optional per-service fields: `turnaround` (string, e.g. "3–5 business days"), `wontMakeScope` (portable text, "what we won't make" policy block). Per-service overrides where the answer differs by service; falls back to `studio-info` for shared facts.
- **D-15:** New `faq` Sanity schema: `{ question (string), answer (portable text), service (reference array → process enum, supports laser+print or both), order (number) }`. 5–8 items per service surfaced on each service page. Same schema serves both services; service tag drives filtering.
- **D-16:** Plan ships placeholder copy. Examples: "We typically respond within 1 business day", common-sense FAQ skeletons covering material lead time, file format requirements, max size, pickup-vs-shipping. Owner replaces in Sanity Studio when ready — no app deploy needed and no execution block on owner copy. Acceptance: every Sanity-backed copy field has at minimum a non-empty placeholder string committed via Studio before the relaunch goes live.
- **D-17:** Materials section UX — anchor link from each service hero ("See materials") scrolls to `#materials` lower on the same page. Section lists materials filtered by service tag (laser/print/both via `material.processes`). Existing `MaterialSingle` component is reused. The legacy `/materials` route serves a 301 redirect (or a `<Navigate>` to `/styles#materials`) with a friendly moved notice; no broken link.
- **D-18:** CNT-04 alt text — bind from the existing/extended Sanity image alt field (`asset->altText` or per-image `alt` field). No empty strings, no filename fallbacks. Dual-purpose images on shared materials carry one alt text that works for both services.

### SEO + shop stub
- **D-19:** Per-page SEO via `react-helmet-async` (install in this phase). Hybrid sourcing: hardcoded `<title>` / `<meta description>` / `og:` defaults in route components for static routes (`/`, `/about`, `/contact`, `/404`, `/shop`); Sanity-driven `seo` block (`metaTitle`, `metaDescription`, `ogImage`) on `laser-style`, `print-style`, and `studio-info` docs for content-driven routes (`/styles`, `/styles/:slug`, `/3d-printing`, `/3d-printing/:slug`).
- **D-20:** og:image strategy — single studio-branded fallback image (logo on the dark background, or a single studio shot if owner provides) used for any route without its own image. Per-service override when a Sanity doc has an image. Branded link previews even when content is sparse.
- **D-21:** `LocalBusiness` JSON-LD on the homepage — core local fields, all sourced from `studio-info` so the owner can tune without redeploy: `name`, `description`, `url`, `telephone` (if owner provides), `address` (city/region; precise street optional), `geo` (optional), `sameAs` (social links), `openingHours` or "by appointment" string, `areaServed`, `makesOffer` (services array). Skip review aggregation until reviews exist.
- **D-22:** `sitemap.xml` generation — at build time from a static route list plus dynamic Sanity slugs (laser styles, print styles). Concrete approach (custom `postbuild` script reading from Sanity vs prebuild generation vs a CRA-compatible plugin) is a planner judgment call within this phase. `robots.txt` references the sitemap.
- **D-23:** `/shop` Coming Soon page is lean — heading + 1–2 sentence promise ("Pre-made laser-cut and 3D-printed pieces, ready to take home — coming soon"), single email field, "Notify me when it launches" button. Submitted via a separate Netlify Form named `shop-notify` (NOT the contact form). Confirmation message replaces the form on success. Hidden form declaration added to `public/index.html` for Netlify prerender.

### Contact form pre-fill (CTC-01..04)
- **D-24:** Service pre-fill reads from two sources, in order: (a) `?service=` query string if present, (b) `document.referrer` matched against a known service-URL list, (c) blank otherwise. User can change the value via the form.
- **D-25:** Pre-fill maps to the existing contact-form "service interested in" field. The dropdown options come from `SERVICES` (already in Phase 1 — `contactSubject` field), so adding the print service is data-driven, not a separate UI change.
- **D-26:** Honeypot field uses CSS-hidden (`aria-hidden`, `tabindex="-1"`, off-screen positioning) — NOT `display:none` (some bots skip those). Visible-to-bots, invisible-to-humans.
- **D-27:** Response-time promise (CTC-04) is rendered on the contact page, sourced from `studio-info.responseTimePromise`. Owner can edit without redeploy.
- **D-28:** `public/index.html` Netlify hidden form prerender is updated with the new `service` field name so it's recognized at deploy time. Same pass adds the `shop-notify` form declaration.

### Cleanup scope (VIS-05)
- **D-29:** VIS-05 is the named owner of dead-code purge. In this phase, delete: `src/data/projects.js` (other than already-removed `capabilitiesTitle`), `src/data/aboutMeData.js`, `src/data/materials.js`, `src/data/singleProjectData.js`, `src/data/images.js`, `src/components/contact/contact-form.js`, `src/components/HireMeModal.jsx`, `src/components/BackToTop.jsx`, `src/components/projects/ProjectsFilter.jsx`, `src/components/projects/ProjectRelatedProjects.jsx`, `src/components/about/AboutClients.jsx`, `src/components/about/AboutCounter.jsx` (if template-residue), `src/utilities/helpers.jsx` (`isProd`/`getImageUrl` dead code). Remove `styled-components` from `package.json`. The `useScrollToTop` listener leak fix is also folded in (one-liner: add `[]` deps + remove duplicate module-level listener).
- **D-30:** External link safety polish — add `rel="noopener noreferrer"` to any `target="_blank"` links touched during the spruce sweep, fix the `target="__blank"` typo (CONCERNS.md). Scope-limited: only links touched during the per-route sweep; not a separate audit.

### README + content (SEO-04)
- **D-31:** Replace the CRA boilerplate `README.md` with: project overview (1 paragraph), tech stack (1–2 sentences), quickstart (`pnpm install` / `pnpm start` / `pnpm build` with `--openssl-legacy-provider` note), content-update guide (how owner edits Sanity for studio-info / faq / styles), deploy notes (Netlify), and links to `.planning/PROJECT.md` for deeper context.

### Plan structure hint
- **D-32:** This phase has 27 requirements; planner should structure plans around natural shipping boundaries:
  1. Foundational schema/data (studio-info, faq, print-style schema spec for owner; ServicesContext + SingleServiceContext + clean rip; @sanity/image-url + react-helmet-async install; SEO meta hardcoded defaults).
  2. /3d-printing surface (routes, components, GROQ, materials section per service, /materials redirect).
  3. Visual spruce (token diff, hero refresh, nav refresh, route-sweep checklist).
  4. Trust copy + SEO (CNT, SEO meta on Sanity-driven routes, JSON-LD, sitemap, og:image).
  5. Contact + /shop stub + cleanup (CTC pre-fill + honeypot + Netlify form updates; /shop page + shop-notify form; VIS-05 cleanup; README).
  Each wave SHOULD leave the site in a deployable state — research warns half-spruce kills the relaunch story, so plan boundaries are about wave atomicity, not dribble-deployment.

### Claude's Discretion
- Specific Tailwind token diff content (D-09 leaves the actual delta to the planner — no palette change is committed).
- Hero composition specifics within the dual-service constraint (D-10).
- Sitemap generation approach within CRA constraints (D-22).
- Exact Sanity schema field names where there's no convention conflict (e.g., snake-case vs camelCase for new fields — match existing project conventions).
- Whether the per-route sweep checklist is a literal `.md` file in the phase dir or just a planner-internal artifact.
- All decisions D-01..D-31 may be adjusted by the planner if a concrete obstacle is found in the codebase — flag in PLAN.md deviations.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level requirements & roadmap
- `.planning/PROJECT.md` §Constraints, §Key Decisions, §Out of Scope — tech-stack lock (CRA + React 18 + JS, no TS/Next), dark-only commitment, /shop ships as Coming Soon during spruce, materials-as-section decision, photography placeholder requirement
- `.planning/REQUIREMENTS.md` §Services, §Materials Sections, §Visual Spruce, §Shop Stub, §Contact + Lead Capture, §Content (Local-Customer Trust), §SEO — SVC-01..05, MAT-01..03, VIS-01..05, SHOP-01..02, CTC-01..04, CNT-01..04, SEO-01..04 (27 requirements; do not invent new ones in this phase)
- `.planning/ROADMAP.md` §Phase 2 — goal, success criteria, dependency edges; explicitly notes the ServicesContext-vs-parallel deferral resolved here in D-01
- `.planning/STATE.md` §Accumulated Context — owner-side prep items (material.processes shape, photo session, print-style schema)

### Phase 1 (locked decisions carried forward)
- `.planning/phases/01-foundation-refactor-env-pinning/01-CONTEXT.md` — `useSanityQuery` API, `SERVICES` constant shape (already declares `print` slot), dark-only commitment, `tailwind.config.js` light-token deletion, file-naming conventions
- `.planning/phases/01-foundation-refactor-env-pinning/01-VERIFICATION.md` — Phase 1 acceptance state; what's already in place

### Codebase ground truth
- `.planning/codebase/CONCERNS.md` — file:line locations for every cleanup target in VIS-05 (`isProd`/`getImageUrl`, `useScrollToTop` leak, `BackToTop` stub, `HireMeModal`, `contact-form.js`, `ProjectsFilter` broken UI, `ProjectRelatedProjects` crash, `AboutClients` undefined-context, dead `src/data/*`, `target="__blank"` typo, missing `rel="noopener"`); the existing GROQ projections in `ProjectsContext` that the new `ServicesContext` will mirror
- `.planning/codebase/ARCHITECTURE.md` — current Sanity-fetch idioms, routing layer, layered structure that the spruce sweeps across; route list for the half-spruce checklist
- `.planning/codebase/CONVENTIONS.md` — `.jsx` for components/hooks, `.js` for plain modules; color-token typo (`ternary` not `tertiary` — preserve); Tailwind dark-pair convention (mostly stripped in Phase 1, only existing `dark:` pairs remain)
- `.planning/codebase/STACK.md` — confirms CRA 5 + React 18.3.1 + pnpm 9 + Node 20 (pinned in Phase 1); `--openssl-legacy-provider` retained until Phase 4 Vite migration
- `.planning/codebase/STRUCTURE.md` — file/directory layout the new `src/components/services/*` and per-service contexts will follow
- `.planning/codebase/INTEGRATIONS.md` — Sanity client config, Netlify Forms wiring, image-fetch patterns
- `.planning/codebase/TESTING.md` — Phase 1 smoke-test scaffold; what regression coverage exists

### Research (already conducted)
- `.planning/research/SUMMARY.md` §"The Key Architectural Tension: ServicesContext vs. Parallel Contexts", §"Critical Pitfalls", §"Open Questions" — context-shape trade-off table (D-01 rationale), half-spruce pitfall (D-09 rationale), `material.processes` migration option (D-06), wrong-abstraction warning (D-04), CRA build-rot warning (already addressed Phase 1)
- `.planning/research/STACK.md` — `@sanity/image-url@^2.1` (one new package this phase), `react-helmet-async` SEO recommendation
- `.planning/research/FEATURES.md` — table-stakes feature list for local hobbyist audience (FAQ, won't-make, turnaround, response-time promise)
- `.planning/research/PITFALLS.md` — half-spruce, wrong-abstraction, schema-sprawl pitfalls relevant to this phase
- `.planning/research/ARCHITECTURE.md` — recommended file/component layout for `src/components/services/*`, ServicesContext shape

### Out-of-scope guardrails
- `.planning/PROJECT.md` §"Out of Scope" — TypeScript, Next.js, accounts, blog, configurable shop, light-mode pass, dedicated quote-form replacement (Bundle 2 supersedes), splitting `/materials` into routes
- `.planning/ROADMAP.md` §Phase 3 — auto-pricing quote tool boundary (no `/quote` page, no `pricing-rule` schema, no STL parsing in this phase)
- `.planning/ROADMAP.md` §Phase 4 — Vite migration boundary (`--openssl-legacy-provider` flag stays)
- `.planning/ROADMAP.md` §Phase 5 — real shop boundary (only stub Coming Soon ships here)
- `.planning/REQUIREMENTS.md` §v2 Requirements — THEME-01 light-mode out-of-scope; QTE-11..13 quote enhancements out-of-scope; SHOP-08..09 shop enhancements out-of-scope

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/hooks/useSanityQuery.jsx`** (Phase 1) — wraps `sanityClient.fetch` with `{ data, loading, error, refetch }` + `AbortController` cancellation. Every Sanity fetch in this phase MUST use this hook; no inline `useEffect` + `sanityClient.fetch` patterns are allowed.
- **`src/data/services.js`** (Phase 1) — `SERVICES = [{ key, urlSegment, navLabel, sanityType, contactSubject }]` with `laser` and `print` already declared. The new `/3d-printing` route reads from this; nav reads from this; contact-form pre-fill reads from this.
- **`src/utilities/sanityClient.jsx`** — single configured client (`projectId: "qx9kep1e"`, `dataset: "production"`, `useCdn: true`). Hardcoded — out of scope to environmentalize in this phase (Phase 4 Vite migration is the natural moment for `VITE_*` env vars).
- **`src/components/projects/ProjectGallery.jsx`** (Phase 1, state-driven) — the modal pattern is the `/3d-printing` gallery template. At N=2 (laser + print galleries), consider extracting a shared `<Modal>` or `<Gallery>` component — research flagged this as the natural Rule-of-Three moment, but only if extraction is clean (don't force).
- **`src/materials/MaterialSingle.jsx`** — existing material card. Reused inside the new in-page Materials section per service.
- **`src/components/contact/ContactForm.jsx`** — Netlify form POST already wired, `encode` helper present. Pre-fill logic adds a small `useEffect` reading query string + referrer; no rewrite.
- **`public/index.html`** — Netlify hidden form prerender pattern already established for `contact-form`. New `shop-notify` form follows the same shape; existing `contact-form` declaration extends with the new `service` field.
- **`@tailwindcss/forms`** plugin — already configured; new email field on `/shop` Coming Soon picks up styling automatically.

### Established Patterns
- **Context provider per Sanity content type** — Phase 1 leaves `ProjectsContext` + `SingleProjectContext` in place. This phase generalizes them to `ServicesContext` + `SingleServiceContext` parameterized by `serviceKey` (D-01..D-05). The 2-of-2 pattern justifies the abstraction at N=3 (shop is committed in Bundle 3).
- **GROQ projection per content type** — extend the existing `laser-style` projection one-for-one for `print-style`; the schemas mirror, so a parameterized projection covers both.
- **Tailwind dark-pair classes** — Phase 1 left `dark:` lookups in component files (only the unused `-light` color tokens were stripped from `tailwind.config.js`). New components in this phase MAY follow the existing `dark:` convention; the per-route sweep is the moment to evaluate flattening (deferred to Phase 2's discretion — D-08 commits to no color/typography churn).
- **`React.lazy` + `Suspense`** in `App.js` for page components — new pages (`PrintStyles.jsx`, `PrintStyleSingle.jsx`) follow the same lazy-load pattern.
- **`framer-motion` `AnimatePresence`** — already wraps the App. Hero refresh may use `motion.*` per existing convention (no new motion library).

### Integration Points
- **`src/App.js`** — adds `/3d-printing` and `/3d-printing/:slug` routes (driven by `SERVICES`); adds `/shop` route (currently unrouted; `Shop.jsx` exists as a stub); adds `/materials` redirect to `/styles#materials`.
- **`src/components/shared/AppHeader.jsx`** — nav refresh: peer-equal entries for both services on mobile + desktop; new `/shop` link.
- **`src/data/services.js`** — `print` entry already declared; no edit needed unless the planner finds a missing field.
- **`tailwind.config.js`** — token diff for spruce (D-09); no palette/typography change committed at the context level.
- **`public/index.html`** — Netlify hidden form prerender extended with the `service` field on contact-form and a new `shop-notify` form.
- **`package.json`** — adds `@sanity/image-url@^2.1`, `react-helmet-async@^2`. Removes `styled-components` (VIS-05 dead-dep purge).
- **Sanity Studio** — owner-prep work driven by a written schema spec produced during planning: new `print-style`, `studio-info`, `faq`, `process` enum doc; extension fields on `material.processes`, `laser-style`, `print-style` (per-service trust copy + seo block). The plan must surface these as a discrete owner-prep checkpoint that gates the Sanity-dependent waves.

</code_context>

<specifics>
## Specific Ideas

The user did not surface specific external references or "I want it like X" examples during discussion. The visual brief is "looks legit, ship fast" with a layout-only constraint (no palette/typography churn) — open to standard approaches within that frame. Decisions D-01..D-32 capture the canonical record of what was chosen and why; downstream agents should treat them as locked unless they hit a concrete obstacle in the codebase, in which case PLAN.md must record the deviation.

</specifics>

<deferred>
## Deferred Ideas

Items raised during discussion or surfaced from prior phases' deferred lists that the user did NOT scope into Phase 2 — preserved here so they aren't lost:

- **Reusable `<Modal>` / `<Gallery>` extraction at N=2** — natural moment is when `/3d-printing` gallery lands. Only extract if the abstraction is clean; do NOT force. If skipped, revisit in Phase 3 quote-tool work where another gallery-like surface may appear.
- **Tailwind `dark:` prefix flattening** — possible during the per-route sweep when every component file is touched. Not required by D-08 (committed to "no color/typography churn"); only the dead `-light` color tokens were stripped in Phase 1.
- **Sanity env-driven config** (`projectId`/`dataset` move to env vars) — flagged in `.planning/codebase/CONCERNS.md`. Best paired with Phase 4 Vite migration where `REACT_APP_*` → `VITE_*` is happening anyway.
- **Per-route test coverage beyond smoke** — Phase 1 only ships a smoke test. Per-route render tests, contact-form submit happy-path, Sanity-context tests with mocked client — out of scope here; revisit when stakes warrant (likely alongside Bundle 2 quote tool, where mis-priced submissions are higher-cost).
- **Real H2D photography session** — owner-side work flagged in STATE.md. Not blocking; placeholder strategy (D-11) covers the gap. When photos exist, owner uploads to Sanity; no app deploy needed.
- **Phase 4 Vite migration prep** — any work to ease the future Vite cut (e.g., avoid CRA-specific patterns) is bonus, not required. The planner may flag CRA-specific decisions in this phase as Phase 4 risk items in PLAN.md notes.
- **Customer reviews / testimonials** — research called out testimonials only-if-real-material. Not in current REQ-XX; flagged for v2 if the owner accumulates reviews post-launch.
- **Slicer-grade pricing** (QTE-11) — Bundle 2 v2 work. Mentioned only because Bundle 2 service-page CTAs are explicitly NOT in this phase.
- **Plausible Analytics** — research recommended. Not in REQ-XX; cheap to add later, no Phase 2 dependency.

</deferred>

---

*Phase: 02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub*
*Context gathered: 2026-05-05*
