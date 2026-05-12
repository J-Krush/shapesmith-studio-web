---
phase: 05-pre-made-goods-shop
plan: 02
subsystem: shop-detail-page
tags: [shop, refactor, gallery, shared-primitive]
dependency_graph:
  requires:
    - "src/components/services/ServiceGallery.jsx (Phase 2 — extraction source)"
    - "src/components/shared/SanityImage.jsx (Phase 2 — image renderer with placeholder fallback)"
    - "src/context/SingleServiceContext.jsx (Phase 2 — wrapper data source)"
    - "src/context/ServicesContext.jsx (Phase 2 — wrapper service-key source)"
  provides:
    - "src/components/shared/ImageGallery.jsx (props-driven gallery primitive consumable by ShopSingle)"
    - "src/components/services/ServiceGallery.jsx (thin context-coupled wrapper preserving the zero-prop API)"
  affects:
    - "src/pages/ProjectSingle.jsx (no API change — still imports ServiceGallery, still renders <ServiceGallery />)"
tech_stack:
  added: []
  patterns:
    - "Shared primitive + thin context-coupled wrapper (extraction pattern)"
key_files:
  created:
    - "src/components/shared/ImageGallery.jsx (69 LOC, props-driven, zero context coupling)"
    - "src/components/shared/ImageGallery.test.jsx (132 LOC, 7 vitest cases)"
  modified:
    - "src/components/services/ServiceGallery.jsx (rewritten 70 → 27 LOC; now a wrapper around ImageGallery)"
decisions:
  - "Honored CONTEXT D-07 images schema (1–6 per product, alt required) — props contract is {images, alt, placeholderCaption}, alt resolution per-image > prop > empty so consumers can pass a name as the prop fallback (e.g. ShopSingle will pass product.name)."
  - "REFACTOR step skipped: the GREEN implementation is already minimal and matches PATTERNS.md verbatim. No cleanup needed."
metrics:
  duration: "~3 min"
  completed: "2026-05-09"
  tests_added: 7
  tests_total_after: 50
---

# Phase 05 Plan 02: ImageGallery Primitive Extraction Summary

Extracted the thumbnail-grid + lightbox gallery from `src/components/services/ServiceGallery.jsx` into a context-free, props-driven primitive at `src/components/shared/ImageGallery.jsx`, then rewrote `ServiceGallery.jsx` as a 27-line wrapper that delegates rendering — unblocking `ShopSingle.jsx` (Plan 05-05) which cannot use the original `ServiceGallery` because of its `useSingleService()` coupling.

## What Shipped

- **`src/components/shared/ImageGallery.jsx`** (new, 69 LOC) — Renders the thumbnail grid + click-to-open lightbox. Accepts `{images, alt, placeholderCaption}` props only. Zero context coupling — verified by grep and by a unit test that renders the component bare without any provider. Tailwind class strings byte-identical to the source (`w-1/3` 3-up grid, `aspect-[4/3]` thumbs, `fixed top-0 left-0 z-80 w-screen h-screen bg-black/70` lightbox overlay, `max-h-[90vh] max-w-[90vw] object-contain` lightbox image, `text-5xl` close button).
- **`src/components/services/ServiceGallery.jsx`** (rewritten, 70 → 27 LOC) — Now a thin wrapper that pulls `singleService.detailImages` from `useSingleService()` and `serviceKey` from `useServices()`, computes the `placeholderCaption` ternary, and forwards everything to `<ImageGallery />`. Preserves the existing zero-prop API consumed by `ProjectSingle.jsx`.
- **`src/components/shared/ImageGallery.test.jsx`** (new, 132 LOC, 7 cases) — Covers: empty/undefined `images`, single-thumbnail render, lightbox open + close, alt fallback chain (per-image > prop > empty), and a guard test that mounts `ImageGallery` with no provider to prove zero context coupling.

## Verification

| Gate | Result |
|------|--------|
| `pnpm test` | **50 passed (50)** — 7 new ImageGallery cases + 43 prior tests still green. No regressions. |
| `pnpm build` | `✓ built in 1.19s` — 0 errors, sitemap regenerated, chunk count consistent with the Phase 4 baseline (Vite tree-shakes `ImageGallery` into the same `ProjectSingle-A9zS9nW2.js` chunk as `ServiceGallery`). |
| `grep "from.*ServiceGallery" src/` | Only `src/pages/ProjectSingle.jsx:4` — no other accidental consumer was introduced. |
| Acceptance grep gauntlet | All 10 PLAN acceptance assertions pass (props signature, default export, wrapper imports, no context calls/imports in primitive, lightbox class strings preserved, etc.). |

## Lines Moved / Diff Shape

```
src/components/services/ServiceGallery.jsx | 70 → 27 LOC  (delete 43, insert 0 net)
src/components/shared/ImageGallery.jsx     |  0 → 69 LOC  (new file)
src/components/shared/ImageGallery.test.jsx|  0 → 132 LOC (new test file)
```

## Regression Risk Addressed

Per RESEARCH §Pitfall 8, this refactor was sequenced as its own small plan so that any visual regression on `/styles/:slug` or `/3d-printing/:slug` would be attributable to a 2-file diff rather than a larger storefront plan. The mitigation chain:

1. **Byte-stable Tailwind classes** copied verbatim from the source (verified by acceptance greps for the lightbox overlay class and lightbox image classes).
2. **Identical alt fallback logic** — original chain was `image.altText ?? singleService?.title ?? ''`; new chain is `image?.altText ?? alt ?? ''` where the wrapper feeds `singleService?.title` as the `alt` prop. Behavior is equivalent.
3. **Wrapper preserves the zero-prop API** consumed by `ProjectSingle.jsx`, so no edits to consumer code were needed.
4. **Test gate**: 50/50 vitest cases pass; build exits 0.

T-05-02-01 (visual regression on detail pages) — mitigated.

## Deviations from Plan

None. Implementation matches PLAN.md `<action>` Steps 1–2 verbatim:
- Step 1 (extract `ImageGallery`): all 8 mechanical transforms applied as specified — drop hooks, drop ternary, add props parameter, replace map source with `(images ?? [])`, swap alt resolution to `image?.altText ?? alt ?? ''` for thumbs and `openImage?.altText ?? alt ?? ''` for the lightbox, keep `useState(null)`, byte-stable Tailwind classes, preserve `loading="lazy"`/`loading="eager"`, preserve close handler.
- Step 2 (rewrite `ServiceGallery`): file body matches the PLAN snippet exactly.
- Step 3 (verify): `pnpm test` and `pnpm build` both green; manual smoke check deferred to live preview (no dev server in this worktree).

## Authentication Gates

None — pure refactor, no external services touched.

## Known Stubs

None. ImageGallery renders real data via `<SanityImage>` and degrades to `<Placeholder>` (existing branded placeholder) when an asset is missing — no hardcoded empty fallbacks were introduced.

## TDD Gate Compliance

- **RED gate** (commit `849280d` `test(05-02)`): 7 failing tests committed before any implementation; verified failure was due to "Failed to resolve import './ImageGallery'" (file did not yet exist).
- **GREEN gate** (commit `185ae47` `feat(05-02)`): both files written, all 7 tests pass, full suite at 50/50.
- **REFACTOR gate**: not required — the GREEN implementation is already the minimal mechanical transform from PATTERNS.md. No cleanup commit added.

## Self-Check: PASSED

- [x] `src/components/shared/ImageGallery.jsx` exists (`test -f` OK)
- [x] `src/components/services/ServiceGallery.jsx` exists and was modified
- [x] `src/components/shared/ImageGallery.test.jsx` exists
- [x] Commit `849280d` (RED) found in `git log`
- [x] Commit `185ae47` (GREEN) found in `git log`
- [x] No accidental file deletions in either commit
- [x] `pnpm test` exits 0 (50/50)
- [x] `pnpm build` exits 0 (`✓ built`)

## Threat Flags

None — pure refactor, no new trust boundaries, no new network endpoints, no schema changes.
