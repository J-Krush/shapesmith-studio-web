# Phase 4: Vite Migration - Pattern Map

**Mapped:** 2026-05-08
**Files analyzed:** 13 (4 new, 9 modified, 1 deleted, 1 moved)
**Analogs found:** 6 / 13 (build-tool migration — most files have no in-repo analog)

## Note on Pattern Matching for This Phase

This is a **build-tool migration**, not feature work. Most created files are configuration (`vite.config.js`, `index.html`-at-root) or modifications to existing config (`package.json`, `netlify.toml`). Pattern matching is fundamentally different here:

- **For new config files** — the closest analog is "an existing config file at the same location with the same module style" (CommonJS at repo root, e.g. `tailwind.config.js`, `postcss.config.js`, `scripts/generate-sitemap.cjs`). The *content* must come from RESEARCH.md (Vite-blessed shapes), not codebase analogs.
- **For modified files** — the "pattern" is a before/after diff. The existing code IS the pattern; the work is mechanical replacement.
- **For test-runner migration (Vitest)** — closest analog is the existing CRA Jest test files; the Vitest API is intentionally Jest-compatible.

When a file has **no codebase analog**, it is marked as "Build-tool migration — no codebase analog" and the planner should use RESEARCH.md's `## Code Examples` section verbatim.

## File Classification

| File | Operation | Role | Data Flow | Closest Analog | Match Quality |
|------|-----------|------|-----------|----------------|---------------|
| `vite.config.js` | CREATE | build-config | build-tool | `tailwind.config.js`, `postcss.config.js` | structural-only (CJS-at-root vs ESM-at-root differ) |
| `index.html` (root) | MOVE from `public/index.html` | build-entry | static | `public/index.html` (the file being moved) | exact (same content + 4 edits) |
| `netlify.toml` | MODIFY (add `[[redirects]]`) | deploy-config | deploy-time | `netlify.toml` (existing) | exact (additive edit) |
| `package.json` | MODIFY (scripts + deps) | manifest | build-tool | `package.json` (existing) | exact (mechanical replacement) |
| `src/App.js` | MODIFY (line 35 + comments) | app-root | runtime | `src/App.js` (existing) | exact (1-line code change + comment updates) |
| `src/App.test.js` | MODIFY (Jest → Vitest API) | test | jsdom | `src/App.test.js` (existing) — already a Jest test | exact (mechanical jest→vi rename) |
| `src/hooks/useLocalStorageState.test.jsx` | MODIFY | test | jsdom | itself | exact |
| `src/utilities/quote/volumeAndBbox.test.js` | MODIFY | test | pure | itself | exact |
| `src/utilities/quote/calculatePrice.test.js` | MODIFY | test | pure | itself | exact |
| `src/utilities/quote/parseSvg.test.js` | MODIFY | test | pure | itself | exact |
| `src/utilities/quote/formatQuoteText.test.js` | MODIFY | test | pure | itself | exact |
| `src/utilities/quote/formatErrors.test.js` | MODIFY | test | pure | itself | exact |
| `src/components/quote/QuoteSubmitForm.test.jsx` | MODIFY | test | jsdom | itself | exact |
| `src/components/quote/QuoteSubmitForm.jsx` | MODIFY (comment line 15) | component | n/a | itself | exact (comment-only edit) |
| `public/index.html` | DELETE (after move) | — | — | — | — |
| `src/css/main.css` | DELETE (orphan generated file) | — | — | — | — |

## Pattern Assignments

### `vite.config.js` (build-config, build-tool) — CREATE

**Analog:** Structurally similar to `tailwind.config.js` and `postcss.config.js` (both at project root, both export config), BUT module style differs (existing root configs use CommonJS `module.exports`; vite.config.js will use ESM `export default`). **Content must come from RESEARCH.md Pattern 1 / Step 1, not from analog.**

**Existing analog: `tailwind.config.js` lines 22-62** (CommonJS-at-root pattern):
```javascript
const colors = require('tailwindcss/colors');

module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	darkMode: 'class',
	theme: { ... },
	plugins: ['@tailwindcss/forms'],
};
```

**Existing analog: `postcss.config.js` lines 8-11** (CommonJS-at-root pattern):
```javascript
const tailwindcss = require('tailwindcss');
module.exports = {
	plugins: [tailwindcss('./tailwind.config.js'), require('autoprefixer')],
};
```

**Pattern divergence — vite.config.js MUST use ESM** (per Vite docs and Vite 7 conventions):
- Use `import` not `require`
- Use `export default defineConfig({...})` not `module.exports`
- This is the first ESM-style root config in the repo; it is allowed because Vite expects it. Other root configs (tailwind, postcss) stay CommonJS.

**Indentation convention from existing root configs** (tabs, not spaces — see `tailwind.config.js` lines 25-61, `postcss.config.js` lines 9-11):
```
\tcontent: ['./src/**/*.{js,jsx,ts,tsx}'],
\tdarkMode: 'class',
```
**Apply the same tab indentation to `vite.config.js`** for consistency with the existing root configs.

**Authoritative content source:** RESEARCH.md `### Step 1: Final vite.config.js (project root)` (lines 425-454). Copy verbatim, then re-indent with tabs to match repo convention.

---

### `index.html` (build-entry, static) — MOVE from `public/index.html`

**Analog:** `public/index.html` (the file being moved — exact content baseline)

**Operation:** `git mv public/index.html ./index.html` then apply 4 edits.

**Existing content to preserve (the entire file from `public/index.html` lines 1-85):**

The file structure must remain byte-identical EXCEPT for the 4 edits below. Specifically, the two Netlify forms (lines 49-73) must remain byte-identical — Netlify's deploy-time prerender scan depends on these.

**Edit 1: Line 5** — replace `%PUBLIC_URL%` token:
```diff
- <link rel="icon" href="%PUBLIC_URL%/favicon.png" />
+ <link rel="icon" href="/favicon.png" />
```

**Edit 2: Line 21** — replace `%PUBLIC_URL%` token:
```diff
- <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
+ <link rel="apple-touch-icon" href="/logo192.png" />
```

**Edit 3: Line 26** — replace `%PUBLIC_URL%` token:
```diff
- <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
+ <link rel="manifest" href="/manifest.json" />
```

**Edit 4: After line 41 (`<div id="root"></div>`)** — add explicit module entry script tag. Place it AFTER the two Netlify forms (post-line-73) to mirror the original document order (forms come first as they did in the original). Or place it at the end of body just before `</body>`:
```html
<script type="module" src="/src/index.js"></script>
```

**MUST NOT TOUCH** (verbatim preservation required):
- Lines 49-62: `<form name="contact-form" netlify ...>` block — D-28 contract
- Lines 64-72: `<form name="shop-notify" netlify ...>` block — D-23 contract
- The `<!--` Netlify comment block lines 43-48 — explains the contract for future maintainers

**Verification step (planner must call out):** Diff the moved file against the original; the only differences must be the 3 `%PUBLIC_URL%` removals and the new `<script type="module">` line.

[CITED: RESEARCH.md Pattern 2 + Pitfall 2, public/index.html lines 1-85]

---

### `netlify.toml` (deploy-config) — MODIFY (additive)

**Analog:** `netlify.toml` itself (existing 11 lines)

**Existing content (`netlify.toml` lines 1-11) — UNCHANGED:**
```toml
[build]
  command = "pnpm build"
  publish = "build"

[build.environment]
  NODE_VERSION = "20"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

**Append (new section, RESEARCH.md Pattern 5 / Step 5):**
```toml

# SPA fallback for React Router. Processes after public/_redirects, so the
# /materials → /styles#materials 301 in _redirects continues to win for that
# specific path; everything else gets the index.html rewrite.
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Indentation note:** The existing `netlify.toml` uses 2-space indentation under TOML headers (see lines 2-3, 6, 9-10). The new `[[redirects]]` block must follow the same 2-space convention.

**Critical:** `command = "pnpm build"` and `publish = "build"` STAY UNCHANGED. The `vite.config.js` `build.outDir: 'build'` override exists specifically to keep these lines stable.

[CITED: RESEARCH.md Pattern 5 + Pitfall 3, netlify.toml lines 1-11]

---

### `package.json` (manifest) — MODIFY (scripts + deps)

**Analog:** `package.json` itself (existing 64 lines)

**Existing scripts block (`package.json` lines 29-36):**
```json
"scripts": {
  "start": "react-scripts start --openssl-legacy-provider",
  "build": "react-scripts build --openssl-legacy-provider",
  "postbuild": "node scripts/generate-sitemap.cjs",
  "test": "react-scripts test",
  "eject": "react-scripts eject",
  "build:css": "postcss src/css/tailwind.css -o src/css/main.css"
}
```

**Replacement scripts block (RESEARCH.md Step 2):**
```json
"scripts": {
  "dev": "vite",
  "start": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "postbuild": "node scripts/generate-sitemap.cjs",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Notes per RESEARCH.md:
- `start` is preserved as alias for `vite` to keep muscle memory + external doc references working
- `dev` is the canonical Vite convention
- `eject` removed — Vite has nothing to eject from
- `build:css` removed — PostCSS runs natively in Vite
- `--openssl-legacy-provider` flag removed everywhere (Pitfall 7)
- `postbuild` UNCHANGED — sitemap generator still runs after build, still writes to `build/`

**Existing dependencies (`package.json` lines 9-28) — REMOVALS:**
- Line 16: `"postcss-cli": "^10.1.0"` — REMOVE
- Line 24: `"react-scripts": "5.0.1"` — REMOVE

**Existing devDependencies (`package.json` lines 55-62) — REMOVALS:**
- Line 56: `"@babel/plugin-proposal-private-property-in-object": "^7.21.11"` — REMOVE (CRA 5 peer-dep workaround, no longer needed)

**Existing devDependencies — ADDITIONS (RESEARCH.md Step 3):**
```json
"vite": "^7.3.3",
"@vitejs/plugin-react": "^5.0.0",
"vitest": "^4.1.5",
"jsdom": "^25.0.0"
```

**JSON formatting convention:** `package.json` uses 2-space indentation (see line 5: `  "engines": {`). Match this exactly when editing.

[CITED: RESEARCH.md Step 2 + Step 3, package.json lines 29-36 + 55-62]

---

### `src/App.js` (app-root, runtime) — MODIFY

**Analog:** `src/App.js` itself (existing 96 lines)

**Existing code at line 35 (the only runtime env var reference in the codebase):**
```javascript
const reCaptchaKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
```

**Replacement:**
```javascript
const reCaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
```

**Existing comment block at lines 28-34** (must update wording — the runtime semantics are identical but the build-tool name is wrong):
```javascript
// reCAPTCHA v3 site key — public, browser-safe; injected at build time by
// `react-scripts build` from the REACT_APP_RECAPTCHA_SITE_KEY env var (CRA
// contract). When unset (e.g. local dev without env vars), the provider
// mounts but the reCAPTCHA script never loads — `executeRecaptcha` stays
// undefined and QuoteSubmitForm surfaces a "spam protection isn't loaded
// yet" inline message instead of throwing. This keeps the build green even
// when owner-prep (Plan 03-03 Task 1) hasn't been completed yet.
```

**Replacement comment block** (per RESEARCH.md Pattern 3 #2 + #4):
```javascript
// reCAPTCHA v3 site key — public, browser-safe; injected at build time by
// Vite from the VITE_RECAPTCHA_SITE_KEY env var. When unset (e.g. local
// dev without env vars), the provider mounts but the reCAPTCHA script
// never loads — `executeRecaptcha` stays undefined and QuoteSubmitForm
// surfaces a "spam protection isn't loaded yet" inline message instead of
// throwing. This keeps the build green even when owner-prep (Plan 03-03
// Task 1) hasn't been completed yet.
```

**Indentation/formatting:** This file uses tabs (see `src/App.js` lines 27-95 — `function App() {` body is tab-indented). Preserve tabs in the edit.

**Verification:** After edit, run `grep -rn "process.env" src/` — should return zero hits. Run `grep -rn "REACT_APP" src/` — should return zero hits.

[CITED: RESEARCH.md Pattern 3, src/App.js lines 28-35]

---

### `src/components/quote/QuoteSubmitForm.jsx` (component) — MODIFY (comment-only)

**Analog:** itself (existing comment at line 15)

**Existing comment (lines 14-18):**
```javascript
//   - Token minted client-side via `useGoogleReCaptcha`'s `executeRecaptcha`.
//   - Action namespaced as `submit_quote` so the Google admin UI shows the
//     score distribution per action.
//   - When REACT_APP_RECAPTCHA_SITE_KEY is unset (e.g. local dev without env
//     vars), the provider mounts but the script never loads, so
```

**Replacement (only the env var name on line 15 changes):**
```javascript
//   - When VITE_RECAPTCHA_SITE_KEY is unset (e.g. local dev without env
```

This is a doc-only edit; no runtime behavior changes. Required to prevent comment drift after the `App.js` env var rename.

[CITED: RESEARCH.md Pattern 3 #3, src/components/quote/QuoteSubmitForm.jsx line 15]

---

### `src/App.test.js` (test, jsdom) — MODIFY (Jest → Vitest)

**Analog:** itself (the cleanest example of the Jest→Vitest mechanical migration)

**Existing imports (line 1):**
```javascript
import { render, screen } from '@testing-library/react';
import App from './App';
```

**Replacement (per RESEARCH.md Step 6):**
```javascript
import { render, screen } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import App from './App';
```

If `vite.config.js#test.globals: true` is set (recommended config does), `test` and `expect` don't need the explicit `vitest` import — only `vi` does. Either pattern is acceptable; the explicit-import version is safer if `globals` is later toggled off.

**Existing mock (lines 4-9):**
```javascript
jest.mock('./utilities/sanityClient', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() => Promise.resolve([])),
  },
}));
```

**Replacement (mechanical `jest` → `vi` rename):**
```javascript
vi.mock('./utilities/sanityClient', () => ({
  __esModule: true,
  default: {
    fetch: vi.fn(() => Promise.resolve([])),
  },
}));
```

**Existing mock to REMOVE entirely (lines 11-28)** — the `jest.mock('./utilities/sanityImage', ...)` workaround:
```javascript
// `@sanity/image-url` ships as ESM — Jest 27 (CRA 5) without `transformIgnorePatterns`
// can't parse it. Mock the wrapper module so the smoke test (whose purpose is to verify
// routing + nav, not image rendering) doesn't pull the ESM dep through the require chain.
// ...
jest.mock('./utilities/sanityImage', () => ({
  __esModule: true,
  urlFor: () => ({ ... }),
  urlAt: () => 'mock://image',
}));
```

Per RESEARCH.md Pitfall 8: this entire block can be removed — Vitest uses Vite's resolver which parses `@sanity/image-url`'s ESM natively. **Removal protocol:** remove the block, run `pnpm test`, confirm green. If the test fails, restore the block.

[CITED: RESEARCH.md Step 6 + Pitfall 8, src/App.test.js lines 1-39]

---

### Other test files (7) — MODIFY (Jest → Vitest)

**Files:**
- `src/hooks/useLocalStorageState.test.jsx`
- `src/utilities/quote/volumeAndBbox.test.js`
- `src/utilities/quote/calculatePrice.test.js`
- `src/utilities/quote/parseSvg.test.js`
- `src/utilities/quote/formatQuoteText.test.js`
- `src/utilities/quote/formatErrors.test.js`
- `src/components/quote/QuoteSubmitForm.test.jsx`

**Pattern (apply uniformly to each — RESEARCH.md Pattern 6):**

For each test file, do a mechanical find/replace:
- `jest.fn(` → `vi.fn(`
- `jest.mock(` → `vi.mock(`
- `jest.spyOn(` → `vi.spyOn(`
- `jest.resetModules(` → `vi.resetModules(`
- `jest.restoreAllMocks(` → `vi.restoreAllMocks(`
- Add `import { vi } from 'vitest';` at top of any file that ends up using `vi`

**Concrete example from `useLocalStorageState.test.jsx` lines 18-26:**
```javascript
beforeEach(() => {
	window.localStorage.clear();
	jest.restoreAllMocks();
});
afterEach(() => {
	window.localStorage.clear();
	jest.restoreAllMocks();
});
```
→
```javascript
beforeEach(() => {
	window.localStorage.clear();
	vi.restoreAllMocks();
});
afterEach(() => {
	window.localStorage.clear();
	vi.restoreAllMocks();
});
```

**Concrete example from `QuoteSubmitForm.test.jsx` lines 16-21** (mock-factory hoisting nuance):
```javascript
const mockExecuteRecaptcha = jest.fn(() => Promise.resolve('FAKE_TOKEN_VALUE'));
const mockUseGoogleReCaptchaState = { executeRecaptcha: mockExecuteRecaptcha };
jest.mock('react-google-recaptcha-v3', () => ({
	useGoogleReCaptcha: () => mockUseGoogleReCaptchaState,
	GoogleReCaptchaProvider: ({ children }) => children,
}));
```
→
```javascript
const mockExecuteRecaptcha = vi.fn(() => Promise.resolve('FAKE_TOKEN_VALUE'));
const mockUseGoogleReCaptchaState = { executeRecaptcha: mockExecuteRecaptcha };
vi.mock('react-google-recaptcha-v3', () => ({
	useGoogleReCaptcha: () => mockUseGoogleReCaptchaState,
	GoogleReCaptchaProvider: ({ children }) => children,
}));
```

The `mock` prefix on local consts (line 16-17 of the original) — Jest required this for hoist-safety. Vitest has the same hoisting semantics for `vi.mock()`, so the prefix convention should remain.

**Indentation:** All test files use tabs (verified — see `useLocalStorageState.test.jsx` lines 19-25). Preserve tabs.

[CITED: RESEARCH.md Pattern 6, all 8 test file paths verified via `find src -name "*.test.*"`]

---

### Files to DELETE

| File | Reason | Source |
|------|--------|--------|
| `public/index.html` | Moved to root via `git mv` | RESEARCH.md Pattern 2 |
| `src/css/main.css` | Orphan generated PostCSS output — nothing imports it | RESEARCH.md Pattern 4 + Runtime State Inventory |

---

## Shared Patterns

### Indentation conventions (must preserve)

| File | Indentation | Verified at |
|------|-------------|-------------|
| `tailwind.config.js`, `postcss.config.js`, root configs | tabs | tailwind.config.js lines 25-61 |
| `package.json` | 2 spaces | package.json line 5 |
| `netlify.toml` | 2 spaces under headers | netlify.toml lines 2-3, 9-10 |
| `src/App.js` (and most src/) | tabs | src/App.js lines 27-95 |
| All test files | tabs | useLocalStorageState.test.jsx lines 19-25 |
| `index.html` (after move) | 2 spaces | public/index.html (existing) |

**Pattern: match the existing file's indentation when editing — do not introduce mixed indentation.**

### Module style at repo root

- **CommonJS** (`require` / `module.exports`): `tailwind.config.js`, `postcss.config.js`, `scripts/generate-sitemap.cjs` (note `.cjs` extension)
- **ESM** (`import` / `export default`): `vite.config.js` (NEW — first ESM root config; required by Vite)

The new `vite.config.js` deliberately diverges from the existing CJS-at-root pattern because Vite 7 expects ESM.

### Test mocking convention (Jest API → Vitest API)

The codebase already uses Jest's mocking API consistently. Vitest exposes the same API surface via the `vi` namespace. The migration is mechanical:

```
jest.fn        → vi.fn
jest.mock      → vi.mock
jest.spyOn     → vi.spyOn
jest.resetModules     → vi.resetModules
jest.restoreAllMocks  → vi.restoreAllMocks
```

`describe`/`test`/`expect`/`beforeEach`/`afterEach` work unchanged when `vite.config.js#test.globals: true` is set.

### Mock-prefix hoist convention (preserve)

Existing code (e.g., `QuoteSubmitForm.test.jsx` line 16):
```javascript
const mockExecuteRecaptcha = jest.fn(...);
```
The `mock`-prefix on local consts is required by Jest's mock-factory hoisting. Vitest's `vi.mock()` has identical hoisting semantics, so **keep the `mock`-prefix convention** when migrating.

### `setupTests.js` reuse

**Source:** `src/setupTests.js` (existing 5 lines):
```javascript
import '@testing-library/jest-dom';
```

**Apply to:** `vite.config.js#test.setupFiles` (point at the same file). No code change needed in `setupTests.js` — `@testing-library/jest-dom` works under Vitest unchanged.

[CITED: RESEARCH.md Pattern 1, src/setupTests.js lines 1-5]

### Postbuild sitemap script (no change required)

**Source:** `scripts/generate-sitemap.cjs` lines 59-65 — hardcodes `path.join(__dirname, '..', 'build', 'sitemap.xml')`.

**Apply to:** `vite.config.js#build.outDir` MUST be `'build'` (not the Vite default `'dist'`). This keeps the postbuild script working without modification.

If outDir were `'dist'` instead, the script would write to `build/sitemap.xml` while Netlify publishes `dist/` — the sitemap would be invisible. RESEARCH.md Pitfall 3 documents this.

[CITED: RESEARCH.md Pitfall 3, scripts/generate-sitemap.cjs lines 59-65]

### Verbatim-preservation contract for Netlify forms

**Source:** `public/index.html` lines 49-72 (the two `<form netlify ...>` blocks)

**Apply to:** `index.html` (root, after move) — these blocks MUST remain byte-identical. Netlify's deploy-time prerender scan registers form fields by parsing this HTML. Any drift = silent submission drop (D-28 contract).

[CITED: RESEARCH.md Pitfall 2, public/index.html lines 49-72]

### `--openssl-legacy-provider` removal

**Source:** `package.json` lines 30-31 (the `start` and `build` scripts)

**Apply to:** any script that includes `--openssl-legacy-provider` — the flag was a CRA 5 / webpack 4 workaround for Node 17+. Vite uses esbuild + Rollup which need no such flag. Node 22+ has removed the flag; leaving it in causes `unknown option` errors.

**Verification:** After migration, `grep -rn "openssl-legacy-provider"` should return zero hits.

[CITED: RESEARCH.md Pitfall 7, package.json lines 30-31]

---

## No Analog Found

These files are entirely new build-tool config with no useful in-repo analog. Use RESEARCH.md verbatim:

| File | Role | Why no analog | Source to use |
|------|------|---------------|---------------|
| `vite.config.js` | build-config | First Vite config in repo; first ESM root config | RESEARCH.md `### Step 1: Final vite.config.js` (lines 425-454) |

For all other "modified" files, the analog IS the existing file — the work is mechanical replacement, not pattern application.

---

## Metadata

**Analog search scope:** repo root, `src/`, `scripts/`, `public/`, `netlify/`
**Files scanned:** 13 explicit + grep-verified env-var references (`grep -rn "process.env" src/` — 1 hit; `grep -rn "REACT_APP" src/` — 3 hits; `find src -name "*.test.*"` — 8 hits)
**Pattern extraction date:** 2026-05-08
**Authoritative source:** RESEARCH.md (`.planning/phases/04-vite-migration/04-RESEARCH.md`) — every "what to write" decision flows from RESEARCH.md; this PATTERNS.md provides the "where to write it" + "what existing code to preserve byte-identical" overlay.
