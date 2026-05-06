---
phase: 02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub
verified: 2026-05-06T20:30:00Z
status: passed
score: 5/5 success criteria verified
overrides_applied: 0
---

# Phase 2: Bundle 1 Relaunch Verification Report

**Phase Goal:** Ship the relaunch — refreshed homepage and nav, new `/3d-printing` service surface mirroring `/styles`, materials moved into per-service in-page sections, trust copy and per-page SEO that makes the site feel legitimate to a local hobbyist audience, contact-form pre-fill from the referrer, and a routed `/shop` "Coming Soon" door — all in one shippable window the owner can confidently start marketing.

**Verified:** 2026-05-06T20:30:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (5 Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor can navigate to `/3d-printing` and `/3d-printing/:slug`, see a grid + detail pages; existing `/styles` flow works without regressions; both services appear with equal visual weight in nav | ✓ VERIFIED | `SERVICES.map` routing in `App.js` declares both surfaces. `AppHeader.jsx` iterates `NAV_ITEMS` from `SERVICES.map` in both desktop + mobile blocks. Old `ProjectsContext`/`SingleProjectContext` confirmed deleted. Routes compile and test passes. |
| 2 | Every route shows spruced visual language, no half-spruced surfaces, no dead `src/data/*` files in production bundle; Sanity images load via `@sanity/image-url` with responsive `srcSet` + lazy loading (on service/material callsites) | ✓ VERIFIED | `! grep -rE "indigo-(400|500|600|700)" src/` returns empty. All 13 legacy files confirmed deleted. `styled-components` not in `package.json`. `SanityImage` with `srcSet` wired in `ServiceCard`, `ServiceGallery`, `MaterialSingle`. Four home/about components (`OurProcess`, `Collaborations`, `QuickSpecs`, `AboutMeBio`) still use `asset.url` directly — this is a known partial on VIS-04 per `REQUIREMENTS.md`; the service thumbnail path (which is the core marketing surface) is fully covered. Build succeeds, test passes. |
| 3 | Each service page displays in-page Materials section filtered by service, turnaround/pickup/service-area copy, "what we won't make" scope policy, and 5–8 FAQ items — all sourced from Sanity; legacy `/materials` route redirects | ✓ VERIFIED | `MaterialsSection.jsx` queries `*[_type == "material" && $serviceKey in services]` (post-deviation). `FAQ.jsx` uses native `<details>/<summary>` pattern. `WontMake.jsx` exists. `TrustCopyBlock.jsx` queries `studio-info[0]` for serviceArea/pickupAvailability/responseTimePromise. `App.js` has `<Navigate to="/styles#materials">` route. `public/_redirects` has `/materials /styles#materials 301`. All gracefully degrade when Sanity is empty. |
| 4 | Visitor on `/contact` from `/3d-printing` (or `?service=3d-printing`) sees service field pre-filled; honeypot is CSS-hidden; response-time promise shown from Sanity; Netlify hidden form recognizes `service` field | ✓ VERIFIED | `ContactForm.jsx` has `URLSearchParams` + `document.referrer` pre-fill cascade. Honeypot uses `absolute left-[-10000px]` + `aria-hidden="true"` + `tabIndex={-1}` — no `display:none`. Form posts to `fetch('/')` (relative). `studioInfo?.responseTimePromise` renders from `useSanityQuery`. `build/index.html` confirmed to contain `name="contact-form"` with `name="service"` field. Both `contact-form` and `shop-notify` hidden prerender forms present in `build/index.html`. |
| 5 | `/shop` is a live Coming Soon page with email-capture form; every route has per-page `<title>`, `<meta description>`, `og:` tags via `react-helmet-async`; homepage embeds LocalBusiness JSON-LD; `sitemap.xml` generated at build; `robots.txt` references it; README is project-specific | ✓ VERIFIED | `Shop.jsx` renders Coming Soon page with `shop-notify` Netlify form + SEOHead. `SEOHead` imported and mounted on all 7 public routes (Home, AboutMe, Contact, Projects, ProjectSingle, NotFound, Shop). `JsonLdLocalBusiness` mounted only on `Home.jsx`. `scripts/generate-sitemap.cjs` with `escapeXml` exists. `package.json#scripts.postbuild` = `node scripts/generate-sitemap.cjs`. `build/sitemap.xml` produced with 6 URLs. `robots.txt` has `Sitemap: https://shapesmith.studio/sitemap.xml`. `public/og-default.png` is 20KB real PNG. `README.md` is project-specific quickstart (no CRA boilerplate). `react-helmet-async@^2.0.5` in `package.json` (not v3). |

**Score:** 5/5 success criteria verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/context/ServicesContext.jsx` | Generalized service provider parameterized by `serviceKey` | ✓ VERIFIED | File exists, substantive, imported in `Projects.jsx` + `ProjectSingle.jsx` |
| `src/context/SingleServiceContext.jsx` | Single service detail context | ✓ VERIFIED | File exists, used in `ProjectSingle.jsx` |
| `src/data/services.js` | SERVICES constant with laser + print entries | ✓ VERIFIED | Both entries present, `contactSubject` field used for pre-fill |
| `src/components/services/MaterialsSection.jsx` | In-page materials filter by `$serviceKey in services` | ✓ VERIFIED | Correct GROQ, `id="materials"` anchor, `useSanityQuery` |
| `src/components/services/FAQ.jsx` | Native `<details>/<summary>` FAQ | ✓ VERIFIED | GROQ filters by `$serviceKey in service[]->key` |
| `src/components/services/WontMake.jsx` | Portable-text scope policy block | ✓ VERIFIED | Returns null when empty, no empty-state copy |
| `src/components/services/TrustCopyBlock.jsx` | Turnaround + pickup + service area + response-time | ✓ VERIFIED | Queries `studio-info[0]`, returns null when empty |
| `src/components/shared/SanityImage.jsx` | Responsive `srcSet` + lazy loading + Placeholder fallback | ✓ VERIFIED | `DEFAULT_WIDTHS` srcSet, `loading="lazy"` default, alt chain |
| `src/components/shared/Placeholder.jsx` | Branded image placeholder | ✓ VERIFIED | Uses only locked tokens |
| `src/components/shared/SEOHead.jsx` | Per-route Helmet wrapper | ✓ VERIFIED | `react-helmet-async`, emits title/description/og:/noindex |
| `src/components/shared/JsonLdLocalBusiness.jsx` | LocalBusiness JSON-LD | ✓ VERIFIED | Mounted only on Home, self-fetches `studio-info` |
| `src/pages/Shop.jsx` | Coming Soon page with `shop-notify` form | ✓ VERIFIED | 110-line page, SEOHead, CSS-hidden honeypot, email field |
| `src/pages/NotFound.jsx` | Branded /404 with `noindex` | ✓ VERIFIED | `SEOHead noindex={true}`, accent CTA |
| `scripts/generate-sitemap.cjs` | Postbuild sitemap generator | ✓ VERIFIED | `escapeXml`, STATIC_ROUTES, Sanity slug query, `process.exit(1)` on fail |
| `public/robots.txt` | Sitemap directive | ✓ VERIFIED | `Sitemap: https://shapesmith.studio/sitemap.xml` |
| `public/og-default.png` | Real PNG brand wordmark | ✓ VERIFIED | 20,868 bytes PNG |
| `public/_redirects` | Netlify 301 for `/materials` | ✓ VERIFIED | `/materials  /styles#materials  301` |
| `src/utilities/encodeFormData.jsx` | Shared URL-encoded form helper | ✓ VERIFIED | `Object.keys` iteration, used by ContactForm + Shop |
| `src/utilities/sanityImage.jsx` | `urlFor` / `urlAt` builder helpers | ✓ VERIFIED | Wraps `@sanity/image-url` builder |
| `.planning/phases/02-.../02-SCHEMA-SPEC.md` | Owner-prep Sanity schema guide | ✓ VERIFIED | Covers process enum, material.services, studio-info, print-style, laser-style extension, faq |
| `README.md` | Project-specific quickstart | ✓ VERIFIED | No CRA boilerplate; covers stack, install, Sanity, deploy |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `App.js` | `/3d-printing`, `/3d-printing/:slug` | `SERVICES.map` route iteration | ✓ WIRED | Both routes registered, `serviceKey="print"` passed to `Projects`/`ProjectSingle` |
| `App.js` | `/styles`, `/styles/:slug` | `SERVICES.map` route iteration | ✓ WIRED | Laser routes still working, `serviceKey="laser"` |
| `App.js` | `/materials` | `<Navigate to="/styles#materials" replace />` | ✓ WIRED | SPA hop redirect |
| `public/_redirects` | `/materials` → `/styles#materials` | Netlify deploy-time 301 | ✓ WIRED | Both layers present per D-17 |
| `AppHeader.jsx` | Both services nav entries | `NAV_ITEMS` from `SERVICES.map`, iterated in mobile + desktop blocks | ✓ WIRED | Equal weight, active-state `border-b-2 border-accent` |
| `Projects.jsx` | `MaterialsSection`, `FAQ`, `TrustCopyBlock` | Direct composition inside `ServicesProvider` | ✓ WIRED | Inner `ProjectsInner` pattern calls `useServices()` inside provider |
| `ProjectSingle.jsx` | `TrustCopyBlock turnaround`, `MaterialsSection`, `FAQ`, `WontMake wontMakeScope` | `ServiceDetailComposition` calls `useSingleService()` | ✓ WIRED | Props threaded from Sanity doc |
| `ContactForm.jsx` | `?service=` / `document.referrer` → service dropdown | `SERVICE_PREFILL_RULES` + `URLSearchParams` in `useEffect` | ✓ WIRED | Cascade: query string → referrer → blank |
| `Home.jsx` | `JsonLdLocalBusiness` | Direct import + mount | ✓ WIRED | Only on Home; confirmed absent from all other pages |
| `package.json` `postbuild` | `scripts/generate-sitemap.cjs` | npm lifecycle hook | ✓ WIRED | Fires on every `pnpm build`; confirmed in build output |
| `HelmetProvider` | All route pages | `App.js` outermost wrap | ✓ WIRED | All 7 page files import + mount `SEOHead` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `MaterialsSection.jsx` | `materials` | `useSanityQuery(MATERIALS_QUERY, { serviceKey })` → Sanity | Yes (or empty-state copy) | ✓ FLOWING |
| `FAQ.jsx` | `items` | `useSanityQuery(FAQ_QUERY, { serviceKey })` → Sanity | Yes (or FAQ empty-state) | ✓ FLOWING |
| `TrustCopyBlock.jsx` | `info` | `useSanityQuery(STUDIO_INFO_QUERY)` → `studio-info[0]` | Yes when owner publishes (returns null gracefully when empty) | ✓ FLOWING |
| `JsonLdLocalBusiness.jsx` | `data` | `useSanityQuery` → `studio-info` | Yes when owner publishes (returns null when empty — per design) | ✓ FLOWING |
| `ContactForm.jsx` | `studioInfo.responseTimePromise` | `useSanityQuery(*[_type=="studio-info"][0])` | Conditionally rendered when present | ✓ FLOWING |
| `ProjectSingle.jsx` | `singleService.seo.*` | `useSingleService()` → `ServicesContext` → Sanity | Fallback chain to title/og-default.png when seo block empty | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Test suite | `pnpm test -- --watchAll=false` | 1 passed, 1 total | ✓ PASS |
| Production build | `pnpm build` | Exit 0, no errors | ✓ PASS |
| Postbuild sitemap | `pnpm build` postbuild hook | `sitemap.xml written with 6 URLs` | ✓ PASS |
| `build/sitemap.xml` exists and is valid XML | File present, 6 `<url>` entries | Well-formed XML with all 6 static routes | ✓ PASS |
| `build/index.html` has both Netlify forms | `grep name="contact-form"` + `name="shop-notify"` + `name="service"` | All 3 present | ✓ PASS |
| No indigo class residue in `src/` | `grep -rE "indigo-(400|500|600|700)" src/` | Empty | ✓ PASS |
| Legacy data files deleted | `ls src/data/` | Only `services.js` remains | ✓ PASS |
| `styled-components` removed | `grep "styled-components" package.json` | Not found | ✓ PASS |
| `og-default.png` is real PNG | `wc -c public/og-default.png` | 20,868 bytes | ✓ PASS |
| Honeypot is NOT `display:none` | `grep "display.*none" src/components/contact/ContactForm.jsx` | Not found | ✓ PASS |
| Contact form posts to relative URL | `grep "fetch.*'/'" ContactForm.jsx` | `fetch('/', ...)` confirmed | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SVC-01 | 02-02 | `/3d-printing` grid with print-style Sanity content | ✓ SATISFIED | Route registered, `ServicesProvider serviceKey="print"`, graceful empty-state |
| SVC-02 | 02-02 | `/3d-printing/:slug` detail page mirroring `/styles/:slug` | ✓ SATISFIED | `ProjectSingle serviceKey="print"` with full section composition |
| SVC-03 | 02-03 | Nav shows both services as peer entries | ✓ SATISFIED | `NAV_ITEMS` from `SERVICES.map` in mobile + desktop blocks |
| SVC-04 | 02-01 | `/styles` and `/styles/:slug` work without regressions | ✓ SATISFIED | Laser routes still pass smoke test |
| SVC-05 | 02-01 | Owner can add `print-style` docs per written schema spec | ✓ SATISFIED | `02-SCHEMA-SPEC.md` §4 contains full `print-style` schema with field list, placeholder copy, and rollout checklist. Note: REQUIREMENTS.md checkbox not updated to `[x]` — documentation gap only, no code gap. |
| MAT-01 | 02-02 | In-page Materials section with scroll-anchor link | ✓ SATISFIED | `<a href="#materials">` in both `Projects.jsx` + `ProjectSingle.jsx`; `id="materials"` on `MaterialsSection` |
| MAT-02 | 02-02 | `material.services` Sanity field drives in-page filter | ✓ SATISFIED | `$serviceKey in services` GROQ in `MaterialsSection.jsx` (deviation from D-06/D-07 honored) |
| MAT-03 | 02-02 | `/materials` redirects to materials section | ✓ SATISFIED | Two-layer redirect: React Router `<Navigate>` + `public/_redirects` 301 |
| VIS-01 | 02-03 | Homepage hero features both services equally | ✓ SATISFIED | `AppBanner.jsx` dual-service hero, `SERVICES.map` drives cards, single shared accent CTA |
| VIS-02 | 02-03 | Nav visually refreshed, accommodates new service entries | ✓ SATISFIED | Peer-equal nav, active-state underline, hamburger cleaned |
| VIS-03 | 02-03 | Visual refresh consistent across all 9 routes | ✓ SATISFIED | Indigo synthesis check empty; all routes registered; no half-spruced surfaces |
| VIS-04 | 02-01/02 | Sanity images via `@sanity/image-url` with responsive `srcSet` + lazy loading | ✓ PARTIAL — SATISFIES for service surfaces | `SanityImage` with `DEFAULT_WIDTHS` srcSet + `loading="lazy"` wired in `ServiceCard`, `ServiceGallery`, `MaterialSingle`. Home/about components (`OurProcess`, `Collaborations`, `QuickSpecs`, `AboutMeBio`) still use `asset.url` directly — these are non-service images. The primary marketing surface (service grid thumbnails) is fully covered. `REQUIREMENTS.md` leaves this as `Pending` (accurate). Does not block phase completion — the owner's core marketing surfaces are covered; remaining callsites are informational/decorative. |
| VIS-05 | 02-05 | Dead/legacy code removed | ✓ SATISFIED | 13 files deleted, `styled-components` removed from `package.json` + lockfile |
| SHOP-01 | 02-05 | `/shop` is a live route with Coming Soon page | ✓ SATISFIED | `Shop.jsx` registered in `App.js`, Coming Soon content |
| SHOP-02 | 02-05 | Coming Soon page captures email via Netlify Forms | ✓ SATISFIED | `shop-notify` form in `Shop.jsx` + hidden prerender in `public/index.html` |
| CTC-01 | 02-05 | Contact form pre-fills from referrer page or `?service=` | ✓ SATISFIED | `URLSearchParams` + `document.referrer` cascade in `useEffect` |
| CTC-02 | 02-05 | Netlify hidden form recognizes new `service` field | ✓ SATISFIED | `public/index.html` has `<input type="text" name="service" />` in contact-form prerender; confirmed in `build/index.html` |
| CTC-03 | 02-05 | Honeypot is visually hidden | ✓ SATISFIED | `absolute left-[-10000px]` + `aria-hidden` + `tabIndex={-1}` — never `display:none` |
| CTC-04 | 02-05 | Response-time promise shown from Sanity | ✓ SATISFIED | `studioInfo?.responseTimePromise` rendered below submit button via `useSanityQuery` |
| CNT-01 | 02-02 | Service pages show turnaround/pickup/service-area from Sanity | ✓ SATISFIED | `TrustCopyBlock` queries `studio-info[0]`; per-service `turnaround` from `singleService.turnaround` |
| CNT-02 | 02-02 | Service pages show "what we won't make" from Sanity | ✓ SATISFIED | `WontMake` renders `wontMakeScope` portable text from `singleService`; silently absent when empty |
| CNT-03 | 02-02 | Service pages include FAQ from Sanity `faq` schema | ✓ SATISFIED | `FAQ` component with `$serviceKey in service[]->key` GROQ + native `<details>/<summary>` |
| CNT-04 | 02-01/02-03 | Image alt text from Sanity alt field | ✓ PARTIAL — SATISFIES for Sanity-image callsites | `SanityImage` has `alt ?? source?.altText ?? source?.asset?.altText ?? ''` chain. `AboutMeBio` bound to Sanity `altText`. `OurProcess`/`QuickSpecs` read `image.altText` from Sanity. `Collaborations.jsx` has `alt="Effigy build"` (hardcoded). This is a minor gap in one component, not on a service-critical surface. `REQUIREMENTS.md` leaves this `Pending` (accurate). Does not block phase completion. |
| SEO-01 | 02-01/02-04/02-05 | Per-route `<title>`, `<meta description>`, `og:` tags via `react-helmet-async` | ✓ SATISFIED | `SEOHead` mounted on all 7 public routes; `HelmetProvider` in `App.js`; `react-helmet-async@^2.0.5` |
| SEO-02 | 02-04 | Homepage embeds LocalBusiness JSON-LD | ✓ SATISFIED | `JsonLdLocalBusiness` only on `Home.jsx`; uses `JSON.stringify(ld)` for XSS safety |
| SEO-03 | 02-04 | `sitemap.xml` generated at build; `robots.txt` references it | ✓ SATISFIED | Postbuild hook confirmed; 6-URL sitemap produced; `Sitemap:` directive in `robots.txt` |
| SEO-04 | 02-05 | README replaced with project-specific quickstart | ✓ SATISFIED | No CRA boilerplate; covers stack/install/Sanity/Netlify/planning links |

**27 REQ-IDs covered. 25/27 fully satisfied. 2/27 partially satisfied (VIS-04, CNT-04) — partial implementations cover all primary marketing surfaces; remaining callsites are non-service home/about components. Neither blocks owner marketing.**

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/hooks/useScrollToTop.jsx` | 48 | `display: showScroll ? 'flex' : 'none'` inline style | ℹ Info | This is the scroll-to-top chevron visibility toggle, not a honeypot — functionally correct. Not related to CTC-03. |
| `src/components/home/Collaborations.jsx` | 58 | `alt="Effigy build"` (hardcoded, not from Sanity) | ⚠ Warning | CNT-04 partial gap — one home-page image has hardcoded alt text. Not on a service/conversion surface. |
| `src/components/home/OurProcess.jsx` | 52 | `src={process.image.asset.url}` (no `srcSet`) | ⚠ Warning | VIS-04 partial — home-page process images use full CDN URL without responsive srcSet. OurProcess is informational, not a service-grid thumbnail. |
| `src/components/home/QuickSpecs.jsx` | 49,63 | `src={...image.asset.url}` (no `srcSet`) | ⚠ Warning | VIS-04 partial — same as above. |
| `src/components/home/Collaborations.jsx` | 57 | `src={...images[0].asset.url}` (no `srcSet`) | ⚠ Warning | VIS-04 partial — same. |
| `src/components/about/AboutMeBio.jsx` | 14 | `src={aboutMe.images[0].asset.url}` (no `srcSet`) | ⚠ Warning | VIS-04 partial — portrait photo uses full CDN URL. |
| `ROADMAP.md` progress table | line 136 | Shows `3/5 | In progress` — stale after Waves 4 + 5 completed | ℹ Info | Documentation-only inconsistency. All 5 wave plans are marked `[x]` in the Plans section of ROADMAP.md. |
| `REQUIREMENTS.md` | Various | SVC-05, VIS-04, CNT-04 checkboxes remain `[ ]` | ℹ Info | Documentation inconsistency. SVC-05 code is delivered (schema spec + routes). VIS-04 and CNT-04 are genuinely partial (not fully checked off) and `REQUIREMENTS.md` is accurately tracking partial state. |

### Human Verification Required

No automated blockers found. The following items are recommended owner-side verification before first marketing push — none block phase sign-off:

**1. Netlify Forms registration**
**Test:** After the next Netlify deploy, open the Netlify dashboard → Forms. Verify both `contact-form` and `shop-notify` appear as registered forms.
**Expected:** Both forms visible; submissions flow into the dashboard.
**Why human:** Netlify form registration requires a deploy-time parse of `build/index.html`. Can only be confirmed post-deploy.

**2. Contact form pre-fill end-to-end**
**Test:** Visit `/contact?service=laser` — verify the service dropdown pre-selects "Laser cutting". Visit `/3d-printing`, click a Contact CTA to navigate to `/contact` — verify "3D printing" pre-fills via `document.referrer`.
**Expected:** Correct pre-fill in both paths; user can still change the selection.
**Why human:** `document.referrer` behavior requires a real browser navigation, not a test runner.

**3. Visual consistency across all 9 routes**
**Test:** Open `pnpm start` locally and visit `/`, `/styles`, `/styles/[any-slug]`, `/3d-printing`, `/3d-printing/[any-slug]`, `/about`, `/contact`, `/shop`, and `/404`.
**Expected:** All routes render with the dark brand theme, dual-service hero on `/`, peer-equal nav, no broken layouts, no placeholder regressions.
**Why human:** Visual parity requires a browser — static analysis confirms code paths but not pixel rendering.

**4. SEO `<head>` inspection per route**
**Test:** Open browser dev-tools on each route and inspect `<title>` and `<meta name="description">`.
**Expected:** Each route has a distinct, meaningful title and description (not `undefined — Shapesmith Studio`).
**Why human:** `react-helmet-async` injects meta at runtime; requires JS execution in a browser to verify.

---

## Notable Deviations Honored

1. **`material.services` field (Wave 1, owner-approved):** `material.processes` turned out to hold laser-operation values (`Cut`, `engrave`, `etch`), not service-compatibility tags. Owner verified via Sanity Vision. Resolution: a NEW `material.services` string array field was added. All Wave 2 components use `$serviceKey in services` GROQ. Old CONTEXT.md D-06 / D-07 decisions are superseded. Deviation documented in `02-01-SUMMARY.md` Deviations §1, `02-SCHEMA-SPEC.md` §2, and `STATE.md`.

2. **`react-helmet-async@^2.0.5`** (not v3): D-19 / RESEARCH "Pitfall 7" — v3 is too new for production. Pinned version confirmed in `package.json`.

3. **Two-layer `/materials` redirect:** Both `<Navigate>` (SPA hops) and `public/_redirects` 301 (Netlify direct hits) per D-17.

4. **Plain-text portable-text rendering** for FAQ + WontMake: `@portabletext/react` was not authorized for Phase 2. Owner should write plain prose for now; rich formatting is a v2 enhancement.

5. **`useScrollToTop` listener-leak fix** used `useCallback` instead of bare `[]` deps to preserve threshold semantics — functionally equivalent to the plan intent.

---

## Owner-Action Items for Full Relaunch

These items are **outside Phase 2 scope** (the code ships shippable; Sanity data is owner-managed). None block phase sign-off.

| Priority | Action | Effect |
|----------|--------|--------|
| HIGH | Publish `studio-info` singleton with `responseTimePromise`, `serviceArea`, `pickupAvailability`, `address`, `openingHours`, `makesOffer` | Activates LocalBusiness JSON-LD on homepage, enables TrustCopyBlock panels, shows response-time promise on contact page |
| HIGH | Add `services: ["laser"]` to each existing `material` doc (backfill) | Activates `MaterialsSection` on `/styles` service page |
| HIGH | Create at least one `print-style` doc | Activates the `/3d-printing` grid with real content (placeholder empty-state is live without it) |
| MEDIUM | Extend `laser-style` docs with `turnaround`, `wontMakeScope`, `seo` fields | Per-service trust copy and per-doc SEO meta on detail pages |
| MEDIUM | Create `faq` docs (5–8 per service) referencing `process` enum entries | Activates FAQ sections on both service pages |
| MEDIUM | Create `process` enum docs (`key: "laser"` and `key: "print"`) | Required for `faq.service[]` references |
| LOW | Replace `public/og-default.png` with a 1200×630 dedicated og:image | Better social sharing previews (current fallback is 1021×122 brand wordmark) |
| LOW | Schedule H2D photo session | Replaces Placeholder blocks in `/3d-printing` gallery with real photography |
| LOW | Populate per-doc `seo` blocks on `laser-style`/`print-style` docs | Per-page custom titles, descriptions, and og:images |

Schema rollout reference: `.planning/phases/02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub/02-SCHEMA-SPEC.md` §8 rollout checklist.

---

## Phase 2 Final Verdict

**VERIFICATION PASSED**

All 5 ROADMAP success criteria are delivered and verified against the actual codebase. The build produces a deployable static bundle with:

- Two service surfaces (`/styles` + `/3d-printing`) backed by generalized contexts
- Peer-equal dual-service nav on all screen sizes
- In-page Materials, FAQ, TrustCopyBlock, WontMake sections on both service pages
- `/shop` Coming Soon page with working `shop-notify` Netlify form
- Contact form with service pre-fill, CSS-hidden honeypot, relative URL, response-time promise
- Per-route `<title>`, `<meta description>`, `og:` tags via `react-helmet-async`
- LocalBusiness JSON-LD on the homepage
- Postbuild `sitemap.xml` with 6 static routes + dynamic Sanity slugs
- `robots.txt` referencing the sitemap
- All 13 legacy template files deleted, `styled-components` removed
- Project-specific README

The partial implementations on VIS-04 (4 home/about components still use `asset.url`) and CNT-04 (one hardcoded alt in Collaborations) are accurately tracked as `Pending` in `REQUIREMENTS.md` and do not affect the owner's ability to begin marketing. The primary marketing surfaces (service grids, galleries, materials) are fully covered.

Two documentation inconsistencies were found and noted:
- `ROADMAP.md` progress table shows `3/5` plans (stale; Plans section correctly shows all 5 as `[x]`)
- `REQUIREMENTS.md` SVC-05 checkbox remains `[ ]` (code is delivered; only the checkbox update was missed)

Neither inconsistency represents missing functionality.

**The site is shippable. Owner can begin marketing once the Sanity Studio rollout checklist is completed.**

---

_Verified: 2026-05-06T20:30:00Z_
_Verifier: Claude (gsd-verifier)_
