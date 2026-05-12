# Phase 1: Foundation — refactor + env pinning - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-03
**Phase:** 1-foundation-refactor-env-pinning
**Areas discussed:** all 4 presented gray areas (delegated to Claude)

---

## Gray Areas Presented

Four phase-specific gray areas were surfaced for the user to choose from. Smoke-test depth (FOUND-06) was held back on the first turn (4-option cap) and would have been raised next had the user picked any of the four. The user instead delegated all decisions to Claude.

| Option | Description | Selected |
|--------|-------------|----------|
| useSanityQuery surface | Beyond `{data, loading, error}`: expose `refetch`? `AbortController` vs ignored-flag cancellation? Auto-memoize GROQ params or require a deps array? (FOUND-01 — touches 7 fetch sites.) | (delegated) |
| Dark theme location | `class="dark"` hardcoded on `<html>` in `public/index.html` vs `useEffect` in `App.js` vs documentElement set in `src/index.js` before mount. (FOUND-03) | (delegated) |
| Modal refactor scope | Narrow `useState` fix in `ProjectGallery` only, OR introduce a reusable `<Modal>` now since Phase 2 needs the same pattern. (FOUND-04) | (delegated) |
| capabilitiesTitle removal | Clean rip + full SERVICES wiring now, OR thin compatibility shim Phase 2 deletes. (FOUND-02) | (delegated) |

**User's response:** *"I don't really care about any of these things — just move forward with whatever you think is best. I don't want to refactor too much, but I want to bring this up to date with modern React and any best practices you think we should cover."*

**Notes:** Two binding constraints from the response:
1. **Don't refactor too much** — Phase 1 stays inside FOUND-01..06; do not pull dead-code/cleanup items from CONCERNS.md forward. VIS-05 owns the broader purge in Phase 2.
2. **Modern React + best practices** — favors `AbortController`, hooks-only state for the modal, `class="dark"` static-HTML route over JS side-effects, atomic-commit PR structure.

---

## Claude's Discretion

All four originally-presented gray areas plus the held-back fifth (smoke-test depth) were exercised under user delegation. Each decision is recorded in CONTEXT.md `<decisions>` (D-01..D-23) with rationale. Highlights:

- **useSanityQuery:** `{data, loading, error, refetch}`, `AbortController` cancellation, explicit `deps` array (no auto-stringify of params).
- **Dark theme:** `class="dark"` on `<html>` in `public/index.html`. `useThemeSwitcher` deleted. Light-mode color tokens removed from `tailwind.config.js`. `dark:` Tailwind variants left in component files (Phase 2 spruce can decide).
- **Modal:** Narrow `useState` fix in `ProjectGallery.jsx` only. Reusable `<Modal>` deferred to Phase 2 (N=2 is the right moment). Free fix bundled in: `image.asset.id` → `image.asset._id` React-key bug.
- **SERVICES:** Clean rip. New `src/data/services.js` declares both `laser` and `print` entries (Phase 2 lights up `print` without re-touching the schema). All four `capabilitiesTitle` consumers migrated. `ProjectsContext` shape untouched — generalization is Phase 2's call.
- **Smoke test:** Single mount-without-crashing test on `<App />` in `MemoryRouter` with mocked Sanity client. No new test deps.
- **Env pin:** `.nvmrc` → `20`, `package.json` adds `engines` + `packageManager`, new `netlify.toml` declares `NODE_VERSION = "20"` and `pnpm build`. `pnpm-lock.yaml` committed. `--openssl-legacy-provider` retained until Phase 4 Vite migration.
- **Plan structure:** Recommend 6 atomic commits (or one PR with 6 commits) in suggested order: env-pin → hook → fetch-site migration → dark theme → modal → SERVICES → smoke test.

## Deferred Ideas

Codebase concerns surfaced during scout but explicitly NOT pulled into Phase 1 (recorded in CONTEXT.md `<deferred>` for traceability):

- `useScrollToTop` listener leak — real bug, not in FOUND-XX
- `BackToTop` stub deletion — Phase 2 VIS-05
- `isProd`/`getImageUrl` dead code — Phase 2 VIS-05
- `ProjectsFilter` / `ProjectRelatedProjects` / `AboutClients` / `AboutCounter` orphan deletes — Phase 2 VIS-05
- `HireMeModal.jsx` + `contact-form.js` orphan deletes — Phase 2 VIS-05
- Sanity env-driven config — best paired with Phase 4 Vite migration
- `rel="noopener noreferrer"` + `target="__blank"` typo fix — security smell, not scoped
- README rewrite — Phase 2 SEO-04
- Reusable `<Modal>` extraction — Phase 2 when N=2
- Tailwind `dark:` prefix flattening — possible during Phase 2 spruce sweep
- Broader test coverage — out of FOUND-06 scope
