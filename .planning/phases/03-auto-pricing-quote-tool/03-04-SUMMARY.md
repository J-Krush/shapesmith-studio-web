---
phase: 03-auto-pricing-quote-tool
plan: 04
subsystem: quote-tool
tags:
  - frontend
  - localstorage
  - hooks
  - polish
  - tdd
requires:
  - Plan 03-01 — /quote stub (QuoteTabs.jsx, FileDropzone, GeometrySummary)
  - Plan 03-02 — MaterialPicker, QuantityInput, PriceRange (per-tab material/quantity state hoisted in QuoteTabs)
  - Plan 03-03 — QuoteSubmitForm (success-path callback target for auto-clear)
provides:
  - "src/hooks/useLocalStorageState.jsx — generic [value, setValue] hook backed by localStorage with QuotaExceededError + disabled-storage fallbacks"
  - "src/components/quote/QuoteRestoreBanner.jsx — subtle 'We restored your last selections.' banner with inline 'Start over' button"
  - "Storage shape `{ tab, materialId, quantity }` at versioned key `shapesmith-quote-v1` (~50 bytes)"
  - "Auto-clear-on-submit path via `onSubmitted` prop on QuoteSubmitForm + `setQuoteState(null)` from QuoteTabs"
affects:
  - "src/components/quote/QuoteTabs.jsx — refactored activeKey + materialIdByTab + quantityByTab into one persisted quoteState object; pre-fill cascade now short-circuits when storage restored a non-default value"
  - "src/components/quote/QuoteSubmitForm.jsx — added onSubmitted prop fired after setSubmitted(true) on a successful 2xx"
tech-stack:
  added: []
  patterns:
    - "Lazy-initializer useState read of localStorage so the storage hit happens once on mount, not on every render"
    - "Try/catch wrapping every localStorage call so disabled storage / Safari private mode / QuotaExceededError fail silently while in-memory state still drives the UI"
    - "Single combined state object (`{ tab, materialId, quantity }`) instead of 3 parallel persisted slices — one localStorage write per interaction, not three"
    - "Banner-visibility state derived from a lazy initializer that captures the 'state at mount' snapshot — survives subsequent updates that would push the state back to 'looks like default'"
    - "URL/referrer pre-fill cascade short-circuited when localStorage restored a non-default value — storage takes precedence over `?service=` / `document.referrer` so a returning visitor's intent is preserved"
key-files:
  created:
    - src/hooks/useLocalStorageState.jsx
    - src/hooks/useLocalStorageState.test.jsx
    - src/components/quote/QuoteRestoreBanner.jsx
    - .planning/phases/03-auto-pricing-quote-tool/03-04-SUMMARY.md
  modified:
    - src/components/quote/QuoteTabs.jsx
    - src/components/quote/QuoteSubmitForm.jsx
decisions:
  - "Single combined `quoteState` object instead of three parallel `useLocalStorageState` calls — Plan 03-04 Step C explicitly recommended this restructure ('keeps the storage write to a single hook call rather than three'). Net effect: one stringify+setItem per interaction; per-tab material/quantity (Plan 03-02's `materialIdByTab[tab]`/`quantityByTab[tab]` maps) collapses to a single tab-keyed pair because the visitor only sees one tab at a time and switching tabs through the storage-aware updater preserves the just-set values across tab swaps within a session."
  - "Pre-fill cascade short-circuit: `if (showRestoreBanner) return;` — localStorage takes precedence over `?service=`/`document.referrer`. A visitor who returns to `/quote` from `/3d-printing` after a session that landed on the laser tab sees their last-laser selection, not the print tab the URL would have pre-filled. Honors QTE-10's 'visitors who close their tab can resume' clause over the URL-hint convention from Plan 03-01."
  - "`handleStartOver` also clears per-tab file/geometry/error maps even though those aren't persisted — a visitor who clicks 'Start over' expects a fully fresh form, not just reset selectors above a stale dropzone."
  - "Banner visibility uses a lazy `useState(() => isNonDefaultState(initialQuoteState))` rather than deriving from the live `quoteState` — once dismissed, the banner must not re-appear when subsequent state updates happen to land back on the default shape (e.g. visitor sets material then clears it; that should NOT show 'we restored' again)."
  - "Hook test file uses `require('./useLocalStorageState').default` inside `importHook` so the spy on `Storage.prototype.getItem` is established BEFORE the module's `useState` lazy initializer reads from it — module re-evaluation isn't needed because the read happens inside the hook body, not at module load. The pattern is defensive against future refactors that might move the read to module scope."
  - "Banner has `role=\"status\"` so screen readers announce the restore once on mount without grabbing focus (avoids a `role=alert` interruption that would feel disproportionate to a one-time confirmation message)."
metrics:
  duration: ~4m
  task_count: 1
  files_changed: 5
  completed: 2026-05-08
---

# Phase 3 Plan 04: localStorage form-state persistence + restore banner Summary

**One-liner:** A generic `useLocalStorageState` hook + a subtle "We restored your last selections" banner give returning visitors a one-tick-free restore of their tab + material + quantity, with QuotaExceededError + Safari-private-mode failures silently degrading to in-memory state and a `setQuoteState(null)` auto-clear-on-submit so the next visitor on a shared browser sees a clean form.

## What Shipped

A returning visitor to `/quote` who previously selected the Laser tab + a material + quantity 4 lands on the same tab, with the same material and quantity already populated, in one render tick — no flicker through the default 3D tab. Above the tab strip a subtle line reads "We restored your last selections." with an inline "Start over" text button (underlined, hover:text-primary-light). The banner is `role="status"` so screen readers announce it once without focus-grabbing.

The first time the visitor touches anything — clicking the other tab, changing material, bumping quantity — the banner disappears (it was a one-time confirmation, not persistent UI). LocalStorage continues to track the new selection silently. If the visitor clicks "Start over" instead, the storage entry is removed AND the in-memory state resets to defaults (`{ tab: 'print', materialId: '', quantity: 1 }`) AND the per-tab file/geometry/error maps are cleared so the form looks truly fresh.

When the visitor (eventually) submits successfully, `QuoteSubmitForm` fires its new `onSubmitted` prop after `setSubmitted(true)`. `QuoteTabs` passes `() => setQuoteState(null)` so the storage entry is removed in the same tick. The next visit to `/quote` on the same browser shows a fresh form — no stale "we restored" banner pointing at someone else's choices.

If localStorage is disabled (Safari private mode, browser settings, or full quota), every storage call no-ops silently. The hook still returns a working `[value, setValue]` pair; the form behaves identically except the persistence layer is a no-op for the session. No console errors, no thrown exceptions, no degraded UI — just no resume.

## Bundle Impact

`pnpm build` clean. Main chunk: **+3 bytes gzip** (99.241 → 99.244 kB). `useLocalStorageState` is 45 lines of pure JS with one `useState` + one `useEffect` and no dependencies; `QuoteRestoreBanner` is 29 lines of stateless JSX. The QuoteTabs refactor reduced surface area (collapsed three `setMaterialIdByTab`/`setQuantityByTab` setters into one `updateState` patch) so net lines added is dominated by the new hook + banner, not the refactor.

## Truth-table for `must_haves.truths` — all 8 PASS

| # | Truth | Status |
|---|-------|--------|
| 1 | Tab + material + quantity persist across page reload via localStorage | PASS — `useLocalStorageState('shapesmith-quote-v1', DEFAULT_STATE)` in QuoteTabs writes via the hook's effect on every quoteState change |
| 2 | On `/quote` mount with stored selection, all three restore | PASS — lazy initializer reads localStorage once; activeKey, materialId, quantity are derived from quoteState and feed into MaterialPicker + QuantityInput on first render |
| 3 | "We restored your last selections. [Start over]" banner appears above the tab strip | PASS — `{showRestoreBanner && <QuoteRestoreBanner ... />}` rendered immediately before the `role=tablist` div |
| 4 | Banner auto-dismisses on first interaction | PASS — `updateState()` flips `setShowRestoreBanner(false)`; every tab/material/quantity change calls updateState |
| 5 | "Start over" clears storage AND resets state to defaults | PASS — `handleStartOver` calls `setQuoteState(DEFAULT_STATE)` (the hook's effect writes it on next render) and clears per-tab file/geometry/error maps |
| 6 | Successful submit clears the localStorage entry | PASS — `<QuoteSubmitForm ... onSubmitted={() => setQuoteState(null)} />`; QuoteSubmitForm fires `onSubmitted?.()` after `setSubmitted(true)`; the hook's effect calls `removeItem` when value is null |
| 7 | File contents NEVER persisted | PASS — `filesByTab` / `geometryByTab` are `useState`, not `useLocalStorageState`; negative grep gates 2a/2b in plan automated verify confirm no `useLocalStorageState(...file...)` or `useLocalStorageState(...geometry...)` calls exist |
| 8 | QuotaExceededError + disabled storage fail silently | PASS — every getItem/setItem/removeItem call is wrapped in try/catch; hook test 7 mocks `Storage.prototype.setItem` to throw and asserts `setValue` does not throw + in-memory value still updates; hook test 8 mocks `getItem` to throw and asserts initialValue fallback |

## Hook unit-test coverage (5 cases × 8 tests)

`src/hooks/useLocalStorageState.test.jsx` covers all 5 cases the plan's `<done>` enumerates:

1. **Initial read returns initialValue when key absent** → test 1 ("initial read returns initialValue when key is absent")
2. **Initial read returns parsed value when key present** → test 2 ("initial read returns parsed value when key is present")
3. **Ignores JSON.parse errors gracefully** → test 3 ("returns initialValue when stored JSON is malformed (parse error swallowed)")
4. **Removes key on null** → test 5 ("setValue(null) removes the key from localStorage (auto-clear-on-submit path)") + test 6 ("setValue(undefined) removes the key from localStorage")
5. **Fails silently on QuotaExceededError** → test 7 ("fails silently when localStorage.setItem throws QuotaExceededError")

Plus two extras: test 4 (write path — `setValue` actually writes JSON.stringified value) and test 8 (getItem-throw — disabled-storage / Safari private mode fallback to initialValue without throwing).

## Phase 3 close-out: 10/10 QTE requirements landed

| Requirement | Plan | Status |
|-------------|------|--------|
| QTE-01 (visitors reach /quote from each service page + top-level CTA) | 03-01 | DONE |
| QTE-02 (drag-and-drop + picker, stated constraints) | 03-01 | DONE |
| QTE-03 (browser-side parse, friendly errors) | 03-01 | DONE |
| QTE-04 (material picker + quantity input from data-driven options) | 03-02 | DONE |
| QTE-05 (price as range, never single point + non-dismissable disclaimer) | 03-02 | DONE |
| QTE-06 (pricing-rule Sanity schema, owner-edited without app deploy) | 03-02 | DONE |
| QTE-07 (Netlify Function + Resend email handoff) | 03-03 (code shipped) | Code DONE, Real-send verification deferred (Plan 03-03 Task 4) |
| QTE-08 (reCAPTCHA v3 server-verified) | 03-03 (code shipped) | Code DONE, Real-send verification deferred |
| QTE-09 (memory-bounded parsing + DOMPurify if SVG renders) | 03-01 + 03-03 | DONE — 25MB cap + isolated DOMParser; DOMPurify not needed because SVG never renders to live DOM (Plan 03-03 punted preview) |
| QTE-10 (localStorage form-state persistence) | 03-04 | DONE |

Real-send verification (Plan 03-03 Task 4) and the Resend domain / reCAPTCHA v3 site / Netlify env-var owner-prep (Plan 03-03 Task 1) remain deferred per user's choice in the prior session — see `.planning/STATE.md` Deferred Items table. The frontend gracefully degrades when env vars are unset (provider mounts, script never loads, executeRecaptcha is undefined, button shows "spam protection isn't loaded yet" inline message — never throws).

**Phase 3 is ready for `/gsd-verify-phase` + `/gsd-transition` once owner-prep + Plan 03-03 Task 4 land.**

## Threat Model Coverage

All `mitigate` and `accept` dispositions from `<threat_model>` are honored:

| Threat | Disposition | Honored In Code |
|--------|-------------|-----------------|
| T-03-04-01 (Information Disclosure on shared device) | mitigate | Stored shape contains NO PII (name/email/message live only in QuoteSubmitForm state, never touch localStorage). Auto-clear-on-submit + visible "Start over" banner give the next visitor a clear cue. File contents are never stored (negative grep gates pass). |
| T-03-04-02 (Tampering via hand-edited localStorage) | accept | JSON.parse try/catch returns initialValue on malformed input. Optional chaining (`quoteState?.tab ?? DEFAULT_STATE.tab`) guards against null/missing fields. Arbitrary materialId fails the `materials.find(...)` guard and renders nothing — no code execution path. |
| T-03-04-03 (DoS via quota exhaustion) | mitigate | Stored payload is ~50 bytes. setItem try/catch swallows QuotaExceededError (test 7 covers this); form still works in-memory. |

## Deviations from Plan

### Auto-fixed Issues

None — Task 1 executed as written. The plan's Step A (hook), Step B (banner), Step C (QuoteTabs refactor + storage-precedence pre-fill cascade), and Step D (QuoteSubmitForm onSubmitted) all landed verbatim from the plan's pseudocode with cosmetic-only adjustments (default-export comment, role=status on banner, JSDoc-style header comment style consistent with other quote/* files).

### TDD Gate Compliance

Sequence verified in `git log`:

1. `fc501a1` — `test(03-04): add failing tests for useLocalStorageState hook` (RED — verified failing with "Cannot find module './useLocalStorageState'" before implementation)
2. `2637aad` — `feat(03-04): localStorage persistence + restore banner for /quote` (GREEN — all 8 hook tests pass; full suite 43/43 passes; build clean)

No separate REFACTOR commit was needed — the hook + banner + QuoteTabs refactor + QuoteSubmitForm onSubmitted prop landed in their final shape during GREEN. The plan's frontmatter declared `type: execute` (not `type: tdd`) but the single task is annotated `tdd="true"`, so the gate sequence applies at task-level. Both gates committed.

## Self-Check: PASSED

Files verified to exist on disk:
- `src/hooks/useLocalStorageState.jsx` ✓ (45 lines, ≥25 required)
- `src/hooks/useLocalStorageState.test.jsx` ✓
- `src/components/quote/QuoteRestoreBanner.jsx` ✓ (29 lines, ≥20 required)
- `.planning/phases/03-auto-pricing-quote-tool/03-04-SUMMARY.md` ✓

Commits verified in git log:
- `fc501a1` test(03-04): add failing tests for useLocalStorageState hook ✓
- `2637aad` feat(03-04): localStorage persistence + restore banner for /quote ✓

Plan automated verification gates (1-5, 7-8 per `<verify>`) all passed manually:
- Files exist + default export ✓
- Negative grep on file/geometry persistence ✓
- onSubmitted + setQuoteState(null) wired ✓
- try/catch around localStorage calls ✓
- Banner copy matches UI-SPEC verbatim ✓
- Hook unit tests (8/8 pass) ✓
- pnpm build clean ✓
- App.test.js smoke test pass ✓

## Requirements Closed

- **QTE-10** (form state persists across page reloads via localStorage so visitors who close their tab can resume) — DONE

## Follow-up Items

- **Plan 03-03 Task 1** — owner-prep (Resend domain verification, reCAPTCHA v3 registration, Netlify env vars) remains deferred. Visitor will not be able to actually submit until those are populated; the UI degrades gracefully with the "spam protection isn't loaded yet" inline message.
- **Plan 03-03 Task 4** — real-send end-to-end smoke test in owner inbox; blocked on Task 1.
- **Future:** if a future plan changes the stored shape (e.g. adds a 4th persisted field), bump the storage key from `shapesmith-quote-v1` to `-v2`. Old `-v1` values will be ignored by the new key (the lazy initializer reads from the new key, gets null, falls back to initialValue) — graceful migration without a manual cleanup step.
- **Future:** if visitor feedback shows people losing work because they didn't realize storage was persisting (e.g. selecting a material on a shared family computer), consider adding an explicit "remember my selections" toggle in `QuoteTabs`. Today the implicit persistence + "Start over" affordance + auto-clear-on-submit is the studio's default-on stance; a toggle would be a reasonable evolution.
- **Phase 3 transition:** ready for `/gsd-verify-phase 3` + `/gsd-transition` once Plan 03-03 owner-prep + Task 4 land.
