# Phase 3: Auto-Pricing Quote Tool - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Auto-pricing quote tool — visitors upload a CAD/vector file, see a ballpark price *range*, and submit to the studio owner who manually confirms before anything binds. **Phase 3 scope = REQUIREMENTS.md QTE-01..10 in full**, but plans break naturally: **Plan 03-01 ships the stub** (pages, file upload, basic geometry readouts) and **later plans (03-02..03-NN) finish the tool** (pricing-rule schema, material picker, quantity, range/markup display, Netlify Function + Resend submission, reCAPTCHA v3, DOMPurify, localStorage persistence).

The roadmap is unchanged — Phase 3 stays a single phase that delivers all 10 QTE items. The decision the user made during discussion was *plan structure*, not phase rescoping.

**In scope (whole phase):**
- QTE-01..10 as written in `.planning/REQUIREMENTS.md`
- A `/quote` route reachable from each service page and a top-level CTA
- Browser-side parsing for STL + OBJ (3D) and SVG (laser); other formats from QTE-02 (3MF, DXF) deferred within-phase to later plans
- A `pricing-rule` Sanity schema (QTE-06) — owner-edited, no app deploy to tune
- A Netlify Function that validates input, verifies reCAPTCHA v3, and emails the owner via Resend (QTE-07–08)

**Out of scope:**
- Slicer-grade pricing — explicit v2 boundary (QTE-11)
- STL preview rendering in the quote UI (R3F + drei) — v2 (QTE-13)
- Customer dashboard for tracking submitted estimates — v2 (QTE-12)
- Real shop catalog + checkout — Phase 5 (Bundle 3)
- Vite migration — Phase 4
- Anything that turns the estimate into a binding order — owner manually confirms with a real quote in a separate email; no path from upload to commitment exists

</domain>

<decisions>
## Implementation Decisions

### Phase staging (plan structure)
- **D-01:** Phase 3 stays single-phase, but plans break naturally. **Plan 03-01 = stub** (front-end pages + tabs + file upload + basic geometry readouts; no submission, no pricing, no schema). **Plans 03-02..03-NN = remaining QTE items** (pricing-rule schema, material picker + quantity, range display + markup, submission via Netlify Function + Resend, reCAPTCHA v3, DOMPurify on rendered SVG, localStorage form-state persistence). The planner determines wave count and ordering. ROADMAP.md is NOT edited; REQUIREMENTS.md is NOT edited.
- **D-02:** Each plan SHOULD leave the site deployable. Plan 03-01 ships a `/quote` page that reads, computes geometry, and shows results — but does NOT submit to anyone yet. Visitors who land on it should get a useful preview, not a half-built form that hangs at "submit."
- **D-03:** Plan 03-01 may include a placeholder "Submit for confirmation — coming soon" CTA on each tab so the surface looks intentionally staged, not broken. Or the tab can route the visitor back to `/contact` with a pre-filled service. Planner discretion within "no broken-feeling dead-ends."

### `/quote` page shape (Plan 03-01)
- **D-04:** Single `/quote` route with **tabs inside the page** ("3D Printing" / "Laser Cutting"). One SEO surface, sibling tools framed visually as one feature. NOT sub-routes (`/quote/3d-printing` + `/quote/laser`) and NOT URL-deep-linked tabs at this stage.
- **D-05:** Tab pre-fill — Claude's discretion within Phase 2 precedent. Recommended: read `?service=` query string and `document.referrer` (matching `ContactForm.jsx` D-24) so a visitor clicking from a service page lands on the correct tab. Mapping: `/styles` → laser tab, `/3d-printing` → 3D tab, `?service=laser|print` → matching tab. Keep the pattern consistent with the contact form to avoid two pre-fill idioms.
- **D-06:** Top-level entry CTAs — planner discretion. Reasonable options: a "Get a Quote" link in `AppHeader` nav, or a CTA on each service page hero, or both. Whatever lands, the link uses `?service=` so the tab opens correctly.
- **D-07:** Descriptive copy on `/quote` (what the tool does, expected accuracy, "estimate not final" disclaimer) — planner discretion on whether it lives in Sanity (`studio-info` extension or a new `quote-tool-info` singleton) vs hardcoded in `Quote.jsx`. Recommended: hardcoded for the stub, Sanity later if the owner wants to tune; matches Phase 2's "graceful degrade with placeholder" stance.

### File pipeline (Plan 03-01)
- **D-08:** **3D tab accepts STL + OBJ.** Both are triangle meshes — the volume calculation and bbox math are identical. 3MF is deferred to a later in-phase plan; QTE-02's full STL/3MF list is honored across the phase as a whole, not Plan 03-01 alone.
- **D-09:** **Laser tab accepts SVG only** for the stub. DXF is deferred to a later in-phase plan; QTE-02's full SVG/DXF list is honored across the phase as a whole. (Skipping DXF in 03-01 avoids pulling in the `dxf` library before the pricing-rule schema exists.)
- **D-10:** File upload UI — drag-and-drop **and** file picker, both per QTE-02. Constraints (size, format) shown before the visitor touches the file. Stated formats per tab; reject mismatches with friendly error messages (QTE-03).
- **D-11:** Parsing strategy — planner discretion. Three options realistic: (a) Three.js `STLLoader` + `OBJLoader` (well-tested, ~600KB bundle hit), (b) lightweight standalone parsers (e.g. `parse-stl`, custom `ArrayBuffer` STL reader, line-based OBJ parser — much smaller bundle, more code to write/maintain), (c) Web Worker wrapping either choice for large-file robustness. **Recommendation:** start with lightweight standalone parsers on the main thread, gated by a file size cap; add Web Worker only if profiling shows main-thread freezes on realistic files. Bundle size matters here — CRA + React 18 + this phase's adds is already non-trivial.
- **D-12:** File size cap + memory-bounded parsing (QTE-09) — planner discretion. Reasonable starting point: 25MB per file, with a friendly "file too large" message and a soft suggestion to compress / decimate. Hard ceiling driven by browser memory practicality, not arbitrary preference.

### 3D geometry readouts (Plan 03-01)
- **D-13:** **Volume = signed-tetrahedra (divergence theorem).** Sum signed volumes of tetrahedra formed by each triangle and the origin. Accurate for closed/watertight meshes, ~10 LOC of math, no library beyond the parser. Display in cm³ (planner may also show in³ as secondary; metric primary per studio context — local hobbyists, mm-native CAD).
- **D-14:** Display in 3D tab readout (in addition to volume): triangle count, file size, bounding-box dimensions (W × D × H mm). All cheap to compute alongside volume.

### Laser geometry readouts (Plan 03-01)
- **D-15:** **Display = bounding box (W × H mm) + total path length (mm).** Bbox tells the visitor whether their design fits on the laser bed (later plans will compare to a Sanity `studio-info.laserBedSize` if it exists). Total path length sets up cut-time estimation; the later pricing plan adds `$/mm` rate per material and the math becomes "ballpark = path × rate × markup."
- **D-16:** Path length method — sum of `path.getTotalLength()` from `SVGPathElement` for each `<path>` in the SVG, including any path elements nested inside `<g>` groups. Planner judges whether to include implicit shapes (`<rect>`, `<circle>`, `<line>`, `<polyline>`, `<polygon>`) in v0 or punt to a later plan; matters for designs exported by simpler tools.
- **D-17:** SVG unit handling — read `viewBox` + `width`/`height` attributes, normalize to mm. SVG default is user units; Inkscape/LightBurn typically save in mm but pixel-based exports happen. If unit can't be confidently inferred, surface a "unit interpretation: assumed mm" note rather than guessing silently.

### Out of scope FOR PLAN 03-01 (in scope for later plans within Phase 3)
- **D-18:** Material picker, quantity input, price-range display, markup buffer math — Plan 03-02 (or later) territory. Plan 03-01 just shows geometry; it does NOT show any dollar number.
- **D-19:** `pricing-rule` Sanity schema (QTE-06) — Plan 03-02 or later. Stub doesn't read pricing data because it doesn't display prices.
- **D-20:** Netlify Function + Resend submission (QTE-07) — later plan. Stub may include a placeholder "Submit for confirmation — coming soon" affordance per D-03 but does NOT actually POST anywhere.
- **D-21:** reCAPTCHA v3 server-verified (QTE-08) — later plan, ships with the submission flow.
- **D-22:** DOMPurify (QTE-09) — only relevant when SVG content renders to the DOM; Plan 03-01 does NOT render SVG visually (just parses for path length + bbox), so DOMPurify enters when/if SVG preview lands. Memory-bounded STL/DXF parsing applies in Plan 03-01 via the file size cap (D-12).
- **D-23:** localStorage form-state persistence (QTE-10) — later plan, lands when there's a multi-step form to persist.

### Claude's Discretion
- **CTA entry placement** (nav vs service-page hero vs both) — D-06 leaves this to the planner.
- **Descriptive copy location** (Sanity vs hardcoded) — D-07 leaves this open; recommend hardcoded for the stub.
- **Parsing library choice** (Three.js loaders vs standalone vs Web Worker) — D-11 lays out trade-offs; planner picks based on bundle-size profiling.
- **File size cap value** (D-12 suggests 25MB; planner judges).
- **Implicit-shape path-length inclusion** (D-16; SVG `<rect>`/`<circle>`/etc — Plan 03-01 vs later plan).
- **Plan 03-01 placeholder submit behavior** (D-03; "coming soon" CTA, redirect to /contact, or no CTA at all).
- **Plan count and ordering** for QTE-04..10 across Plans 03-02..03-NN — planner judgment based on natural shipping boundaries (mirror Phase 2's wave structure).
- All decisions D-01..D-23 may be adjusted by the planner if a concrete obstacle is found in the codebase — flag in PLAN.md deviations.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level requirements & roadmap
- `.planning/PROJECT.md` §Constraints, §Out of Scope — tech-stack lock (CRA + React 18 + JS, no TS/Next), Netlify-only hosting + Functions, Sanity-anonymous-CDN-reads pattern, no auth/users, no real-time
- `.planning/REQUIREMENTS.md` §Quote Tool (Auto-Pricing) — QTE-01..10 (in scope this phase) and §v2 Requirements §Quote Enhancements — QTE-11..13 (explicitly out)
- `.planning/ROADMAP.md` §Phase 3 — goal statement and 5 success criteria the planner verifies against
- `.planning/STATE.md` — Phase 2 verification status (passed 5/5); current phase entry

### Phase 1 (locked decisions carried forward)
- `.planning/phases/01-foundation-refactor-env-pinning/01-CONTEXT.md` — `useSanityQuery` hook contract, `SERVICES` constant shape (used for tab pre-fill mapping), dark-only commitment, smoke-test scaffold
- `.planning/phases/01-foundation-refactor-env-pinning/01-VERIFICATION.md` — what's already in place

### Phase 2 (load-bearing patterns to reuse)
- `.planning/phases/02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub/02-CONTEXT.md` — D-24 (`?service=` + `document.referrer` pre-fill cascade — the template for `/quote` tab pre-fill per D-05); D-25 (SERVICES-driven dropdown — same pattern for tab labels); D-26 (CSS-hidden honeypot — relevant when submission lands in later plan); D-27 (Sanity studio-info pattern — relevant if descriptive copy moves to Sanity per D-07); D-28 (`public/index.html` Netlify form prerender — relevant when later plan adds quote submission)
- `.planning/phases/02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub/02-VERIFICATION.md` — current state of the codebase entering Phase 3
- `.planning/phases/02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub/02-SCHEMA-SPEC.md` — Sanity schema rollout pattern; same approach when `pricing-rule` schema lands in a later plan

### Codebase ground truth
- `.planning/codebase/STACK.md` — CRA 5 + React 18.3.1 + pnpm 9 + Node 20 (pinned); `--openssl-legacy-provider` retained until Phase 4; bundle size constraints
- `.planning/codebase/ARCHITECTURE.md` — current routing layer, Sanity-fetch idioms, SPA shape; `/quote` slots into the existing `App.js` lazy-route pattern
- `.planning/codebase/INTEGRATIONS.md` — Sanity client config (anonymous CDN reads, hardcoded projectId), Netlify Forms wiring patterns, no existing serverless functions (later plan adds the first one)
- `.planning/codebase/CONVENTIONS.md` — `.jsx` for components/hooks, `.js` for plain modules; `ternary` not `tertiary` token name; existing Tailwind dark-pair convention

### Out-of-scope guardrails
- `.planning/REQUIREMENTS.md` §v2 Requirements §Quote Enhancements — QTE-11 (slicer integration), QTE-12 (customer dashboard), QTE-13 (STL preview rendering) — NOT in this phase
- `.planning/PROJECT.md` §"Out of Scope" — TypeScript, Next.js, accounts, configurable shop products
- `.planning/ROADMAP.md` §Phase 4 — Vite migration boundary (`--openssl-legacy-provider` flag stays in this phase)
- `.planning/ROADMAP.md` §Phase 5 — pre-made-goods shop boundary (the quote tool is custom-work pricing; pre-made shop is a separate surface)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/hooks/useSanityQuery.jsx`** (Phase 1) — wraps `sanityClient.fetch` with `{ data, loading, error, refetch }` + `AbortController` cancellation. Any Sanity fetch in this phase MUST use this hook (relevant when later plans add `pricing-rule` and `material` queries; Plan 03-01 may not need it if descriptive copy is hardcoded per D-07).
- **`src/data/services.js`** (Phase 1) — `SERVICES = [{ key, urlSegment, navLabel, sanityType, contactSubject }]` with `laser` and `print` declared. `/quote` tab labels and pre-fill matching read from this. Possible extension during Phase 3 for `acceptedFileFormats` per service if useful — planner discretion.
- **`src/components/contact/ContactForm.jsx`** — the `?service=` + `document.referrer` pre-fill cascade (D-24 from Phase 2) is the template for `/quote` tab pre-fill per D-05. Read it before implementing tab pre-fill so the two patterns stay consistent.
- **`src/utilities/encodeFormData.jsx`** — Netlify Forms POST encoder. Relevant when a later plan adds the quote submission flow; not used in Plan 03-01.
- **`src/components/shared/SEOHead.jsx`** + `react-helmet-async` (Phase 2) — `/quote` page mounts a `SEOHead` like every other route. Per-page `<title>` + meta description + og: tags.
- **`scripts/generate-sitemap.cjs`** (Phase 2) — `/quote` should be added to `STATIC_ROUTES` so it's emitted in `build/sitemap.xml`.
- **`@tailwindcss/forms`** plugin — file input styling picks up automatically.
- **`framer-motion`** — already wraps the App with `AnimatePresence`. Tab transitions on `/quote` may use `motion.*` per existing convention; no new animation library.

### Established Patterns
- **`React.lazy` + `Suspense`** in `App.js` for page components — `Quote.jsx` follows the same lazy-load pattern.
- **Tab UI** — no existing tab component in the codebase. Plan 03-01 introduces the first tabs UI; planner judges whether to inline (small, scoped) or extract a `<Tabs>`/`<TabPanel>` component (reusable but premature without a second consumer). Lean inline unless the abstraction is genuinely clean.
- **Service-driven config** — `SERVICES` is the canonical list of services. Tab labels, pre-fill mapping, accepted-format strings should derive from it where reasonable, not be duplicated in `Quote.jsx`.
- **Sanity content-type per Sanity doc-type** — when later plans add `pricing-rule`, mirror the `studio-info` / `faq` pattern from Phase 2 (singleton or filtered list, owner-edits-without-redeploy).
- **Netlify Forms via `data-netlify="true"` + hidden prerender form in `public/index.html`** — when later plans add quote submission, this is NOT the right pattern (Netlify Forms is fire-and-forget email; QTE-07 wants a Netlify Function so reCAPTCHA can be server-verified before the email fires). Different mechanism, different setup.

### Integration Points
- **`src/App.js`** — adds `/quote` route via `React.lazy` + `Suspense`, same shape as `/styles`, `/3d-printing`, `/about`, etc.
- **`src/components/shared/AppHeader.jsx`** — possible "Get a Quote" nav entry (D-06; planner discretion).
- **`src/components/services/ServiceHeader.jsx`** or similar — possible service-page hero CTA to `/quote?service={key}` (D-06; planner discretion).
- **`scripts/generate-sitemap.cjs`** — add `/quote` to `STATIC_ROUTES`.
- **`public/robots.txt`** — no change (already references the sitemap).
- **`package.json`** — Plan 03-01 adds parser dependencies (Three.js loaders OR lighter standalone STL/OBJ parsers — D-11 leaves choice to planner). Later plans add `dompurify`, `resend` (function-only, not bundled), reCAPTCHA verifier (function-only).
- **No existing Netlify Function** — `netlify/functions/` directory doesn't exist yet. Later plans introduce the first one; Plan 03-01 doesn't need it.
- **Sanity Studio** — no schema changes in Plan 03-01. Later plans add `pricing-rule`; owner-prep checkpoint pattern from Phase 2 applies.

</code_context>

<specifics>
## Specific Ideas

The user's framing was "stub something out" — start with file upload + basic geometry readouts, build the rest later in further plans. They explicitly named:
- "different tabs" for laser vs 3D — resolved as in-page tabs on a single `/quote` route (D-04)
- "stl, iges, etc." for 3D — narrowed to STL + OBJ for Plan 03-01 (D-08); IGES is a NURBS/B-rep format with no good in-browser parser and is dropped from this phase entirely
- SVG for laser — accepted, DXF deferred to a later plan within Phase 3 (D-09)
- "basic volume calculation" — locked as signed-tetrahedra divergence theorem (D-13)
- "front end pages describing the estimator tool and the start of the tool, but not the entire UX" — the staged-plan structure (D-01) honors this directly

No external references, no "I want it to work like X" examples cited.

</specifics>

<deferred>
## Deferred Ideas

Items that came up adjacent to the discussion but belong outside Phase 3 (or in v2):

- **STL preview rendering in the quote UI** — QTE-13, explicit v2 boundary in REQUIREMENTS.md. If owner wants to preview their model after upload, that's a v2 feature gated by R3F + drei bundle cost.
- **Slicer-grade pricing** — QTE-11, explicit v2 boundary. Plan 03-01's signed-tetrahedra volume + later plan's path-length × rate is the ballpark; real slicer (Cura-Engine in a Background Function or hosted slicer API) is v2.
- **Customer dashboard for tracking submitted estimates** — QTE-12, v2. Out of scope; current loop is "submit → owner replies via email."
- **3MF + DXF parsing** — in-phase deferral (D-08, D-09). Plans 03-02..NN may pick these up if the owner asks for them; otherwise they remain QTE-02 line items satisfied by "stated format constraints visible before upload" but not yet wired.
- **Tab UI extraction into a reusable component** — planner discretion in Plan 03-01 (likely inline since N=1 consumer); revisit at the natural Rule-of-Three moment.
- **Sanity-driven descriptive copy on `/quote`** — D-07 leans hardcoded for the stub; if owner wants to tune wording without redeploy, a later plan moves it to a `studio-info` extension or new `quote-tool-info` singleton.
- **Plausible Analytics on `/quote`** — research recommended for the project broadly; not in QTE-XX. Cheap to add later if owner wants funnel data on the estimator.
- **Bundle-size profiling** — D-11 hints at this; if Plan 03-01 lands and the bundle balloons (Three.js loaders pull in ~600KB), profiling and a switch to standalone parsers becomes a follow-up. Not pre-decided.

### Reviewed Todos (not folded)

None — `gsd-tools list-todos` returned 0 todos.

</deferred>

---

*Phase: 03-auto-pricing-quote-tool*
*Context gathered: 2026-05-07*
