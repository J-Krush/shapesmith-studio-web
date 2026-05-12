---
phase: 260512-cur
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/data/services.js
  - src/components/shared/AppHeader.jsx
  - src/components/shared/AppBanner.jsx
autonomous: true
requirements:
  - HIDE-WIP-01
must_haves:
  truths:
    - "Desktop and mobile nav shows exactly: Home, Laser Cutting, About, Contact (CTA)"
    - "Home banner shows exactly one service card (Laser Cutting), horizontally centered on sm+ viewports"
    - "Direct URL /shop renders the Shop page (not 404)"
    - "Direct URL /shop/kinetic-sculpture renders the ShopSingle page (not 404)"
    - "Direct URL /3d-printing renders the Projects page for print service (not 404)"
    - "Direct URL /3d-printing/:slug renders the ProjectSingle page for print service (not 404)"
    - "Direct URL /quote renders the Quote page (not 404)"
    - "Reversal is a three-line change (delete hidden flag + uncomment two nav entries)"
  artifacts:
    - path: "src/data/services.js"
      provides: "SERVICES array with hidden:true on the print entry"
      contains: "hidden: true"
    - path: "src/components/shared/AppHeader.jsx"
      provides: "NAV_ITEMS that filters SERVICES by !hidden and has /shop + /quote commented out"
      contains: "SERVICES.filter((s) => !s.hidden)"
    - path: "src/components/shared/AppBanner.jsx"
      provides: "Service-cards row that filters SERVICES by !hidden and centers when single"
      contains: "sm:justify-center"
  key_links:
    - from: "src/components/shared/AppHeader.jsx"
      to: "src/data/services.js"
      via: "SERVICES.filter((s) => !s.hidden).map(...)"
      pattern: "SERVICES\\.filter\\(\\(s\\) => !s\\.hidden\\)"
    - from: "src/components/shared/AppBanner.jsx"
      to: "src/data/services.js"
      via: "SERVICES.filter((s) => !s.hidden).map(...)"
      pattern: "SERVICES\\.filter\\(\\(s\\) => !s\\.hidden\\)"
    - from: "src/App.js"
      to: "src/data/services.js"
      via: "SERVICES.map(...) — UNFILTERED so /3d-printing routes stay registered"
      pattern: "SERVICES\\.map"
---

<objective>
Hide WIP entry points (Shop, 3D Printing, Get a Quote) from public-facing nav and
the home banner so we can deploy `dev` → `master` and run the Snipcart checkout
test on production (`shapesmith.studio`) without exposing in-progress features.

Routes for the hidden pages MUST remain registered in `src/App.js` so direct URLs
(`/shop`, `/shop/:slug`, `/3d-printing`, `/3d-printing/:slug`, `/quote`) keep
working — this is required for the Snipcart production test.

Purpose: Unblock the production Snipcart 500 diagnostic. Snipcart's account was
originally provisioned for `shapesmith.studio`, so trying checkout there is the
decisive test for whether the failure is deploy-preview-specific.

Output: Three small edits, one commit per file. Reversal when the WIP sections
ship is a three-line change (delete `hidden: true`, uncomment two nav entries).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md

# Canonical source of truth for exact code (READ THIS FIRST)
@/Users/krush/.claude/plans/i-am-trying-to-whimsical-cook.md

# Files being modified
@src/data/services.js
@src/components/shared/AppHeader.jsx
@src/components/shared/AppBanner.jsx

# Files NOT to touch (reference only — confirms routes stay registered)
@src/App.js

<interfaces>
<!-- Key data shape consumers will work with. -->

`SERVICES` in `src/data/services.js` is an array of objects with keys:
- `key` (string) — internal id, e.g. 'laser', 'print'
- `urlSegment` (string) — URL path segment, e.g. 'styles', '3d-printing'
- `navLabel` (string) — nav label, e.g. 'styles', '3D Printing'
- `sanityType` (string) — Sanity document type
- `contactSubject` (string) — pre-filled contact subject
- `hidden` (boolean, optional) — NEW. When `true`, the entry is filtered out of
  visible UI (nav + home banner). Routes in `src/App.js` MUST NOT filter on this
  flag so direct URLs continue to work.

Consumer matrix:
- `src/App.js` — `SERVICES.map(...)` to register routes. **UNFILTERED** (must stay).
- `src/components/shared/AppHeader.jsx` — `NAV_ITEMS` builds via `SERVICES.map(...)`. **Must filter** by `!hidden`.
- `src/components/shared/AppBanner.jsx` — service cards via `SERVICES.map(...)`. **Must filter** by `!hidden`.
</interfaces>

<background>
The user just spent a multi-turn diagnostic session debugging a Snipcart 500 on
a Netlify deploy preview. We've ruled out all merchant-side causes (validation
function, CORS, domain allowlist, account billing, payment gateway, API
key/mode alignment, browser state).

The remaining test is to deploy the shop to production (`shapesmith.studio`)
and try checkout there. The deploy must not expose 3D Printing (WIP), Shop
(test only), or Get a Quote (WIP auto-pricing tool) to public visitors.

Resulting visible nav: **Home, Laser Cutting, About, Contact** (CTA button).
Home banner shows a single centered Laser Cutting card.

Per project memory: never push to `master`; preview locally first; deploy
previews go on `dev`; production via PR `dev` → `master`.
</background>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add hidden flag to print service entry in src/data/services.js</name>
  <files>src/data/services.js</files>
  <action>
Open `src/data/services.js` and add a `hidden: true` field to the `print`
service entry (the second object in the SERVICES array, `key: 'print'`).

Include an explanatory comment above the `hidden: true` line that states:
- the flag is temporary while the 3D printing section is in progress
- routes `/3d-printing` and `/3d-printing/:slug` stay registered in App.js so
  direct URLs continue to work
- remove the flag when the section is ready to launch

Verbatim code (from orchestrator plan §1, lines 31-44):

```js
{
  key: 'print',
  urlSegment: '3d-printing',
  navLabel: '3D Printing',
  sanityType: 'print-style',
  contactSubject: '3D printing',
  // Temporarily hidden from nav + home banner while the 3D printing section
  // is still in progress. Routes /3d-printing and /3d-printing/:slug stay
  // registered in App.js so direct URLs continue to work. Remove this flag
  // when the section is ready to launch.
  hidden: true,
},
```

Do NOT modify the `laser` entry. Do NOT touch `src/App.js`.
  </action>
  <verify>
    <automated>grep -c "hidden: true" src/data/services.js | grep -q "^1$" &amp;&amp; grep -q "key: 'print'" src/data/services.js &amp;&amp; node -e "const m = require('./src/data/services.js'); if (m.SERVICES.find(s => s.key === 'print').hidden !== true) process.exit(1); if (m.SERVICES.find(s => s.key === 'laser').hidden) process.exit(1);"</automated>
  </verify>
  <done>
`SERVICES.find(s => s.key === 'print').hidden === true`.
`SERVICES.find(s => s.key === 'laser').hidden` is falsy.
Comment present above the `hidden: true` line explaining temporariness.
  </done>
</task>

<task type="auto">
  <name>Task 2: Filter NAV_ITEMS and comment out shop + quote in AppHeader.jsx</name>
  <files>src/components/shared/AppHeader.jsx</files>
  <action>
In `src/components/shared/AppHeader.jsx`, modify the `NAV_ITEMS` array
(currently lines 15–29) to:

1. Change `...SERVICES.map((s) => ({...}))` to
   `...SERVICES.filter((s) => !s.hidden).map((s) => ({...}))`.
2. Comment out (do NOT delete) the `/shop` entry (currently line 25) and the
   `/quote` entry (currently line 28). Add a comment block above them
   explaining they're hidden while in test and how to restore.

Verbatim resulting block (from orchestrator plan §2, lines 53-67):

```js
const NAV_ITEMS = [
  { to: '/', label: 'Home', match: '/' },
  ...SERVICES.filter((s) => !s.hidden).map((s) => ({
    to: `/${s.urlSegment}`,
    label: s.navLabel === 'styles' ? 'Laser Cutting' : s.navLabel,
    match: `/${s.urlSegment}`,
  })),
  { to: '/about', label: 'About', match: '/about' },
  // Temporarily hidden while /shop (Snipcart) and /quote (auto-pricing tool)
  // are still in test. Routes stay registered in App.js so direct URLs work.
  // Restore when ready to launch.
  // { to: '/shop', label: 'Shop', match: '/shop' },
  // { to: '/quote', label: 'Get a Quote', match: '/quote' },
];
```

Preserve the existing pretty-print conditional (`s.navLabel === 'styles' ?
'Laser Cutting' : s.navLabel`). You may leave the existing prose comment block
above NAV_ITEMS (lines 9-14) in place — it remains accurate.

Do NOT modify the two `NAV_ITEMS.map(...)` rendering loops (currently at lines
100 and 125). Both desktop + mobile consume the same array, so the single
change covers both.

Do NOT touch the Contact CTA `<span>` blocks (lines 112-120 and 139-147) — Contact
stays as a separate CTA, not a NAV_ITEMS entry.
  </action>
  <verify>
    <automated>grep -q "SERVICES.filter((s) => !s.hidden)" src/components/shared/AppHeader.jsx &amp;&amp; grep -qE "^\s*//\s*\{\s*to:\s*'/shop'" src/components/shared/AppHeader.jsx &amp;&amp; grep -qE "^\s*//\s*\{\s*to:\s*'/quote'" src/components/shared/AppHeader.jsx &amp;&amp; ! grep -qE "^\s*\{\s*to:\s*'/shop'" src/components/shared/AppHeader.jsx &amp;&amp; ! grep -qE "^\s*\{\s*to:\s*'/quote'" src/components/shared/AppHeader.jsx</automated>
  </verify>
  <done>
`NAV_ITEMS` builds via `SERVICES.filter((s) => !s.hidden).map(...)`.
The `/shop` and `/quote` entries are present only as commented-out lines (not
active array entries).
`NAV_ITEMS` evaluates to exactly: Home, Laser Cutting (from laser service), About.
  </done>
</task>

<task type="auto">
  <name>Task 3: Filter service cards and center single card in AppBanner.jsx</name>
  <files>src/components/shared/AppBanner.jsx</files>
  <action>
In `src/components/shared/AppBanner.jsx`, modify the service-cards block
(currently lines 53–75) to:

1. Add `sm:justify-center` to the wrapping flex `<div>` className.
   Before: `className="flex flex-col sm:flex-row gap-6 w-full max-w-4xl mb-10"`
   After:  `className="flex flex-col sm:flex-row sm:justify-center gap-6 w-full max-w-4xl mb-10"`

2. Change `{SERVICES.map((s) => {...})}` to
   `{SERVICES.filter((s) => !s.hidden).map((s) => {...})}`.

Verbatim resulting structure (from orchestrator plan §3, lines 76-90):

```jsx
<div className="flex flex-col sm:flex-row sm:justify-center gap-6 w-full max-w-4xl mb-10">
  {SERVICES.filter((s) => !s.hidden).map((s) => {
    const card = SERVICE_CARDS[s.key];
    return (
      <Link
        key={s.key}
        to={`/${s.urlSegment}`}
        className="w-full sm:w-1/2 dark:bg-ternary-dark rounded-xl p-6 hover:opacity-90 duration-300"
        aria-label={`${card.title} — see examples`}
      >
        ...
      </Link>
    );
  })}
</div>
```

Keep the per-card `sm:w-1/2` class as-is — the centered single card reads as
deliberate. Do NOT touch HERO_COPY (h1 + subhead), SERVICE_CARDS, the brand
image, or the Contact CTA `<Link>` below the cards row. Inner card markup
(`<h2>`, `<p>`, `<span>`) stays unchanged.
  </action>
  <verify>
    <automated>grep -q "sm:justify-center" src/components/shared/AppBanner.jsx &amp;&amp; grep -q "SERVICES.filter((s) => !s.hidden)" src/components/shared/AppBanner.jsx &amp;&amp; grep -q "flex flex-col sm:flex-row sm:justify-center gap-6 w-full max-w-4xl mb-10" src/components/shared/AppBanner.jsx</automated>
  </verify>
  <done>
The service-cards wrapper `<div>` className includes `sm:justify-center`.
Cards iterate via `SERVICES.filter((s) => !s.hidden).map(...)`.
HERO_COPY, SERVICE_CARDS, and the Contact CTA below the row are unchanged.
  </done>
</task>

</tasks>

<verification>
After all three tasks are complete, run the following checks in order. The
direct-URL spot checks for hidden routes are the most critical — they MUST all
resolve (no 404) because Snipcart production testing depends on `/shop/:slug`
remaining reachable.

## 1. Build sanity check

```bash
pnpm build
```

Must exit 0. Warnings unrelated to the existing baseline are a regression — read
them carefully.

## 2. Static grep invariants

```bash
# services.js — print is hidden, laser is not
grep -c "hidden: true" src/data/services.js   # must be exactly 1

# App.js — routes still use UNFILTERED SERVICES.map (NOT filter)
grep -q "SERVICES.map" src/App.js              # must succeed
! grep -q "SERVICES.filter" src/App.js         # must NOT contain filter

# AppHeader.jsx — filtered, shop + quote commented out
grep -q "SERVICES.filter((s) => !s.hidden)" src/components/shared/AppHeader.jsx
grep -qE "^\s*//\s*\{\s*to:\s*'/shop'" src/components/shared/AppHeader.jsx
grep -qE "^\s*//\s*\{\s*to:\s*'/quote'" src/components/shared/AppHeader.jsx

# AppBanner.jsx — filtered, centered
grep -q "SERVICES.filter((s) => !s.hidden)" src/components/shared/AppBanner.jsx
grep -q "sm:justify-center" src/components/shared/AppBanner.jsx
```

## 3. Local dev — visual + routing checkpoint

```bash
pnpm start
```

Open http://localhost:3000 and confirm:

**Visible UI**
- Desktop nav: `Home  Laser Cutting  About  [Contact CTA]` — exactly four items
- Mobile (hamburger) nav: same four items in the dropdown panel
- Home banner: one centered Laser Cutting card (no 3D Printing card)
- "Contact us" button still appears below the card

**Direct-URL spot checks — paste each into the address bar, must render (NOT 404):**
- http://localhost:3000/shop
- http://localhost:3000/shop/kinetic-sculpture
- http://localhost:3000/3d-printing
- http://localhost:3000/3d-printing/:slug (try any slug that exists in Sanity)
- http://localhost:3000/quote

**Smoke checks for visible routes:**
- http://localhost:3000/styles — laser styles page still renders
- http://localhost:3000/about — about page still renders
- http://localhost:3000/contact — contact page still renders
- http://localhost:3000/ — home renders correctly with single centered card
</verification>

<success_criteria>
- `pnpm build` exits 0
- All grep invariants pass
- Visible nav shows exactly: Home, Laser Cutting, About, Contact (CTA)
- Home banner shows exactly one service card, centered on sm+ viewports
- All five hidden-route direct URLs render (no 404)
- All four visible-route URLs still render correctly
- Three commits exist, one per file, with `fix(quick)` or equivalent prefix
- No changes to: src/App.js routes, netlify/functions/snipcart-validate-product/,
  AddToCartButton.jsx, Sanity content, HERO_COPY in AppBanner
</success_criteria>

<output>
After completion, create `.planning/quick/260512-cur-hide-wip-entry-points-shop-3d-printing-g/260512-cur-SUMMARY.md`.

Then per project memory: do NOT push directly to master. Push to `dev` for a
Netlify deploy preview, repeat the verification checks on the preview URL, then
open a PR `dev` → `master` for the production Snipcart test on
`shapesmith.studio`.
</output>
