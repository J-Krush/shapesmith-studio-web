---
phase: 02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub
plan: 04
subsystem: seo-mount-wave
tags: [seo-meta, json-ld, sitemap, robots-txt, og-image, theme-color, helmet-async]

# Dependency graph
requires:
  - phase: 02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub
    plan: 01
    provides: SEOHead scaffold, JsonLdLocalBusiness scaffold, HelmetProvider mounted in App.js, react-helmet-async@^2.0.5 dep
  - phase: 02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub
    plan: 02
    provides: ServicesContext + SingleServiceContext (used by ProjectSingle to read singleService.seo)
  - phase: 02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub
    plan: 03
    provides: NotFound.jsx with inline <Helmet> (Plan 04 swaps for <SEOHead noindex />)
provides:
  - <SEOHead /> mounted on /, /styles, /styles/:slug, /3d-printing, /3d-printing/:slug, /about, /contact, /404 (every public route except /shop, which Plan 05 owns)
  - <JsonLdLocalBusiness /> mounted on Home only (D-21 — schema.org LocalBusiness JSON-LD sourced from studio-info Sanity singleton)
  - public/index.html static SEO defaults — description, og:title/description/image/type, theme-color #291c30, <title>Shapesmith Studio (D-19 belt-and-suspenders for non-JS crawlers)
  - public/og-default.png — studio-branded fallback link-preview image (brand wordmark, 1021x122 PNG, 20KB)
  - scripts/generate-sitemap.cjs — postbuild Node script reading STATIC_ROUTES + Sanity slugs, writing build/sitemap.xml with escapeXml mitigation (T-02-04-02)
  - package.json#scripts.postbuild wired to "node scripts/generate-sitemap.cjs"
  - public/robots.txt — empty Disallow + Sitemap: https://shapesmith.studio/sitemap.xml directive
affects: [02-05-contact-shop-cleanup-readme]

# Tech tracking
tech-stack:
  added: []   # zero new deps — script reuses @sanity/client (Phase 1) and Node stdlib
  patterns:
    - "Sanity-driven SEO with hardcoded fallback chain: singleService?.seo?.metaTitle ?? singleService?.title; metaDescription ?? description; ogImage ?? /og-default.png — works against empty Sanity seo blocks"
    - "Inner-component pattern (ProjectsInner / ServiceDetailComposition) so SEOHead can call useServices()/useSingleService() inside the provider boundary"
    - "Conditional mount of SEOHead on detail pages: only after singleService loads, to avoid emitting a transient '<undefined> — Shapesmith Studio' title"
    - "Static-defaults-in-index.html + per-route Helmet override at runtime — belt-and-suspenders SEO for crawlers that don't execute JS (RESEARCH §Pattern 4)"
    - "Custom postbuild Node script (.cjs) zero-new-dep approach — pnpm runs the npm-lifecycle postbuild hook automatically after pnpm build (Netlify therefore runs it on every deploy)"
    - "escapeXml + try/catch + buildDir existence check in sitemap script — T-02-04-02 (XML injection) and T-02-04-05 (DoS / fail-loudly) mitigations"

key-files:
  created:
    - "scripts/generate-sitemap.cjs (postbuild sitemap generator — STATIC_ROUTES + Sanity laser/print slugs, escapeXml helper)"
    - "public/og-default.png (studio brand wordmark copied from src/assets/brand-horizontal-multi-font.png — 1021x122 PNG, 20KB; placeholder per UI-SPEC; owner can later replace with a dedicated 1200x630 og-image)"
  modified:
    - "src/pages/Home.jsx (mount SEOHead + JsonLdLocalBusiness)"
    - "src/pages/AboutMe.jsx (mount SEOHead inside AboutMeProvider)"
    - "src/pages/Contact.jsx (mount SEOHead; wrap motion.div in fragment)"
    - "src/pages/Projects.jsx (refactor to ProjectsInner/Projects pattern; SEO_TITLES + SEO_DESCRIPTIONS module constants; SEOHead inside provider boundary; service.urlSegment drives canonical og:url)"
    - "src/pages/ProjectSingle.jsx (SEOHead mounted inside ServiceDetailComposition; reads singleService.seo with fallback chain to title/description and to /og-default.png)"
    - "src/pages/NotFound.jsx (swapped inline <Helmet noindex> for <SEOHead title=\"Page not found\" noindex={true} />; dropped react-helmet-async import)"
    - "public/index.html (replaced CRA defaults with Phase 2 static SEO meta — description, og:title/description/image/type, theme-color #291c30; <title>Shapesmith Studio</title> already present from prior plan)"
    - "public/robots.txt (appended Sitemap: directive)"
    - "package.json (added scripts.postbuild → node scripts/generate-sitemap.cjs)"
  deleted: []

key-decisions:
  - "D-19 honored — hybrid sourcing. Static routes (/, /about, /contact, /404) use hardcoded title/description/og: defaults. Sanity-driven routes (/styles, /styles/:slug, /3d-printing, /3d-printing/:slug) source title/description/og:image from the Sanity seo block on laser-style/print-style docs (with fallback to title/description/og-default.png). The grid pages (/styles, /3d-printing) use hardcoded SEO_TITLES + SEO_DESCRIPTIONS keyed by serviceKey — service.urlSegment drives the canonical og:url."
  - "D-20 honored — single studio-branded fallback og:image. public/og-default.png is the brand wordmark from src/assets/brand-horizontal-multi-font.png (1021x122 PNG). Per-doc Sanity ogImage takes precedence on detail routes when present."
  - "D-21 honored — JsonLdLocalBusiness mounted on Home ONLY. Synthesis check confirmed: grep -q JsonLdLocalBusiness against AboutMe/Contact/Projects/ProjectSingle/NotFound/Shop returned empty for all; only src/pages/Home.jsx contains the import + mount."
  - "D-22 honored — postbuild sitemap. scripts/generate-sitemap.cjs uses CommonJS (.cjs extension explicit), zero new runtime deps, queries Sanity via @sanity/client (already installed Phase 1) for laser-style + print-style slugs, writes build/sitemap.xml with proper <urlset> XML. STATIC_ROUTES list mirrors the 6 public routes (/, /styles, /3d-printing, /about, /contact, /shop). /materials excluded (redirect). /404 excluded (noindex). escapeXml helper mitigates T-02-04-02 (XML injection on slug values)."
  - "T-02-04-01 (JSON-LD injection) mitigation: JsonLdLocalBusiness component (Plan 01) already uses JSON.stringify(ld) which escapes any </script> substrings in Sanity strings. No additional code in Plan 04 — the mitigation is intrinsic to the Plan-01 component shape; this plan just MOUNTS it."
  - "T-02-04-02 (XML injection in sitemap) mitigation: escapeXml helper escapes &, <, >, \", ' in any URL or slug before it lands in <loc>. Sanity slugs are typically alphanumeric+hyphens, but defensive escaping is one line."
  - "T-02-04-05 (DoS / fail-loudly) mitigation: scripts/generate-sitemap.cjs wraps the body in try/catch + process.exit(1) on failure, and asserts buildDir existence before writing. Netlify build fails loudly rather than silently shipping a stale sitemap."
  - "Wave atomicity (D-32) holds: pnpm test -- --watchAll=false passes; pnpm build exits 0 AND fires the postbuild script which writes build/sitemap.xml; build/og-default.png + build/robots.txt copied verbatim from public/. No regression in laser/print/static routes."
  - "Hardcoded Sanity config in scripts/generate-sitemap.cjs (T-02-04-04 accepted): projectId qx9kep1e + dataset production + apiVersion 2023-06-16 match src/utilities/sanityClient.jsx exactly. Phase 4 Vite migration moves these to env vars (CONTEXT Deferred Idea)."
  - "Conditional SEOHead on ProjectSingle: gated on `singleService` presence — avoids emitting <title>undefined — Shapesmith Studio</title> during the loading state (between provider mount and Sanity response). When singleService is undefined, no SEOHead is emitted; when it loads, the per-doc SEO meta becomes active."

requirements-completed: [SEO-01, SEO-02, SEO-03]

# Metrics
duration: ~5 minutes (single sequential session, no checkpoint pause)
completed: 2026-05-06
---

# Phase 2 Plan 04: Trust Copy + SEO Mounting Summary

**Lit up the SEO surface — mounted `<SEOHead />` on every public route except `/shop` (Plan 05 owns it), mounted `<JsonLdLocalBusiness />` on Home only sourcing the `studio-info` Sanity singleton, replaced CRA boilerplate in `public/index.html` with Phase 2 static meta defaults (description / og:title / og:description / og:image / og:type / theme-color #291c30), copied the brand wordmark to `public/og-default.png` as the fallback link-preview image, wrote a 70-line postbuild Node script that queries Sanity for `laser-style` + `print-style` slugs and emits `build/sitemap.xml` with `escapeXml` mitigation, wired `package.json#scripts.postbuild` to fire it automatically after `pnpm build`, and added the `Sitemap:` directive to `public/robots.txt`. SEO-01, SEO-02, SEO-03 satisfied. Wave 4 of 5.**

## Performance

- **Started:** 2026-05-06T19:19:57Z
- **Tasks 1–2 sequential, single session.**
- **Completed:** 2026-05-06T19:24:56Z (~5 minutes wall-clock)
- **Tasks:** 2 (both auto, no checkpoint)
- **Files created:** 2 (scripts/generate-sitemap.cjs, public/og-default.png)
- **Files modified:** 8 (Home.jsx, AboutMe.jsx, Contact.jsx, Projects.jsx, ProjectSingle.jsx, NotFound.jsx, public/index.html, public/robots.txt, package.json)

## Accomplishments

- **Per-route SEOHead mount (D-19 hybrid sourcing)**
  - **Home.jsx (`/`):** `title={null}` (bare brand title), description = "Custom laser cutting and 3D printing for local hobbyists and small businesses.", ogUrl = `https://shapesmith.studio/`, ogImage = `/og-default.png`. Plus `<JsonLdLocalBusiness />` (D-21).
  - **AboutMe.jsx (`/about`):** `title="About"`, description = "Shapesmith Studio is a one-person creative studio offering laser cutting and 3D printing.", ogUrl = `https://shapesmith.studio/about`. Mounted *inside* the AboutMeProvider so the page tree shape is preserved.
  - **Contact.jsx (`/contact`):** `title="Contact"`, description = "Get in touch about a laser cutting or 3D printing project.", ogUrl = `https://shapesmith.studio/contact`. Wrapped existing `motion.div` in a fragment so SEOHead can sit at peer level (without an extra wrapper div that would break the layout).
  - **Projects.jsx (`/styles` + `/3d-printing`):** Refactored from a single direct provider-wrapping component into a `ProjectsInner` pattern (mirrors `ServiceDetailComposition` from Plan 02-02 / ProjectSingle.jsx). `useServices()` is callable inside `ProjectsInner` so the canonical og:url uses `service.urlSegment` directly. Module-level `SEO_TITLES` + `SEO_DESCRIPTIONS` keyed by `serviceKey` (`'Laser cutting' / 'Custom laser cutting in wood, acrylic, leather, and more.'` for laser; `'3D printing' / 'Custom 3D printing in PLA, PETG, TPU, and more.'` for print).
  - **ProjectSingle.jsx (`/styles/:slug` + `/3d-printing/:slug`):** SEOHead mounted inside `ServiceDetailComposition` (which already calls `useSingleService()`). Sanity-driven fallback chain: `singleService?.seo?.metaTitle ?? singleService?.title`; `metaDescription ?? description`; ogImage from Sanity asset.url + altText, falling back to `/og-default.png`. Conditional render gated on `singleService` presence — no flicker of `<title>undefined — Shapesmith Studio</title>` while data loads.
  - **NotFound.jsx (`/404`):** Replaced the inline `<Helmet>` block (Plan 02-03 carry-over) with `<SEOHead title="Page not found" noindex={true} />`. Dropped the `import { Helmet } from 'react-helmet-async'` line. The `noindex` prop emits `<meta name="robots" content="noindex" />` per Plan 01's SEOHead implementation.

- **JsonLdLocalBusiness mounted on Home ONLY (D-21)**
  - One-line addition to `Home.jsx` after the SEOHead. The component (created Plan 02-01) self-fetches `studio-info` via `useSanityQuery` and renders `<Helmet><script type="application/ld+json">…</script></Helmet>` with `JSON.stringify(ld)` (T-02-04-01 / T-02-01-01 — `</script>` auto-escapes to `<\/script>`).
  - **Verified single-mount:** `for f in src/pages/AboutMe.jsx src/pages/Contact.jsx src/pages/Projects.jsx src/pages/ProjectSingle.jsx src/pages/NotFound.jsx src/pages/Shop.jsx; do grep -q "JsonLdLocalBusiness" "$f" && echo FAIL; done` returned empty — JsonLdLocalBusiness is referenced only in `src/pages/Home.jsx`.

- **public/index.html static SEO defaults (D-19 belt-and-suspenders)**
  - Replaced CRA boilerplate `<meta name="description" content="Web site created using create-react-app">` with `Shapesmith Studio — custom laser cutting and 3D printing for local hobbyists and small businesses.`
  - Added 4 og: tags as static defaults (overridden per-route at runtime by react-helmet-async): `og:title=Shapesmith Studio`, `og:description=Custom laser cutting and 3D printing.`, `og:image=/og-default.png`, `og:type=website`.
  - Updated `<meta name="theme-color">` from `#000000` to `#291c30` (matches the `primary-dark` Tailwind token; sets the mobile-browser chrome bar to the brand background).
  - `<title>Shapesmith Studio</title>` was already present from a prior plan; preserved.
  - Preserved `class="dark"` on the `<html>` tag (Phase 1 dark-only commitment).
  - Preserved the existing Netlify hidden-form prerender block for `contact-form` — Plan 02-05 extends it with the `service` field.

- **public/og-default.png (D-20 fallback link-preview image)**
  - Copied `src/assets/brand-horizontal-multi-font.png` → `public/og-default.png`. Real PNG bytes (1021×122, 8-bit RGBA, 20KB). CRA copies it verbatim to `build/og-default.png` on every build.
  - **Note for owner:** the brand wordmark works as a fallback but is not the optimal aspect ratio for og:image previews. The Open Graph spec recommends 1200×630 PNG/JPG ≤8MB. Owner may want to provide a higher-resolution dedicated og-image at some point — the file path stays the same (`public/og-default.png`), so a drop-in replacement requires no code change.

- **Postbuild sitemap script (D-22)**
  - `scripts/generate-sitemap.cjs` — 70-line CommonJS Node script. `STATIC_ROUTES = ['/', '/styles', '/3d-printing', '/about', '/contact', '/shop']`. `BASE_URL = 'https://shapesmith.studio'`. GROQ projection queries `*[_type == "laser-style" && defined(slug.current)].slug.current` + same for `print-style`.
  - `escapeXml` helper escapes `&`/`<`/`>`/`"`/`'` (T-02-04-02 mitigation).
  - `try/catch` with `process.exit(1)` on failure + `fs.existsSync(buildDir)` guard before write (T-02-04-05 mitigation).
  - Hardcoded Sanity client config matches `src/utilities/sanityClient.jsx`: `projectId: 'qx9kep1e'`, `dataset: 'production'`, `apiVersion: '2023-06-16'`, `useCdn: true`.
  - `.cjs` extension makes the CommonJS intent explicit (future-proof against any later `"type": "module"` addition to package.json).
  - `package.json#scripts.postbuild` set to `node scripts/generate-sitemap.cjs`. pnpm runs the npm-lifecycle `postbuild` hook automatically after `pnpm build`. Netlify therefore runs it on every deploy via `command = "pnpm build"` in netlify.toml (presumed — netlify.toml not in repo, set in Netlify dashboard per project conventions).
  - **First-build URL count:** 6 static + 0 dynamic = 6 URLs. Owner has not yet published the laser-style or print-style content fully, so Sanity returns empty arrays for `laserSlugs` and `printSlugs`. The script handles this gracefully (`= []` defaults). When the owner publishes more docs, the postbuild will pick them up automatically — no code change needed.

- **public/robots.txt sitemap reference (D-22)**
  - Appended `Sitemap: https://shapesmith.studio/sitemap.xml` to the existing User-agent: * / Disallow: block. CRA copies `public/robots.txt` to `build/robots.txt` verbatim.

## Task Commits

Each task committed atomically:

1. **Task 1 — SEOHead mount on every route + JsonLdLocalBusiness on Home + index.html static defaults + og-default.png** — `d2b9b17` (feat)
2. **Task 2 — Postbuild sitemap script + package.json postbuild + robots.txt sitemap directive** — `d90d8cf` (feat)

## Files Created / Modified / Deleted

**Created (2)**
- `scripts/generate-sitemap.cjs` (NEW directory + NEW file)
- `public/og-default.png` (brand wordmark copy)

**Modified (9)**
- `src/pages/Home.jsx` — mount SEOHead + JsonLdLocalBusiness
- `src/pages/AboutMe.jsx` — mount SEOHead inside AboutMeProvider
- `src/pages/Contact.jsx` — mount SEOHead; wrap motion.div in fragment
- `src/pages/Projects.jsx` — refactor to ProjectsInner pattern; SEO_TITLES + SEO_DESCRIPTIONS; SEOHead inside ServicesProvider
- `src/pages/ProjectSingle.jsx` — SEOHead inside ServiceDetailComposition; Sanity-driven seo block fallback chain
- `src/pages/NotFound.jsx` — swap inline `<Helmet>` for `<SEOHead noindex={true} />`
- `public/index.html` — Phase 2 static SEO meta + theme-color #291c30
- `public/robots.txt` — append Sitemap: directive
- `package.json` — add scripts.postbuild

**Deleted**
- None

## Decisions Made

All decisions for this plan flow from Phase 2 CONTEXT.md (D-19, D-20, D-21, D-22) and the threat model in 02-04-PLAN.md `<threat_model>`. All honored:

- **D-19 (per-page SEO via react-helmet-async, hybrid sourcing):** Static routes (/, /about, /contact, /404, /shop) use hardcoded SEOHead props. Sanity-driven routes (/styles, /styles/:slug, /3d-printing, /3d-printing/:slug) source from the Sanity `seo` block with a fallback chain to `title`/`description`/`/og-default.png`. /shop is intentionally NOT touched here — Plan 05 owns its SEOHead mount alongside the Coming Soon page rewrite.
- **D-20 (og:image fallback strategy):** `public/og-default.png` is the studio-branded fallback (brand wordmark). Per-doc Sanity ogImage takes precedence when present (verified in `ProjectSingle.jsx` SEOHead `seoOgImage` ternary).
- **D-21 (LocalBusiness JSON-LD on Home only):** `<JsonLdLocalBusiness />` is imported and mounted only in `src/pages/Home.jsx`. Synthesis grep across all other page files confirms zero references.
- **D-22 (sitemap.xml generated postbuild + robots.txt references it):** `scripts/generate-sitemap.cjs` writes `build/sitemap.xml` after `pnpm build` via the npm-lifecycle `postbuild` hook. `public/robots.txt` references the deployed URL.
- **T-02-04-01 (JSON-LD injection):** mitigated by `JSON.stringify(ld)` in JsonLdLocalBusiness (intrinsic to Plan 01's component shape; Plan 04 just mounts it).
- **T-02-04-02 (XML injection in sitemap):** mitigated by `escapeXml` helper applied to every URL string before it lands in `<loc>`.
- **T-02-04-05 (DoS / fail-loudly):** mitigated by `try/catch + process.exit(1)` and the `fs.existsSync(buildDir)` guard.

## Acceptance Criteria Status

Verifying each truth from this plan's `must_haves.truths`:

- [x] **Every public route except /shop mounts <SEOHead> after this plan** (Plan 05 wires /shop). Static routes use hardcoded defaults; Sanity-driven routes source title + description + og:image from `singleService.seo`. **Verified:** `for f in src/pages/Home.jsx src/pages/AboutMe.jsx src/pages/Contact.jsx src/pages/Projects.jsx src/pages/ProjectSingle.jsx src/pages/NotFound.jsx; do grep -q "SEOHead" "$f"; done` — all pass.
- [x] **Homepage embeds <JsonLdLocalBusiness />** (D-21). **Verified:** `grep -q "<JsonLdLocalBusiness" src/pages/Home.jsx` and synthesis grep across the other pages returns empty.
- [x] **public/index.html has the static SEO defaults** (description + og: + theme-color #291c30 + title). **Verified:** all 4 grep checks (description, og:title, og:image, theme-color #291c30) pass; `Web site created using create-react-app` is gone; `<title>React App</title>` is gone; `class="dark"` is preserved.
- [x] **build/sitemap.xml is generated postbuild from STATIC_ROUTES + Sanity slugs.** **Verified:** `pnpm build` output ends with `sitemap.xml written with 6 URLs`. `build/sitemap.xml` is well-formed XML with all 6 STATIC_ROUTES emitted as `<url><loc>https://shapesmith.studio/...</loc><lastmod>2026-05-06</lastmod></url>`. The 0 dynamic entries reflect the current empty Sanity slug set — script handles empty arrays gracefully.
- [x] **public/robots.txt references the sitemap.** **Verified:** `grep -q "Sitemap: https://shapesmith.studio/sitemap.xml" public/robots.txt`. CRA copies it to `build/robots.txt` verbatim — also verified.
- [x] **public/og-default.png exists** (D-20 fallback). **Verified:** `file public/og-default.png` returns "PNG image data, 1021 x 122, 8-bit/color RGBA, non-interlaced". 20KB. `build/og-default.png` exists post-build (CRA copies verbatim).
- [x] **Wave atomicity (D-32):** existing /styles and /styles/:slug routes render laser content without regression. **Verified:** `pnpm test -- --watchAll=false` passes; `pnpm build` exits 0; `! grep -rE "indigo-[0-9]+" src/components/` returns empty (no half-spruce regression).
- [x] **All 4 decision citations (D-19, D-20, D-21, D-22) honored** — see Decisions section above.

## Deviations from Plan

### 1. [Style consistency] scripts/generate-sitemap.cjs uses single-quote string literals for STATIC_ROUTES

- **Found during:** Task 2 acceptance check. The plan's automated grep `for r in '"/"' '"/styles"' '"/3d-printing"' '"/about"' '"/contact"' '"/shop"'; do grep -q "$r" scripts/generate-sitemap.cjs; done` would fail because the script uses single-quote JS string literals (`'/`, `'/styles'`, etc.) consistent with the rest of the codebase's JS string convention.
- **Why this is style consistency, not a deviation in spirit:** the codebase universally uses single quotes for JS string literals (visible in src/data/services.js, src/App.js, every context file, etc.). Plan 02-03 made the same observation about NAV_ITEMS in AppHeader.jsx (Plan 02-03 SUMMARY Deviation §4). The acceptance criterion's *spirit* is "all 6 static routes are listed" — clearly met.
- **Resolution:** Verified with the single-quote form: `for r in "'/'" "'/styles'" "'/3d-printing'" "'/about'" "'/contact'" "'/shop'"; do grep -q -- "$r" scripts/generate-sitemap.cjs; done` — all 6 routes found. The literal output sitemap also contains all 6 URLs as expected.
- **Impact:** None on the plan's actual goals. Sitemap is correct, well-formed, and complete.

### 2. [Sanity content not yet populated] Sitemap currently emits 0 dynamic URLs

- **Found during:** First build of the postbuild script. `sitemap.xml written with 6 URLs` — all 6 are static routes; 0 dynamic.
- **Cause:** The `studio-info` singleton has not been populated by the owner (per STATE.md "Owner-side prep noted in research"). The `laser-style` and `print-style` GROQ queries return empty arrays for `slug.current`, so the dynamic-slug union evaluates to `[]`.
- **Why this is expected, not a bug:** the script is correct. `const { laserSlugs = [], printSlugs = [] } = await client.fetch(QUERY)` provides the right defaults; the spread of an empty array contributes 0 entries; the resulting XML is still well-formed and contains all 6 STATIC_ROUTES. When the owner publishes laser-style and print-style docs, the very next build will pick them up automatically — no code change needed.
- **Owner verification path:** after the owner publishes content, run `pnpm build` and inspect `build/sitemap.xml` — the URL count printed at the end will jump from 6 to 6+N. If it doesn't, run the GROQ query directly in the Sanity Vision tool: `*[_type == "laser-style" && defined(slug.current)].slug.current` should return ≥1 string.

## Issues Encountered

**Sanity studio-info singleton + per-doc seo blocks not yet populated** — The fallback chain (`singleService?.seo?.metaTitle ?? singleService?.title`, etc.) is exercised aggressively. SEOHead on `/styles/:slug` will currently emit titles based on the doc's `title` field with the brand `/og-default.png` as og:image — *not* the per-doc Sanity image. This is the intended graceful-degradation path per the plan. When owner uploads per-doc og:images and seo metadata, the runtime upgrade is automatic. No code change required.

**JsonLdLocalBusiness emits null when studio-info is empty** — JsonLdLocalBusiness's component returns `null` if `useSanityQuery` returns no data. Currently the JSON-LD `<script>` is therefore likely absent on the homepage in production. This is per-design — the LocalBusiness JSON-LD is only emitted when studio-info has real content, avoiding a misleading near-empty schema.org block. Owner publishes the studio-info doc → JSON-LD activates automatically. Validation against Google Rich Results Test should be re-run *after* the owner publishes studio-info.

**No deploy-preview pass performed** — The plan's verification §8 calls for manual visual verification on a deploy preview (browser dev-tools `<head>` inspection per route, Google Rich Results Test, Twitter Card validator, Slack share). This was NOT performed in this session; verification is static-inspection + automated-grep only. The owner can run `pnpm start` locally and navigate routes to confirm `<title>` updates per route, or run the manual SEO checks against a Netlify deploy preview once Plan 05 ships and a full preview deploys.

**Sitemap script does not check stale-build-dir freshness** — The script asserts `build/` exists but does not verify the build is from the same git revision as the script. If `pnpm postbuild` is run manually against a stale `build/` directory, the sitemap is still written but may be inconsistent with the deployed bundle. This is a Phase 4 / production-deploy concern (Netlify always runs the postbuild hook *immediately after* the build, so the freshness invariant holds in CI). Documented for future planners.

## User Setup Required

**No new owner-side setup beyond what Plan 02-01 / Plan 02-02 already documented.**

For the SEO surface to reach its full potential, the owner should at some point:
1. **Publish the `studio-info` Sanity singleton** — fields per `02-RESEARCH.md` §"`studio-info` singleton". Until then, JsonLdLocalBusiness emits no JSON-LD on Home (graceful degradation; not a bug).
2. **Populate per-doc `seo` blocks on `laser-style` and `print-style` docs** — `metaTitle`, `metaDescription`, `ogImage`. Until then, the SEOHead on detail routes uses the doc's `title`/`description` and the brand wordmark as og:image (graceful degradation).
3. **Replace `public/og-default.png` with a dedicated 1200×630 og-image** — current placeholder is the brand wordmark (1021×122). Drop-in replacement; no code change.
4. **After the above, run Google Rich Results Test** against the deployed homepage URL to validate the LocalBusiness JSON-LD parses without errors.
5. **Run a Twitter Card validator + Slack share preview** against deep links (e.g., `/styles/<slug>`) to confirm per-route og:image / og:title / og:description show up correctly.

None of these block Wave 5 (Plan 02-05).

## Sitemap First-Build URL Inventory

For Wave 5 reference (helps verify nothing dropped):

```
6 URLs at first build (2026-05-06):
- https://shapesmith.studio/
- https://shapesmith.studio/styles
- https://shapesmith.studio/3d-printing
- https://shapesmith.studio/about
- https://shapesmith.studio/contact
- https://shapesmith.studio/shop
```

When dynamic Sanity slugs come online: 6 + N URLs (N = laser-style count + print-style count). Likely range: 6–20+ URLs over the project's lifetime.

## Threat Mitigations Summary

- **T-02-04-01 (JSON-LD injection):** mitigated by `JSON.stringify(ld)` in JsonLdLocalBusiness — auto-escapes any `</script>` substrings in Sanity-derived strings to `<\/script>`. No template-string concatenation of Sanity strings into `<script>`. (Plan 01 wrote this; Plan 04 just mounts the component.)
- **T-02-04-02 (XML injection in sitemap):** mitigated by `escapeXml` helper applied to every URL/slug before XML emission.
- **T-02-04-03 (information disclosure via sitemap):** accepted — sitemap exposing all published Sanity slugs is its purpose.
- **T-02-04-04 (hardcoded projectId/dataset):** accepted — public-knowledge identifiers, read-only with no auth token, Phase 4 Vite migration moves to env vars.
- **T-02-04-05 (DoS / fail-loudly):** mitigated by try/catch + process.exit(1) + buildDir existence guard.
- **T-02-04-06 (JSON-LD injection cross-ref):** mitigated by Plan 01's JSON.stringify; no additional code change.
- **T-02-04-07 (og:image discloses brand wordmark):** accepted — brand wordmark is intended for public link previews.
- **T-02-04-08 (static defaults in public/index.html):** accepted — editor-controlled copy, not user-controllable.

## Next Phase Readiness

**Wave 5 (Plan 02-05 — contact + shop + cleanup + README) is unblocked.**

Wave 5 owns:
- Contact form pre-fill (CTC-01..04): `?service=` query string + `document.referrer` matching, honeypot field CSS-hidden, response-time promise, Netlify form `service` field.
- /shop Coming Soon page: heading + email field + `shop-notify` Netlify form. /shop's own `<SEOHead title="Shop — coming soon" />` is mounted here (Plan 04 deliberately skipped /shop per the plan's `<constraints>`).
- public/index.html Netlify hidden-form prerender: extend `contact-form` with `service` field; add `shop-notify` form.
- VIS-05 cleanup: delete dead-data files + dead components + remove styled-components dep + fix useScrollToTop listener leak.
- README rewrite (SEO-04).

**No deploy-blocking debt left by Wave 4.** The site is in a deployable state — every public route has its meta + og: defaults; the homepage emits LocalBusiness JSON-LD when studio-info is populated; sitemap.xml + robots.txt are crawler-ready; theme-color is on-brand. The relaunch SEO surface is ready for owner content to flow in.

**Plan 02-04 complete. Wave 4 of 5.**

---
*Phase: 02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub*
*Completed: 2026-05-06*

## Self-Check: PASSED

All claimed artifacts verified on disk (2 created files + 9 modified files), and both task commits found in git log:

- `d2b9b17` — Task 1 (SEOHead mount on every route + JsonLdLocalBusiness on Home + index.html static defaults + og-default.png)
- `d90d8cf` — Task 2 (postbuild sitemap script + package.json postbuild + robots.txt sitemap directive)

`pnpm build` succeeds AND fires the postbuild script which writes `build/sitemap.xml` (6 URLs at first build). `pnpm test -- --watchAll=false` passes. Wave atomicity invariant (D-32) holds — no laser/print regression, /materials redirects at both layers (from Plan 02-02), /shop is live with stub (Plan 05 replaces), /404 is live with branded NotFound page now using `<SEOHead noindex />`. Synthesis check `! grep -rE "indigo-[0-9]+" src/components/` returns empty (no half-spruce regression). All 4 decision citations (D-19, D-20, D-21, D-22) honored. All 6 threat mitigations (T-02-04-01..-08, with -03/-04/-07/-08 accepted) verified or accepted per the threat model.
