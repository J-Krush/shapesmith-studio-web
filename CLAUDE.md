<!-- GSD:project-start source:PROJECT.md -->
## Project

**Shapesmith Studio**

The web presence for Shapesmith Studio — a one-person creative studio offering laser cutting and (newly) 3D printing services to local hobbyists and small businesses. The site shows what the studio can make, lets people see materials and example styles, and routes them into a contact/quote flow. It's a marketing surface and lead-generation tool — not a transactional storefront yet.

**Core Value:** The site has to look legit enough that the owner feels comfortable marketing it again — visual confidence first, features second.

### Constraints

- **Tech stack**: Stay on Create React App + React 18 + JavaScript — no TS, no Next.js. Why: scope discipline; migration cost > value for a marketing site. The build flag `--openssl-legacy-provider` (Node 17+) is the implicit Node-version pin.
- **CMS**: All structured content goes through Sanity, anonymous CDN reads only. Why: established pattern, owner has studio access, no backend to operate.
- **Hosting**: Netlify (static SPA + Netlify Forms). Why: existing deployment, free tier sufficient, no serverless/SSR appetite right now.
- **Lead capture**: Reuse the existing Netlify contact form for the spruce bundle. Why: a richer dedicated quote feature is its own bundle (#2), so spruce should ship without blocking on it.
- **Visual identity**: Targeted spruce only, not a full redesign — same dark theme, same fonts, same overall identity, with hero + nav refresh. Why: core value is "looks legit, ship fast"; a full redesign delays launch.
- **Timeline**: Bundle 1 (spruce + 3D printing) wants to ship ASAP. Bundles 2 and 3 follow when Bundle 1 is live.
- **Photography**: No 3D-print photos exist yet — UI must degrade gracefully to placeholder blocks where Sanity returns no images.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (ES2015+ / JSX) — All application source under `src/` is `.js` / `.jsx`. No TypeScript anywhere in the repo (no `tsconfig.json`, no `.ts` / `.tsx` files outside `node_modules`).
- HTML5 — Single-page shell at `public/index.html` (Create React App template, plus a hidden `name="contact-form"` Netlify form prerender).
- CSS3 + Tailwind utility CSS — Source at `src/css/tailwind.css`, compiled output at `src/css/main.css` and `src/css/App.css`, plus `src/index.css`.
## Runtime
- Browser only — This is a Create React App (CRA) Single Page Application; there is no Node server in the repo.
- Node.js used for build/dev tooling. Build script uses `--openssl-legacy-provider` (`package.json:23-24`), indicating compatibility with Node 17+ where the legacy OpenSSL provider is required for CRA 5 / webpack 4-era crypto.
- pnpm — Lockfile present at `pnpm-lock.yaml` (`lockfileVersion: '9.0'`), implying pnpm 8+.
- A `yarn.lock` was deleted from the repo (see `git status`: `D yarn.lock`); pnpm is the current manager.
- npm scripts work too because nothing pnpm-specific is required in `package.json` (`package.json:22-28`).
## Frameworks
- React `^18.2.0` (resolved `18.3.1`) — UI framework. Bootstrapped via `ReactDOM.createRoot` in `src/index.js` and wrapped in `<React.StrictMode>`.
- React Router DOM `^6.12.0` (resolved `6.30.3`) — Client-side routing. Used in `src/App.js` with `BrowserRouter`, `Routes`, `Route`, and `useParams` (`src/context/SingleProjectContext.jsx:2`).
- Create React App / `react-scripts` `5.0.1` — Build, dev server, test runner, and Jest/ESLint config wrapper. All build tooling is hidden behind it; the project has not been ejected.
- Jest — Provided transitively by `react-scripts` (no direct dependency, no `jest.config.*`).
- `@testing-library/react` `^13.4.0` (resolved `13.4.0`) — Component testing. Used by `src/App.test.js`.
- `@testing-library/jest-dom` `^5.16.5` (resolved `5.17.0`) — Custom DOM matchers. Imported globally in `src/setupTests.js`.
- `@testing-library/user-event` `^13.5.0` — User interaction simulation (declared but not yet used in any test).
- `@testing-library/dom` `^9.3.0` (devDependency) — Underlying queries.
- Only one test file exists: `src/App.test.js` (a CRA boilerplate test that searches for "learn react" text — note: it will fail against the current `App.js` because that string is no longer rendered).
- webpack — Bundled via `react-scripts` (not directly configured).
- Babel — Bundled via `react-scripts`. `@babel/plugin-proposal-private-property-in-object` `^7.21.11` is pinned as a devDependency (`package.json:48`) to silence the well-known CRA 5 peer-dep warning.
- Tailwind CSS `^3.1.8` (resolved `3.4.19`) — Utility CSS. Configured at `tailwind.config.js` with custom color palette (`primary-dark: #291c30`, `accent: #348bd8`, etc.), `darkMode: 'class'`, container padding overrides, and the `@tailwindcss/forms` plugin.
- PostCSS `^8.4.16` (resolved `8.5.13`) — Tailwind/autoprefixer pipeline, configured at `postcss.config.js`.
- `postcss-cli` `^10.1.0` — Used by the `build:css` npm script: `postcss src/css/tailwind.css -o src/css/main.css` (`package.json:27`).
- Autoprefixer `^10.4.10` — Vendor prefixing (devDependency).
- `@tailwindcss/forms` `^0.5.3` — Form-element styling plugin (devDependency, registered in `tailwind.config.js:63`).
## Key Dependencies
- `@sanity/client` `^6.1.7` (resolved `6.29.1`) — CMS data fetching client. Single client instance in `src/utilities/sanityClient.jsx` (note: hard-coded `projectId: "qx9kep1e"`, `dataset: "production"`, `apiVersion: '2023-06-16'`, `useCdn: true`). Used by every data-driven page/component.
- `framer-motion` `^10.12.16` (resolved `10.18.0`) — Animations. Used in `src/App.js` (top-level `AnimatePresence`), and `motion.*` wrappers in `src/pages/Contact.jsx`, `src/pages/AboutMe.jsx`, `src/pages/ProjectSingle.jsx`, `src/components/shared/AppHeader.jsx`, `src/components/HireMeModal.jsx`.
- `react-router-dom` `^6.12.0` — See Frameworks.
- `react-icons` `^4.9.0` (resolved `4.12.0`) — Icon set (Feather subset `react-icons/fi` only). Used in `src/components/reusable/SocialLinks.jsx`, `src/components/contact/ContactDetails.jsx`, `src/components/shared/AppHeader.jsx`, `src/components/HireMeModal.jsx`.
- `styled-components` `^6.0.0-rc.3` (resolved `6.4.1`) — Declared but no `import` of `styled-components` is currently present anywhere under `src/`. Effectively unused at runtime; styling is done with Tailwind classes.
- `react-countup` `^6.4.2` (resolved `6.5.3`) — Animated counters; used by `src/components/about/CounterItem.jsx` / `AboutCounter.jsx` (per directory listing).
- `react-scroll` `^1.8.9` (resolved `1.9.3`) — Smooth-scroll links (declared; usage limited).
- `web-vitals` `^2.1.4` — Performance metrics. Wired up in `src/reportWebVitals.js` but invoked with no callback in `src/index.js:17` (so it currently does nothing).
## Configuration
- Configuration is not externalized — `.env` files are git-ignored (`.gitignore:19-22, 28`) and no committed `.env.example` exists.
- Only env var referenced in source: `process.env.REACT_APP_ENV` (`src/utilities/helpers.jsx:3`). Note: `isProd()` always returns `true` regardless of the value (both branches return `true`), so the env var is effectively dead code.
- Sanity credentials are NOT env-driven — `projectId`, `dataset`, and `apiVersion` are hard-coded in `src/utilities/sanityClient.jsx`. No auth token is used (anonymous read access via `useCdn: true`).
- `tailwind.config.js` — Tailwind v3 config (CommonJS), `content: ['./src/**/*.{js,jsx,ts,tsx}']`, `darkMode: 'class'`, custom palette, `@tailwindcss/forms` plugin.
- `postcss.config.js` — PostCSS config (CommonJS), loads Tailwind from explicit path and Autoprefixer.
- `package.json` `eslintConfig` — Extends `react-app` and `react-app/jest` (CRA defaults). No standalone `.eslintrc*`.
- `package.json` `browserslist` — Standard CRA targets (`>0.2%, not dead, not op_mini all` for prod).
- No Prettier config, no Husky, no lint-staged, no commit hooks.
## Platform Requirements
- Node.js 16+ recommended (CRA 5 supports 14+, but `--openssl-legacy-provider` flag is only needed/valid on Node 17+).
- pnpm 8+ (matches `lockfileVersion: '9.0'`).
- Run `pnpm install`, then `pnpm start` (alias for `react-scripts start --openssl-legacy-provider`) for the dev server on `http://localhost:3000`.
- `pnpm build` produces a static bundle under `build/` (git-ignored).
- `pnpm build:css` regenerates `src/css/main.css` from `src/css/tailwind.css`.
- Static SPA — Output is a static `build/` directory ready for any static host.
- Deployment target: Netlify (inferred). `public/index.html:34-45` declares a hidden form with `netlify` and `netlify-honeypot="bot-field"` attributes for Netlify Forms prerender detection. Domain `shapesmith.studio` is the production form action target (`src/components/contact/ContactForm.jsx:29`).
- No serverless functions, no SSR, no `netlify.toml`/`vercel.json` checked in — Netlify config is presumably set in the dashboard.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Language & Type System
- `.jsx` — All React components (in `src/components/`, `src/pages/`, `src/context/`, `src/hooks/`, `src/utilities/`, `src/materials/`)
- `.js` — Non-component JS modules (e.g., `src/data/projects.js`, `src/data/aboutMeData.js`, `src/reportWebVitals.js`, `src/setupTests.js`, `src/index.js`, `src/App.js`)
- A few `.js` files contain JSX (e.g., `src/App.js`, `src/components/contact/contact-form.js`) — extension is inconsistent.
## File Naming Patterns
- `src/components/projects/ProjectsGrid.jsx`
- `src/components/shared/AppHeader.jsx`
- `src/components/reusable/FormInput.jsx`
- `src/pages/Home.jsx`
- `src/pages/ProjectSingle.jsx`
- `src/hooks/useScrollToTop.jsx`
- `src/hooks/useThemeSwitcher.jsx`
- `src/context/ProjectsContext.jsx`
- `src/context/SingleProjectContext.jsx`
- `src/context/AboutMeContext.jsx`
- `src/data/projects.js`, `src/data/aboutMeData.js`, `src/data/images.js`
## Directory Structure
## Component Patterns
## Hooks Usage
- `useState` and `useEffect` are the workhorses. `useContext` is used in every page that consumes Sanity data.
- Effects fetch from Sanity directly inside the component or context provider — no abstraction layer (see `src/context/ProjectsContext.jsx`, `src/components/home/OurProcess.jsx`, `src/pages/Materials.jsx`, etc.).
- Custom hooks live in `src/hooks/`. `useScrollToTop` returns JSX (a button); `useThemeSwitcher` returns a `[value, setter]` tuple. Naming + return shape are inconsistent.
- `useScrollToTop` registers the same scroll listener twice — once inside `useEffect` (with cleanup) and once at module render time without cleanup. This is a bug, not a convention to follow.
## Context Patterns
## Styling Conventions
- Colors: `primary-light`, `secondary-light`, `ternary-light` (note typo: "ternary" instead of "tertiary" — used consistently throughout the codebase, must be preserved), `primary-dark`, `secondary-dark`, `ternary-dark`, `secondary-section-light/dark`, `ternary-section-dark`, `accent`, `accent-highlight`.
- Always pair light/dark variants: `text-primary-dark dark:text-primary-light`, `bg-secondary-light dark:bg-ternary-dark`.
- `font-general-regular`, `font-general-medium`, `font-display`, `font-general-variable`, `font-general-variable-italic`, `font-general-extralight`.
## Import Organization
## Error Handling
## Logging
## Comments & Dead Code
## Function Design
- Components are typically 30–200 lines; the contact form (`src/components/contact/ContactForm.jsx`, 167 lines) is the largest.
- Helpers are small pure functions (`src/utilities/helpers.jsx`).
- No utility module re-exports; consumers import functions directly.
## Linting & Formatting
- ESLint config: `package.json#eslintConfig` extends `react-app` and `react-app/jest` (CRA defaults). No custom rules.
- No Prettier config (`.prettierrc*` absent). No EditorConfig. No Husky / lint-staged.
- No CI workflow (`.github/workflows` does not exist).
- The CRA scripts `start` and `build` pass `--openssl-legacy-provider`, indicating Node 17+ workaround for legacy webpack/CRA.
## Module Design
- Components: one `default` export per file; the file name matches the component name.
- Data modules: named exports only (`export const capabilitiesTitle = 'styles'`).
- Context modules: provider as named export; context object as either named or default (see Context Patterns above).
## Routing
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
```
## Component Responsibilities
| Component | Responsibility | File |
|-----------|----------------|------|
| Browser bootstrap | Mount React tree into `#root` with StrictMode | `src/index.js` |
| App root | Force dark theme, mount Router, define routes, render shared chrome | `src/App.js` |
| Routing | Define five public routes, lazy-load page components, wrap in `Suspense` | `src/App.js` |
| Page shell | Compose feature components into a route-level layout | `src/pages/Home.jsx`, `src/pages/Projects.jsx`, `src/pages/ProjectSingle.jsx`, `src/pages/AboutMe.jsx`, `src/pages/Contact.jsx`, `src/pages/Materials.jsx` |
| Sanity client | Single configured CMS client used by every fetch site | `src/utilities/sanityClient.jsx` |
| Projects context | Fetch `laser-style` documents and expose to subtree | `src/context/ProjectsContext.jsx` |
| Single project context | Resolve a single style by `:capability` slug from `ProjectsContext` | `src/context/SingleProjectContext.jsx` |
| About context | Fetch `profile` document and expose to subtree | `src/context/AboutMeContext.jsx` |
| Header / footer | Persistent navigation and copyright | `src/components/shared/AppHeader.jsx`, `src/components/shared/AppFooter.jsx`, `src/components/shared/AppFooterCopyright.jsx` |
| Auto-scroll on route change | Reset scroll on `useLocation` change | `src/components/ScrollToTop.jsx` |
| User-triggered scroll-to-top | Floating chevron button after 400px scroll | `src/hooks/useScrollToTop.jsx` |
| Contact form | Netlify-style POST with honeypot field | `src/components/contact/ContactForm.jsx` |
## Pattern Overview
- Single bundle SPA — no SSR, no Next.js, no API routes; CRA serves a static build.
- Routing is declarative in `src/App.js` using `react-router-dom` v6 `<Routes>` / `<Route>`.
- Page components are lazy-loaded via `React.lazy` + `Suspense` (fallback is empty string).
- Sanity is the canonical content source — fetched at runtime from the browser using `useEffect`.
- Two parallel data-loading idioms coexist: (a) Context providers (`ProjectsContext`, `AboutMeContext`, `SingleProjectContext`) and (b) inline `useEffect` + `useState` inside leaf components (`Materials.jsx`, `OurProcess.jsx`, `Collaborations.jsx`, home `QuickSpecs.jsx`).
- Static fallback data still lives in `src/data/*` (`projects.js`, `materials.js`, `aboutMeData.js`) but is no longer wired into rendering paths — only `capabilitiesTitle` from `src/data/projects.js` is used (as a routing constant).
- Styling is Tailwind (with PostCSS) + a few `styled-components` left as dependencies but unused.
- Theme is hard-locked to dark via `App.js` (`root.classList.add('dark')`); the `useThemeSwitcher` hook exists but is commented out at every call site.
## Layers
- Purpose: Boot React onto the DOM
- Location: `src/index.js`
- Contains: `ReactDOM.createRoot`, `<App />` mount, `reportWebVitals()` call
- Depends on: `src/App.js`, `src/index.css`
- Used by: Browser via `public/index.html` `<div id="root">`
- Purpose: Define routing tree, dark theme side-effect, shared chrome
- Location: `src/App.js`
- Contains: `BrowserRouter`, `Routes`, `Suspense`, `AppHeader`, `AppFooter`, `ScrollToTop`, `UseScrollToTop`
- Depends on: `react-router-dom`, `framer-motion`, `src/data/projects.js` (for `capabilitiesTitle`), pages, shared components
- Used by: `src/index.js`
- Purpose: One file per route; compose feature components and wrap in needed Context providers
- Location: `src/pages/*.jsx`
- Contains: Provider wrappers + composition, occasional inline data fetch (`Materials.jsx`)
- Depends on: feature components, context providers
- Used by: `src/App.js` via `React.lazy`
- Purpose: UI building blocks scoped per feature folder
- Location: `src/components/{home,projects,about,contact,reusable,shared}/`, `src/materials/`
- Contains: `.jsx` presentational components, container components that consume Context
- Depends on: contexts, `react-icons`, `framer-motion`, Sanity client (in some leaves)
- Used by: pages
- Purpose: Talk to Sanity CMS and external POST endpoint
- Location: `src/utilities/sanityClient.jsx`, `src/utilities/helpers.jsx`
- Contains: Configured `@sanity/client` instance, image URL helpers (legacy Google Drive fallback)
- Depends on: `@sanity/client`
- Used by: every Context provider and any leaf doing `useEffect` fetches
## Data Flow
### Primary Request Path — viewing the home page
### Single-project drill-in
### Materials page (no Context)
### Contact form submission
- React Context for cross-component CMS data (`ProjectsContext`, `SingleProjectContext`, `AboutMeContext`).
- Local `useState` for ephemeral UI state (menu toggles, modal visibility, form fields, scroll position).
- `localStorage.setItem('theme', 'dark')` is written once in `App.js` but never read — effectively a no-op persistence.
- No Redux, Zustand, React Query, or SWR.
## Key Abstractions
- Purpose: Each Sanity schema corresponds to one or more components that fetch + render it.
- Examples:
- Pattern: `useEffect(() => sanityClient.fetch(GROQ).then(setState), [])`.
- Purpose: `capabilitiesTitle = 'styles'` is the single source for the `/styles` route segment, the matching nav label, and the `useParams` key.
- Location: `src/data/projects.js:22`
- Consumed by: `src/App.js`, `src/components/shared/AppHeader.jsx`, `src/components/projects/ProjectsFilter.jsx`, `src/components/projects/ProjectsGrid.jsx`.
- Purpose: Reusable labelled text input
- Location: `src/components/reusable/FormInput.jsx`
- Pattern: Controlled component with `onChange` callback
## Entry Points
- Location: `src/index.js`
- Triggers: Loaded by `public/index.html` `<div id="root">` after CRA build.
- Responsibilities: Create root, render `<App />` in StrictMode, kick off `reportWebVitals`.
- Location: `src/App.js`
- Triggers: Rendered by `src/index.js`.
- Responsibilities: Force dark mode side-effect, mount `BrowserRouter`, declare every route, lazy-load pages, render persistent `AppHeader`/`AppFooter`/`ScrollToTop`.
- `react-scripts start --openssl-legacy-provider` (defined in `package.json:23`) — CRA dev server on port 3000.
- `react-scripts build --openssl-legacy-provider` produces the static bundle.
- `npm run build:css` runs `postcss src/css/tailwind.css -o src/css/main.css` (rarely needed because CRA already runs PostCSS through its build pipeline).
## Architectural Constraints
- **Threading:** Single browser main thread — there are no Web Workers, no Service Workers, no SSR.
- **Global state:** A single `sanityClient` module-level singleton in `src/utilities/sanityClient.jsx` is imported across the app. The dark-mode side effect in `App.js` mutates `document.documentElement` and `localStorage` on every render.
- **Circular imports:** None observed. `SingleProjectContext` depends on `ProjectsContext` but only at consumer level (it `useContext`s it, not imports cycles).
- **Routing constraint:** Every route segment for project styles is derived from `capabilitiesTitle` in `src/data/projects.js`. Renaming this string will rewrite the URL and the header link simultaneously — that's intentional, but means it's effectively a config flag.
- **Hardcoded Sanity project:** `projectId: "qx9kep1e"` and `dataset: "production"` are baked into `src/utilities/sanityClient.jsx` (no env vars). `useCdn: true` means writes are not supported and reads are eventually-consistent.
- **No environment switching:** `helpers.jsx` `isProd()` always returns `true` (early return), so the local-image fallback path in `getImageUrl` is dead code.
- **CRA + OpenSSL legacy provider:** Build/start scripts pass `--openssl-legacy-provider` to work around Node 17+ webpack incompatibility. Node version is implicitly pinned by this flag.
- **No TypeScript:** Despite `tailwind.config.js` `content` globbing `ts/tsx`, all source files are `.js`/`.jsx`.
## Anti-Patterns
### DOM imperatively manipulated from React component
### Per-leaf Sanity fetches duplicated alongside Context providers
### Force-dark theme as a render side-effect
### Honeypot field rendered visibly
### Two contact form components
## Error Handling
- Sanity fetches: every provider chains `.catch(console.error)` (e.g. `src/context/ProjectsContext.jsx:41`). On failure the component just keeps its initial empty state, leading to silent empty grids.
- Optional chaining at render time: components do `{aboutMe && aboutMe.title}` (`src/components/about/AboutMeBio.jsx:17`) instead of suspense/skeleton — this is the de-facto loading state.
- Form submission: `fetch` `.catch(error => alert(error))` (`src/components/contact/ContactForm.jsx:46-49`) — user-visible but unstyled.
- No error boundary component is registered.
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
