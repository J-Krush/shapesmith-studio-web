# Phase 3: Auto-Pricing Quote Tool - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-07
**Phase:** 03-auto-pricing-quote-tool
**Areas discussed:** Phase staging (housekeeping), Stub shape (tabs, file formats, 3D volume method, laser readout)

---

## Phase Staging — Where un-stubbed QTE items go

User reframed the discussion early: rather than building all 10 QTE items in one phase, scope the first plan to a stub (file upload + basic geometry) and stage the remainder. This raised a housekeeping question — what does the un-stubbed work block off?

| Option | Description | Selected |
|--------|-------------|----------|
| New decimal phase: 3.1 Quote Tool Completion | Insert a Phase 3.1 between 3 and 4 that picks up QTE-04..10. Roadmap-clean, each phase has a tight scope. | |
| Stay in Phase 3, ship as later plan waves | Phase 3 keeps all 10 QTE items but plans break naturally: Plan 03-01 is the stub, Plans 03-02..03-NN finish it. No roadmap edit. | ✓ |
| Defer un-stubbed items to v2 in REQUIREMENTS.md | QTE-04..10 move to v2 (alongside QTE-11..13). Phase 3 is officially "stub only." | |

**User's choice:** Stay in Phase 3, ship as later plan waves
**Notes:** Mirrors Phase 2's pattern (5 plans landed 27 requirements). ROADMAP.md and REQUIREMENTS.md untouched; planner determines wave count.

---

## Stub Shape — Tab Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Tabs on a single /quote page | One route /quote, two tabs inside ("3D Printing" / "Laser Cutting"). Single SEO surface. Tab state may persist to ?service= for deep-linking. | ✓ |
| Sub-routes /quote/3d-printing + /quote/laser | Two real routes plus a /quote landing page. Better SEO per service; matches SERVICES urlSegment pattern. | |
| Tabs + URL deep-links | Single page with tabs but each tab has a unique URL path. Best of both, more wiring. | |

**User's choice:** Tabs on a single /quote page
**Notes:** Simplest route shape for the stub.

---

## Stub Shape — File Formats Per Tab

| Option | Description | Selected |
|--------|-------------|----------|
| 3D: STL only — Laser: SVG only | Tightest stub. Skips 3MF, OBJ, IGES, DXF. | |
| 3D: STL + 3MF (+ OBJ) — Laser: SVG + DXF | Matches REQUIREMENTS QTE-02 exactly. More upfront work; 3MF needs zip+XML, DXF needs `dxf` library. | |
| 3D: STL + IGES — Laser: SVG | What user said verbatim. IGES has no good browser parser. | |
| 3D: STL + OBJ — Laser: SVG (free-text) | User-typed override. Both 3D formats are triangle meshes, same volume math. DXF deferred within phase. | ✓ |

**User's choice:** 3D: STL + OBJ — Laser: SVG (free-text answer)
**Notes:** OBJ is line-based text mesh; STL is binary or ASCII triangle data. Volume calculation is identical for both. IGES dropped (no in-browser parser available); DXF moved to a later plan within Phase 3.

---

## Stub Shape — 3D Volume Calculation Method

| Option | Description | Selected |
|--------|-------------|----------|
| Signed-tetrahedra (divergence theorem) | Standard for triangle meshes. Sum signed volumes of tetrahedra formed by each triangle and origin. ~10 LOC, accurate for closed/watertight meshes. | ✓ |
| Bounding box approximation | X * Y * Z of AABB. Trivial but typically overstates by 2-5x for organic shapes. | |
| Display dimensions only, no volume yet | Triangle count + file size + bbox dims. Defers volume math. Lowest scope. | |

**User's choice:** Signed-tetrahedra (divergence theorem)
**Notes:** Reports cm³. No library needed beyond the parser.

---

## Stub Shape — Laser Tab Readout

| Option | Description | Selected |
|--------|-------------|----------|
| Bounding box (W × H in mm) | Read viewBox / width-height attributes, normalize to mm. Tells visitor "will it fit on the bed." | |
| Bounding box + total path length | Bbox plus sum of Path2D.getTotalLength(). Path length sets up cut-time pricing in later plan. | ✓ |
| Just upload + show file metadata | "SVG accepted" + file size + path/group counts. No measurement. Smallest scope. | |

**User's choice:** Bounding box + total path length
**Notes:** Path length now means later pricing plan just adds $/mm rate per material. Implicit-shape inclusion (rect/circle/line/polyline/polygon) is planner discretion.

---

## Continuation Check

| Option | Description | Selected |
|--------|-------------|----------|
| Two more questions — CTA + tab pre-fill | Service-page hero CTA target, tab pre-fill from referrer/query (matching Phase 2 contact-form pattern). | |
| Two more questions — size cap + worker thread | File size cap + error UX, Web Worker for STL parsing vs main-thread. | |
| I'm ready for context | Lock decided items; smaller details fall to planner discretion (annotated as Claude's Discretion). | ✓ |

**User's choice:** I'm ready for context
**Notes:** Open gaps captured under "Claude's Discretion" in CONTEXT.md (CTA placement, tab pre-fill specifics, size cap value, parser library choice, Web Worker threshold, descriptive copy location).

---

## Claude's Discretion

Items the planner judges (captured in CONTEXT.md `<decisions>` and §"Claude's Discretion"):
- CTA entry placement (nav vs service-page hero vs both)
- Descriptive copy location (Sanity vs hardcoded for the stub)
- Parsing library choice (Three.js loaders vs standalone vs Web Worker)
- File size cap value (recommendation: 25MB)
- Implicit-shape path-length inclusion in laser readout
- Plan 03-01 placeholder submit behavior (coming-soon CTA / redirect to /contact / no CTA)
- Plan count and ordering for QTE-04..10 across Plans 03-02..03-NN
- Whether `acceptedFileFormats` field is added to `SERVICES` constant

## Deferred Ideas

Surfaced during discussion or adjacent to it; preserved for future phases:
- STL preview rendering in the quote UI (QTE-13, v2)
- Slicer-grade pricing (QTE-11, v2)
- Customer dashboard for tracking submitted estimates (QTE-12, v2)
- 3MF + DXF parsing — in-phase deferral; later plans within Phase 3 may pick up
- Tab UI extraction into reusable component — Rule-of-Three moment
- Sanity-driven descriptive copy on `/quote` — if owner wants to tune wording
- Plausible Analytics on `/quote` — funnel data; not in QTE-XX
- Bundle-size profiling — follow-up if Plan 03-01 STL/OBJ parser choices balloon the bundle
