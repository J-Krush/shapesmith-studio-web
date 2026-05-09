# Phase 4: Vite Migration - Research

**Researched:** 2026-05-08
**Domain:** Frontend build tooling — Create React App → Vite migration for a static React 18 SPA on Netlify
**Confidence:** HIGH

## Summary

Migrating Shapesmith Studio from `react-scripts` 5.0.1 to Vite is a mechanically straightforward swap because the codebase is already well-suited: dual ESM/CJS dependencies, browser-only output, no SSR, no ejected webpack config, and a single-file entry point (`src/index.js`). The migration's risk concentrates in five areas: (1) JSX inside `.js` files (`src/App.js`, `src/index.js`) which Vite parses as plain JavaScript by default, (2) the single `process.env.REACT_APP_RECAPTCHA_SITE_KEY` reference that must become `import.meta.env.VITE_RECAPTCHA_SITE_KEY` with a matching Netlify dashboard rename, (3) the deploy-time Netlify form prerender in `public/index.html` which Vite moves to project root with `%PUBLIC_URL%` token replacement, (4) the publish-directory change from `build/` to Vite's default `dist/` (or override Vite to keep `build/`), and (5) the postbuild sitemap generator and CRA-bundled Jest test runner, both of which depend on the old toolchain.

The standard stack is Vite 7 + `@vitejs/plugin-react` 5 — Vite 8 went GA on 2026-03-12 and replaces esbuild/Rollup with Rolldown/Oxc, which is fast but introduces enough new surface area that a "no user-visible change" migration phase should not double as a Rolldown bake-in. Recommend Vite 7 (current 7.3.3, released 2026-05-07) for the migration itself; Vite 8 can be a separate small upgrade later if desired. The Vitest-vs-keep-Jest decision tilts toward **migrate to Vitest in this phase** because keeping Jest after removing `react-scripts` requires standalone Jest config + Babel preset wiring (Jest cannot natively parse JSX or ESM), whereas Vitest reads the same `vite.config.js` and runs the existing 8 test files with near-zero rework. The Vitest migration here is small (~6 lines of `jest.fn()` → `vi.fn()`, one config block).

**Primary recommendation:** Adopt Vite 7 + `@vitejs/plugin-react` 5 with `esbuild.loader: 'jsx'` configured for `.js` files (avoid renaming `App.js`/`index.js` to keep the diff minimal); migrate the test runner to Vitest; override `build.outDir` to `'build'` to keep `netlify.toml`'s `publish = "build"` line stable; rename the single `REACT_APP_RECAPTCHA_SITE_KEY` env var to `VITE_RECAPTCHA_SITE_KEY` with a paired Netlify dashboard rename; verify the Netlify form prerender survives Vite's `index.html` transform (it does — the form is plain HTML with no `%PUBLIC_URL%` tokens); add a `[[redirects]]` SPA fallback to `netlify.toml` to formalize what `public/_redirects` already does; and verify on a deploy preview before merge.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Module bundling + dev server | Build tooling (Vite) | — | Vite owns the dev server, HMR, and production bundle; nothing changes at the React/runtime tier |
| JSX → JS transformation | Build tooling (Vite + plugin-react) | — | Plugin-react replaces CRA's Babel preset; oxc/esbuild handles the transform |
| Static asset serving | Static host (Netlify) | Build tooling (Vite copies `public/`) | Vite copies `public/` verbatim into the output; Netlify serves it; the runtime tier is unaware |
| Environment variable injection | Build tooling (Vite) | Static host (Netlify dashboard) | Build replaces `import.meta.env.VITE_*` at build time; Netlify provides values; runtime sees baked-in strings |
| SPA history fallback | Static host (Netlify) | — | `netlify.toml` `[[redirects]]` rewrites all unknown paths to `/index.html` so React Router can take over |
| Netlify form prerender | Static host (Netlify) | Build tooling (Vite copies `index.html` verbatim) | Netlify scans the deployed HTML for `<form netlify>` tags at deploy time; Vite must not strip/rewrite them |
| Sitemap + robots | Build tooling (postbuild script) | Static host (Netlify serves) | `scripts/generate-sitemap.cjs` runs after build; outputs to `dist/` (or `build/`); Netlify serves as static files |
| Test runner | Dev tooling (Vitest, after migration) | — | Tests run in jsdom against the same Vite resolver as production code |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite | ^7.3.3 | Build tool + dev server | The mainstream CRA-replacement; Vite 7 is the current stable line with active patches (7.3.3 released 2026-05-07, same week as Vite 8.0.11). Vite 8 ships Rolldown/Oxc as a brand-new bundler stack — only ~2 months old in production; deferring it keeps this migration boring. Vite 7 requires Node `^20.19.0 \|\| >=22.12.0`. [VERIFIED: npm view vite] [CITED: https://v7.vite.dev/guide/migration] |
| @vitejs/plugin-react | ^5.0.0 | React Fast Refresh + JSX transform | Official Vite plugin for React; uses Babel for the JSX transform with React Fast Refresh wired up. Plugin v5 is the line that pairs with Vite 7. (Plugin 6.x targets Vite 8 only — peer dep `vite: ^8.0.0`). [VERIFIED: npm view @vitejs/plugin-react] |
| vitest | ^3.0.0 | Test runner replacing CRA-bundled Jest | Reuses `vite.config.js`, runs in jsdom, ships a Jest-compatible API (`vi.fn()` ≅ `jest.fn()`). Vitest 4 (current latest, 4.1.5) requires `vite: ^6.0.0 \|\| ^7.0.0 \|\| ^8.0.0` — compatible with Vite 7. Choose Vitest 4 for the latest Jest-compat surface. [VERIFIED: npm view vitest] [CITED: https://vitest.dev/guide/migration.html] |
| jsdom | ^25.0.0 | DOM emulation for tests | Standard jsdom environment used by Vitest's `environment: 'jsdom'`. Runs the existing React Testing Library tests. [CITED: https://vitest.dev/guide/environment.html] |
| @vitest/coverage-v8 | ^4.0.0 | Coverage reporter | Standard pairing for Vitest. Optional — only needed if the planner wants `pnpm test:coverage`. [CITED: https://vitest.dev/guide/coverage.html] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | already installed (^13.4.0) | Component test queries | Keep — works with Vitest unchanged |
| @testing-library/jest-dom | already installed (^5.16.5) | DOM matchers (`.toBeInTheDocument`) | Keep — `import '@testing-library/jest-dom'` in `setupTests.js` works with Vitest's `setupFiles` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@vitejs/plugin-react` (Babel) | `@vitejs/plugin-react-swc` | SWC is faster but the Babel-based plugin is the more conservative pick — better-tested with Babel-emitted React 18 patterns, and there are no SWC-specific gains needed for this codebase. The minor speed difference is irrelevant for a marketing site. [CITED: https://vite.dev/blog/announcing-vite4] |
| Vite 7 | Vite 8 | Vite 8 (released 2026-03-12, ~2 months mature) replaces esbuild + Rollup with Rolldown + Oxc. Auto-conversion layer claims compatibility, but a "no user-visible change" migration shouldn't ride the bleeding edge of two new Rust toolchains. Defer Vite 8 to a follow-up. [CITED: https://vite.dev/blog/announcing-vite8] |
| Migrate Jest to Vitest | Keep Jest standalone | Possible, but requires installing `jest`, `babel-jest`, `@babel/preset-env`, `@babel/preset-react`, plus a `babel.config.js` and `jest.config.js` (CRA hides all of this). That's more code to maintain than the Vitest swap. Vitest also reuses the Vite resolver, so the existing `jest.mock('./utilities/sanityImage', ...)` pattern (which exists *because* CRA-Jest can't parse `@sanity/image-url`'s ESM) likely becomes unnecessary — Vite handles ESM natively. [VERIFIED: src/App.test.js comments lines 11-17] |
| Delete tests instead of migrating | Just remove the 8 test files | Tempting but wrong — there are now 8 test files (not just the stale CRA boilerplate from before): `App.test.js`, `useLocalStorageState.test.jsx`, `volumeAndBbox.test.js`, `calculatePrice.test.js`, `parseSvg.test.js`, `formatQuoteText.test.js`, `formatErrors.test.js`, `QuoteSubmitForm.test.jsx`. Phase 1's FOUND-06 deliberately landed the smoke test; Phase 3 added unit tests for quote logic. These are real coverage; deleting them is regressing FOUND-06. [VERIFIED: find src -name "*.test.*"] |

**Installation:**
```bash
pnpm add -D vite@^7 @vitejs/plugin-react@^5 vitest@^4 jsdom@^25
pnpm remove react-scripts
# Optional, only if coverage is wanted:
pnpm add -D @vitest/coverage-v8@^4
```

**Version verification (2026-05-08):**
- `vite@7.3.3` — published 2026-05-07; engines `^20.19.0 || >=22.12.0`
- `@vitejs/plugin-react@5.x` (peer `vite: ^7.0.0`) — note: `@vitejs/plugin-react@6.0.1` exists (peer `vite: ^8.0.0`) but pins to Vite 8 only
- `vitest@4.1.5` — published 2026-05-08; peer `vite: ^6.0.0 || ^7.0.0 || ^8.0.0`
- `jsdom@25.x` — current line for jsdom

[VERIFIED: npm view vite/plugin-react/vitest version dist-tags engines peerDependencies — 2026-05-08]

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Source Tree (no structural changes from CRA layout)              │
├─────────────────────────────────────────────────────────────────┤
│  index.html (root)  ← MOVED from public/index.html               │
│  src/index.js       ← contains JSX in .js (config handles this)  │
│  src/App.js         ← contains JSX in .js                        │
│  src/**/*.{js,jsx}                                               │
│  public/*           ← static assets, copied verbatim             │
│  vite.config.js     ← NEW (project root)                         │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Build Pipeline (vite build)                                      │
├─────────────────────────────────────────────────────────────────┤
│  1. esbuild dep pre-bundle (CJS→ESM, ESM passthrough)            │
│     - @sanity/client (dual; ESM picked)                          │
│     - framer-motion (dual; ESM picked)                           │
│     - react-icons (ESM)                                          │
│     - react-google-recaptcha-v3 (dual; ESM picked)               │
│  2. plugin-react Babel transform                                 │
│     (JSX → React.createElement; Fast Refresh in dev)             │
│  3. esbuild .js loader override → .js files parsed as JSX        │
│  4. PostCSS pipeline (auto-detected from postcss.config.js)      │
│     - Tailwind v3 (@tailwind directives in src/index.css)        │
│     - Autoprefixer                                               │
│  5. Rollup bundle + asset hashing                                │
│  6. Output → build/  (we override outDir from default 'dist')    │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Postbuild (npm lifecycle hook)                                   │
├─────────────────────────────────────────────────────────────────┤
│  scripts/generate-sitemap.cjs                                    │
│  - Reads STATIC_ROUTES + Sanity laser/print slugs                │
│  - Writes build/sitemap.xml                                      │
│  - MUST update build dir reference if outDir overridden          │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Netlify Deploy                                                   │
├─────────────────────────────────────────────────────────────────┤
│  1. Read netlify.toml: command=pnpm build, publish=build         │
│  2. Run pnpm install + pnpm build (with postbuild)               │
│  3. Scan build/index.html for <form netlify ...> tags            │
│     → register contact-form + shop-notify hidden forms           │
│  4. Apply [[redirects]] from netlify.toml                        │
│     - /materials  → /styles#materials  (301; from public/_redirects) │
│     - /*  → /index.html  (200; SPA fallback — NEW in Phase 4)    │
│  5. Copy build/ to CDN; deploy                                   │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Browser (runtime — UNCHANGED from CRA build)                     │
├─────────────────────────────────────────────────────────────────┤
│  - Loads /index.html → /assets/index-<hash>.js (module)          │
│  - React 18 hydrates #root via createRoot                        │
│  - React Router takes over routing                               │
│  - Sanity client fetches CDN GROQ; reCAPTCHA v3 loads on demand  │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (post-migration)
```
shapesmith-studio-web/
├── index.html               ← MOVED from public/index.html (root-of-project, NEW location)
├── vite.config.js           ← NEW
├── netlify.toml             ← MODIFIED: add [[redirects]] SPA fallback (publish stays "build")
├── package.json             ← MODIFIED: scripts, deps
├── postcss.config.js        ← UNCHANGED (Vite reads it natively)
├── tailwind.config.js       ← UNCHANGED (Vite reads via PostCSS)
├── public/
│   ├── _redirects           ← UNCHANGED (still copied to build/)
│   ├── favicon.png          ← UNCHANGED
│   ├── manifest.json        ← UNCHANGED
│   ├── og-default.png       ← UNCHANGED
│   ├── robots.txt           ← UNCHANGED
│   └── (index.html REMOVED — moved to project root)
├── src/                     ← UNCHANGED tree
│   ├── App.js               ← code change: process.env → import.meta.env (line 35)
│   ├── index.js             ← UNCHANGED
│   ├── App.test.js          ← code change: jest.fn → vi.fn, jest.mock → vi.mock; add `import { vi } from 'vitest'`
│   └── ...
└── scripts/
    └── generate-sitemap.cjs ← UNCHANGED if outDir='build'; UPDATE if outDir defaults to 'dist'
```

### Pattern 1: Minimal `vite.config.js` for CRA-shaped JS-only React project

**What:** Single config that handles JSX in `.js` files, keeps the `build/` output directory (so `netlify.toml` and `scripts/generate-sitemap.cjs` don't need to change), wires Vitest into the same config, and explicitly leaves PostCSS auto-detection on (no override needed).

**When to use:** Always. This is the minimum viable config for this codebase — anything beyond this is premature.

**Example:**
```js
// vite.config.js
// Source: https://vite.dev/config/ + https://github.com/vitejs/vite/discussions/3448
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Keep CRA's output directory so netlify.toml (publish="build") and
    // scripts/generate-sitemap.cjs (writes to build/sitemap.xml) don't move.
    outDir: 'build',
  },
  // Tell esbuild to treat .js files as JSX. The codebase has JSX in
  // src/App.js and src/index.js — without this, Vite parses them as plain
  // JS and breaks at the first `<` token.
  // Plugin-react's `include` covers .js for Fast Refresh, but the underlying
  // esbuild loader also has to be told. See vitejs/vite#3448.
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    // Apply the same .js-as-JSX rule to dep pre-bundling, otherwise the dev
    // server fails on the first .js-with-JSX file it encounters.
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  test: {
    // Vitest config, kept in vite.config.js (no separate vitest.config.ts).
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    // Mirrors CRA's behavior: pick up *.test.js, *.test.jsx anywhere under src/
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
```

[CITED: https://vite.dev/config/, https://github.com/vitejs/vite/discussions/3448, https://vitest.dev/guide/]

### Pattern 2: `index.html` move + entry point script tag

**What:** Vite expects `index.html` to live at project root and treats it as the build entry point. The script tag must explicitly import the entry module (CRA injected this implicitly).

**When to use:** Always — this is the single biggest mechanical change in the migration.

**Steps:**
1. `git mv public/index.html ./index.html`
2. In the moved file:
   - Replace every `%PUBLIC_URL%` with empty (Vite serves `public/` at `/`):
     - `href="%PUBLIC_URL%/favicon.png"` → `href="/favicon.png"`
     - `href="%PUBLIC_URL%/logo192.png"` → `href="/logo192.png"`
     - `href="%PUBLIC_URL%/manifest.json"` → `href="/manifest.json"`
   - Add a script tag inside `<body>` (after `<div id="root"></div>`):
     ```html
     <script type="module" src="/src/index.js"></script>
     ```
   - **Leave both `<form name="contact-form">` and `<form name="shop-notify">` untouched.** They contain plain HTML — no Vite-specific tokens — and Vite's HTML transform copies static elements verbatim. Netlify's form-detection scan runs against the deployed `build/index.html`, which Vite will produce with the form blocks intact. [VERIFIED: public/index.html lines 49-72]

[CITED: https://vite.dev/guide/#index-html-and-project-root, https://www.robinwieruch.de/vite-create-react-app/]

### Pattern 3: Environment variables — `process.env.REACT_APP_*` → `import.meta.env.VITE_*`

**What:** Vite injects only variables prefixed `VITE_` (configurable via `envPrefix` if needed) into client code via `import.meta.env`. This is a build-time replacement, not a runtime lookup.

**When to use:** Always — the codebase has exactly **one** runtime env var reference and **two** comment references (the comments must also update to avoid drift).

**Code locations to change:**

1. `src/App.js` line 35:
   ```diff
   - const reCaptchaKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
   + const reCaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
   ```
2. `src/App.js` line 29 (comment update):
   ```diff
   - // `react-scripts build` from the REACT_APP_RECAPTCHA_SITE_KEY env var (CRA
   + // Vite at build time from the VITE_RECAPTCHA_SITE_KEY env var (Vite
   ```
3. `src/components/quote/QuoteSubmitForm.jsx` line 15 (comment update):
   ```diff
   - //   - When REACT_APP_RECAPTCHA_SITE_KEY is unset (e.g. local dev without env
   + //   - When VITE_RECAPTCHA_SITE_KEY is unset (e.g. local dev without env
   ```
4. `src/App.js` line 33 (comment update referencing CRA):
   - Update the "When unset (e.g. local dev without env vars)" paragraph to read "Vite" instead of "CRA contract" — the runtime semantics are identical (build-time string replacement; undefined when unset; provider mounts but reCAPTCHA script never loads), but the contract description is wrong.

**Netlify dashboard rename:**
The deferred Plan 03-03 Task 1 owner-prep includes setting `REACT_APP_RECAPTCHA_SITE_KEY` in the Netlify dashboard. Phase 4 must coordinate: rename to `VITE_RECAPTCHA_SITE_KEY` in the dashboard (the value is identical; only the key changes). The Netlify Function-side `RECAPTCHA_SECRET_KEY` and `RESEND_API_KEY` are server-side env vars consumed by `netlify/functions/submit-quote/` — they have no `REACT_APP_` prefix and **do not need to change**. [VERIFIED: grep -rn "REACT_APP" src/ scripts/ public/ netlify.toml package.json — 3 hits, all in src/]

[CITED: https://v7.vite.dev/guide/env-and-mode]

### Pattern 4: Tailwind v3 + PostCSS — drop-in compatibility

**What:** Vite reads `postcss.config.js` from project root automatically. Tailwind v3's `@tailwind` directives in `src/index.css` flow through PostCSS unchanged.

**When to use:** Always. No changes needed to `tailwind.config.js`, `postcss.config.js`, or any CSS file.

**Verification points:**
- `postcss.config.js` already exports a CommonJS `module.exports` with the tailwind + autoprefixer plugin chain. Vite picks this up without configuration. [CITED: https://vite.dev/guide/features.html#postcss]
- `src/index.css` (loaded from `src/index.js`) already uses `@tailwind base; @tailwind components; @tailwind utilities;` — these compile through PostCSS into utility classes.
- The `postcss-cli` dep and `build:css` npm script are vestigial. They produce `src/css/main.css` — but **nothing imports `main.css`**. The runtime CSS path goes `src/index.js → src/index.css` (which has the `@tailwind` directives) and `src/App.js → src/css/App.css` (which has `@font-face` rules). The `build:css` script and `postcss-cli` dep should be deleted in this phase. [VERIFIED: grep -rn "main.css" src/ — no hits except in main.css itself]

**Existing latent bug to flag (not block):**
`tailwind.config.js` line 61 has `plugins: ['@tailwindcss/forms']` — a **string**, not `require('@tailwindcss/forms')`. Tailwind v3 expects the plugin to be a function/object; passing a string is a silent no-op. The `@tailwindcss/forms` styling is therefore not active in the current build. Fixing this is **out of scope** for the Vite migration (it's a pre-existing bug, fixing it could change visual output, which violates the "no user-visible change" success criterion), but the planner should call it out and the owner can decide whether to fix or leave-alone in this phase. [VERIFIED: tailwind.config.js line 61]

### Pattern 5: SPA fallback in `netlify.toml`

**What:** Vite outputs a static SPA. Netlify needs an explicit rewrite to serve `index.html` for unknown paths (so React Router can take over). The current Netlify dashboard auto-detect plus `public/_redirects` covers this implicitly today, but the migration should formalize it in `netlify.toml`.

**When to use:** Always — the existing `public/_redirects` only contains the `/materials` → `/styles#materials` 301; it does **not** contain a SPA fallback. The site currently works because Netlify's auto-detection adds it. Making it explicit prevents future surprise.

**Example:**
```toml
[build]
  command = "pnpm build"
  publish = "build"

[build.environment]
  NODE_VERSION = "20"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

# SPA fallback — must come AFTER any specific rewrites in public/_redirects.
# Netlify processes _redirects first, then netlify.toml [[redirects]],
# so the /materials 301 in public/_redirects continues to win.
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

[CITED: https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/, https://docs.netlify.com/routing/redirects/]

### Pattern 6: Vitest migration of existing tests

**What:** Vitest exposes a Jest-compatible API. The existing 8 test files require minimal mechanical changes: replace `jest.fn()` with `vi.fn()`, `jest.mock()` with `vi.mock()`, add `import { vi } from 'vitest'`.

**When to use:** Always — the alternative (standalone Jest) is more work.

**Mechanical change pattern (per test file):**
```diff
+ import { describe, test, expect, vi } from 'vitest';
- jest.mock('./utilities/sanityClient', () => ({
+ vi.mock('./utilities/sanityClient', () => ({
    __esModule: true,
    default: {
-     fetch: jest.fn(() => Promise.resolve([])),
+     fetch: vi.fn(() => Promise.resolve([])),
    },
  }));
```

If `globals: true` is set in `vite.config.js#test` (which the recommended config does), `describe`/`test`/`expect` don't need explicit imports — only `vi`.

**Existing `jest.mock('./utilities/sanityImage', ...)` workaround in `src/App.test.js`:**
This mock exists *because* CRA-Jest 27 cannot parse `@sanity/image-url`'s ESM. Vitest uses Vite's resolver, which handles ESM natively. The mock can be **removed entirely** after migration, simplifying the test. The planner should verify this by running the test once with the mock and once without to confirm it still passes. [VERIFIED: src/App.test.js lines 11-28]

[CITED: https://vitest.dev/guide/migration.html]

### Anti-Patterns to Avoid

- **Renaming `App.js` → `App.jsx` and `index.js` → `index.jsx`** — tempting because Vite documentation often suggests it, but it touches every import that references those files (currently `import App from './App'` works under both extensions thanks to extension resolution). The diff is larger and changes git blame for two foundational files. The `esbuild.loader: 'jsx'` config achieves the same outcome with one config line. Skip the rename. [CITED: https://github.com/vitejs/vite/discussions/3448 — "Better Alternative" comment is one valid view; we choose the config approach for diff minimization, which the same discussion thread explicitly endorses for migration scenarios]

- **Adopting `@vitejs/plugin-react-swc` instead of `@vitejs/plugin-react`** — SWC is faster but for a 50-component marketing site the build-speed delta is irrelevant. Stick with the Babel-based plugin which has the more conservative bug surface and matches what most CRA-migration tutorials use. [CITED: https://vite.dev/blog/announcing-vite4]

- **Migrating to Vite 8** in this phase. Vite 8 went GA 2026-03-12; it replaces esbuild + Rollup with Rolldown + Oxc. The compatibility layer auto-converts old config options, but the underlying bundler is brand new. A "no user-visible change" migration cannot also be the project's first Rolldown bake-in. [CITED: https://vite.dev/blog/announcing-vite8]

- **Using `process.env.NODE_ENV` shims** — Vite exposes `import.meta.env.MODE` (string: 'development' | 'production') and `import.meta.env.PROD` (boolean) and `import.meta.env.DEV` (boolean). The codebase doesn't currently use `process.env.NODE_ENV` directly (verified — the only `process.env` reference is to `REACT_APP_RECAPTCHA_SITE_KEY`), so no shim is needed. If a dependency internally references `process.env.NODE_ENV`, Vite already replaces it at build time as part of its standard `define` config. [CITED: https://v7.vite.dev/guide/env-and-mode]

- **Using `splitVendorChunkPlugin`** — removed in Vite 7. If any internet tutorial mentions it, ignore. The default Rollup chunk-splitting is sufficient for this site. [CITED: https://v7.vite.dev/guide/migration]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| `.env` file loading | Custom `dotenv` parser or shell script | Vite's built-in `.env`/`.env.local`/`.env.[mode]` cascade | Vite already loads them in the documented priority order; reinventing this leaks secrets and breaks parity with CRA's behavior. Just use `.env.local` for local dev (already gitignored). [CITED: https://v7.vite.dev/guide/env-and-mode] |
| SPA history fallback | Cloudflare Worker / custom Function | `netlify.toml` `[[redirects]]` with `status = 200` | Netlify's built-in rewrite is what every Vite-on-Netlify project uses. [CITED: https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/] |
| JSX-in-`.js` parser plugin | Custom esbuild plugin | `esbuild.loader: 'jsx'` + `optimizeDeps.esbuildOptions.loader` | Documented official escape hatch from the Vite team. [CITED: vitejs/vite#3448] |
| Test runner config from scratch | Standalone Jest with Babel preset | Vitest reusing `vite.config.js` | Vitest is purpose-built to share Vite's resolver/transform pipeline; it's the actively maintained successor for Vite-shaped projects. [CITED: https://vitest.dev/] |
| `%PUBLIC_URL%` template engine | Custom HTML preprocessor | Vite's native asset URL handling (just remove `%PUBLIC_URL%`) | Vite serves everything in `public/` at `/`; the prefix is unnecessary. [CITED: https://vite.dev/guide/assets.html#the-public-directory] |
| Nested env var prefix support (e.g., keeping `REACT_APP_` working) | Configure `envPrefix: ['REACT_APP_', 'VITE_']` | Just rename — the codebase has 1 var | Possible via `envPrefix` config, but introduces drift and confusion. The codebase has exactly one `REACT_APP_*` reference; rename it. [VERIFIED: grep -rn "REACT_APP" src/ — 3 hits, 1 runtime + 2 comments] |

**Key insight:** Every problem this phase touches has a documented Vite-blessed solution. Resist the urge to add config surface — the recommended `vite.config.js` is ~25 lines and that's the goal.

## Runtime State Inventory

This is a build-tooling migration, not a rename or data refactor — but a few categories still apply because env-var names and Netlify dashboard config are runtime state.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Sanity dataset, ChromaDB, etc. unaffected; Sanity `projectId`/`dataset` are hardcoded literals in `src/utilities/sanityClient.jsx` (no env-var lookup, so the `REACT_APP_` rename doesn't touch them). | None |
| Live service config | **Netlify dashboard environment variable**: `REACT_APP_RECAPTCHA_SITE_KEY` (deferred from Plan 03-03 Task 1; may or may not be set yet by the owner). When the owner completes Phase 4, this dashboard env var name must change to `VITE_RECAPTCHA_SITE_KEY`. The value is identical. | Owner-side rename in Netlify UI; coordinate with the deferred Plan 03-03 Task 1 owner-prep |
| OS-registered state | None — no Task Scheduler / launchd / systemd entries reference this project. | None — verified by repository scope (single-purpose web project, no cross-system registrations) |
| Secrets/env vars | **`.env`/`.env.local` files** (gitignored, owner-side only). If the owner has `REACT_APP_RECAPTCHA_SITE_KEY=...` in a local `.env.local`, they must rename it to `VITE_RECAPTCHA_SITE_KEY=...`. The Netlify Function-side env vars `RESEND_API_KEY` + `RECAPTCHA_SECRET_KEY` (used by `netlify/functions/submit-quote/`) have **no** `REACT_APP_` prefix — they are server-side and require **no rename**. | Document in Phase 4 plan; owner updates local `.env.local` (if any) |
| Build artifacts | **`src/css/main.css`** is a stale, generated PostCSS output committed to git via the `build:css` script. Nothing imports it (verified). After dropping `postcss-cli` and the `build:css` script, this file becomes orphan-but-harmless. Recommend deleting `src/css/main.css` and removing the `build:css` script + `postcss-cli` dep in this phase to close the loop. **`build/` directory** itself is gitignored and gets fully regenerated on every build — no risk. **`netlify/functions/*/node_modules`** are gitignored and reinstalled per build — no risk. | Delete `src/css/main.css`, remove `build:css` script and `postcss-cli` dep |

**Canonical question check:** *After every file in the repo is updated, what runtime systems still have the old name cached, stored, or registered?*
Answer: only the Netlify dashboard env var (`REACT_APP_RECAPTCHA_SITE_KEY`). Everything else is in-repo. Owner action required: one Netlify dashboard rename.

## Common Pitfalls

### Pitfall 1: JSX in `.js` files crashes the build
**What goes wrong:** First `pnpm dev` or `pnpm build` after migration fails with an esbuild parse error like `Unexpected "<"` pointing at `src/App.js` or `src/index.js`.
**Why it happens:** Vite's default esbuild loader rule treats `.js` files as plain JavaScript. The `@vitejs/plugin-react` plugin's `include` covers `.js` for *Fast Refresh wrapping*, but the underlying parser still rejects JSX syntax in `.js` files unless `esbuild.loader: 'jsx'` is set explicitly.
**How to avoid:** Include the `esbuild.loader` + `optimizeDeps.esbuildOptions.loader` blocks shown in Pattern 1. Verify with a test build before declaring the migration done.
**Warning signs:** Error message contains "Transform failed with 1 error" + a `<` token reference.
[CITED: https://github.com/vitejs/vite/discussions/3448]

### Pitfall 2: Netlify form prerender goes silent
**What goes wrong:** Contact form / shop-notify form submissions stop being received by the studio owner. The visitor sees a 404 or an HTML page back instead of a success redirect.
**Why it happens:** Netlify scans `index.html` at deploy time for `<form name="..." netlify ...>` tags and registers them. If Vite's HTML transform strips, rewrites, or replaces those tags — or if `index.html` is moved to root but the forms are *not* preserved verbatim — Netlify never registers them and POSTs to `/` return 404.
**How to avoid:** When moving `public/index.html` → `./index.html`, treat the file as text and only edit (a) `%PUBLIC_URL%` removals and (b) the new script tag insertion. Diff the moved file against the original to confirm the two `<form ...>` blocks are byte-identical. Add a verification step: in the deploy preview, open the Netlify Forms tab in the dashboard and confirm both `contact-form` and `shop-notify` appear with the same field list as before. [VERIFIED: public/index.html lines 49-72 + Plan 02-05 D-28 contract]
**Warning signs:** Netlify Forms tab in dashboard shows the form but with `0 fields detected`, OR the form is missing entirely. Submitting from the live site returns a generic Netlify 404.

### Pitfall 3: Sitemap script writes to the wrong directory
**What goes wrong:** `pnpm build` succeeds but `build/sitemap.xml` is missing, OR the sitemap appears at `dist/sitemap.xml` instead of `build/sitemap.xml`.
**Why it happens:** `scripts/generate-sitemap.cjs` hardcodes `path.join(__dirname, '..', 'build', 'sitemap.xml')` (verified). If the planner takes the path of accepting Vite's default `outDir: 'dist'`, the sitemap script writes to `build/sitemap.xml` but Netlify publishes `dist/`, so the sitemap is invisible. Conversely, if `outDir: 'build'` is overridden to keep the CRA path, the script works as-is.
**How to avoid:** Use `build.outDir: 'build'` in `vite.config.js` (recommended in Pattern 1) so the sitemap script doesn't move. **Or** alternative: change Vite's outDir to `'dist'` AND update the script's `'build'` literal to `'dist'` AND update `netlify.toml`'s `publish = "build"` to `publish = "dist"`. Three coordinated changes vs. one config line — the one-line option is preferred. [VERIFIED: scripts/generate-sitemap.cjs - need to read full file for line refs]
**Warning signs:** Search Console reports "Sitemap could not be read" after deploy.

### Pitfall 4: `process.env` references in third-party packages cause runtime errors
**What goes wrong:** Some library throws `ReferenceError: process is not defined` in the browser console after migration.
**Why it happens:** Vite does not automatically polyfill `process.env` in client code. The codebase itself only references `process.env.REACT_APP_RECAPTCHA_SITE_KEY` (which we rename), but a third-party package may internally reference `process.env.NODE_ENV`. Vite handles this case automatically via its built-in `define` substitution, but only for the standard `process.env.NODE_ENV` shape. Other `process.env.X` references in third-party code are not auto-handled.
**How to avoid:** Run `pnpm build` and `pnpm preview` (Vite's local production preview) after migration. Open the browser console. If any `process is not defined` error appears, identify the offending package and add a `define` config: `define: { 'process.env': '{}' }` as a defensive shim. **However** — verified via `grep -rn "process.env" src/` (1 hit only, in `App.js`) and the dependency list (Sanity, framer-motion, react-router, react-icons, react-helmet-async, react-google-recaptcha-v3, three) — none of these are known to reference unguarded `process.env.X` in client paths. Risk is low; verify don't pre-shim. [CITED: https://vite.dev/config/shared-options.html#define]
**Warning signs:** Browser console error: `ReferenceError: process is not defined` at module load time.

### Pitfall 5: ESM/CJS interop on `@sanity/client` v6
**What goes wrong:** Build error like `Cannot find module '@sanity/client'` or `'X' is not exported by '@sanity/client'`.
**Why it happens:** `@sanity/client` v6 declares `"type": "module"` and ships both `dist/index.js` (ESM) and `dist/index.cjs` (CJS) via `module`/`main` fields. Vite picks the ESM entry via the `module` field, which is correct. The risk is real but small — the package is properly dual-published.
**How to avoid:** Default Vite behavior is correct. If a build error appears, add `optimizeDeps.include: ['@sanity/client']` to force pre-bundling. Do **not** add it pre-emptively — Vite's auto-detection works for this package. [VERIFIED: npm view @sanity/client@6.29.1 type module main]
**Warning signs:** Build fails on a Sanity-related import; dev server fails on first Sanity-using component.

### Pitfall 6: `react-google-recaptcha-v3` reCAPTCHA script never loads after migration
**What goes wrong:** `executeRecaptcha` is `undefined` even with `VITE_RECAPTCHA_SITE_KEY` set; `QuoteSubmitForm` shows the "spam protection isn't loaded yet" message.
**Why it happens:** Two possibilities: (a) the env var rename happened in code but not in the Netlify dashboard, OR (b) the value in `.env.local` is missing the `VITE_` prefix. The graceful-degrade behavior (per Plan 03-03 Task 3) means the build succeeds either way; the failure is silent at runtime.
**How to avoid:** After migration, verify in deploy-preview DevTools: `import.meta.env.VITE_RECAPTCHA_SITE_KEY` should be a defined string at the top of `<App>` (you can `console.log(reCaptchaKey)` temporarily during migration verification, then remove the log). The Netlify dashboard rename is the single most likely failure point — coordinate it with the owner explicitly. [VERIFIED: src/App.js lines 28-35 + Plan 03-03 graceful-degrade contract]
**Warning signs:** Quote form submission button enabled but always returns "spam protection isn't loaded yet."

### Pitfall 7: `--openssl-legacy-provider` lingers in package.json or netlify.toml
**What goes wrong:** Build still tries to pass `--openssl-legacy-provider` to a Node binary that no longer accepts it (Node 22+ removed the flag).
**Why it happens:** The flag was only ever needed for CRA 5 / webpack 4's old crypto. Vite uses esbuild + Rollup, which use modern Node crypto APIs natively. The flag is now harmful.
**How to avoid:** Grep for `openssl-legacy-provider` across the repo and remove every occurrence. Confirmed locations: `package.json` `start` and `build` scripts (only). [VERIFIED: package.json lines 30-31]
**Warning signs:** Local Node 22 build fails with `unknown option --openssl-legacy-provider`.

### Pitfall 8: Existing `jest.mock` workaround for ESM dep no longer needed but still present
**What goes wrong:** Tests pass but contain dead workaround code; or, worse, the workaround masks a real test failure.
**Why it happens:** `src/App.test.js` mocks `./utilities/sanityImage` *because* CRA-Jest cannot parse `@sanity/image-url`'s ESM. Under Vitest, the resolver handles ESM natively, so the mock becomes unnecessary. Leaving it in is technical debt and may hide future bugs.
**How to avoid:** During Vitest migration, remove the `vi.mock('./utilities/sanityImage', ...)` block in `App.test.js`, run the test, confirm it still passes (it should — the test only asserts on nav links, not images). If it fails, restore the mock. Document the outcome. [VERIFIED: src/App.test.js lines 11-28]
**Warning signs:** Test suite green but `App.test.js` has a `vi.mock` block that references a real, working module.

## Code Examples

### Step 1: Final `vite.config.js` (project root)
```js
// vite.config.js
// Source: https://vite.dev/config/, vitejs/vite#3448, https://vitest.dev/guide/
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
```

### Step 2: `package.json` script changes
```diff
   "scripts": {
-    "start": "react-scripts start --openssl-legacy-provider",
-    "build": "react-scripts build --openssl-legacy-provider",
+    "dev": "vite",
+    "start": "vite",
+    "build": "vite build",
+    "preview": "vite preview",
     "postbuild": "node scripts/generate-sitemap.cjs",
-    "test": "react-scripts test",
-    "eject": "react-scripts eject",
-    "build:css": "postcss src/css/tailwind.css -o src/css/main.css"
+    "test": "vitest run",
+    "test:watch": "vitest"
   },
```

Note: `start` is kept as an alias for `vite` so any owner muscle-memory or external doc reference (README, etc.) keeps working. `dev` is the modern Vite convention and should be the canonical script. `eject` is removed (Vite has nothing to eject from). `build:css` is removed (PostCSS runs natively in Vite). [CITED: https://vite.dev/guide/cli.html]

### Step 3: `package.json` dependency changes
```diff
   "dependencies": {
     ...
-    "react-scripts": "5.0.1",
     ...
-    "postcss-cli": "^10.1.0",
     ...
   },
   "devDependencies": {
     "@babel/plugin-proposal-private-property-in-object": "^7.21.11",
     "@tailwindcss/forms": "^0.5.3",
     "@testing-library/dom": "^9.3.0",
     "autoprefixer": "^10.4.10",
     "postcss": "^8.4.16",
-    "tailwindcss": "^3.1.8"
+    "tailwindcss": "^3.1.8",
+    "vite": "^7.3.3",
+    "@vitejs/plugin-react": "^5.0.0",
+    "vitest": "^4.1.5",
+    "jsdom": "^25.0.0"
   }
```

The `@babel/plugin-proposal-private-property-in-object` dep was a CRA 5 peer-dep workaround — it's only needed by `babel-preset-react-app` which `react-scripts` pulled in. **Once `react-scripts` is removed, this Babel plugin is also vestigial and should be removed.** [VERIFIED: package.json line 56 — comment says "to silence the well-known CRA 5 peer-dep warning"]

```diff
   "devDependencies": {
-    "@babel/plugin-proposal-private-property-in-object": "^7.21.11",
     "@tailwindcss/forms": "^0.5.3",
     ...
   }
```

### Step 4: `index.html` migration (after `git mv`)
```html
<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.png" />        <!-- was %PUBLIC_URL%/favicon.png -->
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#291c30" />
    <meta
      name="description"
      content="Shapesmith Studio — custom laser cutting and 3D printing for local hobbyists and small businesses."
    />
    <meta property="og:title" content="Shapesmith Studio" />
    <meta property="og:description" content="Custom laser cutting and 3D printing." />
    <meta property="og:image" content="/og-default.png" />
    <meta property="og:type" content="website" />
    <link rel="apple-touch-icon" href="/logo192.png" />   <!-- was %PUBLIC_URL%/logo192.png -->
    <link rel="manifest" href="/manifest.json" />          <!-- was %PUBLIC_URL%/manifest.json -->
    <title>Shapesmith Studio</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>

    <!--
      Netlify deploy-time form prerender (D-28).
      LEAVE EXACTLY AS-IS — see CONTACT-FORM CONTRACT in src/components/contact/ContactForm.jsx.
    -->
    <form name="contact-form" netlify netlify-honeypot="bot-field" hidden>
      <input type="text" name="bot-field" />
      <input type="text" name="name" />
      <input type="email" name="email" />
      <input type="text" name="service" />
      <input type="text" name="subject" />
      <textarea name="message"></textarea>
      <input type="submit" value="Submit">
    </form>
    <form name="shop-notify" netlify netlify-honeypot="bot-field" hidden>
      <input type="text" name="bot-field" />
      <input type="email" name="email" />
      <input type="submit" value="Submit">
    </form>

    <!-- NEW: explicit module entry — Vite injects this manually, CRA did it implicitly. -->
    <script type="module" src="/src/index.js"></script>
  </body>
</html>
```

[VERIFIED: public/index.html — full file content preserved + 3 %PUBLIC_URL% removals + 1 script tag addition]

### Step 5: `netlify.toml` after migration
```toml
[build]
  command = "pnpm build"
  publish = "build"

[build.environment]
  NODE_VERSION = "20"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

# SPA fallback for React Router. Processes after public/_redirects, so the
# /materials → /styles#materials 301 in _redirects continues to win for that
# specific path; everything else gets the index.html rewrite.
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

[CITED: https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/, https://docs.netlify.com/routing/redirects/#rule-processing-order]

### Step 6: `App.test.js` Vitest migration
```js
import { render, screen } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import App from './App';

vi.mock('./utilities/sanityClient', () => ({
  __esModule: true,
  default: {
    fetch: vi.fn(() => Promise.resolve([])),
  },
}));

// NOTE: The previous jest.mock on './utilities/sanityImage' (ESM workaround
// for Jest 27 in CRA 5) is removed — Vitest uses Vite's resolver and parses
// @sanity/image-url ESM natively. Verify by running the test; restore the
// mock only if a real failure surfaces.

test('App mounts without crashing and renders persistent nav', async () => {
  render(<App />);
  const contactLinks = await screen.findAllByText(/contact/i);
  expect(contactLinks.length).toBeGreaterThan(0);
});
```

The other 7 test files require similar `jest.fn()` → `vi.fn()` and `jest.mock()` → `vi.mock()` substitutions. If `vite.config.js` has `globals: true`, no `import { describe, test, expect } from 'vitest'` is needed (only `vi`). [CITED: https://vitest.dev/guide/migration.html]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Create React App (`react-scripts`) | Vite + plugin-react | CRA officially deprecated by React team in 2025; community has been migrating since 2022 | The default React-app starter recommendation; Vite is now the assumed bundler for React SPAs |
| `process.env.REACT_APP_*` | `import.meta.env.VITE_*` | Vite 2.x (2021) | Build-time string replacement vs CRA's webpack DefinePlugin substitution; same model, different syntax |
| webpack 4 + Babel + `--openssl-legacy-provider` | esbuild dep pre-bundle + Rollup output (Vite 7) | Vite 4-7 line | No legacy OpenSSL flag needed; works on all modern Node versions |
| Jest bundled in `react-scripts` | Vitest sharing `vite.config.js` | Vitest 0.x in 2022, mature in v1+ (2024), v4 current | Reuses build-tool resolver; no separate Babel preset; native ESM |
| `public/index.html` template with `%PUBLIC_URL%` | `index.html` at project root with relative `/` paths | Vite 2.x (2021) | Removes the proprietary template token; HTML is now plain HTML |
| CRA-default `build/` output | Vite-default `dist/` output | Vite 2.x (2021) | Convention difference; either works, both are configurable |
| No SPA fallback redirect | Explicit `[[redirects]]` in `netlify.toml` | Always required for client-side routers; Netlify auto-detects but explicit is safer | Eliminates "works in dev, 404s in prod-on-deep-link" surprise |

**Deprecated/outdated:**
- **Create React App** — officially deprecated by React core team in early 2025; the React docs no longer recommend it for new projects. [CITED: https://react.dev/learn/start-a-new-react-project]
- **`splitVendorChunkPlugin`** — removed in Vite 7. Use `build.rollupOptions.output.manualChunks` if needed (not needed here). [CITED: https://v7.vite.dev/guide/migration]
- **`process.env.REACT_APP_*`** — superseded by `import.meta.env.VITE_*` in any Vite-shaped project.
- **`postcss-cli` as a runtime build dependency** — vestigial in this codebase; Vite runs PostCSS natively.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vite 7 is more conservative than Vite 8 for this migration. | Standard Stack > Alternatives Considered | Low — even if Vite 8 works perfectly here, Vite 7 also works; the conservatism just trades a small future re-bump for current-day risk reduction. |
| A2 | The Netlify Functions block (`[functions] directory = "netlify/functions"`) is correctly preserved in the existing `netlify.toml` and Vite migration changes do not affect it. | Pattern 5 | Low — Vite never touches `netlify/functions/`; this is Netlify-side build behavior. Verify in deploy preview. |
| A3 | `web-vitals` library calls in `src/reportWebVitals.js` continue to work under Vite. The lib is dual-published; the dynamic `import('web-vitals')` in `reportWebVitals.js` is standard ESM and well-supported. | (not a separate section — implied by ecosystem-friendly migration) | Low — `web-vitals` is wired but called as `reportWebVitals()` with no callback (verified `src/index.js` line 17), so even a runtime failure here would be silent. The migration doesn't make this worse. |
| A4 | The `@tailwindcss/forms` plugin string-vs-require bug in `tailwind.config.js` line 61 is a pre-existing latent issue and Phase 4 does not need to fix it. | Pattern 4 | Medium — if the planner *does* fix it as a side-effect, visual output may change (form elements get `@tailwindcss/forms` styling that they don't have today), violating the "no user-visible change" success criterion. Recommend the planner explicitly defer fixing this bug. |
| A5 | The `process.env` shim for third-party packages is not needed — no current dep of this project references unguarded `process.env.X` in client paths. | Pitfall 4 | Medium — verifiable by running `pnpm preview` and checking the browser console after migration. If a `process is not defined` error surfaces, add `define: { 'process.env': '{}' }` to vite.config.js. |
| A6 | Vitest's resolver handles `@sanity/image-url` ESM natively, allowing the workaround mock in `App.test.js` to be removed. | Pattern 6 + Pitfall 8 | Low — verifiable by running the test once with the mock removed. If it fails, restore the mock. |

**User confirmation needed for:** A1 (which Vite major version), A4 (whether to fix the `@tailwindcss/forms` plugin bug as a Phase 4 side-effect or defer), A5 (whether to pre-emptively add `define: { 'process.env': '{}' }` or defer until verification surfaces a real need).

## Open Questions

1. **Vite 7 vs Vite 8 — owner preference?**
   - What we know: Vite 7 (current 7.3.3) is conservative; Vite 8 (current 8.0.11, GA'd 2026-03-12) is faster but two months mature.
   - What's unclear: Owner's risk appetite for a "no user-visible change" phase.
   - Recommendation: Default to Vite 7. Surface Vite 8 as a deferred follow-up if the owner wants the perf wins later.

2. **Does the owner have any local `.env.local` files with `REACT_APP_*` vars beyond `REACT_APP_RECAPTCHA_SITE_KEY`?**
   - What we know: Only one `process.env.REACT_APP_*` reference in source. No `.env*` files are committed. `.env.local` is gitignored.
   - What's unclear: Whether the owner has personal/local env vars set that would need parallel renames.
   - Recommendation: The plan should include a one-line owner-facing note: "If you have a local `.env.local` with `REACT_APP_RECAPTCHA_SITE_KEY=...`, rename the key to `VITE_RECAPTCHA_SITE_KEY=...`. The value is unchanged."

3. **Should the `@tailwindcss/forms` plugin bug be fixed in this phase?**
   - What we know: `tailwind.config.js` line 61 has the plugin name as a string instead of `require('@tailwindcss/forms')`. This is a silent no-op in Tailwind v3.
   - What's unclear: Whether activating the plugin would change any visual output.
   - Recommendation: **Defer** — this is a pre-existing bug and the Phase 4 success criteria explicitly demand "behaves identically to the CRA build from any user's perspective." Fixing this could change form-element rendering and violate the criterion. File a follow-up issue.

4. **Should `web-vitals` be removed entirely?**
   - What we know: It's wired up in `reportWebVitals.js` but called as `reportWebVitals()` with no callback (verified `src/index.js` line 17), making it a no-op. The whole module is dead code.
   - What's unclear: Whether the owner intends to wire it up later (e.g. to Plausible/Datadog).
   - Recommendation: Out of scope for Phase 4. If owner wants, file as a v2 cleanup.

5. **Plan 03-03 deferred Task 1 + Task 4 — does Phase 4 unblock or block them?**
   - What we know: Plan 03-03 Tasks 1 + 4 are deferred pending owner-prep (Resend domain verify, reCAPTCHA registration, Netlify env var population including `REACT_APP_RECAPTCHA_SITE_KEY`).
   - What's unclear: Should Phase 4 wait for owner to complete Plan 03-03 owner-prep first (so the env var rename happens once), or proceed independently?
   - Recommendation: **Phase 4 proceeds independently.** The owner-prep is value-decoupled from the build-tool migration. When the owner *does* set the dashboard env var (whether before, during, or after Phase 4), they set it as `VITE_RECAPTCHA_SITE_KEY` not `REACT_APP_RECAPTCHA_SITE_KEY`. Phase 4 plan should call this out so the owner doesn't accidentally use the old name.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite 7 dev/build | ✓ | 22.22.0 (local); Netlify "20" alias resolves to 20.20.x at deploy | None needed — both meet `^20.19.0 \|\| >=22.12.0` requirement |
| pnpm | Package management | ✓ | 9.x (lockfile v9.0); `packageManager: "pnpm@9.0.0"` in package.json | None needed |
| Netlify CLI (`netlify dev`) | Local Functions testing | Optional | — | Not blocking — Functions can be tested in deploy preview |
| Sanity Studio access | Owner-side schema management | ✓ (existing — owner has access) | — | None — Phase 4 doesn't touch Sanity |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

[VERIFIED: `node -v` returns v22.22.0; package.json declares engines.node ">=20" + packageManager pnpm@9.0.0; netlify.toml line 6 declares NODE_VERSION="20"]

## Project Constraints (from CLAUDE.md)

These constraints are extracted from `./CLAUDE.md` and bind the planner. They override any conflicting recommendation in this research.

- **Stay on Create React App + React 18 + JavaScript — no TS, no Next.js.** Phase 4 explicitly *exits* CRA but stays on React 18 + JavaScript. ✓ honored.
- **CMS: All structured content goes through Sanity, anonymous CDN reads only.** No Sanity changes in Phase 4. ✓ honored.
- **Hosting: Netlify (static SPA + Netlify Forms).** Phase 4 stays on Netlify; the `[[redirects]]` SPA fallback formalizes existing behavior. ✓ honored.
- **Lead capture: Reuse the existing Netlify contact form for the spruce bundle.** No contact form changes in Phase 4. ✓ honored.
- **Visual identity: Targeted spruce only, not a full redesign.** Phase 4 must produce a build that "behaves identically to the CRA build from any user's perspective." This is the dominant constraint of Phase 4 — see Pitfalls 2, 4, and 6 + Open Question 3. ✓ honored.
- **Photography: No 3D-print photos exist yet.** Not relevant to Phase 4. ✓ honored.
- **GSD Workflow Enforcement: Before using Edit, Write, or other file-changing tools, start work through a GSD command.** Research is being produced under `gsd-research-phase`. ✓ honored.
- **Tech stack file extensions: `.jsx` for components, `.js` for non-component modules.** This research recommends NOT renaming `App.js`/`index.js` to `.jsx` (anti-pattern listed) — keeping the existing extension convention. ✓ honored.
- **Custom palette: `ternary` typo (not `tertiary`) used consistently throughout the codebase, must be preserved.** Phase 4 doesn't touch Tailwind tokens or component CSS. ✓ honored.

## Sources

### Primary (HIGH confidence)
- [Context7 `/websites/vite_dev`] — topics fetched: CRA migration, JSX in .js files, plugin-react config
- [Context7 `/vitejs/vite`] — topics fetched: plugin-react include option
- [Vite v7 official migration guide](https://v7.vite.dev/guide/migration) — Node version + breaking changes
- [Vite v7 official env-and-mode docs](https://v7.vite.dev/guide/env-and-mode) — `import.meta.env`, prefix system, `.env` cascade
- [Vite official Vite 8 release blog](https://vite.dev/blog/announcing-vite8) — Rolldown/Oxc breaking changes
- [Netlify Vite framework setup guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/) — recommended `netlify.toml` settings
- [Netlify redirects docs](https://docs.netlify.com/routing/redirects/) — rule processing order, SPA fallback pattern
- [Vitest migration guide](https://vitest.dev/guide/migration.html) — Jest → Vitest mechanical changes
- [vitejs/vite#3448 GitHub Discussion](https://github.com/vitejs/vite/discussions/3448) — JSX in .js files canonical workaround, `esbuild.loader: 'jsx'`
- [npm registry — package version verification 2026-05-08]: `vite@7.3.3`, `@vitejs/plugin-react@5.x`, `vitest@4.1.5`, `@sanity/client@6.29.1`, `framer-motion@10.18.0`

### Secondary (MEDIUM confidence)
- [Robin Wieruch — Migrate to Vite from CRA](https://www.robinwieruch.de/vite-create-react-app/) — verified against official Vite docs
- [@vitejs/plugin-react GitHub README](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react) — verified against npm package metadata

### Tertiary (LOW confidence — flagged for verification)
- None — every claim in this research has at least one HIGH or MEDIUM source.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VITE-01 | Build tool migrates from `react-scripts` to Vite with the existing static-SPA output unchanged from a user's perspective; `pnpm build` produces a deployable bundle | Pattern 1 (vite.config.js), Pattern 2 (index.html move), Pattern 4 (Tailwind compatibility), Pattern 6 (Vitest), Anti-Pattern: don't migrate to Vite 8, all 8 Pitfalls |
| VITE-02 | All `REACT_APP_*` environment variables are renamed to `VITE_*` and code references updated | Pattern 3 (env var rename — exactly 1 runtime ref + 2 comment refs), Runtime State Inventory (Netlify dashboard rename), Pitfall 6 (verify reCAPTCHA after rename) |
| VITE-03 | The Netlify build configuration (`netlify.toml`) reflects the new build command and publish directory; deploy preview verifies the migrated site behaves identically to the CRA build | Pattern 5 (netlify.toml with SPA fallback), Step 5 of Code Examples (full netlify.toml content), Pitfall 3 (sitemap script + outDir alignment), Open Question 5 (deploy preview verification scope) |

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version verified against npm registry on 2026-05-08; ecosystem is mature and well-documented.
- Architecture: HIGH — Vite + plugin-react + Vitest is the canonical CRA-replacement pattern; no novel architectural decisions.
- Pitfalls: HIGH — every pitfall is verified against either the codebase (e.g., `process.env` grep, sitemap script source, App.js line refs) or canonical Vite/Netlify docs.

**Research date:** 2026-05-08
**Valid until:** 2026-06-08 (30 days — Vite 7 is stable; Vite 8 may continue to mature; recheck before execution if Phase 4 is scheduled past this date)
