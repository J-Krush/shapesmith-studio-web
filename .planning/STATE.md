---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Plan 02-01 complete — Wave 2 ready (Plan 02-02)
last_updated: "2026-05-06T19:00:00.000Z"
last_activity: 2026-05-06 -- Plan 02-01 finalized; Task 4 checkpoint resolved via deviation (material.services field)
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 11
  completed_plans: 7
  percent: 64
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value:** The site has to look legit enough that the owner feels comfortable marketing it again — visual confidence first, features second.
**Current focus:** Phase 02 — Bundle 1 Relaunch — 3D printing + spruce + content + SEO + shop stub

## Current Position

Phase: 02 (Bundle 1 Relaunch — 3D printing + spruce + content + SEO + shop stub) — EXECUTING
Plan: 1 of 5 complete — ready to start Plan 02-02 (Wave 2: 3D printing surface, MaterialsSection / FAQ / WontMake / TrustCopyBlock)
Status: Wave 1 done; deviation captured (material.services field instead of D-06/D-07 processes migration)
Last activity: 2026-05-06 -- Plan 02-01 finalized; Task 4 checkpoint resolved; SUMMARY committed

Progress: Phase 1 [██████████] 100% — Complete; Phase 2 [██░░░░░░░░] 1/5 plans complete

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- **Plan 02-01 / Task 4 deviation (2026-05-06):** Sanity `material.processes` holds laser-operations (`Cut`, `engrave`, `etch`) — NOT service-compatibility tags. Adopted a NEW `material.services` field (string array of `laser` | `print` | `both`) instead of D-06 ref-array or D-07 string-array migration of `processes`. Existing `processes` is preserved as-is (it correctly documents laser ops). Wave 2 (Plan 02-02) `MaterialsSection.jsx` `MATERIALS_QUERY` MUST use `$serviceKey in services` — not `$serviceKey in processes[]->key` (D-06, obsolete) and not `$serviceKey in processes` (D-07, obsolete). Backfill: every existing material gets `services: ["laser"]`. Full record: `02-01-SUMMARY.md` Deviations §1 + `02-SCHEMA-SPEC.md` §"Deviation from Plan 02-01 Task 4 Checkpoint".
- Plan 02-01 (2026-05-06): Generalized ServicesContext over parallel PrintsContext per D-01..D-05; clean rip of ProjectsContext/SingleProjectContext (no compat shim).
- Plan 02-01 (2026-05-06): `react-helmet-async` pinned to `^2.0.5` (NOT `^3.x` — too new per D-19/RESEARCH Pitfall 7).
- Roadmap (2026-05-02): Bundle 1 ships as a single big relaunch phase — visual spruce + content (FAQ, "what we won't make", turnaround) + SEO ride together, not as a fast-follow
- Roadmap (2026-05-02): `useThemeSwitcher` is stripped entirely; commit to dark-only, no light-mode design pass
- Roadmap (2026-05-02): Vite migration is its own phase between Phase 3 (quote) and Phase 5 (shop) — not skipped
- Roadmap (2026-05-02): ServicesContext-vs-parallel-PrintsContext deferred to Phase 2's plan (input: trade-off table in research/SUMMARY.md) — RESOLVED in Plan 02-01 (generalized ServicesContext chosen)
- Roadmap (2026-05-02): Granularity coarse → 5 phases (research suggested 6; combined Foundation as standalone, Bundle 1 spruce + content + SEO into one)

### Pending Todos

None yet.

### Blockers/Concerns

- **RESOLVED (Plan 02-01 Task 4 checkpoint):** Owner ran the Sanity Vision query and discovered `material.processes` documents laser-operations (`Cut`, `engrave`, `etch`) — NOT service-compatibility tags as both D-06 and D-07 assumed. Resolution: adopt a NEW `material.services` field. See Decisions section above. Schema spec updated (`02-SCHEMA-SPEC.md` revised in commit `c175a90`). Wave 2 unblocked.

**Owner-side prep noted in research (resolve before or during Phase 2 planning):**

- ✅ `material.processes` shape confirmed via Plan 02-01 Task 4 checkpoint (laser-operation values; NOT service tags). Adopting new `material.services` field — see Decisions above.
- Schedule a real-photo session for the new H2D so Phase 2 doesn't ship with placeholder blocks for hero imagery (still pending; not blocking — `Placeholder` component degrades gracefully per D-11)
- Owner applies the updated schemas in `02-SCHEMA-SPEC.md` to Sanity Studio per the §8 rollout checklist before Wave 2 components render against real Sanity data (loading/empty states render fine while owner is mid-rollout — no execution ordering constraint)

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-05-06T19:00:00.000Z
Stopped at: Plan 02-01 complete — ready to start Plan 02-02 (Wave 2)
Resume file: .planning/phases/02-bundle-1-relaunch-3d-printing-spruce-content-seo-shop-stub/02-02-PLAN.md

### Performance Metrics (Phase 2)

**Plan 02-01:** ~2h actual (across multiple sessions including the Task 4 human-verify checkpoint pause). 4 tasks (3 auto + 1 checkpoint resolved via deviation). 14 source files + 1 schema spec doc + package manifest + lockfile changes. 5 commits (b554335, 5d54082, c6440f9, 07cdc53, c175a90).
