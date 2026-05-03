# Project Research Summary

**Project:** Shapesmith Studio — web presence relaunch + 3D printing + auto-quote + shop
**Domain:** One-person local maker studio (laser cutting + 3D printing), existing CRA + Sanity + Netlify SPA
**Researched:** 2026-05-02
**Confidence:** HIGH for Bundle 1 (mirrors proven patterns); MEDIUM for Bundle 2 (file-parsing strategy has options); MEDIUM for Bundle 3 (platform undecided by design)

---

## Executive Summary

Shapesmith Studio is a marketing and lead-generation site that needs to look credible before it can drive revenue. The codebase is functional but paused — built on Create React App 5 (officially deprecated Feb 2025), Sanity CMS, Netlify static hosting, and React Router v6. The site currently covers laser cutting only. The owner has a new Bambu H2D 3D printer and wants to launch that service alongside a visual refresh, then add an auto-pricing quote tool, then a pre-made-goods shop. All four research threads agree on the sequencing: trust first, features second.

The single most important finding is that **Bundle 1 carries more scope than its original Active list**. The original list covers the technical surface (new routes, modal fix, dark-theme fix, shop stub, contact pre-fill). Research adds five items that competitor analysis and conversion research agree are table stakes for a local hobbyist audience: FAQ per service, "what we won't make" policy copy, turnaround/pickup/service-area copy, a response-time promise, and per-page SEO meta + LocalBusiness JSON-LD. These are low-effort, high-trust items. **The roadmapper must decide whether these belong in Bundle 1 or a named fast-follow phase — they cannot be silently deferred.** Either way, the spruce is incomplete without them.

The second critical finding is that five foundational refactors belong in Bundle 1 — `useSanityQuery` hook, `ServicesContext` generalization (or parallel contexts), `material.processes` schema reference, `SERVICES` constant replacing `capabilitiesTitle`, and state-driven modal — because each one is cheap now and expensive to retrofit later. If they land in Bundle 1, Bundles 2 and 3 add only domain-specific code with zero rework.

---

## Key Findings

### Recommended Stack

The existing stack (React 18, CRA 5, Tailwind 3, `@sanity/client`, Netlify Forms, `framer-motion`, `react-router-dom` v6) is untouched. Every bundle adds at the margin only.

**Bundle 1 — one new package:**
- `@sanity/image-url@^2.1` — responsive Sanity image URLs; current code ships full-size CDN originals (`asset->url`), which tanks LCP once real photography lands.

**Bundle 2 — file-upload quote (install at Bundle 2 start, not before):**
- `react-dropzone@^15` — drag-and-drop file picker
- `three@^0.169` + `three/examples/jsm/loaders/STLLoader.js` — browser-side STL parse. Do NOT use abandoned standalone packages (`three-stl-loader`, `react-stl-viewer`).
- `@react-three/fiber@^8.18` — CRITICAL PIN: v9 requires React 19; we are on React 18; use `^8` or the build breaks.
- `@react-three/drei@^9.122` — same pin rule; drei v10 requires R3F v9 + React 19.
- `dxf@^5.3` — DXF parsing/SVG render (no three.js loader exists for DXF).
- Netlify Functions (built-in) + `@netlify/blobs` + `resend` — server-side for quote email + optional file storage.
- Do NOT use: `cura-wasm` (deprecated by author), `@toybox-labs/cura-wasm` (maintained fork but heavy 15MB WASM — overkill for ballpark pricing), `node-stl` (3 years stale — write the 50-line volume formula instead), Slant3D API (drop-ship model, not our use case).

**Bundle 3 — shop (platform decided at Bundle 3 discovery):**
- Default: Snipcart v3 (script tag, no npm dep, 2% transaction fee, products in Sanity, no backend).
- Alternative: `@shopify/storefront-api-client@^1` — if catalog grows or owner wants Shopify mobile admin. Do NOT use `shopify-buy` — deprecated Jan 2025, EOL Jan 2026.
- Third option: Stripe Checkout via Netlify Function + Sanity products — only for tiny SKU count (5–20) with Sanity as source of truth.

**Cross-cutting additions:**
- Plausible Analytics: $9/mo, one script tag in `public/index.html`, SPA-aware, no consent banner needed. Better than GA4 (heavy, sampled, requires consent) and Fathom (~50% pricier).
- Environment pins: `.nvmrc` (Node 20 LTS), `netlify.toml` with `NODE_VERSION` + build image pin, commit `pnpm-lock.yaml` (currently untracked per git status).
- Vite migration: schedule between Bundle 1 and Bundle 3 as its own work item. Not before Bundle 1, not during Bundle 3.

### Expected Features

**Must have in Bundle 1 (table stakes — missing = visitor doesn't trust the site is real):**
- `/3d-printing` service surface: grid + slug detail pages mirroring `/styles`
- Materials as in-page sections on each service page (replaces top-level `/materials`)
- Home hero + nav refresh featuring both services equally
- `/shop` routed as Coming Soon (avoid dead link, add email capture)
- Contact form pre-fills service from referrer + honeypot visually hidden
- Modal refactor + dark-theme side-effect fix (code correctness required for relaunch story)
- Turnaround time, pickup availability, service-area copy
- Per-page `<title>`, `<meta description>`, `og:image`, LocalBusiness JSON-LD (local SEO table stake; `react-helmet-async`)

**Strongly recommended to include in Bundle 1 (high value, low effort):**
- FAQ per service (5–8 questions): new `faq` Sanity schema; reduces pre-quote email noise
- "What we won't make" policy copy: 30-minute add, signals professionalism
- Response-time promise on contact page ("We reply within 1 business day")
- Email capture on `/shop` Coming Soon (Netlify Forms piggyback)
- Testimonials: only if owner has real material; empty section is worse than nothing

**Bundle 2 must-haves:**
- File upload with up-front stated constraints, client-side format + size validation, progress bar, file-replacement affordance, `localStorage` persistence of form state
- STL parsed client-side (Three.js STLLoader in-browser); volume math in-browser; only metadata POSTed to Netlify Function
- Price shown as a **range with a visible disclaimer** — never a single number, never the word "quote" — "Estimate, final price subject to owner confirmation"
- Manual confirmation gate: no path from file upload to binding order without owner review
- `pricing-rule` Sanity schema: per-material rates, setup fees, machine-time multipliers (owner-tunable without redeploy)
- reCAPTCHA v3 (server-side token verification) before the higher-value file-upload form

**Bundle 3 must-haves:** Discovery sub-phase first (one week max, platform decision gating); pre-made-goods catalog; checkout via chosen platform; no configurable products (hard out-of-scope).

**Defer permanently:** accounts/auth, blog, customizable products, live chat, newsletter popups, spec-sheet-first language, multi-state tax at launch.

### Architecture Approach

The architecture is progressive layering onto the existing CRA SPA. Bundle 1 cleans the foundation before net-new features land on it. The five foundational refactors are cheap in Bundle 1 and progressively more expensive to retrofit later.

**Components added across bundles:**

1. `src/hooks/useSanityQuery.jsx` — wraps `sanityClient.fetch` with `{ data, loading, error }` + cancellation. Retires inline-`useEffect` fetch idiom. Every subsequent feature uses this.
2. `src/data/services.js` — exports `SERVICES = [{ key, sanityType, urlSegment, navLabel, contactSubject }]`; replaces load-bearing `capabilitiesTitle` constant; drives nav + routing.
3. `src/context/ServicesContext.jsx` + `SingleServiceContext.jsx` — parameterized by `serviceKey`; one set covers both laser and print.
4. `src/components/services/*` — generalized rename of `src/components/projects/*`; adds `MaterialsSection`.
5. `netlify/functions/quote.js` (Bundle 2) — validates submitted estimate, emails owner via Resend. STL never traverses Netlify (client-side parse only).
6. `src/components/shop/*` + platform integration (Bundle 3).

**Sanity schemas:**
- `print-style`: exact mirror of `laser-style` field shape so one GROQ projection covers both.
- `material.processes`: convert to reference array pointing at a new `process` enum doc. GROQ: `*[_type == "material" && "print" in processes[]->key]{...}`.
- `pricing-rule` (Bundle 2): per-material rate constants.
- `product` (Bundle 3): defer detailed schema to discovery sub-phase.

### The Key Architectural Tension: ServicesContext vs. Parallel Contexts

Architecture research recommends one generalized `ServicesContext` parameterized by `serviceKey`. Pitfalls research cites the Rule of Three (Sandi Metz) and argues for free duplication at N=2.

The tension is real. Trade-off table:

| | Parallel (PrintsContext + SinglePrintContext) | Generalized (ServicesContext) |
|---|---|---|
| Risk in Bundle 1 | Low — additive, doesn't touch existing laser screens | Medium — rename-in-place touches existing screens |
| Net new files | +4 files | +2 files (rename 2, delete 2) |
| Rollback | Easy — delete the print contexts | Harder — need to restore project contexts |
| Bundle 2/3 reuse | Worse — quote and shop introduce a third pattern | Better — pattern already proven |
| Rule of Three | Correct at N=2: duplicate | Exception: N=3 (shop) is committed on the roadmap |

**Synthesis recommendation:** Use generalized `ServicesContext`, executed as a safe migration sequence: (1) copy project files to services, (2) add 3D printing routes using new files, (3) repoint laser routes to new files, (4) delete old project files. Laser routes work throughout. The Rule of Three exception is warranted because N=3 (shop) is committed — unlike a speculative refactor.

**Low-risk alternative:** Use parallel contexts (`PrintsContext`) for Bundle 1 if the owner wants the lowest-risk path. Migrate to `ServicesContext` at the start of Bundle 2 when the benefit is concrete. **Roadmapper should surface this choice to the user explicitly.**

### Critical Pitfalls

1. **Auto-quote creates a price expectation that binds the studio** — Show a range, never a single number. Never use "quote" until owner confirms. Visible disclaimer ("Estimate, final price may vary"). 15–25% markup buffer. Every submission goes to owner for review before anything binds. Non-negotiable acceptance criteria for Bundle 2.

2. **CRA build rot breaks silently on a Netlify Node update** — CRA deprecated Feb 2025, no more fixes. The `--openssl-legacy-provider` flag is the current pin. Bundle 1 fix: `.nvmrc` + `netlify.toml` Node pin + committed `pnpm-lock.yaml`. Do NOT `npm audit fix --force`. Plan Vite migration between Bundle 1 and Bundle 3.

3. **Half-spruce: hero refreshed, interior pages left old** — "Looks legit" fails if `/about`, `/contact`, detail pages, footer still show old visual language. Prevention: define the spruce as a token diff in `tailwind.config.js` first; sweep every route on a checklist before merging.

4. **Wrong abstraction from premature /styles ↔ /3d-printing merge** — Whichever context approach is chosen, do not add `serviceType` conditional branches inside shared components. `if (service === '3d-printing')` branches in shared code is the Sandi Metz "wrong abstraction" signal.

5. **File upload is where quote-tool conversion dies** — Validate format and size client-side before any work starts. State constraints before the user touches a file. Progress bar for client-side parse. Build upload UX first in Bundle 2.

---

## Implications for Roadmap

### Suggested Phase Structure (6 phases across 3 bundles)

---

**Phase 1: Foundation Refactors + Environment Pinning**

Rationale: Cheap, high-leverage, non-visual. Unblock every subsequent phase. Address CRA rot before any new feature lands on an unstable base.

Delivers:
- `useSanityQuery` hook
- `src/data/services.js` + `SERVICES` constant (replaces `capabilitiesTitle`)
- `material.processes` converted to reference array (`process` enum doc)
- Dark-theme side-effect moved out of render into `useEffect`
- `ProjectGallery` imperative modal → state-driven
- `.nvmrc` (Node 20 LTS) + `netlify.toml` + `pnpm-lock.yaml` committed
- `App.test.js` replaced with smoke test

Avoids: CRA build rot (Pitfall 2), wrong abstraction from rushed foundation.
Research flag: Standard patterns — skip research phase.

---

**Phase 2: 3D Printing Surface + Visual Spruce**

Rationale: Primary user-facing Bundle 1 deliverable. Lands on top of Phase 1 foundation.

Delivers:
- `ServicesContext` + `SingleServiceContext` (generalized, or parallel if low-risk path chosen — see open question)
- `src/components/services/*` (generalized from projects)
- `/3d-printing` routes (grid + slug detail pages)
- Materials as in-page sections (MaterialsSection component with service filter)
- Home hero + nav refresh (both services equally featured)
- `/shop` routed as Coming Soon (with email capture form)
- Contact form pre-fills service from referrer + `?service=` query param
- Hidden form in `public/index.html` updated with `service` field
- Honeypot visually hidden
- Dead files deleted (`src/components/projects/`, old contexts, `src/data/projects.js`)
- `@sanity/image-url` installed; `<SanityImage>` with `srcSet` + `loading="lazy"`
- `styled-components` removed from `package.json`

Avoids: Half-spruce (Pitfall 4), schema sprawl (Pitfall 8).
Research flag: Standard patterns — existing `/styles` codebase is the template.

---

**Phase 3: Content + SEO ("actually looks legit" phase)**

**ROADMAP DECISION REQUIRED:** This phase contains items not in PROJECT.md's original Active list. The roadmapper must confirm with the user whether these belong in Bundle 1 alongside Phase 2 (strongly recommended) or as a named fast-follow phase before Bundle 2 starts. Do not silently defer.

Delivers:
- Per-page `<title>`, `<meta description>`, `og:title`, `og:image`, `og:url` via `react-helmet-async`
- Schema.org `LocalBusiness` JSON-LD on homepage
- `sitemap.xml` + `robots.txt` generated at build
- FAQ per service (5–8 questions; new `faq` Sanity schema)
- "What we won't make" policy copy on service pages
- Turnaround time + pickup availability + service-area copy (Sanity field)
- Response-time promise on contact page
- Alt text bound from Sanity (field exists but is unused in `AboutMeBio.jsx`)
- `/materials` 301 redirect to laser materials anchor
- README updated (currently CRA boilerplate)

Avoids: Local SEO miss (Pitfall 9), half-spruce (Pitfall 4).
Research flag: Copy decisions are owner-driven. Flag photo session as parallel non-code dependency.

---

**Phase 4: Auto-Pricing Quote Tool (Bundle 2)**

Rationale: Depends on `useSanityQuery` + `ServicesContext` from Phase 1. Service pages from Phase 2 are the entry points. Site must look credible (Phase 3) before quote tool drives traffic.

Delivers:
- `netlify.toml` updated with `[functions]` directory
- `netlify/functions/quote.js` — validates estimate, emails owner via Resend
- `src/utilities/stl.js` — STL volume math using Three.js STLLoader in-browser
- `src/utilities/pricing.js` — rate × volume × material density → price range
- `src/components/quote/*` — FileDropzone, MaterialPicker, PriceDisplay
- `src/pages/Quote.jsx` + `QuoteResult.jsx`
- `pricing-rule` Sanity schema (owner adds rate constants)
- reCAPTCHA v3 with server-side token verification
- SVG sanitization via DOMPurify before any user-uploaded SVG touches the DOM
- Quote CTA added to `/3d-printing` and `/styles`

Uses: `react-dropzone@^15`, `three@^0.169`, `@react-three/fiber@^8.18`, `@react-three/drei@^9.122`, `dxf@^5.3`

Avoids: Price-divergence-binds-studio (Pitfall 1 — range + disclaimer + manual gate are acceptance criteria), file-upload-conversion-death (Pitfall 6), file-upload-security (Pitfall 7 — DOMPurify + magic-byte whitelist + memory-bounded STL parse).
Research flag: Needs `/gsd-research-phase`. Two open questions must resolve before planning (see below).

---

**Phase 5: Vite Migration (between Bundle 2 and Bundle 3)**

Rationale: CRA is deprecated. Shop product pages need to be indexable. Vite is the lowest-friction exit — mostly env-var prefix changes (`REACT_APP_` → `VITE_`), entry HTML diff. Doing migration + new revenue feature in the same window is a known failure mode.

Delivers: Vite-based build (still static SPA, just a healthy build tool). Observable behavior identical to users.
Avoids: CRA rot cascading into Bundle 3 (Pitfall 2), shop product pages not indexing (Pitfall 10).
Research flag: Well-documented migration — likely skip research phase.

---

**Phase 6: Pre-Made Goods Shop (Bundle 3)**

Rationale: Depends on `ServicesContext` pattern + `material` service tagging from Phase 1–2. Platform decision must be made first.

Delivers:
- One-week discovery sub-phase: SKU count, platform decision (Snipcart default), tax/shipping boundary
- `product` Sanity schema (finalized in discovery)
- `src/components/shop/*` — ProductGrid, ProductCard, ProductDetail, cart UI (shape per platform)
- `src/pages/Shop.jsx` (real) + `ShopProductSingle.jsx`
- Checkout integration per chosen platform

Avoids: Shop-platform-paralysis (Pitfall 10 — hard-bounded discovery sub-phase), client-computed prices trusted by server.
Research flag: Needs `/gsd-research-phase` for discovery sub-phase.

---

### Phase Ordering Rationale

- Phase 1 before Phase 2: foundation refactors are non-visual, low-risk; spruce PRs don't carry hidden complexity.
- Phase 2 before Phase 3: service routes must exist before SEO meta and FAQ can land in them.
- Phase 3 before Bundle 2: site must look credible before a quote tool drives traffic. A quote tool on a half-spruced site is counterproductive.
- Phase 4 after Phases 1–3: quote tool's service pages, `useSanityQuery`, and `ServicesContext` are all prerequisites.
- Phase 5 after Bundle 2, before Bundle 3: migration + new revenue feature in the same window is a known failure mode; shop product pages benefit from a healthy build tool.
- Phase 6 last: depends on Phase 1–2 patterns and benefits from Phase 5 foundation.

### Research Flags

Needs `/gsd-research-phase` during planning:
- Phase 4 (Bundle 2): file-parsing strategy depends on expected file size range; pricing formula calibration needs owner input on actual job history.
- Phase 6 (Bundle 3): platform decision sub-phase.

Standard patterns (skip research phase):
- Phase 1: hook pattern, env pinning, modal refactor — all well-documented.
- Phase 2: direct mirror of existing `/styles` codebase.
- Phase 3: react-helmet-async + JSON-LD + Sanity copy fields — standard additions.
- Phase 5: CRA-to-Vite — dozens of guides, well-documented.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All major technology choices verified against official npm versions and docs. React 18 / R3F v8 / drei v9 pin confirmed critical. |
| Features | HIGH | Table-stakes set and anti-features converge across 15+ competitor sites + lead-form conversion research. B2 quote tool internals MEDIUM. |
| Architecture | HIGH for B1 | Direct mirror of existing code. MEDIUM for B2/3 (forward-looking). ServicesContext vs. parallel contexts is a judgment call. |
| Pitfalls | MEDIUM-HIGH | Specific items verified against codebase + official docs. Pricing divergence risk is inference from industry sources. |

**Overall confidence:** HIGH for Bundle 1 scope and ordering. MEDIUM for Bundle 2 (two open questions below). MEDIUM for Bundle 3 (platform deferred by design).

### Open Questions (user input needed before planning)

1. **File-parsing strategy for Bundle 2:** Client-side parse + direct POST is simpler if typical STL files are under 6 MB (hobbyist keychains/small prints). Pre-signed Netlify Blobs flow is needed if larger mechanical models are expected. The owner should characterize their expected customer file sizes before Bundle 2 planning begins.

2. **Shop platform for Bundle 3:** Correctly deferred. Default is Snipcart. Must be confirmed at Bundle 3 discovery against actual SKU count and operations preferences.

3. **Current `material.processes` field shape:** Architecture research cannot verify without Sanity Studio access whether `processes` is currently free-text strings or already a reference. Owner should check in Sanity Studio before Phase 1 planning. If free-text, migration to reference docs requires owner to retag existing material documents.

4. **`useThemeSwitcher` fate:** Two clean options only: (a) remove entirely + strip dead `dark:` variants (commit to dark-only, no user-facing change); (b) revive with a real light-mode design pass (significant scope). A third state — half-dead hook left in place — is explicitly not acceptable per pitfalls research. **User must decide before Phase 2 ships.**

5. **Slicer accuracy vs. disclaimer-only for Bundle 2:** All research recommends shipping the ballpark with visible disclaimer + range display + manual confirmation. If the owner wants better accuracy later, run Cura-Engine in a Netlify Background Function (separate future feature). User should confirm this framing matches their comfort level with variance.

---

## Sources

### Primary (HIGH confidence)
- Official npm registries + `npm view` — R3F, drei, three, @sanity/image-url, react-dropzone version verification
- [Netlify Functions docs](https://docs.netlify.com/build/functions/overview/) — payload limits, timeouts
- [Netlify Background Functions docs](https://docs.netlify.com/build/functions/background-functions/) — 202 immediate, no result delivery
- [Sanity GROQ specifications](https://www.sanity.io/docs/specifications/groq-operators) — reference dereferencing, `in` membership
- [Three.js STLLoader](https://threejs.org/docs/pages/STLLoader.html) — browser-side parsing
- [Shopify JS Buy SDK deprecation](https://shopify.dev/changelog/js-buy-sdk-deprecation-notice) — Jan 2025 deprecated, Jan 2026 EOL
- [Snipcart installation + products docs](https://docs.snipcart.com/v3/setup/installation)
- [CRA deprecation — React team](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)
- `.planning/PROJECT.md` + `.planning/codebase/*` — existing codebase ground truth

### Secondary (MEDIUM confidence)
- 15+ competitor service sites (SendCutSend, Champion 3D, 3DTomorrow, Makelab, Ponoko, Xometry, Shapeways) — table-stakes feature analysis
- [The Wrong Abstraction — Sandi Metz](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction) — Rule of Three basis
- [Steganographic attacks on 3D printing files — ACM](https://dl.acm.org/doi/fullHtml/10.1145/3471621.3471843) — file security
- [File uploader UX best practices — Uploadcare](https://uploadcare.com/blog/file-uploader-ux-best-practices/)
- [Snipcart vs Stripe comparison](https://snipcart.com/blog/stripe-checkout-form-integration-vs-snipcart) — vendor-authored but pricing facts verifiable
- [Plausible vs Fathom vs GA4 2026](https://theboom.ca/blog/website-analytics-ga4-alternatives-2026/)

### Tertiary (LOW confidence — needs owner validation)
- Pricing formula calibration: every shop calibrates differently; rate constants must be owner-configurable Sanity/env fields
- Turnaround time specifics: owner knowledge, not researchable

---
*Research completed: 2026-05-02*
*Ready for roadmap: yes*
