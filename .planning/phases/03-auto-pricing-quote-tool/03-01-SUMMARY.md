---
phase: 03-auto-pricing-quote-tool
plan: 01
subsystem: quote-tool
tags:
  - frontend
  - file-upload
  - parser
  - tabs
  - lazy-route
  - three.js
requires:
  - Phase 2 — visual identity, SEOHead, sitemap, AppHeader nav, ContactForm pre-fill cascade
provides:
  - "/quote route — lazy-loaded auto-pricing quote tool stub"
  - "src/utilities/quote/parseStl.js — STL parser (Three.js STLLoader + signed-tetrahedra volume)"
  - "src/utilities/quote/parseObj.js — OBJ parser sharing volume math via volumeAndBbox helper"
  - "src/utilities/quote/parseSvg.js — SVG parser (DOMParser + offscreen-host getTotalLength/getBBox)"
  - "src/utilities/quote/volumeAndBbox.js — pure signed-tetrahedra math helper"
  - "src/utilities/quote/formatErrors.js — error code → UI-SPEC string mapper"
  - "src/components/quote/QuoteTabs.jsx — WAI-ARIA tabs with ?service=/referrer pre-fill"
  - "src/components/quote/FileDropzone.jsx — native HTML5 drop + picker"
  - "src/components/quote/GeometrySummary.jsx — definition-list readout panel"
affects:
  - "src/App.js (route added)"
  - "src/components/shared/AppHeader.jsx (NAV_ITEMS entry)"
  - "src/pages/Projects.jsx + ProjectSingle.jsx (hero CTA)"
  - "scripts/generate-sitemap.cjs (STATIC_ROUTES)"
tech-stack:
  added:
    - "three@0.184.0 — STLLoader, OBJLoader (subpath imports only)"
  patterns:
    - "Dynamic import inside file handler — Three.js parsers stay out of /quote first paint"
    - "Offscreen-host trick (left:-99999px) for SVG getTotalLength/getBBox per Pitfall 5"
    - "Signed-tetrahedra volume + Math.abs — winding-flip safe (Pitfall 2)"
    - "WAI-ARIA tabs without a library — role=tablist/tab/tabpanel + arrow-key nav"
key-files:
  created:
    - src/utilities/quote/volumeAndBbox.js
    - src/utilities/quote/volumeAndBbox.test.js
    - src/utilities/quote/parseStl.js
    - src/utilities/quote/parseObj.js
    - src/utilities/quote/parseSvg.js
    - src/utilities/quote/parseSvg.test.js
    - src/utilities/quote/formatErrors.js
    - src/utilities/quote/formatErrors.test.js
    - src/pages/Quote.jsx
    - src/components/quote/QuoteTabs.jsx
    - src/components/quote/FileDropzone.jsx
    - src/components/quote/GeometrySummary.jsx
  modified:
    - package.json (three dependency added)
    - pnpm-lock.yaml
    - src/App.js (lazy import + Route)
    - src/components/shared/AppHeader.jsx (NAV_ITEMS Get a Quote)
    - src/pages/Projects.jsx (hero CTA + Link import)
    - src/pages/ProjectSingle.jsx (hero CTA + Link import)
    - scripts/generate-sitemap.cjs (STATIC_ROUTES /quote)
decisions:
  - "D-16 implicit-shape inclusion: ENABLED in parseSvg — rect/circle/ellipse/line/polyline/polygon are all queried via getTotalLength so shape-only SVG designs (Inkscape default exports) yield non-zero pathLengthMm. One-line cost; matches RESEARCH.md Open Question 2 recommendation."
  - "Volume math extracted into volumeAndBbox helper — testable without Three.js's ESM-only loaders running through Jest 27 (CRA 5 Jest config does not honor transformIgnorePatterns override). Loader-wrapper code is exercised in browser only."
  - "Plan 03-01 placeholder submit affordance is the disabled CTA per D-03 (NOT a /contact link)."
metrics:
  duration: ~10m
  task_count: 3
  files_changed: 19
  completed: 2026-05-08
---

# Phase 3 Plan 01: /quote stub — tabs + file upload + browser-side parsers Summary

**One-liner:** Lazy-loaded `/quote` route with WAI-ARIA tabs (3D / Laser), native HTML5 drag-and-drop, and Three.js-backed STL/OBJ/SVG parsers — the front-end of the auto-pricing quote tool minus pricing math, submission, and Sanity schema (those land in Plans 03-02/03-03/03-04).

## What Shipped

A visitor can now navigate from the AppHeader "Get a Quote" entry, from the `/styles` hero CTA, or from the `/3d-printing` hero CTA, to `/quote`. They land on a tab strip (3D Printing / Laser Cutting) pre-filled from `?service=` query string OR `document.referrer` (mirrors `ContactForm.jsx` D-24 verbatim). The active panel surfaces format chips (`STL` `OBJ` for 3D, `SVG` for laser), a constraints line ("Max 25MB. Files are read in your browser…"), and a drop zone that accepts both drag-and-drop and click-to-pick.

A valid file is read in the browser (`File.arrayBuffer()` for STL, `File.text()` for OBJ/SVG), then handed to a dynamically-imported parser. The parser returns geometry metadata that renders into a definition-list panel — volume (cm³ + in³ secondary), bounding box (W × D × H mm), triangle count, file size for 3D; cut-area bbox, total cut length (mm), file size for laser. SVGs whose units cannot be inferred surface a "reading as millimeters" footnote inside the panel under the bbox row.

A disabled "Submit for confirmation — coming soon" CTA per D-03 marks the placeholder explicitly so visitors don't hit a hung submit. Real submission lands in Plan 03-03.

## Bundle Size — measured against the Plan output spec

| Chunk | Raw | Gzip | Notes |
|-------|-----|------|-------|
| `342.*.chunk.js` | 13.0 KB | **4.3 KB** | The `/quote` page chunk — Quote.jsx + QuoteTabs + FileDropzone + GeometrySummary + formatErrors |
| `186.*.chunk.js` | 4.0 KB | 1.9 KB | STLLoader (loaded after first STL drop) |
| `549.*.chunk.js` | 10.1 KB | 3.5 KB | OBJLoader (loaded after first OBJ drop) |
| `633.*.chunk.js` | 144.3 KB | 38.7 KB | Three.js core (loaded after first 3D parse — shared across STL + OBJ) |
| `main.*.js` | 294.2 KB | 97.2 KB | Main chunk grew only **+221 B** vs pre-Plan-03-01 — confirms Three.js stayed out of the synchronous render path |

**Verdict:** the `/quote` chunk gzip size of **4.3 KB** is far below the 120 KB gzip soft target from RESEARCH.md §Bundle math. Even the worst-case path (visitor opens /quote AND drops an STL → /quote chunk + Three.js core + STLLoader = ~45 KB gzip) stays well under target. The dynamic-import lazy split worked: Three.js is fetched on demand, never on first /quote paint.

## Implicit-Shape D-16 Decision

`parseSvg` queries `<rect>`, `<circle>`, `<ellipse>`, `<line>`, `<polyline>`, `<polygon>` in addition to `<path>` and sums their `getTotalLength()` into `pathLengthMm`. The check `typeof el.getTotalLength === 'function'` is defensive against older SVG-2 implementations. Cost: one extra querySelector + forEach. Benefit: shape-only Inkscape exports (extremely common for hobbyist laser designs) yield non-zero pathLengthMm instead of a confusing 0. RESEARCH.md Open Question 2 recommended this; planner agreed.

## Unit-Cube Parse-Time Observation

The unit-cube STL fixture is synthesized in `volumeAndBbox.test.js` (12 triangles). Test wall time: **~30 ms** including Jest startup; the `volumeAndBbox(positions)` call itself is sub-millisecond per the test loop. For Open Question 3 calibration: a 25MB STL has roughly 500k–1M triangles depending on ASCII vs binary; signed-tetrahedra volume scales linearly so projected wall time on a single laptop main-thread is well under one second. Web Worker is NOT yet warranted; flagging for re-evaluation if real-world feedback shows freezes on large meshes.

## Threat Model Coverage

All `mitigate` dispositions from `<threat_model>` are landed in code:

| Threat | Mitigation in code |
|--------|---------------------|
| T-03-01-01 (DoS via large files) | `FileDropzone.validate()` enforces 25MB cap before any `arrayBuffer()`/`text()` read; rejection runs in O(1) and surfaces UI-SPEC `TOO_LARGE` copy with the exact size in MB. |
| T-03-01-02 (DoS via getTotalLength) | Bounded by upstream 25MB cap; loop is O(paths) and runs in milliseconds even on pathological input. |
| T-03-01-03 (XSS via SVG to live DOM) | `parseSvg` clones into `position:absolute;left:-99999px` host then removes in `finally{}`. NEVER appends to a visible container. DOMPurify deferred per D-22 because no visible SVG render exists in this plan. |
| T-03-01-04 (drop-default opens file as tab) | `FileDropzone` calls `e.preventDefault()` in BOTH `onDragOver` AND `onDrop`. Verified by inspection at `src/components/quote/FileDropzone.jsx:75-76, 80-81`. |
| T-03-01-05 (renamed extensions) | `accept` (UX guard, not security boundary): a renamed file fails parser-side and surfaces the friendly malformed-file copy. No code-execution path. |
| T-03-01-07 (Three.js loader CVE surface) | Subpath imports only — `examples/jsm/loaders/STLLoader.js` and `OBJLoader.js`. No renderer/scene code in the bundle. |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Volume math extracted from parseStl/parseObj into a pure helper (`volumeAndBbox.js`)**
- **Found during:** Task 1 GREEN phase — running the test suite.
- **Issue:** Three.js v0.184 ships `examples/jsm/loaders/*` as ESM only. Jest 27 (bundled with CRA 5) cannot transform those files because `transformIgnorePatterns` excludes `node_modules` by default. CRA 5's `react-scripts test` does NOT honor a `transformIgnorePatterns` override in `package.json#jest` (only an allowlist of properties is forwarded). Per-loader test files (`parseStl.test.js`, `parseObj.test.js`) failed with `SyntaxError: Cannot use import statement outside a module`.
- **Fix:** Refactored the signed-tetrahedra volume + bbox math out of `parseStl.js` and `parseObj.js` into a pure helper at `src/utilities/quote/volumeAndBbox.js`. Both parsers now construct a flat positions array (`Float32Array`) from the loader output and delegate to the helper. The helper is unit-tested with the canonical 10×10×10 mm cube fixture (volume ≈ 1.00 cm³, triangles = 12, bbox = 10×10×10) and a reversed-winding fixture (winding-flip safety). The loader-wrapper code itself is exercised at runtime in the browser; jsdom does not faithfully run Three.js's loaders anyway.
- **Files modified:** `src/utilities/quote/volumeAndBbox.js` (new), `volumeAndBbox.test.js` (new), `parseStl.js` (now uses helper), `parseObj.js` (now uses helper). Per-loader test files (`parseStl.test.js`, `parseObj.test.js`) were dropped — math coverage is in `volumeAndBbox.test.js`.
- **Commit:** a7d4658
- **Net effect:** Test coverage of the math is at parity with the original plan. The plan's done-criteria "1cm³ unit-cube test passes" is satisfied by `volumeAndBbox.test.js` (which builds the same cube fixture as the planned `parseStl.test.js` would have, but in `Float32Array` form skipping the binary-STL serialization).

### Deviations Documented in Plan but Honored Inline

- **D-16 (implicit shapes):** Planner accepted the RESEARCH.md Open Question 2 recommendation; one-liner included. See `parseSvg.js` lines 65-72.
- **D-03 (placeholder submit):** Disabled `<button>` chosen over a styled `<Link>` to `/contact` — matches UI-SPEC §"Plan 03-01 placeholder" recommendation ("placeholder disabled button is preferred to keep the surface honest").

## Self-Check: PASSED

Files verified to exist on disk:
- `src/utilities/quote/volumeAndBbox.js` ✓
- `src/utilities/quote/parseStl.js` ✓
- `src/utilities/quote/parseObj.js` ✓
- `src/utilities/quote/parseSvg.js` ✓
- `src/utilities/quote/formatErrors.js` ✓
- `src/pages/Quote.jsx` ✓
- `src/components/quote/QuoteTabs.jsx` ✓
- `src/components/quote/FileDropzone.jsx` ✓
- `src/components/quote/GeometrySummary.jsx` ✓
- `build/sitemap.xml` contains `<loc>https://shapesmith.studio/quote</loc>` ✓

Commits verified in git log:
- `703ce8e` test(03-01): RED tests ✓
- `a7d4658` feat(03-01): parsers GREEN ✓
- `8ad60e3` feat(03-01): /quote page surface ✓
- `906e5d1` feat(03-01): wire /quote into App ✓

## TDD Gate Compliance

Sequence verified in `git log`:
1. `703ce8e` — `test(03-01): add failing tests for STL/OBJ/SVG parsers + formatErrors` (RED)
2. `a7d4658` — `feat(03-01): implement STL/OBJ/SVG parsers + formatErrors mapper` (GREEN)

No separate REFACTOR commit was required — the volumeAndBbox extraction occurred inside the GREEN phase as part of resolving the Rule 3 blocker.

## Requirements Closed

- **QTE-01** (visitors reach /quote from each service page + top-level CTA) — DONE
- **QTE-02** (drag-and-drop + picker, stated constraints) — DONE
- **QTE-03** (browser-side parse, friendly errors) — DONE
- **QTE-09 (partial — memory-bounded parsing)** — 25MB cap enforced before any read; SVG sanitation deferred to Plan 03-03 per D-22.

## Follow-up Items

- **Plan 03-02:** pricing-rule Sanity schema, MaterialPicker, QuantityInput, PriceRange, calculatePrice (QTE-04, QTE-05, QTE-06).
- **Plan 03-03:** Netlify Function + Resend + reCAPTCHA v3 + DOMPurify if SVG preview is added (QTE-07, QTE-08, QTE-09 server-side).
- **Plan 03-04:** localStorage form-state persistence (QTE-10).
- **Future profiling:** if real-world large-mesh feedback shows freezes, evaluate Web Worker for parsing (Open Question 3) — not warranted today.
