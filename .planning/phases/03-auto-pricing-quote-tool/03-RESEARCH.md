# Phase 3: Auto-Pricing Quote Tool - Research

**Researched:** 2026-05-07
**Domain:** Browser-side CAD/vector parsing, instant ballpark pricing, Netlify Function submission with Resend email + reCAPTCHA v3
**Confidence:** HIGH (stack + bundle math + integration patterns); MEDIUM (signed-tetrahedra implementation correctness, SVG implicit-shape coverage)

---

## Summary

Phase 3 builds a `/quote` surface where visitors upload a CAD or vector file, see a ballpark price *range* (never a point), and submit it to the studio owner who manually replies with a real quote. CONTEXT.md splits the work: **Plan 03-01 = stub** (front-end pages, tabs, file upload, geometry readouts, no submission, no pricing), **Plans 03-02..03-NN = the rest** (pricing-rule schema, material+quantity, range display, Netlify Function + Resend submission, reCAPTCHA v3, DOMPurify, localStorage). Twenty-three decisions (D-01..D-23) are locked; the planner's freedom is bundle-size choices, plan ordering, and a few UI placement calls.

The technical core is browser-side parsing: STL + OBJ on the 3D tab, SVG on the laser tab. The codebase has zero prior art for any of this — no Three.js, no Web Workers, no `dropzone`, no `netlify/functions/`, no `dompurify`. Every dependency in this phase is net-new. Bundle size matters: current production bundle is **459 KB total JS / 293 KB main chunk** [VERIFIED: ls build/static/js], and Phase 4 (Vite migration) is the only thing that improves the situation — no help yet. Three.js full bundle is 182 KB gzip [VERIFIED: bundlephobia three@0.184.0], which would roughly triple the main chunk on the `/quote` route alone if pulled in carelessly. **The single highest-leverage architectural choice in this phase is the parser strategy** — and it's the planner's call per D-11.

The submission flow is the second-largest unknown: this is the project's first Netlify Function. Resend + reCAPTCHA v3 + Function plumbing is well-trodden ground in 2026 but completely net-new for this codebase. Patterns from Phase 2's contact form (pre-fill cascade, success-state replacement, Sanity-driven response-time copy) carry forward; Netlify *Forms* does NOT carry forward — the function-based path is mechanically different and must NOT be conflated with Forms (the Phase 2 prerender pattern in `public/index.html` is the wrong template for QTE-07).

**Primary recommendation:** For Plan 03-01, use Three.js's standalone `examples/jsm/loaders/STLLoader.js` and `OBJLoader.js` (lazy-imported inside the `/quote` route only) — NOT the full `three` package, NOT a hand-rolled parser, NOT a Web Worker. Use a hand-rolled drag-and-drop dropzone (no `react-dropzone` — bundle cost not justified for one consumer). Use native `<input type="file">` for the picker, native `DOMParser` + `getTotalLength()` for SVG. Defer Web Workers, DOMPurify, and `react-dropzone` evaluation until profiling on real files justifies them.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Phase staging (plan structure)
- **D-01:** Phase 3 stays single-phase, but plans break naturally. **Plan 03-01 = stub** (front-end pages + tabs + file upload + basic geometry readouts; no submission, no pricing, no schema). **Plans 03-02..03-NN = remaining QTE items** (pricing-rule schema, material picker + quantity, range display + markup, submission via Netlify Function + Resend, reCAPTCHA v3, DOMPurify on rendered SVG, localStorage form-state persistence). The planner determines wave count and ordering. ROADMAP.md is NOT edited; REQUIREMENTS.md is NOT edited.
- **D-02:** Each plan SHOULD leave the site deployable. Plan 03-01 ships a `/quote` page that reads, computes geometry, and shows results — but does NOT submit to anyone yet. Visitors who land on it should get a useful preview, not a half-built form that hangs at "submit."
- **D-03:** Plan 03-01 may include a placeholder "Submit for confirmation — coming soon" CTA on each tab so the surface looks intentionally staged, not broken. Or the tab can route the visitor back to `/contact` with a pre-filled service. Planner discretion within "no broken-feeling dead-ends."

#### `/quote` page shape (Plan 03-01)
- **D-04:** Single `/quote` route with **tabs inside the page** ("3D Printing" / "Laser Cutting"). One SEO surface, sibling tools framed visually as one feature. NOT sub-routes (`/quote/3d-printing` + `/quote/laser`) and NOT URL-deep-linked tabs at this stage.
- **D-05:** Tab pre-fill — Claude's discretion within Phase 2 precedent. Recommended: read `?service=` query string and `document.referrer` (matching `ContactForm.jsx` D-24) so a visitor clicking from a service page lands on the correct tab. Mapping: `/styles` → laser tab, `/3d-printing` → 3D tab, `?service=laser|print` → matching tab. Keep the pattern consistent with the contact form to avoid two pre-fill idioms.
- **D-06:** Top-level entry CTAs — planner discretion. Reasonable options: a "Get a Quote" link in `AppHeader` nav, or a CTA on each service page hero, or both. Whatever lands, the link uses `?service=` so the tab opens correctly.
- **D-07:** Descriptive copy on `/quote` (what the tool does, expected accuracy, "estimate not final" disclaimer) — planner discretion on whether it lives in Sanity (`studio-info` extension or a new `quote-tool-info` singleton) vs hardcoded in `Quote.jsx`. Recommended: hardcoded for the stub, Sanity later if the owner wants to tune; matches Phase 2's "graceful degrade with placeholder" stance.

#### File pipeline (Plan 03-01)
- **D-08:** **3D tab accepts STL + OBJ.** Both are triangle meshes — the volume calculation and bbox math are identical. 3MF is deferred to a later in-phase plan; QTE-02's full STL/3MF list is honored across the phase as a whole, not Plan 03-01 alone.
- **D-09:** **Laser tab accepts SVG only** for the stub. DXF is deferred to a later in-phase plan; QTE-02's full SVG/DXF list is honored across the phase as a whole. (Skipping DXF in 03-01 avoids pulling in the `dxf` library before the pricing-rule schema exists.)
- **D-10:** File upload UI — drag-and-drop **and** file picker, both per QTE-02. Constraints (size, format) shown before the visitor touches the file. Stated formats per tab; reject mismatches with friendly error messages (QTE-03).
- **D-11:** Parsing strategy — planner discretion. Three options realistic: (a) Three.js `STLLoader` + `OBJLoader` (well-tested, ~600KB bundle hit), (b) lightweight standalone parsers (e.g. `parse-stl`, custom `ArrayBuffer` STL reader, line-based OBJ parser — much smaller bundle, more code to write/maintain), (c) Web Worker wrapping either choice for large-file robustness. **Recommendation:** start with lightweight standalone parsers on the main thread, gated by a file size cap; add Web Worker only if profiling shows main-thread freezes on realistic files. Bundle size matters here — CRA + React 18 + this phase's adds is already non-trivial.
- **D-12:** File size cap + memory-bounded parsing (QTE-09) — planner discretion. Reasonable starting point: 25MB per file, with a friendly "file too large" message and a soft suggestion to compress / decimate. Hard ceiling driven by browser memory practicality, not arbitrary preference.

#### 3D geometry readouts (Plan 03-01)
- **D-13:** **Volume = signed-tetrahedra (divergence theorem).** Sum signed volumes of tetrahedra formed by each triangle and the origin. Accurate for closed/watertight meshes, ~10 LOC of math, no library beyond the parser. Display in cm³ (planner may also show in³ as secondary; metric primary per studio context — local hobbyists, mm-native CAD).
- **D-14:** Display in 3D tab readout (in addition to volume): triangle count, file size, bounding-box dimensions (W × D × H mm). All cheap to compute alongside volume.

#### Laser geometry readouts (Plan 03-01)
- **D-15:** **Display = bounding box (W × H mm) + total path length (mm).** Bbox tells the visitor whether their design fits on the laser bed (later plans will compare to a Sanity `studio-info.laserBedSize` if it exists). Total path length sets up cut-time estimation; the later pricing plan adds `$/mm` rate per material and the math becomes "ballpark = path × rate × markup."
- **D-16:** Path length method — sum of `path.getTotalLength()` from `SVGPathElement` for each `<path>` in the SVG, including any path elements nested inside `<g>` groups. Planner judges whether to include implicit shapes (`<rect>`, `<circle>`, `<line>`, `<polyline>`, `<polygon>`) in v0 or punt to a later plan; matters for designs exported by simpler tools.
- **D-17:** SVG unit handling — read `viewBox` + `width`/`height` attributes, normalize to mm. SVG default is user units; Inkscape/LightBurn typically save in mm but pixel-based exports happen. If unit can't be confidently inferred, surface a "unit interpretation: assumed mm" note rather than guessing silently.

#### Out of scope FOR PLAN 03-01 (in scope for later plans within Phase 3)
- **D-18:** Material picker, quantity input, price-range display, markup buffer math — Plan 03-02 (or later) territory. Plan 03-01 just shows geometry; it does NOT show any dollar number.
- **D-19:** `pricing-rule` Sanity schema (QTE-06) — Plan 03-02 or later. Stub doesn't read pricing data because it doesn't display prices.
- **D-20:** Netlify Function + Resend submission (QTE-07) — later plan. Stub may include a placeholder "Submit for confirmation — coming soon" affordance per D-03 but does NOT actually POST anywhere.
- **D-21:** reCAPTCHA v3 server-verified (QTE-08) — later plan, ships with the submission flow.
- **D-22:** DOMPurify (QTE-09) — only relevant when SVG content renders to the DOM; Plan 03-01 does NOT render SVG visually (just parses for path length + bbox), so DOMPurify enters when/if SVG preview lands. Memory-bounded STL/DXF parsing applies in Plan 03-01 via the file size cap (D-12).
- **D-23:** localStorage form-state persistence (QTE-10) — later plan, lands when there's a multi-step form to persist.

### Claude's Discretion
- **CTA entry placement** (nav vs service-page hero vs both) — D-06.
- **Descriptive copy location** (Sanity vs hardcoded) — D-07.
- **Parsing library choice** (Three.js loaders vs standalone vs Web Worker) — D-11.
- **File size cap value** (D-12 suggests 25MB).
- **Implicit-shape path-length inclusion** (D-16).
- **Plan 03-01 placeholder submit behavior** (D-03).
- **Plan count and ordering** for QTE-04..10 across Plans 03-02..03-NN.
- All decisions D-01..D-23 may be adjusted by the planner if a concrete obstacle is found in the codebase — flag in PLAN.md deviations.

### Deferred Ideas (OUT OF SCOPE)
- **STL preview rendering** in the quote UI (QTE-13, v2)
- **Slicer-grade pricing** (QTE-11, v2)
- **Customer dashboard** for tracking submitted estimates (QTE-12, v2)
- **3MF + DXF parsing** (in-phase deferral D-08, D-09 — may be picked up in Plans 03-02..NN if owner asks)
- **Tab UI extraction** into a reusable component (planner discretion in Plan 03-01)
- **Sanity-driven descriptive copy** on `/quote` (D-07 leans hardcoded for the stub)
- **Plausible Analytics** on `/quote`
- **Bundle-size profiling follow-up** (if Three.js loaders prove heavy, switch to standalone parsers becomes a post-stub task)

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QTE-01 | Visitors can navigate to a Quote page from each service page and from a top-level CTA | UI-SPEC §"Top-level CTA placement" + Phase 2 `AppHeader.NAV_ITEMS` SERVICES.map pattern. Documented in §Architecture Patterns Pattern 1. |
| QTE-02 | Drag-and-drop or file picker upload with stated size/format constraints surfaced before file touch | §Code Examples "Dropzone (drag + picker, no library)" + §Architecture Patterns Pattern 2. Native HTML5 `dataTransfer.files` + `<input type="file">` covers both per D-10. |
| QTE-03 | Browser-side parsing (STL/OBJ for 3D, SVG for laser) with friendly error messages on bad files | §Standard Stack STL/OBJ parsers (Three.js examples/jsm loaders) + §Code Examples "STL volume math" / "SVG path length" / "Native DOMParser SVG read". §Common Pitfalls 1, 2, 3. |
| QTE-04 | Material picker + quantity from data-driven Sanity options with live estimate updates | §Architecture Patterns Pattern 6 + §Standard Stack Sanity (existing `useSanityQuery`). Plan 03-02+ scope per D-18. |
| QTE-05 | Estimate as range, never a point; visible disclaimer; word "quote" not used until owner confirms | UI-SPEC §"Disclaimer placement" + §Code Examples "Range formatter". Plan 03-02+ scope per D-18. |
| QTE-06 | `pricing-rule` Sanity schema (per-material rate, machine-time multiplier, setup fee, density) | §Architecture Patterns Pattern 6 + §Code Examples "pricing-rule schema sketch". Plan 03-02+ scope per D-19. Owner-prep doc pattern from Phase 2 `02-SCHEMA-SPEC.md`. |
| QTE-07 | Submit posts metadata to Netlify Function which validates + emails owner via Resend | §Standard Stack Resend + Netlify Functions + §Architecture Patterns Pattern 5 + §Code Examples "Netlify Function + Resend skeleton". Plan 03-02+ scope per D-20. |
| QTE-08 | Server-verified reCAPTCHA v3 token verification | §Standard Stack reCAPTCHA + §Architecture Patterns Pattern 5 + §Code Examples "reCAPTCHA v3 verify". Plan 03-02+ scope per D-21. |
| QTE-09 | SVG sanitized via DOMPurify before any DOM render; STL/DXF parsing memory-bounded | §Standard Stack DOMPurify + §Architecture Patterns Pattern 4 + §Common Pitfalls 5. Plan 03-02+ for DOMPurify (only when SVG renders); Plan 03-01 enforces 25MB cap. |
| QTE-10 | Form state persists across page reloads via `localStorage` | §Architecture Patterns Pattern 7 + §Code Examples "localStorage hook (hand-rolled)". Plan 03-02+ scope per D-23. File contents NOT persisted (privacy + size). |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| File ingestion (drag/drop + picker) | Browser / Client | — | HTML5 File API runs only in the browser. No upload anywhere. |
| STL/OBJ/SVG parsing | Browser / Client | — | Files never leave the browser per UI-SPEC constraints line "files are read in your browser — they're not uploaded anywhere unless you submit". Volume + path-length math is pure JS, no server. |
| Geometry readouts display | Browser / Client | — | Pure presentational React state; consumes parser output. |
| Material list (data-driven) | Browser / Client | Sanity CDN | Anonymous CDN read via existing `useSanityQuery` hook. |
| Pricing-rule data (data-driven) | Browser / Client | Sanity CDN | Same pattern as material — owner edits in Studio, no deploy. |
| Price-range computation | Browser / Client | — | Pure math on geometry × pricing-rule fields; no server round-trip per visitor. Range derived client-side keeps it instant. |
| Estimate submission | Netlify Function | Browser / Client | Function owns validation + reCAPTCHA verify + Resend send. Client only POSTs metadata. **NOT Netlify Forms** — function-based per D-20. |
| Email delivery | Netlify Function (server) | Resend (external) | Resend SDK is server-only; the API key MUST stay in Function env, NEVER bundled. |
| reCAPTCHA token mint | Browser / Client | — | `grecaptcha.execute(siteKey, {action})` runs in the browser via Google's loaded script. |
| reCAPTCHA token verify | Netlify Function (server) | google.com/recaptcha (external) | Token verified server-side with `RECAPTCHA_SECRET_KEY` (NEVER on client). Score check determines accept/reject. |
| localStorage state | Browser / Client | — | Tab + material + quantity only (NOT file contents — privacy + size). |
| SEO meta + sitemap entry | CDN / Static | — | `react-helmet-async` `<SEOHead>` per existing Phase 2 pattern; `/quote` added to `STATIC_ROUTES` in `scripts/generate-sitemap.cjs`. |

**Tier-misassignment risk to watch:**
- Resend SDK MUST NOT be imported from any `src/` file. Even though it works in Node, its inclusion in the SPA bundle would (a) bloat the client JS and (b) leak the API-key import path to attackers. Function code lives in `netlify/functions/`, separate from `src/`.
- reCAPTCHA `secret_key` is server-only; site_key is public (browser). Don't mix them.

---

## Standard Stack

### Core (Plan 03-01 — front-end stub)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `three` (examples/jsm/loaders only) | `^0.184.0` (latest) [VERIFIED: npm view three version, 2026-04-16] | STL + OBJ parsing via `STLLoader` + `OBJLoader` | These are the de-facto reference parsers; the Three.js team maintains both, they handle binary STL + ASCII STL header detection, multi-mesh OBJ, and edge cases that hand-rolled parsers miss. Lazy-imported on `/quote` only. |
| (none for SVG) | — | SVG path-length + bbox via DOM | Native `DOMParser` + `SVGPathElement.getTotalLength()` is a browser builtin. No library needed. |
| (none for dropzone) | — | Drag-and-drop + file picker | Native `<input type="file">` + `onDragOver`/`onDrop` handlers cover D-10 with ~30 LOC. `react-dropzone` is 60KB min / 16KB gzip [VERIFIED: bundlephobia react-dropzone@15.0.0] for one consumer — bundle cost not justified. |

**Bundle math for Plan 03-01:**
- Current production main chunk: 293 KB / `~90 KB gzip est.` [VERIFIED: ls build/static/js/main.ee5a3277.js]
- Three.js full module: 724 KB raw / 182 KB gzip [VERIFIED: bundlephobia three@0.184.0]
- STLLoader.js standalone: 10.7 KB raw [VERIFIED: curl unpkg]
- OBJLoader.js standalone: 22.9 KB raw [VERIFIED: curl unpkg]

**Critical:** STLLoader and OBJLoader from `examples/jsm/` import from `three` for `BufferGeometry`, `BufferAttribute`, `FileLoader`, `Float32BufferAttribute`, etc. Webpack 5 (CRA 5) tree-shakes ES module imports — but **only if** the loaders are imported via the ES path (`three/examples/jsm/loaders/STLLoader.js`) and Three.js's `sideEffects: false`-equivalent is honored. In practice, importing from `examples/jsm/loaders/STLLoader.js` will pull a substantial subset of `three` core (BufferGeometry + BufferAttribute + Vector3 + Box3 + supporting math). [VERIFIED: three@0.184.0 package.json `exports` confirms `./examples/jsm/*` is a valid subpath; tree-shaking quality depends on consumer bundler.]

Realistic Plan 03-01 bundle delta on the lazy-loaded `/quote` chunk: **estimate 80–120 KB gzip added** for STL+OBJ loaders + their three dependencies. This goes into a SEPARATE webpack chunk via `React.lazy(() => import('./pages/Quote'))` and does NOT inflate the main bundle for visitors who never visit `/quote`. [ASSUMED: exact gzip delta not measured — actual number must be verified after a real build; planner tracks it as a Plan 03-01 acceptance criterion.]

**Alternatives considered:**
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Three.js loaders | Hand-rolled binary STL parser (~80 LOC: read header, read 4-byte triangle count, loop reading 50-byte triangle records) + line-based OBJ parser (~120 LOC: split by newline, handle `v`/`f`/`vn`/comments) | Saves ~80 KB gzip but you own the edge cases (binary vs ASCII STL detection — first 5 bytes "solid" doesn't reliably mean ASCII, since binary STL files sometimes start with that string in the 80-byte header; OBJ negative indices, faces with >3 vertices needing fan-triangulation, mixed line endings). For a stub, the maintenance cost is low because the parsers don't change. But the bug surface is real. |
| Three.js loaders | `parse-stl@1.0.2` [VERIFIED: npm view parse-stl version] | Old (last published per npm registry — single-author, low maintenance signal). Unverified support for binary STL header edge cases. Not recommended. |
| Three.js loaders | `obj-file-parser@0.6.2` [VERIFIED: npm view obj-file-parser version] | Same maintenance concern. OBJ-only — would still need an STL parser. |
| Native dropzone | `react-dropzone@15.0.0` (60 KB min / 16 KB gzip) [VERIFIED: bundlephobia] | Saves ~50 LOC + handles edge cases (Safari dataTransfer quirks, accept-MIME spec quirks, paste-from-clipboard — but Plan 03-01 doesn't need clipboard paste). For one consumer, hand-rolling is cheaper. **Re-evaluate** if a future plan adds a second dropzone (rule-of-three). |

**Recommendation (Plan 03-01):** Use Three.js `examples/jsm/loaders/STLLoader.js` + `OBJLoader.js`, lazy-imported. Native dropzone, native picker, native DOMParser. **DO NOT install `react-dropzone`. DO NOT install `parse-stl`/`obj-file-parser`. DO NOT pre-emptively introduce a Web Worker** — D-11 says profile first, and 25MB STL parsing on the main thread is empirically OK on modern desktop browsers (a 25MB binary STL is ~500K triangles which parses in 100–300ms on a 2020+ laptop [ASSUMED]; mobile is slower but the file size cap protects). If profiling shows freezes, Web Worker becomes a follow-up plan.

### Plan 03-02+ (submission, schema, persistence)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `dompurify` | `^3.4.2` (latest) [VERIFIED: npm view dompurify version] | SVG sanitization before DOM render | The cure53 reference XSS sanitizer; SVG-aware via `USE_PROFILES: { svg: true, svgFilters: true }` config. 24 KB min / 9 KB gzip [VERIFIED: bundlephobia dompurify@3.4.2]. ONLY needed if a future plan renders user SVG to the DOM (Plan 03-01 only parses, doesn't render — D-22). |
| `resend` | `^6.12.3` (latest) [VERIFIED: npm view resend version] | Email send from Netlify Function | Project-level decision per ROADMAP §Phase 3 success criterion 3 + REQUIREMENTS QTE-07. Maintained, simple Node SDK, free tier covers <100 emails/day. **Function-only** — bundled via Netlify build, NOT in client `package.json` `dependencies`. |
| `react-google-recaptcha-v3` | `^1.11.0` [VERIFIED: npm view react-google-recaptcha-v3 version] | Client-side reCAPTCHA v3 token mint + provider | Wraps `grecaptcha.execute(siteKey, {action})`, handles script load. 9 KB min / 3.6 KB gzip [VERIFIED: bundlephobia]. Alternative: load `https://www.google.com/recaptcha/api.js` directly via `react-helmet-async` and call `window.grecaptcha.execute` — saves 3.6 KB but adds 30 LOC of plumbing. Library is the cleaner pick for a one-time integration. |
| `@netlify/functions` | `^5.2.0` [VERIFIED: npm view @netlify/functions version] | Function handler types/helpers (optional in JS) | OPTIONAL. Provides `Handler` type and `HandlerEvent`/`HandlerResponse` shapes — useful if/when migrating to TS, but with the JS lock per PROJECT.md it's just docs. Functions can be plain `exports.handler = async (event) => ({ statusCode, body })` without the package. **Recommendation: don't install it for the stub.** |

**Hand-rolled (no library) for Plan 03-02+:**
- **localStorage persistence (QTE-10):** ~25 LOC custom hook (`useLocalStorageState`) instead of `use-local-storage-state@19.5.0` (1.6 KB min / 0.8 KB gzip [VERIFIED: bundlephobia]). The library is genuinely small but matches the codebase's "don't add deps for trivial helpers" stance (cf. `encodeFormData.jsx` which is 9 LOC inline).
- **Price formatter:** `Intl.NumberFormat` (browser builtin) — no `numeral`, no `currency.js`.

**Verified install commands:**
```bash
# Plan 03-01 (front-end stub)
pnpm add three@^0.184.0

# Plan 03-02+ (submission flow — when those plans land)
pnpm add dompurify@^3.4.2 react-google-recaptcha-v3@^1.11.0
# Function-only, NOT app dep:
# pnpm add --filter ./netlify/functions/submit-quote resend@^6.12.3
# (Or simpler: place function-level package.json with `resend` dep — see §Architecture Patterns Pattern 5.)
```

### Sanity Schema (Plan 03-02+ — `pricing-rule`)

The owner-prep doc pattern from Phase 2 `02-SCHEMA-SPEC.md` carries forward [VERIFIED: file exists at `.planning/phases/02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub/02-SCHEMA-SPEC.md`]. Plan 03-02 (or whichever plan adds pricing) ships a `03-SCHEMA-SPEC.md` with the `pricing-rule` schema + a checklist for the owner. See §Code Examples below for a schema sketch.

---

## Architecture Patterns

### System Architecture Diagram

```
                    ┌──────────────────────────────────────────────┐
                    │             Browser (CRA SPA)                │
                    │  /quote route — lazy chunk                   │
                    │                                              │
                    │  ┌──────────────┐   ┌──────────────────┐    │
   visitor ────────▶│  │ QuoteTabs    │   │ FileDropzone     │    │
   (drag file)      │  │ 3D | Laser   │──▶│ - drag handlers   │    │
                    │  └──────────────┘   │ - picker fallback │    │
                    │         │            │ - format guard    │    │
                    │         │            │ - 25MB cap        │    │
                    │         │            └────────┬──────────┘    │
                    │         │                     │ File ArrayBuffer
                    │         │                     ▼               │
                    │         │            ┌──────────────────┐    │
                    │         │            │ Parsers (lazy)   │    │
                    │         │            │ • parseStl       │    │
                    │         │            │ • parseObj       │    │
                    │         │            │ • parseSvg       │    │
                    │         │            └────────┬──────────┘    │
                    │         │                     │ {volume, bbox, paths…}
                    │         │                     ▼               │
                    │         │            ┌──────────────────┐    │
                    │         │            │ GeometrySummary  │    │
                    │         │            │ <dl> rhythm      │    │
                    │         │            └──────────────────┘    │
                    │         ▼                                     │
                    │  ┌──────────────────┐  ┌─────────────────┐  │
                    │  │ MaterialPicker   │  │ QuantityInput   │  │
                    │  │ (Plan 03-02+)    │  │ (Plan 03-02+)   │  │
                    │  │ Sanity-driven    │  │                 │  │
                    │  └────────┬─────────┘  └────────┬────────┘  │
                    │           │                     │            │
                    │           ▼                     ▼            │
                    │       ┌────────────────────────────────┐    │
                    │       │  PriceRange (Plan 03-02+)      │    │
                    │       │  geometry × pricing-rule       │    │
                    │       │  → range with markup buffer    │    │
                    │       └──────────────┬─────────────────┘    │
                    │                      │                       │
                    │                      ▼                       │
                    │              ┌───────────────┐               │
                    │              │ QuoteSubmit   │               │
                    │              │ (Plan 03-02+) │               │
                    │              └───────┬───────┘               │
                    │                      │                       │
                    │  + grecaptcha.execute(siteKey, {action})    │
                    │     produces token                           │
                    └──────────────────────┼───────────────────────┘
                                           │
                                           │ POST {metadata, token}
                                           ▼
                            ┌────────────────────────────────┐
                            │   Netlify Function             │
                            │   netlify/functions/           │
                            │     submit-quote.js            │
                            │                                │
                            │   1. Validate input shape      │
                            │   2. POST verify-token to      │
                            │      google.com/recaptcha/     │
                            │      api/siteverify (with      │
                            │      RECAPTCHA_SECRET_KEY)     │
                            │   3. Check score >= 0.5        │
                            │   4. resend.emails.send({...}) │
                            │   5. Return { ok: true }       │
                            └────────────────────────────────┘
                                           │
                                           ├─▶ Resend API → owner's inbox
                                           │
                                           └─▶ google.com/recaptcha/api/siteverify

┌────────────────────────────────────────────────────────────┐
│  Sanity CDN (anonymous read, existing useSanityQuery hook) │
│   • material[]   (filtered by service)                     │
│   • pricing-rule (NEW Plan 03-02+; per-material)           │
│   • studio-info  (existing — responseTimePromise)          │
└────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

Mirrors Phase 2's UI-SPEC §"Component Inventory" verbatim — components live in `src/components/quote/` (new feature folder), parsers in `src/utilities/quote/` (plain `.js`, no JSX), netlify functions in `netlify/functions/` (new top-level dir, sibling to `src/`):

```
src/
├── pages/
│   └── Quote.jsx                   # NEW (Plan 03-01) — lazy-loaded
├── components/
│   └── quote/                      # NEW feature folder
│       ├── QuoteTabs.jsx           # Plan 03-01 — WAI-ARIA tabs + framer-motion crossfade
│       ├── FileDropzone.jsx        # Plan 03-01 — drag + picker, native HTML5
│       ├── GeometrySummary.jsx     # Plan 03-01 — definition-list <dl> rhythm
│       ├── MaterialPicker.jsx      # Plan 03-02+
│       ├── QuantityInput.jsx       # Plan 03-02+
│       ├── PriceRange.jsx          # Plan 03-02+
│       ├── QuoteSubmit.jsx         # Plan 03-02+
│       └── QuoteRestoreBanner.jsx  # Plan 03-02+
├── utilities/
│   └── quote/                      # NEW — pure parsers
│       ├── parseStl.js             # Plan 03-01 — wraps three STLLoader, computes signed-tetrahedra volume
│       ├── parseObj.js             # Plan 03-01 — wraps three OBJLoader, same volume math
│       └── parseSvg.js             # Plan 03-01 — DOMParser + getTotalLength() + viewBox unit normalization
└── data/
    └── (existing — no changes for Plan 03-01; no acceptedFileFormats added unless planner chooses to extend SERVICES per CONTEXT.md "Code Insights")

netlify/                            # NEW top-level (Plan 03-02+)
└── functions/
    └── submit-quote/
        ├── submit-quote.js         # handler — validates + verifies reCAPTCHA + sends via Resend
        └── package.json            # function-local deps (resend); see Pattern 5

netlify.toml                        # MODIFIED Plan 03-02+ — add [functions] directory = "netlify/functions"
```

### Pattern 1: `/quote` route registration in `App.js`

Mirror existing `Shop` / `NotFound` lazy-load pattern. Add ONE route — no SERVICES.map iteration since `/quote` is a single surface (D-04).

```jsx
// src/App.js — add to existing imports + lazy block + route block
const Quote = lazy(() => import('./pages/Quote'));

// Inside <Routes>, alongside existing /shop, /about, /contact:
<Route path="/quote" element={<Quote />} />
```

Add `/quote` to `STATIC_ROUTES` in `scripts/generate-sitemap.cjs` so the postbuild sitemap.xml emits it.

### Pattern 2: Tab pre-fill cascade (mirrors `ContactForm.jsx` D-24)

```jsx
// src/components/quote/QuoteTabs.jsx — initial active tab logic
import { useEffect, useState } from 'react';
import { SERVICES } from '../../data/services';

const QuoteTabs = () => {
	const [activeKey, setActiveKey] = useState('print'); // 3D default per UI-SPEC

	useEffect(() => {
		// Cascade matches ContactForm.jsx:35-52 verbatim semantics.
		const queryService = new URLSearchParams(window.location.search).get('service');
		if (queryService) {
			const m = SERVICES.find(
				(s) => s.key === queryService || s.urlSegment === queryService
			);
			if (m) {
				setActiveKey(m.key);
				return;
			}
		}
		const referrer =
			(typeof document !== 'undefined' && document.referrer) || '';
		const rule = SERVICES.find((s) => referrer.includes(`/${s.urlSegment}`));
		if (rule) setActiveKey(rule.key);
		// else stay at default 'print'
	}, []);

	// ... render tabs (WAI-ARIA pattern) + active panel
};
```

URL is NOT updated when the user clicks the other tab — `?service=` is read-only on mount, per UI-SPEC §"Tab UI" Tabs are visual, NOT URL-deep-linked.

### Pattern 3: WAI-ARIA tabs (no library)

```jsx
// Skeleton — full render in src/components/quote/QuoteTabs.jsx
<div role="tablist" aria-label="Quote tool service">
	{SERVICES.map((s) => (
		<button
			key={s.key}
			role="tab"
			id={`tab-${s.key}`}
			aria-selected={activeKey === s.key}
			aria-controls={`panel-${s.key}`}
			tabIndex={activeKey === s.key ? 0 : -1}
			onClick={() => setActiveKey(s.key)}
			onKeyDown={handleArrowNav}
			className={
				activeKey === s.key
					? 'text-primary-light font-general-medium border-b-2 border-accent pb-2'
					: 'text-ternary-section-dark hover:text-primary-light pb-2'
			}
		>
			{s.key === 'laser' ? 'Laser Cutting' : '3D Printing'}
		</button>
	))}
</div>
<AnimatePresence mode="wait">
	<motion.div
		key={activeKey}
		role="tabpanel"
		id={`panel-${activeKey}`}
		aria-labelledby={`tab-${activeKey}`}
		initial={{ opacity: 0, y: 8 }}
		animate={{ opacity: 1, y: 0 }}
		exit={{ opacity: 0, y: -8 }}
		transition={{ duration: 0.2 }}
	>
		{/* Active tab panel content */}
	</motion.div>
</AnimatePresence>
```

`handleArrowNav` cycles between tabs on `ArrowLeft`/`ArrowRight`/`Home`/`End` per UI-SPEC.

### Pattern 4: Native dropzone (no `react-dropzone`)

```jsx
// src/components/quote/FileDropzone.jsx — skeleton
const FileDropzone = ({ acceptedExtensions, maxBytes, onFile, onError }) => {
	const inputRef = useRef(null);
	const [dragActive, setDragActive] = useState(false);
	const [error, setError] = useState('');

	const validate = (file) => {
		const ext = file.name.split('.').pop().toLowerCase();
		if (!acceptedExtensions.includes(ext)) {
			return { code: 'WRONG_FORMAT', ext };
		}
		if (file.size > maxBytes) {
			return { code: 'TOO_LARGE', sizeMB: (file.size / 1024 / 1024).toFixed(1) };
		}
		return null;
	};

	const handleFile = (file) => {
		const err = validate(file);
		if (err) {
			setError(formatError(err)); // copy from UI-SPEC §"File-rejection error copy"
			onError(err);
			return;
		}
		setError('');
		onFile(file);
	};

	return (
		<div
			role="region"
			aria-label="File upload"
			onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
			onDragLeave={() => setDragActive(false)}
			onDrop={(e) => {
				e.preventDefault();
				setDragActive(false);
				const file = e.dataTransfer.files?.[0];
				if (file) handleFile(file);
			}}
			className={dragActive
				? 'border-2 border-solid border-accent bg-ternary-dark rounded-xl p-12 text-center'
				: 'border-2 border-dashed border-secondary-section-dark bg-ternary-dark/40 rounded-xl p-12 text-center cursor-pointer'}
		>
			<label htmlFor="quote-file" className="cursor-pointer block">
				<FiUploadCloud className="mx-auto text-5xl text-ternary-section-dark mb-3" />
				{/* Idle/drag-over copy from UI-SPEC §Copywriting Contract */}
				{dragActive
					? <p>Drop the file to upload.</p>
					: <p>Drop your {acceptedExtensions.map(e => e.toUpperCase()).join(' or ')} here. Or click to choose a file. (max {maxBytes / 1024 / 1024}MB)</p>}
			</label>
			<input
				ref={inputRef}
				id="quote-file"
				type="file"
				accept={acceptedExtensions.map(e => `.${e}`).join(',')}
				onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
				className="sr-only"
			/>
			{error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}
		</div>
	);
};
```

`e.preventDefault()` on `onDragOver` is REQUIRED — without it, the browser's default drop behavior (open the file as a tab) fires and overrides React's handler. This is the most common drag-and-drop bug in React apps.

### Pattern 5: Netlify Function for submission (Plan 03-02+)

**Directory & config:**

```toml
# netlify.toml — ADD this section (existing [build] block stays)
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

**Function file:**

```js
// netlify/functions/submit-quote/submit-quote.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
	if (event.httpMethod !== 'POST') {
		return { statusCode: 405, body: 'Method not allowed' };
	}

	let payload;
	try {
		payload = JSON.parse(event.body);
	} catch {
		return { statusCode: 400, body: 'Invalid JSON' };
	}

	// 1. Shape validation (manual — no zod/joi to keep function bundle small)
	const required = ['name', 'email', 'service', 'recaptchaToken', 'metadata'];
	for (const k of required) {
		if (!payload[k]) return { statusCode: 400, body: `Missing ${k}` };
	}

	// 2. reCAPTCHA v3 server verify
	const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			secret: process.env.RECAPTCHA_SECRET_KEY,
			response: payload.recaptchaToken,
		}),
	});
	const verifyJson = await verifyRes.json();

	// Recommended threshold: 0.5 per Google docs (lenient for low-volume sites);
	// raise to 0.7 if spam volume warrants.
	if (!verifyJson.success || (verifyJson.score ?? 0) < 0.5) {
		return { statusCode: 403, body: 'Spam check failed' };
	}

	// 3. Send email via Resend
	try {
		await resend.emails.send({
			from: 'Shapesmith Studio <quotes@shapesmith.studio>', // verified sender domain required
			to: ['jkrush@shapesmith.studio'],
			reply_to: payload.email,
			subject: `[Quote] ${payload.service} — ${payload.name}`,
			text: formatQuoteText(payload), // hand-roll plain-text body, no React Email template
		});
	} catch (e) {
		console.error('Resend failed:', e);
		return { statusCode: 502, body: 'Email send failed' };
	}

	return {
		statusCode: 200,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ok: true }),
	};
};

function formatQuoteText(p) {
	const m = p.metadata;
	return [
		`Service: ${p.service}`,
		`From: ${p.name} <${p.email}>`,
		'',
		`File: ${m.filename} (${m.fileSizeMB} MB)`,
		m.volumeCm3 ? `Volume: ${m.volumeCm3} cm³` : null,
		m.bbox ? `Bounding box: ${m.bbox}` : null,
		m.pathLengthMm ? `Total cut length: ${m.pathLengthMm} mm` : null,
		`Material: ${m.materialName}`,
		`Quantity: ${m.quantity}`,
		`Estimated range: $${m.priceLow}–$${m.priceHigh}`,
		'',
		'Reply to this email with a real quote.',
	].filter(Boolean).join('\n');
}
```

**Function-local package.json** (so `resend` is bundled into the function but NOT into the SPA):

```json
{
	"name": "submit-quote",
	"private": true,
	"dependencies": {
		"resend": "^6.12.3"
	}
}
```

Netlify auto-installs function-local `package.json` deps at build time. The root SPA `package.json` does NOT include `resend`.

**Environment variables (Netlify dashboard, Site Settings → Environment):**
- `RESEND_API_KEY` — from resend.com dashboard after sender domain verified
- `RECAPTCHA_SECRET_KEY` — from google.com/recaptcha admin (paired with v3 site key)

**Site key (public, browser):** Wired into `<GoogleReCaptchaProvider reCaptchaKey="...">` in `App.js` or scoped just to `Quote.jsx`. Either via a `REACT_APP_RECAPTCHA_SITE_KEY` env var (existing CRA pattern) OR hardcoded inline (it's public; safe). REACT_APP_ env prefix is the CRA contract for browser-exposed vars [VERIFIED: package.json scripts use `react-scripts start` which honors REACT_APP_*].

**Local dev:** `netlify dev` proxies the CRA dev server (port 3000) and serves functions at `http://localhost:8888/.netlify/functions/submit-quote`. Add `netlify-cli` as a devDependency or use `npx netlify dev`. The client should POST to a *relative* URL `/.netlify/functions/submit-quote` so the same code works locally and in prod.

### Pattern 6: Sanity `pricing-rule` schema (Plan 03-02+)

Schema sketch — owner adds to Sanity Studio per a forthcoming `03-SCHEMA-SPEC.md` (mirroring Phase 2's `02-SCHEMA-SPEC.md` rollout pattern):

```ts
// pricing-rule.ts (Sanity v3 defineType syntax)
import { defineType, defineField } from 'sanity';

export default defineType({
	name: 'pricing-rule',
	type: 'document',
	title: 'Pricing Rule',
	fields: [
		defineField({
			name: 'material',
			type: 'reference',
			to: [{ type: 'material' }],
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'ratePerCm3',
			type: 'number',
			title: 'Rate per cm³ (USD) — 3D printing',
			description: 'For 3D printing materials. Multiplied by signed-tetrahedra volume.',
		}),
		defineField({
			name: 'ratePerMm',
			type: 'number',
			title: 'Rate per mm of cut length (USD) — laser',
			description: 'For laser materials. Multiplied by total path length.',
		}),
		defineField({
			name: 'machineTimeMultiplier',
			type: 'number',
			title: 'Machine time multiplier',
			description: 'Adjusts for slow / fast geometry. Default 1.0.',
			initialValue: 1.0,
		}),
		defineField({
			name: 'setupFee',
			type: 'number',
			title: 'Setup fee (USD)',
			description: 'Flat cost added per submission regardless of size.',
		}),
		defineField({
			name: 'density',
			type: 'number',
			title: 'Density (g/cm³) — 3D only',
			description: 'For sanity-checking part weight (optional).',
		}),
		defineField({
			name: 'markupBufferLow',
			type: 'number',
			title: 'Range low markup (%)',
			description: 'e.g., 15 = price low end is 15% above formula.',
			initialValue: 15,
		}),
		defineField({
			name: 'markupBufferHigh',
			type: 'number',
			title: 'Range high markup (%)',
			description: 'e.g., 25 = price high end is 25% above formula.',
			initialValue: 25,
		}),
	],
});
```

**Recommended cardinality:** **One `pricing-rule` per `material`** (one-to-one ref from rule → material). NOT embedded inside `material` (keeps the material schema unchanged from Phase 2 + lets the owner publish/unpublish pricing without unpublishing the material). NOT a singleton — there's one rule document per material.

**GROQ for the picker:**
```groq
*[_type == "material" && $serviceKey in services] | order(order asc){
  _id, title,
  "pricing": *[_type == "pricing-rule" && references(^._id)][0]{
    ratePerCm3, ratePerMm, machineTimeMultiplier, setupFee, density,
    markupBufferLow, markupBufferHigh
  }
}
```

If `pricing` is null for a given material, the price-range component renders "Pricing not yet configured for this material — please [contact us](/contact) for a manual quote" and disables submit.

**Range computation (3D example):**
```js
// For 3D: price = (volume_cm3 × ratePerCm3 + setupFee) × machineTimeMultiplier × quantity
// For laser: price = (pathLength_mm × ratePerMm + setupFee) × machineTimeMultiplier × quantity
const baseFor = (g, p) => g.mode === '3d'
	? (g.volumeCm3 * p.ratePerCm3 + p.setupFee) * p.machineTimeMultiplier * g.quantity
	: (g.pathLengthMm * p.ratePerMm + p.setupFee) * p.machineTimeMultiplier * g.quantity;

const base = baseFor(geometry, pricing);
const low  = base * (1 + pricing.markupBufferLow  / 100);
const high = base * (1 + pricing.markupBufferHigh / 100);
return { low, high };
```

The QTE-05 contract is "always a range, never a point" — so the formula MUST output two numbers. Even if `markupBufferLow === markupBufferHigh`, render `$X – $X` with the em-dash so the format never collapses to a single value (avoids accidentally implying a binding price).

### Pattern 7: localStorage persistence (Plan 03-02+, QTE-10)

```jsx
// src/hooks/useLocalStorageState.jsx — hand-rolled, ~25 LOC
import { useState, useEffect } from 'react';

const useLocalStorageState = (key, initialValue) => {
	const [value, setValue] = useState(() => {
		try {
			const stored = window.localStorage.getItem(key);
			return stored !== null ? JSON.parse(stored) : initialValue;
		} catch {
			return initialValue;
		}
	});

	useEffect(() => {
		try {
			if (value === undefined || value === null) {
				window.localStorage.removeItem(key);
			} else {
				window.localStorage.setItem(key, JSON.stringify(value));
			}
		} catch {
			// QuotaExceededError or disabled storage — fail silently
		}
	}, [key, value]);

	return [value, setValue];
};

export default useLocalStorageState;
```

**Storage key:** `shapesmith-quote-v1` (versioned in case the shape changes later).

**Stored shape (small, no PII, NO file contents):**
```json
{
	"tab": "print",
	"materialId": "abc123",
	"quantity": 3
}
```

NOT stored: file contents, file name, file metadata, geometry readouts (re-derivable from the file the visitor re-uploads, and not worth the 5MB localStorage cap risk).

**Auto-clear on submit:** Successful submission handler calls `setQuoteState(null)` which removes the key. Prevents stale "we restored your selections" UI for the next visitor on a shared browser.

### Anti-Patterns to Avoid

- **Importing the full `three` package:** `import * as THREE from 'three'` pulls 182 KB gzip into the chunk. Use `import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'` (subpath import) so webpack tree-shakes the unused renderer/scene/camera/animation/shader modules.
- **Using Netlify Forms for the quote submission:** Phase 2's `public/index.html` hidden form prerender + `data-netlify="true"` pattern (D-28) is the WRONG pattern for QTE-07. Forms is fire-and-forget — there's no server-side hook to verify reCAPTCHA before the email fires. Use a Netlify Function instead.
- **Bundling `resend` into the SPA:** Even though the SDK is small, importing it from `src/` would (a) inflate the client chunk and (b) expose attack surface. Resend must ONLY be imported from `netlify/functions/`.
- **Hardcoding the reCAPTCHA secret key in client code:** The `secret_key` is server-only. Only the `site_key` is browser-safe. Mixing them is a credential leak.
- **Calling `getElementById` on user-uploaded SVG:** Even before DOMPurify lands (Plan 03-02+), Plan 03-01's SVG parsing must use `DOMParser` to construct an isolated document — NEVER append the user SVG to the live DOM. Path-length math runs against the parsed but un-rendered SVG. (See §Common Pitfalls 5.)
- **Persisting file contents in localStorage:** 5MB cap, slow JSON serialization of binary, customer privacy risk if the file is sensitive geometry. Persist tab + material + quantity only.
- **Treating the price as a point value anywhere in the UI or in an email:** QTE-05 + UI-SPEC lock the range format. Even the email to the owner shows `$low – $high`, NOT a single number. (Owner replies with the real point value in their manual quote.)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| STL parsing (binary + ASCII detection) | Custom ArrayBuffer reader | `three/examples/jsm/loaders/STLLoader.js` | Binary STL detection is non-trivial — the first 5 bytes of a binary STL can spell "solid" (the ASCII signature). Real-world detection requires reading the 80-byte header + 4-byte triangle count and checking if `expectedFileSize === 80 + 4 + triangleCount * 50`. STLLoader does this; hand-rolled parsers usually don't. |
| OBJ parsing (multi-mesh, faces with > 3 vertices) | Line-based custom parser | `three/examples/jsm/loaders/OBJLoader.js` | OBJ files can have faces with 4+ vertices (quads, n-gons) requiring fan-triangulation. They can have negative vertex indices (relative to the end of the list). They can have multiple `o`/`g` blocks. OBJLoader handles all of this. |
| Email delivery from a serverless function | Raw SMTP, raw Nodemailer | `resend` SDK | Resend handles SPF/DKIM signing, retry, bounce tracking, free-tier quota tracking. SMTP from Netlify Functions has IP-reputation issues (shared IP pool). |
| reCAPTCHA v3 token mint on client | Manual `<script>` tag + window polling | `react-google-recaptcha-v3` | Library handles script load deferral, token expiry (2 min), action namespacing, and provider context. Saves ~30 LOC of plumbing. |
| Sanitizing user SVG before render | Custom regex / element strip | `dompurify` (when SVG renders to DOM in Plan 03-02+) | XSS via SVG is well-trodden ground (script-in-foreignObject, javascript: in href, on* event handlers, CSS expression). DOMPurify with `USE_PROFILES: { svg: true }` is the reference allowlist. Plan 03-01 doesn't render SVG — DOMPurify is deferred. |
| URL-form-data encoding | Inline `encodeURIComponent` chain | `src/utilities/encodeFormData.jsx` (existing) | Only relevant if a plan reverts to Netlify Forms. The Function path uses JSON, so this utility may not be needed in Phase 3 at all. |
| Currency formatting | `numeral`, `currency.js` | `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` | Browser builtin. Handles thousands separators, decimals, locale. ~3 LOC. |

**Hand-roll OK (low complexity, no edge cases):**
- Drag-and-drop dropzone (HTML5 spec is stable; ~50 LOC; one consumer in this phase) — see Pattern 4.
- Signed-tetrahedra volume math (~10 LOC; no library equivalent worth the dep) — see §Code Examples.
- SVG path-length sum (`Array.from(doc.querySelectorAll('path')).reduce(...)`) — see §Code Examples.
- Tabs (~80 LOC including ARIA + keyboard nav; one consumer; no library worth the dep) — see Pattern 3.
- localStorage hook (~25 LOC; one consumer) — see Pattern 7.

**Key insight:** This phase is at a sweet spot where the file-format parsers are too complex to hand-roll (real spec edge cases) but the UI plumbing (tabs, dropzone, localStorage) is small enough that adding deps for one-off consumers costs more than it saves. Split the bundle accordingly.

---

## Common Pitfalls

### Pitfall 1: Binary vs ASCII STL detection
**What goes wrong:** Hand-rolled parser checks if the file starts with `"solid "` to decide ASCII vs binary. Sometimes it's wrong — binary STL files can contain "solid" in the 80-byte header bytes, leading to a parse attempt that produces 0 triangles or garbage geometry.
**Why it happens:** The STL spec doesn't enforce a magic number for binary files. Detection requires comparing `file.size` against `80 + 4 + triangleCount * 50` (the expected binary size given the triangle count read from bytes 80-84).
**How to avoid:** Use `three/examples/jsm/loaders/STLLoader.js` — its `parse()` does the size check correctly [VERIFIED: STLLoader.js source available at unpkg].
**Warning signs:** Parsed mesh has 0 triangles, volume is `NaN`, or rendered preview is completely empty.

### Pitfall 2: Mesh winding orientation flips signed volume
**What goes wrong:** Signed-tetrahedra formula sums `dot(v0, cross(v1, v2)) / 6` per triangle. If a mesh has reversed winding (CW instead of CCW per the STL convention), the result is negative.
**Why it happens:** Some CAD tools export with reversed winding. The mesh is geometrically correct but the signed volume comes out flipped.
**How to avoid:** Take `Math.abs(signedVolume)` at the end. The studio is showing volume, not direction — sign doesn't matter.
**Warning signs:** Volume reads as negative (would never display correctly anyway, but documenting the cause).

### Pitfall 3: Non-watertight meshes give wrong volume
**What goes wrong:** Signed-tetrahedra assumes the mesh is closed (every edge belongs to exactly two triangles). Open meshes (holes, missing faces, single-sided shells) give a wrong but plausible-looking number.
**Why it happens:** The divergence-theorem identity holds only for closed surfaces. An open mesh effectively integrates over a non-closed surface and gives garbage.
**How to avoid:** Three options:
1. **Document the assumption** in the UI: a small "Volume assumes a closed mesh — if your model is hollow or has missing faces, this number will be off." note next to the volume readout (no separate validation needed).
2. **Detect non-watertight meshes** by counting edges and checking each is shared by exactly two triangles. Adds parsing cost; for stub, defer.
3. **Just trust it** — most printable STLs are watertight by definition (slicers reject non-watertight meshes anyway). Studio's audience is hobbyists with already-printable files.
**Recommendation:** Option 1 (document) for Plan 03-01. Option 2 is a v2 nicety.
**Warning signs:** Volume seems wildly off compared to the bbox (e.g., a 10×10×10 mm cube reading 50 cm³).

### Pitfall 4: SVG `getTotalLength()` returns user units, not mm
**What goes wrong:** `path.getTotalLength()` returns a value in the SVG's user-unit coordinate space, NOT millimeters. If the SVG has `viewBox="0 0 200 100"` with `width="200mm" height="100mm"`, user units = mm; great. But if the SVG has `width="800px" height="400px"` with the same viewBox, user units are still relative to the viewBox (not the px width), and the visitor's intent (the design is 200mm wide) gets lost — the path-length number is off by a factor of `width_unit_ratio`.
**Why it happens:** SVG's coordinate system is intentionally device-independent. Inkscape's "default" exports vary by user pref; LightBurn typically saves with mm-aligned viewBox; design-tool exports (Figma, Illustrator) often save with px units that don't map to mm.
**How to avoid:**
1. Read both `viewBox` and `width`/`height` attributes from `<svg>` root.
2. If `width` ends with `mm`, user-unit ≈ mm if `viewBox` width === parseFloat(width). If `width` is px or unitless, user units are ambiguous.
3. Compute a scale factor: `scaleFactor = (parseFloat(widthMm) / viewBoxWidth)` where `widthMm` is normalized via the unit (mm passes through, in × 25.4, px / 3.7795 ≈ assumes 96dpi — which is the SVG default per CSS spec).
4. If unit can't be confidently inferred (no width/height attrs, or unitless), surface the unit-warning footnote per UI-SPEC §"Geometry readout panel" instead of guessing silently.
**Warning signs:** Path length reads 10000 mm for a small business-card-sized cut; or path length reads 0.5 mm for a poster-sized engrave.

### Pitfall 5: SVG injection via DOM render
**What goes wrong:** A future plan adds an SVG preview ("here's what we'll cut") and renders the user's SVG into the live DOM via `dangerouslySetInnerHTML` or by appending the parsed SVG to a container. The user's SVG contains `<script>alert(1)</script>` or `<a href="javascript:..."` or `onload="..."`, which executes in the page's origin and can steal Sanity tokens (none here, but the risk pattern is general) or hijack the form.
**Why it happens:** SVG is a rich DOM document with the same XSS surface as HTML. `<script>`, event handlers, `xlink:href`, `<foreignObject>` all execute.
**How to avoid:** Plan 03-01 is SAFE — it parses with `DOMParser('image/svg+xml')` into an *isolated* document and only reads geometry; never appends the user document to the live page. Plan 03-02+ that adds a visible preview MUST run user SVG through DOMPurify first:
```js
import DOMPurify from 'dompurify';
const cleanSvg = DOMPurify.sanitize(rawSvgString, { USE_PROFILES: { svg: true, svgFilters: true } });
container.innerHTML = cleanSvg;
```
**Warning signs:** None — this is a silent-failure class. Defense is preventive, not reactive. CSP headers (already absent from the project) are a defense-in-depth layer; DOMPurify is the primary control.

### Pitfall 6: Drag-and-drop swallowed by browser default
**What goes wrong:** User drops a file on the dropzone, the browser opens the file as a new tab, the React handler never fires.
**Why it happens:** The default browser action for drag-and-drop is "navigate to the dropped file." React's synthetic `onDrop` only suppresses this if `e.preventDefault()` is called — and CRITICALLY, `e.preventDefault()` must ALSO be called in `onDragOver`, otherwise the drop event never fires at all.
**How to avoid:** ALWAYS preventDefault in BOTH `onDragOver` AND `onDrop`. See Pattern 4.
**Warning signs:** Drop opens the file as a tab; React handler never logs.

### Pitfall 7: Three.js tree-shaking partial — bundle bigger than expected
**What goes wrong:** `import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'` pulls more from `three` than just BufferGeometry — it transitively imports a chunk of three's math + core. Webpack 5 in CRA 5 doesn't always tree-shake the way Vite does.
**Why it happens:** CRA 5's webpack config marks `three` per its package.json `sideEffects` field but examples/jsm files weren't designed for tree-shaking — they expect the full `three` to be available. [VERIFIED: three@0.184.0 hasSideEffects includes `./src/nodes/**/*` per bundlephobia, but examples/jsm has its own characteristics.]
**How to avoid:**
1. Lazy-load the `/quote` route (`React.lazy`) so the cost is paid only by visitors who go there.
2. Measure actual bundle delta with `react-scripts build` + inspect `build/static/js/*.chunk.js` sizes after Plan 03-01 lands. If the `/quote` chunk exceeds ~150 KB gzip, that's the signal to (a) hand-roll parsers, (b) move to a Web Worker that loads parsers off the main bundle, or (c) accept the cost since Phase 4 Vite migration will improve the situation. Document the measured delta in `03-01-SUMMARY.md`.
**Warning signs:** Production bundle of `/quote` chunk significantly larger than the 80–120 KB gzip estimate — investigate.

### Pitfall 8: Resend sender domain not verified → silent send failures
**What goes wrong:** Function calls `resend.emails.send({ from: 'quotes@shapesmith.studio', ... })` but the domain isn't verified in Resend dashboard → API returns an error → owner never receives the email → visitor sees "submitted" UI but estimate is lost.
**Why it happens:** Resend requires DNS-verified SPF + DKIM records on the sending domain before it'll accept a `from` address on that domain [CITED: resend.com/docs/dashboard/domains]. Verification can take minutes to hours after DNS changes propagate.
**How to avoid:**
1. Owner adds Resend's DNS records to shapesmith.studio's DNS provider BEFORE the QTE-07 plan ships (owner-prep checkpoint, mirroring Phase 2's Sanity-schema-first pattern).
2. Function logs `resend.emails.send` errors and returns 502 — visitor sees "send failed, please try again or email us directly" inline message, not a false success.
3. Plan acceptance criterion: a real test submission lands in the owner's inbox before the plan is marked complete.
**Warning signs:** 502 from the function; Resend dashboard shows blocked sends; owner reports "I didn't get the email."

### Pitfall 9: reCAPTCHA v3 score threshold too aggressive
**What goes wrong:** Default Google docs example uses `score >= 0.5`; some tutorials use 0.7. Set too high, real users get rejected. Set too low, spam slips through.
**Why it happens:** v3 returns a score 0.0–1.0 (likelihood of being human). Real users on slow connections, mobile, VPN, or aggressive privacy settings get scores in 0.3–0.5 range.
**How to avoid:** Start at 0.5 (Google's recommended default for low-risk sites). Monitor the Google reCAPTCHA admin console for score distribution after launch. Tune up only if the studio sees real spam volume.
**Warning signs:** Real visitors complain submissions silently fail; OR owner sees a flood of bot submissions get through.

### Pitfall 10: Function timeout on Resend slow path
**What goes wrong:** Resend API has a transient slowdown, the function exceeds Netlify's 10-second sync function timeout, the visitor sees a timeout error, but the email may have actually been sent in the background.
**Why it happens:** Network round-trip to google-recaptcha + resend can occasionally exceed expected latency. Netlify sync functions default to 10s.
**How to avoid:**
1. Set sensible per-call timeouts on `fetch()` calls inside the function (5s for recaptcha, 5s for Resend).
2. If the path becomes hot, migrate to Netlify Background Functions (15-min timeout) — but this is out of scope for the initial submission.
3. Idempotency: include a client-generated UUID in the payload so retries don't double-email the owner. (Optional v2 polish; not blocking.)
**Warning signs:** Visitor reports "submit hung" but owner received the email anyway.

---

## Code Examples

Verified patterns. Sources cited. All examples assume CRA 5 + React 18 + JS conventions per CLAUDE.md.

### STL parsing + signed-tetrahedra volume

```js
// src/utilities/quote/parseStl.js
// Source: three/examples/jsm/loaders/STLLoader.js (parse), divergence-theorem volume math
//   (https://n-e-r-v-o-u-s.com/blog/?p=4415 reference implementation)
//   [CITED: rosenzweig.io/blog/hilariously-fast-volume-computation-with-the-divergence-theorem.html]

import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const loader = new STLLoader();

export const parseStl = (arrayBuffer, fileSizeBytes) => {
	const geometry = loader.parse(arrayBuffer);
	// geometry is a THREE.BufferGeometry
	const positions = geometry.attributes.position.array; // Float32Array, 9 values per triangle (3 verts × xyz)
	const triangleCount = positions.length / 9;

	let signedVolumeMm3 = 0;
	let minX = Infinity, minY = Infinity, minZ = Infinity;
	let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

	for (let i = 0; i < positions.length; i += 9) {
		const v0x = positions[i],     v0y = positions[i + 1], v0z = positions[i + 2];
		const v1x = positions[i + 3], v1y = positions[i + 4], v1z = positions[i + 5];
		const v2x = positions[i + 6], v2y = positions[i + 7], v2z = positions[i + 8];

		// Signed volume of tetrahedron formed by triangle (v0,v1,v2) and origin:
		// (1/6) · v0 · (v1 × v2)
		const cx = v1y * v2z - v1z * v2y;
		const cy = v1z * v2x - v1x * v2z;
		const cz = v1x * v2y - v1y * v2x;
		signedVolumeMm3 += (v0x * cx + v0y * cy + v0z * cz) / 6;

		// Bbox accumulation
		minX = Math.min(minX, v0x, v1x, v2x); maxX = Math.max(maxX, v0x, v1x, v2x);
		minY = Math.min(minY, v0y, v1y, v2y); maxY = Math.max(maxY, v0y, v1y, v2y);
		minZ = Math.min(minZ, v0z, v1z, v2z); maxZ = Math.max(maxZ, v0z, v1z, v2z);
	}

	const volumeMm3 = Math.abs(signedVolumeMm3); // winding-flip safe
	const volumeCm3 = volumeMm3 / 1000;

	return {
		mode: '3d',
		triangleCount,
		volumeCm3: Number(volumeCm3.toFixed(2)),
		volumeIn3: Number((volumeCm3 / 16.387).toFixed(2)),
		bbox: {
			w: Number((maxX - minX).toFixed(1)),
			d: Number((maxY - minY).toFixed(1)),
			h: Number((maxZ - minZ).toFixed(1)),
		},
		fileSizeMB: Number((fileSizeBytes / 1024 / 1024).toFixed(2)),
	};
};
```

**STL units:** STL files are unitless. Convention is mm — almost universally true for hobbyist CAD (Bambu Studio, PrusaSlicer, Cura, Fusion 360 export) [ASSUMED: industry convention, not enforced by file format]. We assume mm and the volume formula returns cm³ via `/1000`. If a future submission turns out to be in inches (rare), the pricing's `markupBufferHigh` covers the discrepancy.

### OBJ parsing (same volume math)

```js
// src/utilities/quote/parseObj.js
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const loader = new OBJLoader();

export const parseObj = (text, fileSizeBytes) => {
	const group = loader.parse(text); // THREE.Group
	const positions = [];
	group.traverse((obj) => {
		if (obj.isMesh && obj.geometry?.attributes?.position) {
			const p = obj.geometry.attributes.position.array;
			for (let i = 0; i < p.length; i++) positions.push(p[i]);
		}
	});
	// Then run the same triangle loop as parseStl from positions[]
	// ... (identical volume + bbox math) ...
};
```

### SVG parsing (path length + bbox + unit handling)

```js
// src/utilities/quote/parseSvg.js
// No external deps — uses browser DOMParser + SVGPathElement.getTotalLength()
// [VERIFIED: MDN SVGGeometryElement.getTotalLength is widely supported]
// [CITED: wiki.inkscape.org/wiki/Units_In_Inkscape — 1mm = 3.7795 user-unit-px @ 96dpi]

const PX_PER_MM = 96 / 25.4; // ≈ 3.7795 — SVG default DPI per CSS spec
const PX_PER_IN = 96;

const parseUnit = (val) => {
	if (!val) return null;
	const m = val.match(/^([\d.]+)\s*(mm|cm|in|pt|px|)?$/);
	if (!m) return null;
	const n = parseFloat(m[1]);
	const u = m[2] || '';
	switch (u) {
		case 'mm': return n;
		case 'cm': return n * 10;
		case 'in': return n * 25.4;
		case 'pt': return n * 25.4 / 72;
		case 'px':
		case '':  return n / PX_PER_MM; // assume 96dpi
		default:  return null;
	}
};

export const parseSvg = (text, fileSizeBytes) => {
	const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
	const svg = doc.documentElement;
	if (svg.tagName !== 'svg') throw new Error('NOT_SVG');

	// Read viewBox + width/height
	const vb = svg.getAttribute('viewBox')?.split(/\s+|,/).map(Number);
	const widthAttr = svg.getAttribute('width');
	const heightAttr = svg.getAttribute('height');
	const widthMm = parseUnit(widthAttr);
	const heightMm = parseUnit(heightAttr);

	// Determine scale: user-unit → mm
	let unitWarning = false;
	let scale = 1; // user units are already mm
	if (vb && widthMm && heightMm && vb[2] > 0) {
		scale = widthMm / vb[2];
	} else if (!widthMm && !vb) {
		unitWarning = true; // genuinely unknown — default to mm + warn
	}

	// MUST be in DOM to evaluate getTotalLength on SVGGeometryElement.
	// Append to a hidden offscreen container so the user SVG isn't visible
	// but is in the live document for getBBox/getTotalLength to compute.
	// Cleanup happens in finally.
	const host = document.createElement('div');
	host.style.cssText = 'position:absolute;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden';
	document.body.appendChild(host);

	let pathLengthMm = 0;
	let bbox = { w: 0, h: 0 };
	try {
		host.appendChild(svg.cloneNode(true));
		const liveSvg = host.querySelector('svg');
		const paths = liveSvg.querySelectorAll('path');
		paths.forEach((p) => { pathLengthMm += p.getTotalLength() * scale; });

		// Optional: implicit shapes (rect, circle, line, polyline, polygon)
		// Plan-01 may include OR defer per D-16. Each has getTotalLength on SVGGeometryElement.
		// liveSvg.querySelectorAll('rect, circle, ellipse, line, polyline, polygon')
		//   .forEach((el) => { pathLengthMm += el.getTotalLength() * scale; });

		// Bbox from <svg> in mm
		const svgBox = liveSvg.getBBox();
		bbox = { w: svgBox.width * scale, h: svgBox.height * scale };
	} finally {
		host.remove();
	}

	return {
		mode: 'laser',
		bbox: { w: Number(bbox.w.toFixed(1)), h: Number(bbox.h.toFixed(1)) },
		pathLengthMm: Number(pathLengthMm.toFixed(0)),
		unitWarning,
		fileSizeMB: Number((fileSizeBytes / 1024 / 1024).toFixed(2)),
	};
};
```

**`getTotalLength` requires the element to be in a live document** — that's why we append to an offscreen `<div>`. This is the bit that's easy to miss. The offscreen container has `position:absolute;left:-99999px` (NOT `display:none` — `display:none` causes `getBBox` and `getTotalLength` to return zero in some browsers).

**Implicit shapes (D-16):** The commented `liveSvg.querySelectorAll('rect, circle, ...')` block adds `<rect>` etc. coverage. Plan 03-01 can ship without it (most laser-cutting designs use `<path>`); a follow-up plan can enable when needed. SVGGeometryElement covers all of them uniformly.

### Range price formatter

```js
// src/components/quote/PriceRange.jsx — formatter for $low – $high
const formatUsd = (n) => {
	if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`; // $1.2k
	return `$${Math.round(n)}`; // $24
};

const range = `${formatUsd(low)} – ${formatUsd(high)}`; // em dash, NOT hyphen
```

`–` is U+2013 EN DASH per UI-SPEC §Copywriting Contract "Price range value format" (em dash mentioned in spec; en dash is the actual codepoint that looks right between numbers — UI-SPEC uses "em dash" colloquially; the actual character should be – U+2013).

### Netlify Function — minimal handler skeleton

See Pattern 5 above for the full handler. The minimal viable version (omitting reCAPTCHA + Resend specifics):

```js
// netlify/functions/submit-quote/submit-quote.js
exports.handler = async (event) => {
	if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
	const payload = JSON.parse(event.body);
	// validate, verify recaptcha, send via Resend...
	return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Three.js loader imports via root (`import { STLLoader } from 'three'`) | Subpath imports (`import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'`) | Three.js r127+ (2021) | Subpath is the only path; root export does NOT include loaders. Old tutorials may show the wrong import. [VERIFIED: three@0.184.0 package.json `exports` confirms `./examples/jsm/*`] |
| `react-scripts` env vars `REACT_APP_*` | Same in CRA 5; switches to `VITE_*` in Phase 4 only | — | This phase stays on CRA. `REACT_APP_RECAPTCHA_SITE_KEY` is the env naming convention for browser-exposed values until Phase 4 Vite migration. [VERIFIED: package.json scripts use react-scripts] |
| Netlify Forms for contact submissions (existing) | Netlify Function for quote submissions (NEW for QTE-07) | This phase | Mechanically different: Forms is fire-and-forget; Functions allow server-side validation BEFORE the email fires. Critical for reCAPTCHA. UI-SPEC and CONTEXT.md call this out — DO NOT use the `public/index.html` prerender pattern for the quote. |
| Sendgrid / Mailgun / Postmark | Resend (project decision per ROADMAP/REQUIREMENTS) | This phase | Resend offers a simpler Node SDK, free tier covers low volume, and is well-supported by Netlify [CITED: developers.netlify.com/guides/send-emails-with-astro-and-resend/]. |
| reCAPTCHA v2 (checkbox UI) | reCAPTCHA v3 (frictionless score) | This phase | Per QTE-08. v3 has no UI ("I'm not a robot" checkbox); the user is scored invisibly based on behavior. Server-side verification of score is mandatory — without it, the score does nothing. |

**Deprecated/outdated:**
- **`isProd()` in `src/utilities/helpers.jsx`:** dead code [VERIFIED: file content — both branches return `true`]. Don't use it. Hardcode behavior or read `process.env.NODE_ENV` directly.
- **CRA `react-scripts` itself:** Phase 4 migrates to Vite. Don't add new CRA-specific patterns (e.g., `craco`, `react-app-rewired`, custom CRA loaders). Pattern in this phase: stick to vanilla CRA scripts + add deps that work in both CRA and Vite (which is most modern deps).
- **`public/index.html` Netlify Forms prerender:** valid for the existing contact + shop-notify forms; NOT the right pattern for quote submission per QTE-07.

---

## Project Constraints (from CLAUDE.md)

Extracted directives the planner must honor — same authority as locked CONTEXT.md decisions:

1. **Stay on Create React App + React 18 + JavaScript** — no TS, no Next.js, no migration. The `--openssl-legacy-provider` flag remains until Phase 4.
2. **Sanity is the ONLY structured-content store** — anonymous CDN reads via the existing `useSanityQuery` hook. New Sanity content types follow the Phase 2 owner-prep pattern (`02-SCHEMA-SPEC.md`).
3. **Netlify is the hosting target** — static SPA + Netlify Functions for backend, Netlify Forms for the existing contact + shop-notify forms (do NOT remove). Quote submission uses Functions, not Forms.
4. **Visual identity: targeted spruce only** — same dark theme, same fonts, same identity. NO new CSS framework, NO shadcn, NO Material UI. Tailwind classes against existing tokens. Token name **`ternary` not `tertiary`** — preserve the typo.
5. **Photography degrades gracefully** — UI components must render with placeholder blocks when Sanity returns no images. (Plan 03-01 doesn't surface photography; relevant for `pricing-rule`-related affordances in later plans if any image is involved.)
6. **GSD workflow enforcement** — all file-changing work goes through a GSD command. Standalone research like this is OK; any subsequent code edits must come from `/gsd-execute-phase` or equivalent.
7. **No `console.log` in new code** — `.catch(console.error)` is the existing pattern; do not extend it with `console.log` (per CONVENTIONS.md).
8. **Prefer in-page UI feedback over `alert()`** — Phase 2 already replaced `ContactForm.jsx`'s `alert()` with state-driven `submitError`. Plan 03-02+ submit flow follows this pattern.
9. **`.jsx` for components/hooks/contexts; `.js` for plain modules** — parsers in `src/utilities/quote/` are `.js` (no JSX). Components are `.jsx`.
10. **Tabs (indentation), single quotes in JS, double quotes in JSX, arrow components, default export** — match the surrounding file (no automated formatter exists).
11. **Project skills:** none currently registered (verified absent). No skill-driven patterns to apply.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node 20 | CRA build, Netlify Functions runtime | ✓ | per `.nvmrc` + `netlify.toml` | — |
| pnpm 9 | Package install | ✓ | per `pnpm-lock.yaml` lockfileVersion 9.0 | — |
| Netlify Functions (deploy) | QTE-07 submission | ✓ | Netlify default Node 20 | None — required for Plan 03-02+ |
| Netlify CLI (`netlify dev`) | Local dev for Plan 03-02+ submission flow | UNKNOWN — not currently in `package.json` | — | `npx netlify dev` (no install needed) |
| Sanity Studio access | QTE-06 pricing-rule schema | ✓ owner has access | — | — (owner must add schema before Plan 03-02+ ships) |
| Resend account + verified sender domain | QTE-07 email send | UNKNOWN — owner-side prep | — | None — must be set up before Plan 03-07-equivalent ships |
| Google reCAPTCHA v3 site/secret keys | QTE-08 spam protection | UNKNOWN — owner-side prep | — | None — must be registered before Plan 03-08-equivalent ships |
| Browser File API (`File`, `FileReader`, `dataTransfer`) | All file upload | ✓ all target browsers per `browserslist` | — | — |
| Browser `DOMParser` + `SVGGeometryElement.getTotalLength` | SVG path-length math | ✓ all target browsers | — | — |
| `Intl.NumberFormat('en-US', { style: 'currency' })` | Price range formatter | ✓ all target browsers | — | — |

**Missing dependencies with no fallback (owner-side prep checkpoints):**

These three items are the same shape as Phase 2's "owner adds Sanity schema before plan executes" pattern. Each blocks one plan in 03-02..03-NN:

- **Resend account creation + sender domain DNS verification.** Without this, the function returns 502 on every submit. Owner-prep:
  1. Sign up at resend.com.
  2. Add `shapesmith.studio` (or `quotes.shapesmith.studio` subdomain) in dashboard → Domains.
  3. Add the SPF + DKIM TXT records to the domain's DNS provider.
  4. Wait for verification (minutes to hours).
  5. Generate an API key and provide it for `RESEND_API_KEY` Netlify env var.
- **Google reCAPTCHA v3 registration.** Without keys, client can't mint a token. Owner-prep:
  1. Visit google.com/recaptcha/admin.
  2. Register `shapesmith.studio` for reCAPTCHA v3.
  3. Receive site key (public, browser) + secret key (server, Function).
  4. Site key → `REACT_APP_RECAPTCHA_SITE_KEY` Netlify build env var.
  5. Secret key → `RECAPTCHA_SECRET_KEY` Netlify Functions env var.
- **`pricing-rule` Sanity schema published + at least one rule per laser/print material backfilled.** Without this, the picker renders the empty state. Owner-prep:
  1. Apply the `pricing-rule` schema spec (forthcoming `03-SCHEMA-SPEC.md`).
  2. Create a `pricing-rule` doc per existing material with rates filled in.

**Missing dependencies with fallback:**
- **Netlify CLI for local dev:** `npx netlify dev` works without a local install; no permanent dep needed. Document in `03-02-PLAN.md` (or whichever plan adds the function) that local testing requires `npx netlify dev` running alongside `pnpm start`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Plan 03-01 bundle delta on `/quote` chunk is ~80–120 KB gzip | Standard Stack §Bundle math | Low — measured at build time. If bigger, planner re-evaluates D-11 standalone-parser path. |
| A2 | 25MB binary STL parses in 100–300ms on a 2020+ laptop | Standard Stack §Recommendation | Low — empirical guidance; if slow on real test files, Web Worker becomes a follow-up. Worst case visitor sees a 1-2s lag, not a freeze. |
| A3 | Most printable STLs are watertight by definition | Common Pitfalls §Pitfall 3 | Medium — non-watertight files give a wrong volume. Mitigation: document the assumption in the UI ("Volume assumes a closed mesh"). |
| A4 | STL files use mm units universally in hobbyist CAD | Code Examples §STL units | Low — industry convention. If a submission turns out to be in inches, the markup buffer covers the discrepancy in the price range. |
| A5 | reCAPTCHA v3 score 0.5 threshold is appropriate for low-volume marketing site | Pattern 5 + Pitfall 9 | Medium — too high blocks real users; too low lets bots through. Can be tuned post-launch via Netlify env var. |
| A6 | Netlify auto-installs function-local `package.json` deps at build time | Pattern 5 | Low — well-documented Netlify behavior. Verify on first function deploy. |
| A7 | `getBBox` returns valid dimensions when SVG is in offscreen-positioned container (NOT display:none) | Code Examples §parseSvg | Low — well-known browser behavior; `display:none` zeros the box but `position:absolute;left:-99999px` keeps it valid. |
| A8 | Resend's free tier covers expected studio submission volume | Standard Stack §resend | Low — free tier is 100/day, 3000/month per resend.com docs at time of training; studio expects << 100/day. |
| A9 | Owner-prep checkpoints for Resend domain, reCAPTCHA keys, and pricing-rule schema can run BEFORE the submission plan executes | Environment Availability | Low — same shape as Phase 2's `02-SCHEMA-SPEC.md` checkpoint pattern that worked. |
| A10 | Plan 03-01 doesn't render SVG to the live DOM beyond the offscreen-host technique used for `getTotalLength` | Don't Hand-Roll + Pitfall 5 | Low — explicit per UI-SPEC and D-22. The offscreen-host technique is required for `getTotalLength` but the SVG is removed in `finally` and never reaches user-visible DOM. The host element is also wrapped in a try/finally so an exception during parse doesn't leak the host into the DOM. **However:** if a future plan adds visible SVG preview, DOMPurify is mandatory before that plan — and the offscreen-host parsing in 03-01 is itself a candidate for DOMPurify hardening as a defense-in-depth measure. |

---

## Open Questions

1. **Whether to install `react-google-recaptcha-v3` or load `https://www.google.com/recaptcha/api.js` directly.**
   - What we know: library is 9 KB min / 3.6 KB gzip with React provider context; manual script load saves ~3.6 KB but adds ~30 LOC of plumbing.
   - What's unclear: which the planner prefers given the codebase's "small dep is fine if it removes plumbing" stance (cf. `react-helmet-async`, `framer-motion`).
   - Recommendation: install `react-google-recaptcha-v3` for cleanliness. Bundle cost is negligible relative to the Three.js loaders cost in this phase.

2. **Whether implicit-shape SVG path-length (`<rect>`, `<circle>`, etc.) lands in Plan 03-01 or a follow-up plan.**
   - What we know: D-16 leaves it to the planner; both implementations are identical (`getTotalLength()` works on all SVGGeometryElement subclasses).
   - What's unclear: how much real-world laser-cutting design uses non-`<path>` primitives. Inkscape converts most shapes to paths on export; LightBurn imports varies.
   - Recommendation: include in 03-01. Cost is 1 LOC (extend the querySelector). Visitor with a `<rect>`-only design otherwise gets a wrong "0 mm" path length and a confusing zero-cost reading later.

3. **Whether to add Web Worker for parsing in Plan 03-01 or defer.**
   - What we know: D-11 says "profile first." 25MB STL ≈ 500K triangles ≈ 100–300ms on desktop [ASSUMED A2].
   - What's unclear: real mobile parse time on cheap Android. Could be 1–3 seconds, which would feel like a freeze.
   - Recommendation: defer Web Worker to a follow-up. Plan 03-01 acceptance includes a real-file profile run on desktop + one mobile device; if the mobile time exceeds 1 second, file a follow-up plan.

4. **Plan ordering for Plans 03-02..03-NN.**
   - What we know: D-01 says planner determines wave count + ordering. The remaining QTE items are: QTE-04 (material+quantity), QTE-05 (range display), QTE-06 (pricing-rule schema), QTE-07 (Function+Resend), QTE-08 (reCAPTCHA), QTE-09 (DOMPurify only if SVG preview lands; STL/DXF memory-bounded already in 03-01), QTE-10 (localStorage).
   - What's unclear: planner's call.
   - Recommendation: natural shipping boundaries (each plan deployable):
     - **Plan 03-02:** pricing-rule schema (QTE-06) + material+quantity picker (QTE-04) + price-range display (QTE-05) — surfaces the *number* but doesn't submit yet.
     - **Plan 03-03:** Netlify Function + Resend (QTE-07) + reCAPTCHA v3 client+server (QTE-08) — submission lands, with spam protection.
     - **Plan 03-04:** localStorage form-state persistence (QTE-10) — last because it's lowest-risk polish.
     - DOMPurify (QTE-09) only enters if a future plan introduces SVG preview rendering (out-of-scope per CONTEXT.md/QTE-13). Plan 03-01 + 03-03 cover the memory-bounded parsing aspect of QTE-09 already (file size cap + Function input validation).

5. **Whether `studio-info` Sanity singleton should be extended to hold `laserBedSize` for the bbox-vs-bed comparison.**
   - What we know: D-15 mentions "later plans will compare to a Sanity `studio-info.laserBedSize` if it exists."
   - What's unclear: planner's call. Could ride along with the pricing-rule schema in Plan 03-02 or be deferred.
   - Recommendation: include in `03-SCHEMA-SPEC.md` as an optional extension. Owner can fill or leave empty; UI degrades to "bed comparison unavailable" if not set.

---

## Sources

### Primary (HIGH confidence)
- `npm registry` — version verification for `three@0.184.0`, `resend@6.12.3`, `dompurify@3.4.2`, `react-google-recaptcha-v3@1.11.0`, `react-dropzone@15.0.0`, `use-local-storage-state@19.5.0`, `@netlify/functions@5.2.0`, `parse-stl@1.0.2`, `obj-file-parser@0.6.2`, `svg-pathdata@9.0.0` (via `npm view {package} version` 2026-05-07)
- `bundlephobia.com` — exact bundle sizes for three (724KB/182KB gzip), react-dropzone (60KB/16KB gzip), dompurify (24KB/9KB gzip), react-google-recaptcha-v3 (9KB/3.6KB gzip), use-local-storage-state (1.6KB/0.8KB gzip)
- [unpkg.com/three@0.184.0/examples/jsm/loaders/STLLoader.js](https://unpkg.com/three@0.184.0/examples/jsm/loaders/STLLoader.js) — verified standalone STLLoader file size (10.7 KB raw) and content
- [unpkg.com/three@0.184.0/examples/jsm/loaders/OBJLoader.js](https://unpkg.com/three@0.184.0/examples/jsm/loaders/OBJLoader.js) — verified standalone OBJLoader file size (22.9 KB raw)
- `three@0.184.0` package.json `exports` field — confirms `./examples/jsm/*` subpath import contract
- Codebase ground truth: `src/App.js`, `src/hooks/useSanityQuery.jsx`, `src/data/services.js`, `src/components/contact/ContactForm.jsx`, `src/utilities/encodeFormData.jsx`, `public/index.html`, `package.json`, `netlify.toml`, `tailwind.config.js`, `.planning/phases/02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub/02-SCHEMA-SPEC.md`
- CONTEXT.md (CONTEXT.md decisions D-01..D-23) and UI-SPEC.md (visual + interaction contract)

### Secondary (MEDIUM confidence)
- [Hilariously Fast Volume Computation with the Divergence Theorem (rosenzweig.io)](https://rosenzweig.io/blog/hilariously-fast-volume-computation-with-the-divergence-theorem.html) — signed-tetrahedra algorithm validation (cross-referenced with multiple game-dev / math sources)
- [Calculating the volume of a mesh (n-e-r-v-o-u-s.com)](https://n-e-r-v-o-u-s.com/blog/?p=4415) — practical JS implementation reference
- [DOMPurify GitHub README (cure53/DOMPurify)](https://github.com/cure53/DOMPurify) — `USE_PROFILES: { svg: true, svgFilters: true }` config
- [Send emails with Resend on Netlify (developers.netlify.com)](https://developers.netlify.com/guides/send-emails-with-astro-and-resend/) — Netlify Functions + Resend integration confirmed
- [Resend Node SDK README](https://github.com/resend/resend-node) — SDK shape, sender domain verification flow
- [Units in Inkscape (wiki.inkscape.org)](https://wiki.inkscape.org/wiki/Units_In_Inkscape) — SVG unit conventions, 96dpi default, Inkscape mm-aligned exports
- [Analysis of SVG Units (mpetroff.net)](https://mpetroff.net/2013/08/analysis-of-svg-units/) — corroboration of px-to-mm conversion factor (3.7795)
- [cra-netlify-functions example repo (GitHub)](https://github.com/oliverjam/cra-netlify-functions) — CRA + Netlify Functions directory structure pattern
- [Netlify Functions optional configuration (docs.netlify.com)](https://docs.netlify.com/build/functions/optional-configuration/) — function directory, env vars, node_bundler

### Tertiary (LOW confidence — flagged for verification at execution time)
- Bundle delta estimate of 80–120 KB gzip for the `/quote` chunk including STL+OBJ loaders is informed by published Three.js bundle facts but NOT measured against this specific codebase's tree-shaking outcome. Plan 03-01 should measure with `pnpm build` and document in summary.
- 25MB STL parse time of 100–300ms on a 2020+ laptop is a rough order-of-magnitude estimate from general knowledge; the planner should profile a real file as a 03-01 acceptance step.

---

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — all package versions verified against npm registry 2026-05-07; bundle sizes verified against bundlephobia; Three.js subpath import path verified against unpkg + package.json exports.
- Architecture: **HIGH** — patterns are direct extensions of existing Phase 1/Phase 2 codebase patterns (lazy-load route, useSanityQuery, framer-motion AnimatePresence, react-helmet-async SEOHead, SERVICES-driven config). Netlify Functions structure verified against Netlify docs and a reference CRA repo.
- Pitfalls: **MEDIUM** — STL/OBJ/SVG parsing pitfalls verified against multiple sources; bundle-size pitfall (Pitfall 7) requires real measurement; SVG injection pitfall (Pitfall 5) is well-known general security but DOMPurify-on-this-codebase is unverified until Plan 03-02+.
- Math correctness: **MEDIUM** — signed-tetrahedra formula verified against three independent published references but not numerically validated against a known-volume mesh in this session. Plan 03-01 should validate with a 1cm³ unit cube STL as an acceptance step.

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (30 days for stable stack; revisit if Three.js, Resend, or Netlify Functions ship a major version in the meantime)

---

## RESEARCH COMPLETE
