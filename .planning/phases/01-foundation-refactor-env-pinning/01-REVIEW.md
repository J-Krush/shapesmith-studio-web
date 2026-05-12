---
phase: 01-foundation-refactor-env-pinning
reviewed: 2026-05-03T00:00:00Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - .nvmrc
  - netlify.toml
  - package.json
  - public/index.html
  - src/App.js
  - src/App.test.js
  - src/components/home/Collaborations.jsx
  - src/components/home/OurProcess.jsx
  - src/components/home/QuickSpecs.jsx
  - src/components/projects/ProjectGallery.jsx
  - src/components/projects/ProjectsFilter.jsx
  - src/components/projects/ProjectsGrid.jsx
  - src/components/shared/AppBanner.jsx
  - src/components/shared/AppHeader.jsx
  - src/context/AboutMeContext.jsx
  - src/context/ProjectsContext.jsx
  - src/data/projects.js
  - src/data/services.js
  - src/hooks/useSanityQuery.jsx
  - src/pages/Materials.jsx
  - tailwind.config.js
findings:
  blocker: 2
  warning: 6
  info: 7
  total: 15
  resolved: 1
status: issues_found
resolved_findings:
  - BL-01 (resolved 2026-05-04 via commit 6942a1a — restored four -light tokens in tailwind.config.js)
---

# Phase 1: Code Review Report

**Reviewed:** 2026-05-03
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

Phase 1 lands four solid wins — env pinning, the `useSanityQuery` consolidation,
state-driven `ProjectGallery`, and the `SERVICES` constant — and the
implementation of each is generally clean. Findings cluster in two areas:

1. **The Tailwind palette deletion (`01-03`) is more invasive than the SUMMARY
   claims.** Plan 01-03 removed `primary-light`, `secondary-light`,
   `ternary-light`, and `secondary-section-light` from `tailwind.config.js` while
   knowingly leaving 30+ `dark:text-ternary-light` / `dark:bg-secondary-light`
   classNames untouched in components. The SUMMARY asserts this is
   "visual-equivalent because dark mode is the only mode" — that claim is wrong:
   `dark:text-ternary-light` is a *visible* dark-mode utility that produces an
   actual `color` rule. Removing the token causes the rule to silently drop, not
   fall back to a dark equivalent. Site-wide text/bg readability in dark mode is
   at risk. Filed as BLOCKER (BL-01).

2. **Pre-existing render-time mutations and fragile guards were carried into
   the refactored files.** `Array.prototype.sort` is called on the live React
   state inside render in three components, the `Collaborations` image guard
   only checks the wrapper not the array, and `ProjectsFilter` binds a function
   reference to `option value`. These are not regressions, but the files are
   in scope and the issues are real.

The new `useSanityQuery` hook is correct and cancellable, but it has a
documented footgun (`params` is not in the dep array) that should be called
out before more callers depend on it.

The smoke test (`App.test.js`) is good. The env pinning (Node 20 / pnpm 9.0.0)
is consistent across `.nvmrc`, `netlify.toml`, and `package.json`. The
`ProjectGallery` modal refactor is correct and fixes the previous duplicate
`key` bug.

## Blocker Issues

### BL-01: Tailwind `-light` color tokens deleted but still referenced as dark-mode utilities, dropping production styles  [RESOLVED 2026-05-04 — commit 6942a1a restored the four tokens; compiled CSS verified to contain `.dark:text-ternary-light` and friends]

**File:** `tailwind.config.js:30-49` (combined with consumer files listed below)

**Issue:**
`tailwind.config.js` no longer defines `primary-light`, `secondary-light`,
`ternary-light`, or `secondary-section-light`. With Tailwind v3 JIT, any class
referencing these — including the `dark:` variants — silently does not generate
a CSS rule. The codebase still references these tokens in dozens of *visible*
dark-mode utilities, e.g.:

- `src/components/projects/ProjectsGrid.jsx:14` — `dark:text-ternary-light` on
  the H1 ("Laser Cutting styles"). With no rule generated, the H1's color
  cascades to the body default (no body color is set in `index.css` or
  `App.css`), which on the `bg-primary-dark` (#291c30) page bg renders as
  near-black-on-purple — unreadable.
- `src/components/projects/ProjectsGrid.jsx:17, 26` — same heading body copy.
- `src/components/projects/ProjectsFilter.jsx:30` — `dark:text-ternary-light`
  in the select dropdown.
- `src/components/home/Collaborations.jsx:25` —
  `bg-secondary-section-light dark:bg-secondary-section-dark` (the `dark:`
  variant references a still-defined token, so the bg is fine, but the bare
  `bg-secondary-section-light` in light contexts now no-ops).
- `src/components/home/Collaborations.jsx:30, 33` — `dark:text-ternary-light`
  on the section title and body copy.
- `src/components/home/OurProcess.jsx:28, 32, 56, 59` — multiple
  `dark:text-ternary-light` instances.
- `src/components/home/QuickSpecs.jsx:29, 35, 67` — `dark:text-primary-light`
  and `dark:text-ternary-light` on H1 and body copy.
- `src/App.js:28` — wrapper `bg-secondary-light dark:bg-primary-dark` (the
  `dark:` variant uses a still-defined token, so bg is fine; the bare class
  no-ops, which is harmless because dark is forced).
- `src/components/shared/AppHeader.jsx:75, 83, 91, 99, 122, 136, 143, 150` —
  every nav link uses `dark:text-ternary-light` and
  `dark:hover:text-secondary-light`. Every nav link will render with no color
  rule in dark mode, falling back to inherited browser default.
- Outside the listed-files scope, the same problem exists in
  `src/materials/MaterialSingle.jsx`, `src/components/HireMeModal.jsx`,
  `src/components/contact/ContactDetails.jsx`,
  `src/components/contact/ContactForm.jsx`,
  `src/components/home/HowLasersWork.jsx`, `src/components/home/QuickInfo.jsx`,
  and likely more.

The 01-03 SUMMARY explicitly defers this cleanup to Phase 2 / VIS-05 and notes
`pnpm build` succeeds — but a green build is not the same as a correct render.
The auto-approved (yolo) visual smoke checkpoint was the only gate that could
have caught this, and it was skipped.

The deferral may be intentional product strategy, but as a code-review concern
the *current* HEAD ships with broken text colors across the live site. If
Phase 1 is merged to `master`, that's the deployed state until Phase 2
completes. This needs to be either (a) reverted/postponed to ship with VIS-05,
or (b) the broken classNames swept now.

**Fix:**
Option A (recommended for fastest fix without re-doing the palette work) — restore the four tokens in `tailwind.config.js` until Phase 2's VIS-05 sweep replaces the classNames:
```js
extend: {
    colors: {
        'primary-light': '#F7F8FC',
        'secondary-light': '#FFFFFF',
        'ternary-light': '#f6f7f8',
        'secondary-section-light': '#d1d1d1ff',
        // ... existing dark tokens
    },
    // ...
}
```

Option B — sweep the classNames now (i.e., do VIS-05 in this phase): replace
every `dark:text-ternary-light` with `dark:text-gray-200`/equivalent existing
token, every `dark:text-primary-light` similarly, every `dark:bg-secondary-light`
(if used in dark cascade) with a defined dark token, etc. Not trivial; the
SUMMARY's claim that there are "30+ files" is likely accurate.

Option C — do nothing in Phase 1 *and* run an actual visual smoke (page-by-page
in a browser) before merge to confirm the deferred state is, in fact,
acceptable. The 01-03 SUMMARY's logical argument that the dark-mode rules
"don't matter because dark mode is the only mode" is fundamentally incorrect —
those `dark:*` utilities *are* the only thing painting text and backgrounds in
dark mode.

### BL-02: `App.js:24,35,37` will hard-crash if `SERVICES` ever loses the `'laser'` entry

**File:** `src/App.js:24, 35, 37`

**Issue:**
```js
const laser = SERVICES.find((s) => s.key === 'laser');
// ...
<Route path={`/${laser.urlSegment}`} element={<Projects />} />
<Route path={`/${laser.urlSegment}/:capability`} ... />
```

If `'laser'` is ever removed/renamed in `src/data/services.js`,
`SERVICES.find(...)` returns `undefined` and `laser.urlSegment` throws
`TypeError: Cannot read properties of undefined (reading 'urlSegment')` *during
the render of `App`*, which is the root component — every page crashes, not
just the `/styles` route. Same pattern is repeated in
`AppHeader.jsx:12,82,84,87,135,137,139`, `ProjectsFilter.jsx:11,34`, and
`ProjectsGrid.jsx:8,15`.

This is a self-inflicted footgun introduced by the SERVICES indirection. Before
01-05, `capabilitiesTitle` was a string literal — there was no lookup that
could fail. Now there is.

This may or may not be a "blocker" depending on team taste — there's no current
*runtime* defect, only a fragility — but the entry being mandatory should be
enforced or the fallback should be defensive. I'm flagging as BLOCKER because
the next person editing `services.js` (e.g., to add the 3D-printing entry in
Phase 2) will not be warned by anything before the page crashes in production.

**Fix:**

Either enforce uniqueness/presence with a derived constant in `services.js`:
```js
export const SERVICES = [
    { key: 'laser', urlSegment: 'styles', navLabel: 'styles', sanityType: 'laser-style', contactSubject: 'Laser cutting' },
    { key: 'print', urlSegment: '3d-printing', navLabel: '3D Printing', sanityType: 'print-style', contactSubject: '3D printing' },
];

export const SERVICE_BY_KEY = Object.freeze(
    SERVICES.reduce((acc, s) => {
        if (acc[s.key]) throw new Error(`Duplicate SERVICES key: ${s.key}`);
        return { ...acc, [s.key]: s };
    }, {})
);

export const requireService = (key) => {
    const s = SERVICE_BY_KEY[key];
    if (!s) throw new Error(`Unknown service: ${key}`);
    return s;
};
```

Then call sites become `const laser = requireService('laser');` — fails fast
at module-load time if `'laser'` is missing, with a clear error.

Or, more minimally, freeze the array and add a typed accessor:
```js
export const LASER_SERVICE = SERVICES.find((s) => s.key === 'laser');
if (!LASER_SERVICE) throw new Error("SERVICES is missing 'laser' entry");
```
…and import `LASER_SERVICE` instead of doing the `.find` per call site. This
also de-duplicates the four nearly-identical `SERVICES.find((s) => s.key === 'laser')`
lookups in `App.js`, `AppHeader.jsx`, `ProjectsFilter.jsx`, `ProjectsGrid.jsx`.

## Warnings

### WR-01: `Array.prototype.sort()` mutates React state inside render in three files

**File:** `src/components/home/OurProcess.jsx:48`,
`src/components/projects/ProjectsGrid.jsx:40`, `src/pages/Materials.jsx:55`

**Issue:**
```js
const processSteps = data ?? [];
// ...
{processSteps
    .sort((a,b) => a.order < b.order ? -1 : 1)
    .map(...)}
```
`sort()` mutates the array in place. Here, `processSteps` aliases the array
held in `useState` inside `useSanityQuery`. Sorting it during render is a
**side effect during render** — it violates React's purity rule and can
behave unexpectedly in StrictMode (which double-invokes renders) or if the
same `data` array were ever observed by another component.

Additionally, the comparator is incorrect for stable / equal-element behavior:
```js
(a,b) => a.order < b.order ? -1 : 1
```
returns `1` for both "greater than" and "equal", which is a non-standard
comparator. For uniformly-ordered records with unique `order` values, the
visible result is correct, but if `a.order === b.order` (or either is
`undefined`, which `<` evaluates to `false`), records get arbitrarily
shuffled — and with strict-mode double-invoke, *re-shuffled*.

Pre-existing pattern, but the files are in scope and the bug is real.

**Fix:**
Sort an immutable copy with a numeric comparator:
```js
const processSteps = (data ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
```
…outside the JSX (or memoized with `useMemo([data])` if perf matters). Apply
the same fix in `ProjectsGrid.jsx` and `Materials.jsx`.

### WR-02: `Collaborations.jsx:57` accesses `images[0]` without checking the array

**File:** `src/components/home/Collaborations.jsx:55-59`

**Issue:**
```jsx
<img
    className="rounded-lg md:ml-6"
    src={collaborationData && collaborationData.images[0].asset.url}
    alt="Effigy build"
/>
```
The guard short-circuits if `collaborationData` is falsy (loading or fetch
failed), but if `collaborationData` is truthy and `.images` is `[]`,
`images[0].asset.url` throws `TypeError: Cannot read properties of undefined
(reading 'asset')` — which then breaks the whole component tree (no error
boundary in the app per CLAUDE.md). Sanity does not enforce a non-empty
`images` array on the schema; a CMS user editing the document and saving with
no images mid-edit will produce this state.

Same pattern likely exists for `OurProcess.jsx:50` (`process.image.altText` as
a `key` — if `image` is `undefined`, this throws), and `OurProcess.jsx:52,54`,
`QuickSpecs.jsx:49-51,63-65` (chained access on `bedSizeImage.image.asset.url`
that bypasses the outer `bedSizeImage &&` once the asset chain is incomplete).

This is pre-existing, but the `useSanityQuery` migration was a chance to add
optional chaining cheaply.

**Fix:**
Use optional chaining throughout:
```jsx
src={collaborationData?.images?.[0]?.asset?.url}
```
And for the `key` in `OurProcess.jsx:50`:
```jsx
<div key={process._id ?? process.image?.altText ?? index} ...>
```
(The Sanity query already returns `_id`; use it as the canonical key.)

### WR-03: `useSanityQuery` accepts `params` but never includes it in the dep array — silent stale-data hazard

**File:** `src/hooks/useSanityQuery.jsx:4-32`

**Issue:**
```js
const useSanityQuery = (query, params = {}, deps = []) => {
    // ...
    useEffect(() => {
        // ... uses params ...
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, refetchIndex, ...deps]);
```

`params` is captured in the effect closure but not in the dep array. A caller
who passes `useSanityQuery(query, { slug })` will refetch only on `query`
change, even though `slug` changing should refetch. The contract is that
callers must remember to put any dynamic param values into `deps`. This is
a silent footgun — there's no eslint warning (the rule is disabled), no type
checker (project is JS), and no runtime warning. The next `useSanityQuery`
caller (e.g., a future single-project hook) will hit this.

Additionally, `params = {}` creates a new object literal on every render, so
even if `params` *were* in the dep array, it would re-fire every render.

**Fix:**
Either (a) drop the `params` argument from the public API (currently no
caller uses it — the six current consumers all omit it), or (b) document
loudly and add a runtime warning:
```js
const useSanityQuery = (query, params, deps = []) => {
    if (params !== undefined && deps.length === 0) {
        console.warn(
            'useSanityQuery: params provided but deps is empty. ' +
            'Pass dynamic params values into deps to trigger refetch on change.'
        );
    }
    // ...
};
```
Or (c) JSON-stringify `params` and include the string in `deps`:
```js
const paramsKey = JSON.stringify(params);
useEffect(() => { /* ... */ }, [query, paramsKey, refetchIndex, ...deps]);
```
The cheapest correct option for now: drop the unused `params` and `deps`
arguments from the signature until a caller actually needs them.

### WR-04: `useSanityQuery` does not reset `data` on `query` change — consumers see stale data during refetch

**File:** `src/hooks/useSanityQuery.jsx:12-28`

**Issue:**
When `query` changes (or `refetch()` is called), the effect aborts the in-flight
request and starts a new fetch with `setLoading(true)`, but `data` is *not*
reset. Components rendering on `data` (with `loading` not gated) will see the
old query's results until the new request resolves.

Most current consumers don't use `loading` — they just render `data ?? []` —
so for those, stale data leaking visually is a real problem if the hook is
ever used with a dynamic `query`.

This isn't actively broken in Phase 1 (no caller passes a dynamic query), but
the hook is intended to be the canonical fetch primitive going forward.

**Fix:**
```js
useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);  // <- add this
    // ...
}, [query, refetchIndex, ...deps]);
```
Or, document explicitly that callers must gate on `loading` to avoid stale
reads.

### WR-05: `ProjectsFilter.jsx:33` binds a function reference to `<option value>`

**File:** `src/components/projects/ProjectsFilter.jsx:33`

**Issue:**
```jsx
<option value={setSelectProject} className="capitalize text-sm sm:text-md">
    All {laser.navLabel}
</option>
```
`value={setSelectProject}` passes the `setSelectProject` callback as the
option's value. When this option is selected, `e.target.value` is the
stringified function (`"function setSelectProject() { [native code] }"` or
similar). The default selected option always reports a meaningless value back
to the parent.

Pre-existing bug, but it's in a refactored file in scope.

**Fix:**
```jsx
<option value="" className="capitalize text-sm sm:text-md">
    All {laser.navLabel}
</option>
```
And let the parent treat empty string as "show all".

### WR-06: `Collaborations.jsx:42-50` uses a `<span>` wrapping a `<Link>` styled to look like a button — not a real button or accessible

**File:** `src/components/home/Collaborations.jsx:42-51`,
`src/components/shared/AppHeader.jsx:105-115, 160-169`

**Issue:**
```jsx
<span className="... cursor-pointer">
    <Link to="/contact" aria-label="contact-us">
        Let's Work Together!
    </Link>
</span>
```
The button styling lives on a `<span>` parent with `cursor-pointer`, while
the actual click target is the inner `<Link>`. Click region is whatever the
`<a>` covers (text only) — clicks on the padded area around the text don't
navigate. Also, the `<span>` `cursor-pointer` lies about clickability
in regions where clicks do nothing.

Pre-existing pattern (3 instances total: Collaborations.jsx:42, AppHeader.jsx:105, AppHeader.jsx:160).

**Fix:**
Move the styling onto the `<Link>`:
```jsx
<Link
    to="/contact"
    aria-label="contact-us"
    className="block text-center text-md font-semibold md:mb-8 mt-8 bg-accent hover:bg-accent-highlight text-white shadow-sm rounded-md px-5 py-2.5 duration-300"
>
    Let's Work Together!
</Link>
```
Drop the wrapping `<span>` entirely.

## Info

### IN-01: `src/data/projects.js` is now entirely dead code (265 lines)

**File:** `src/data/projects.js` (and its 18 transitively-imported asset
files via `./images`)

**Issue:**
After 01-05 removed the `capabilitiesTitle` export, the only remaining export
in this file is `capabilitiesData`, which has zero importers in `src/`
(verified with `grep -rn "from.*data/projects" src/`). The phase removed the
last live consumer but did not delete the orphaned module. This drags 18
image asset imports into the dependency graph for no purpose, and CRA will
include them in the build until tree-shaking eliminates the orphan (which
generally requires the dead code to be ESM-imported by something for webpack
to do its job — in this case, nothing imports it, so webpack should drop it,
but the file persists).

Same applies to `src/data/aboutMeData.js` and `src/data/materials.js` per
CLAUDE.md ("Static fallback data still lives in `src/data/*` … no longer
wired into rendering paths").

**Fix:**
Delete `src/data/projects.js`, `src/data/aboutMeData.js`,
`src/data/materials.js`, and (if no other consumers) `src/data/images.js`
plus the asset files imported only by these. Verify with a grep before
deletion.

If the team prefers to defer asset-cleanup to Phase 2, at minimum delete the
JS modules — they are guaranteed-orphan and any build-time bundler that
side-effect-imports them is wasting effort.

### IN-02: Legacy no-op setters in context providers leak unnecessary API surface

**File:** `src/context/AboutMeContext.jsx:30`,
`src/context/ProjectsContext.jsx:42`

**Issue:**
```js
<AboutMeContext.Provider value={{ aboutMe, setAboutMe: () => {} }}>
<ProjectsContext.Provider value={{ projects, setProjects: () => {} }}>
```
A `grep` (above) confirms no consumer reads `setAboutMe` or `setProjects`
anywhere in `src/`. The no-op stubs were retained for "legacy" but the
legacy consumers do not exist.

**Fix:**
```js
<AboutMeContext.Provider value={{ aboutMe }}>
<ProjectsContext.Provider value={{ projects }}>
```
Delete the no-op stubs and the comment.

### IN-03: `z-80` and `z-90` Tailwind classes are not valid utilities — the modal relies on luck

**File:** `src/components/projects/ProjectGallery.jsx:32, 34`

**Issue:**
```jsx
<div className="fixed top-0 left-0 z-80 ...">
    <button className="fixed z-90 ...">
```
Tailwind v3's default `z-` scale only includes `0, 10, 20, 30, 40, 50, auto`.
`z-80` and `z-90` are unknown classes and produce no rule (without arbitrary-
value syntax `z-[80]`). The modal's stacking is "whatever the default flow
gives it" — which currently happens to render above page content because
nothing else is fixed-positioned at the same level, but `AppHeader.jsx:29`
has `z-10` on the nav and `HireMeModal.jsx` uses `z-30`, so this is real
fragility.

Pre-existing (the modal refactor inherited the classes); the refactor was
a chance to fix.

**Fix:**
```jsx
<div className="fixed top-0 left-0 z-[80] w-screen h-screen bg-black/70 ...">
<button className="fixed z-[90] top-6 right-8 ...">
```
Or, use a defined utility (`z-50` is sufficient for an overlay above all
existing fixed elements):
```jsx
<div className="fixed inset-0 z-50 bg-black/70 flex justify-center items-center">
<button className="fixed z-50 top-6 right-8 ...">
```

### IN-04: `AppHeader.jsx:14-20` `toggleMenu` is unnecessarily verbose

**File:** `src/components/shared/AppHeader.jsx:14-20`

**Issue:**
```js
function toggleMenu() {
    if (!showMenu) {
        setShowMenu(true);
    } else {
        setShowMenu(false);
    }
}
```
Pre-existing. Idiomatic version is `setShowMenu((s) => !s)`. The `if/else`
also captures `showMenu` from the closure — fine in this case but error-prone
for future async callers.

**Fix:**
```js
const toggleMenu = () => setShowMenu((s) => !s);
```

### IN-05: `engines.node` is open-ended (`>=20`) while `.nvmrc` and `netlify.toml` pin `20`

**File:** `package.json:5-7`, `.nvmrc:1`, `netlify.toml:6`

**Issue:**
`package.json` declares `"engines": { "node": ">=20" }` but `.nvmrc` says
`20` and `netlify.toml` says `NODE_VERSION = "20"`. A developer on Node 22 or
24 will pass the engines check but won't match the CI/Netlify version. The
`--openssl-legacy-provider` flag still works on those versions for now, but
this leaves room for a "works on my machine" divergence.

**Fix:**
Pin to a major version range:
```json
"engines": { "node": "^20" }
```
This catches anyone on 18 or 22+ at install time (with `engine-strict`) and
matches the rest of the toolchain pin.

### IN-06: `useSanityQuery.jsx` uses `.jsx` extension but contains no JSX

**File:** `src/hooks/useSanityQuery.jsx`

**Issue:**
The new hook uses `.jsx` extension to match the project's other hooks
(`useScrollToTop.jsx`) per local convention, but contains zero JSX. CLAUDE.md
already calls out that the `.js` vs `.jsx` convention in this repo is
inconsistent — this hook continues that inconsistency.

Not a behavioral defect; flagged for future cleanup.

**Fix:**
Rename to `src/hooks/useSanityQuery.js` (and update its single import in
each consumer). Or, alternatively, decide on a project-wide convention in a
follow-up phase.

### IN-07: `AppBanner.jsx:3` imports `heroLight` — confusing now that there is no light mode

**File:** `src/components/shared/AppBanner.jsx:3, 61`

**Issue:**
```js
import heroLight from '../../assets/bloom-layers-top.jpg';
// ...
<img src={heroLight} alt="Developer" />
```
The variable name `heroLight` was meaningful when the file had a `heroDark`
fallback for light mode — both are gone. The asset file (`bloom-layers-top.jpg`)
should be imported as `hero` or `heroImage`.

Same with `alt="Developer"` — wrong alt text for a laser-cut bloom hero.
Pre-existing.

**Fix:**
```js
import heroBloom from '../../assets/bloom-layers-top.jpg';
// ...
<img src={heroBloom} alt="Layered laser-cut bloom panel" />
```

---

_Reviewed: 2026-05-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
