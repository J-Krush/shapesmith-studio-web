# Technology Stack

**Analysis Date:** 2026-05-02

## Languages

**Primary:**
- JavaScript (ES2015+ / JSX) — All application source under `src/` is `.js` / `.jsx`. No TypeScript anywhere in the repo (no `tsconfig.json`, no `.ts` / `.tsx` files outside `node_modules`).

**Secondary:**
- HTML5 — Single-page shell at `public/index.html` (Create React App template, plus a hidden `name="contact-form"` Netlify form prerender).
- CSS3 + Tailwind utility CSS — Source at `src/css/tailwind.css`, compiled output at `src/css/main.css` and `src/css/App.css`, plus `src/index.css`.

## Runtime

**Environment:**
- Browser only — This is a Create React App (CRA) Single Page Application; there is no Node server in the repo.
- Node.js used for build/dev tooling. Build script uses `--openssl-legacy-provider` (`package.json:23-24`), indicating compatibility with Node 17+ where the legacy OpenSSL provider is required for CRA 5 / webpack 4-era crypto.

**Package Manager:**
- pnpm — Lockfile present at `pnpm-lock.yaml` (`lockfileVersion: '9.0'`), implying pnpm 8+.
- A `yarn.lock` was deleted from the repo (see `git status`: `D yarn.lock`); pnpm is the current manager.
- npm scripts work too because nothing pnpm-specific is required in `package.json` (`package.json:22-28`).

## Frameworks

**Core:**
- React `^18.2.0` (resolved `18.3.1`) — UI framework. Bootstrapped via `ReactDOM.createRoot` in `src/index.js` and wrapped in `<React.StrictMode>`.
- React Router DOM `^6.12.0` (resolved `6.30.3`) — Client-side routing. Used in `src/App.js` with `BrowserRouter`, `Routes`, `Route`, and `useParams` (`src/context/SingleProjectContext.jsx:2`).
- Create React App / `react-scripts` `5.0.1` — Build, dev server, test runner, and Jest/ESLint config wrapper. All build tooling is hidden behind it; the project has not been ejected.

**Testing:**
- Jest — Provided transitively by `react-scripts` (no direct dependency, no `jest.config.*`).
- `@testing-library/react` `^13.4.0` (resolved `13.4.0`) — Component testing. Used by `src/App.test.js`.
- `@testing-library/jest-dom` `^5.16.5` (resolved `5.17.0`) — Custom DOM matchers. Imported globally in `src/setupTests.js`.
- `@testing-library/user-event` `^13.5.0` — User interaction simulation (declared but not yet used in any test).
- `@testing-library/dom` `^9.3.0` (devDependency) — Underlying queries.
- Only one test file exists: `src/App.test.js` (a CRA boilerplate test that searches for "learn react" text — note: it will fail against the current `App.js` because that string is no longer rendered).

**Build/Dev:**
- webpack — Bundled via `react-scripts` (not directly configured).
- Babel — Bundled via `react-scripts`. `@babel/plugin-proposal-private-property-in-object` `^7.21.11` is pinned as a devDependency (`package.json:48`) to silence the well-known CRA 5 peer-dep warning.
- Tailwind CSS `^3.1.8` (resolved `3.4.19`) — Utility CSS. Configured at `tailwind.config.js` with custom color palette (`primary-dark: #291c30`, `accent: #348bd8`, etc.), `darkMode: 'class'`, container padding overrides, and the `@tailwindcss/forms` plugin.
- PostCSS `^8.4.16` (resolved `8.5.13`) — Tailwind/autoprefixer pipeline, configured at `postcss.config.js`.
- `postcss-cli` `^10.1.0` — Used by the `build:css` npm script: `postcss src/css/tailwind.css -o src/css/main.css` (`package.json:27`).
- Autoprefixer `^10.4.10` — Vendor prefixing (devDependency).
- `@tailwindcss/forms` `^0.5.3` — Form-element styling plugin (devDependency, registered in `tailwind.config.js:63`).

## Key Dependencies

**Critical:**
- `@sanity/client` `^6.1.7` (resolved `6.29.1`) — CMS data fetching client. Single client instance in `src/utilities/sanityClient.jsx` (note: hard-coded `projectId: "qx9kep1e"`, `dataset: "production"`, `apiVersion: '2023-06-16'`, `useCdn: true`). Used by every data-driven page/component.
- `framer-motion` `^10.12.16` (resolved `10.18.0`) — Animations. Used in `src/App.js` (top-level `AnimatePresence`), and `motion.*` wrappers in `src/pages/Contact.jsx`, `src/pages/AboutMe.jsx`, `src/pages/ProjectSingle.jsx`, `src/components/shared/AppHeader.jsx`, `src/components/HireMeModal.jsx`.
- `react-router-dom` `^6.12.0` — See Frameworks.
- `react-icons` `^4.9.0` (resolved `4.12.0`) — Icon set (Feather subset `react-icons/fi` only). Used in `src/components/reusable/SocialLinks.jsx`, `src/components/contact/ContactDetails.jsx`, `src/components/shared/AppHeader.jsx`, `src/components/HireMeModal.jsx`.

**Infrastructure:**
- `styled-components` `^6.0.0-rc.3` (resolved `6.4.1`) — Declared but no `import` of `styled-components` is currently present anywhere under `src/`. Effectively unused at runtime; styling is done with Tailwind classes.
- `react-countup` `^6.4.2` (resolved `6.5.3`) — Animated counters; used by `src/components/about/CounterItem.jsx` / `AboutCounter.jsx` (per directory listing).
- `react-scroll` `^1.8.9` (resolved `1.9.3`) — Smooth-scroll links (declared; usage limited).
- `web-vitals` `^2.1.4` — Performance metrics. Wired up in `src/reportWebVitals.js` but invoked with no callback in `src/index.js:17` (so it currently does nothing).

## Configuration

**Environment:**
- Configuration is not externalized — `.env` files are git-ignored (`.gitignore:19-22, 28`) and no committed `.env.example` exists.
- Only env var referenced in source: `process.env.REACT_APP_ENV` (`src/utilities/helpers.jsx:3`). Note: `isProd()` always returns `true` regardless of the value (both branches return `true`), so the env var is effectively dead code.
- Sanity credentials are NOT env-driven — `projectId`, `dataset`, and `apiVersion` are hard-coded in `src/utilities/sanityClient.jsx`. No auth token is used (anonymous read access via `useCdn: true`).

**Build:**
- `tailwind.config.js` — Tailwind v3 config (CommonJS), `content: ['./src/**/*.{js,jsx,ts,tsx}']`, `darkMode: 'class'`, custom palette, `@tailwindcss/forms` plugin.
- `postcss.config.js` — PostCSS config (CommonJS), loads Tailwind from explicit path and Autoprefixer.
- `package.json` `eslintConfig` — Extends `react-app` and `react-app/jest` (CRA defaults). No standalone `.eslintrc*`.
- `package.json` `browserslist` — Standard CRA targets (`>0.2%, not dead, not op_mini all` for prod).
- No Prettier config, no Husky, no lint-staged, no commit hooks.

## Platform Requirements

**Development:**
- Node.js 16+ recommended (CRA 5 supports 14+, but `--openssl-legacy-provider` flag is only needed/valid on Node 17+).
- pnpm 8+ (matches `lockfileVersion: '9.0'`).
- Run `pnpm install`, then `pnpm start` (alias for `react-scripts start --openssl-legacy-provider`) for the dev server on `http://localhost:3000`.
- `pnpm build` produces a static bundle under `build/` (git-ignored).
- `pnpm build:css` regenerates `src/css/main.css` from `src/css/tailwind.css`.

**Production:**
- Static SPA — Output is a static `build/` directory ready for any static host.
- Deployment target: Netlify (inferred). `public/index.html:34-45` declares a hidden form with `netlify` and `netlify-honeypot="bot-field"` attributes for Netlify Forms prerender detection. Domain `shapesmith.studio` is the production form action target (`src/components/contact/ContactForm.jsx:29`).
- No serverless functions, no SSR, no `netlify.toml`/`vercel.json` checked in — Netlify config is presumably set in the dashboard.

---

*Stack analysis: 2026-05-02*
