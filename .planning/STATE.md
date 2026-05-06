---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Plan 02-03 complete — ready to start Plan 02-04 (Wave 4 — trust copy + SEO mounting)
last_updated: "2026-05-06T19:29:15.868Z"
last_activity: 2026-05-06
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 11
  completed_plans: 10
  percent: 91
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value:** The site has to look legit enough that the owner feels comfortable marketing it again — visual confidence first, features second.
**Current focus:** Phase 02 — Bundle 1 Relaunch — 3D printing + spruce + content + SEO + shop stub

## Current Position

Phase: 02 (Bundle 1 Relaunch — 3D printing + spruce + content + SEO + shop stub) — EXECUTING
Plan: 4 of 5 complete — ready to start Plan 02-04 (Wave 4: trust copy + SEO — SEOHead mounted on every route, JsonLdLocalBusiness on Home, sitemap.xml + robots.txt, og-default.png, theme-color)
Status: Ready to execute
Last activity: 2026-05-06

Progress: [█████████░] 91%

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
| Phase 02 P04 | 5m | 2 tasks | 11 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- **Plan 02-03 (2026-05-06):** Visual spruce sweep landed. Dual-service hero (D-10), peer-equal SERVICES.map-driven nav with `border-b-2 border-accent` active state (SVC-03 + UI-SPEC OQ4), NotFound `/404` page with inline `<Helmet noindex>` (UI-SPEC OQ3), `/shop` route registered (Plan 02-05 replaces the legacy stub with the Coming Soon page). Indigo→accent class swap consolidated to a synthesis-clean `! grep -rE "indigo-(400|500|600|700)" src/` empty result — including dead-comment cleanup in HireMeModal/AppFooter/AppFooterCopyright (Tailwind JIT scans JSX comments) and `App.css .scrollToTop` (live BackToTop button). External-link safety (D-30): all `target="__blank"` typo sites fixed to `target="_blank"` + `rel="noopener noreferrer"`. AboutMeBio image alt-text bound to Sanity (CNT-04 partial — free a11y win during sweep). D-08 honored: zero new tokens in `tailwind.config.js`.
- **Plan 02-03 (2026-05-06):** Created NotFound.jsx as part of Task 2 (not Task 3) per Rule 3 deviation — the lazy import in App.js would otherwise fail to build. Page content matches the Task-3 spec verbatim. Plan 02-04 will swap inline `<Helmet>` for the `<SEOHead noindex>` component once that wrapper is mounted everywhere.
- **Plan 02-02 (2026-05-06):** Wave 2 honored the Plan 02-01 GROQ deviation: `MaterialsSection.MATERIALS_QUERY` reads `$serviceKey in services` (the new field), not `$serviceKey in processes[]->key` (D-06) and not `$serviceKey in processes` (D-07). Both prior CONTEXT decisions are superseded; deviation is documented inline in `MaterialsSection.jsx` + `02-02-SUMMARY.md` Deviations §1.
- **Plan 02-02 (2026-05-06):** Two-layer `/materials` redirect — Netlify `public/_redirects` (deploy-time 301) + React Router `<Navigate replace />` (SPA hops). Both layers explained inline in their files. `src/pages/Materials.jsx` preserved (Plan 02-05 owns deletion per VIS-05).
- **Plan 02-02 (2026-05-06):** Plain-text portable-text rendering for FAQ + WontMake — no `@portabletext/react` dep introduced (CONTEXT.md doesn't authorize). Owner-supplied bold/italic/links in answers will render as flat text; rich formatting deferred to v2.
- **Plan 02-02 (2026-05-06):** [Rule 3 fix] `App.test.js` `jest.mock` for `./utilities/sanityImage` — the smoke test's require chain now reaches `@sanity/image-url` ESM through `MaterialSingle → SanityImage → sanityImage.jsx`, which Jest 27 (CRA 5) without `transformIgnorePatterns` can't parse. Mocking the thin wrapper module keeps the smoke test focused on routing + nav.
- **Plan 02-01 / Task 4 deviation (2026-05-06):** Sanity `material.processes` holds laser-operations (`Cut`, `engrave`, `etch`) — NOT service-compatibility tags. Adopted a NEW `material.services` field (string array of `laser` | `print` | `both`) instead of D-06 ref-array or D-07 string-array migration of `processes`. Existing `processes` is preserved as-is (it correctly documents laser ops). Wave 2 (Plan 02-02) `MaterialsSection.jsx` `MATERIALS_QUERY` MUST use `$serviceKey in services` — not `$serviceKey in processes[]->key` (D-06, obsolete) and not `$serviceKey in processes` (D-07, obsolete). Backfill: every existing material gets `services: ["laser"]`. Full record: `02-01-SUMMARY.md` Deviations §1 + `02-SCHEMA-SPEC.md` §"Deviation from Plan 02-01 Task 4 Checkpoint".
- Plan 02-01 (2026-05-06): Generalized ServicesContext over parallel PrintsContext per D-01..D-05; clean rip of ProjectsContext/SingleProjectContext (no compat shim).
- Plan 02-01 (2026-05-06): `react-helmet-async` pinned to `^2.0.5` (NOT `^3.x` — too new per D-19/RESEARCH Pitfall 7).
- Roadmap (2026-05-02): Bundle 1 ships as a single big relaunch phase — visual spruce + content (FAQ, "what we won't make", turnaround) + SEO ride together, not as a fast-follow
- Roadmap (2026-05-02): `useThemeSwitcher` is stripped entirely; commit to dark-only, no light-mode design pass
- Roadmap (2026-05-02): Vite migration is its own phase between Phase 3 (quote) and Phase 5 (shop) — not skipped
- Roadmap (2026-05-02): ServicesContext-vs-parallel-PrintsContext deferred to Phase 2's plan (input: trade-off table in research/SUMMARY.md) — RESOLVED in Plan 02-01 (generalized ServicesContext chosen)
- Roadmap (2026-05-02): Granularity coarse → 5 phases (research suggested 6; combined Foundation as standalone, Bundle 1 spruce + content + SEO into one)
- [Phase ?]: Plan 02-04 (2026-05-06): SEO surface fully wired. <SEOHead /> mounts on every public route except /shop (Plan 05 owns it); <JsonLdLocalBusiness /> on Home only (D-21); public/index.html has Phase 2 static defaults (description/og: tags/theme-color #291c30) replacing CRA boilerplate; public/og-default.png is the brand wordmark fallback (D-20); scripts/generate-sitemap.cjs runs postbuild via npm-lifecycle, writing build/sitemap.xml from STATIC_ROUTES + Sanity laser/print slugs; public/robots.txt references the sitemap. T-02-04-01 (JSON-LD injection) mitigated via JSON.stringify; T-02-04-02 (XML injection) mitigated via escapeXml; T-02-04-05 (DoS) mitigated via try/catch + buildDir guard. First-build sitemap emits 6 URLs (all static — Sanity slugs not yet populated; script handles empty arrays gracefully).

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

Last session: 2026-05-06T19:29:15.862Z
Stopped at: Plan 02-03 complete — ready to start Plan 02-04 (Wave 4 — trust copy + SEO mounting)
Resume file: None

### Performance Metrics (Phase 2)

**Plan 02-01:** ~2h actual (across multiple sessions including the Task 4 human-verify checkpoint pause). 4 tasks (3 auto + 1 checkpoint resolved via deviation). 14 source files + 1 schema spec doc + package manifest + lockfile changes. 5 commits (b554335, 5d54082, c6440f9, 07cdc53, c175a90).

**Plan 02-02:** ~6 minutes actual (single sequential session, no checkpoint). 3 tasks (all auto). 5 created files + 8 modified files. 3 commits (87e84d1, e5bbe99, 89a8db1). Deviation: GROQ override carried forward from Plan 02-01 spike (uses `$serviceKey in services`, not `processes`); Rule 3 jest.mock for `./utilities/sanityImage` to keep smoke test passing once `MaterialSingle` joined SanityImage's chain.

**Plan 02-03:** ~7 minutes actual (single sequential session, no checkpoint). 3 tasks (all auto). 1 created file (NotFound.jsx) + 13 modified files (AppBanner, AppHeader, App.js, QuickInfo, ServicesGrid, ContactForm, SocialLinks, AppFooter, AppFooterCopyright, HireMeModal, AboutMeBio, App.css, main.css). 3 commits (3b1289a, d2ec150, b9eadc7). Deviations: Rule 3 NotFound.jsx created in Task 2 (not Task 3) to avoid build-blocking missing-module error after lazy import added; Rule 2 indigo→accent purge extended into dead-comment code (HireMeModal + AppFooter + AppFooterCopyright) and live `App.css .scrollToTop` to satisfy synthesis check; obsolete dark-token parity check skipped (invalidated by Phase 1 commit 6942a1a that restored `-light` tokens for dark-mode use); single-quote NAV_ITEMS string literals (consistent with codebase JS convention).
