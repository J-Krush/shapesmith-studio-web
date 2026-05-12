<!-- refreshed: 2026-05-02 -->
# Architecture

**Analysis Date:** 2026-05-02

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Browser Entry (CRA)                       │
│  `public/index.html`  →  `src/index.js`  →  `src/App.js`     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Routing Layer (react-router-dom v6)             │
│  `src/App.js` — BrowserRouter + lazy-loaded route elements   │
│   /        /styles    /styles/:capability    /materials      │
│   /about   /contact                                          │
└──────┬──────────────────┬──────────────────────┬────────────┘
       │                  │                       │
       ▼                  ▼                       ▼
┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐
│  Pages       │  │  Context          │  │  Shared Chrome     │
│ `src/pages/` │  │ Providers         │  │ AppHeader/Footer   │
│              │  │ `src/context/`    │  │ `src/components/   │
│              │  │                   │  │  shared/`          │
└──────┬───────┘  └────────┬──────────┘  └────────────────────┘
       │                   │
       ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│        Feature Components (presentational + container)       │
│  `src/components/{home,projects,about,contact,reusable}/`    │
│  `src/materials/MaterialSingle.jsx`                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Sanity CMS (read-only)                      │
│  `src/utilities/sanityClient.jsx` — @sanity/client + GROQ    │
│  Schemas: profile, laser-style, maker-process, laser-specs,  │
│           material, collaboration                            │
└─────────────────────────────────────────────────────────────┘

         (out-of-band)                  (out-of-band)
                │                              │
                ▼                              ▼
┌──────────────────────────────┐   ┌─────────────────────────┐
│  Netlify Forms (contact)     │   │ Local static assets     │
│  POST https://shapesmith.    │   │ `src/assets/`,          │
│  studio/ (urlencoded)        │   │ `src/fonts/`            │
└──────────────────────────────┘   └─────────────────────────┘
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

**Overall:** Client-rendered single-page application (Create React App) with file-based feature folders, React Context for CMS data, and per-component Sanity fetches.

**Key Characteristics:**
- Single bundle SPA — no SSR, no Next.js, no API routes; CRA serves a static build.
- Routing is declarative in `src/App.js` using `react-router-dom` v6 `<Routes>` / `<Route>`.
- Page components are lazy-loaded via `React.lazy` + `Suspense` (fallback is empty string).
- Sanity is the canonical content source — fetched at runtime from the browser using `useEffect`.
- Two parallel data-loading idioms coexist: (a) Context providers (`ProjectsContext`, `AboutMeContext`, `SingleProjectContext`) and (b) inline `useEffect` + `useState` inside leaf components (`Materials.jsx`, `OurProcess.jsx`, `Collaborations.jsx`, home `QuickSpecs.jsx`).
- Static fallback data still lives in `src/data/*` (`projects.js`, `materials.js`, `aboutMeData.js`) but is no longer wired into rendering paths — only `capabilitiesTitle` from `src/data/projects.js` is used (as a routing constant).
- Styling is Tailwind (with PostCSS) + a few `styled-components` left as dependencies but unused.
- Theme is hard-locked to dark via `App.js` (`root.classList.add('dark')`); the `useThemeSwitcher` hook exists but is commented out at every call site.

## Layers

**Bootstrap layer:**
- Purpose: Boot React onto the DOM
- Location: `src/index.js`
- Contains: `ReactDOM.createRoot`, `<App />` mount, `reportWebVitals()` call
- Depends on: `src/App.js`, `src/index.css`
- Used by: Browser via `public/index.html` `<div id="root">`

**App / routing layer:**
- Purpose: Define routing tree, dark theme side-effect, shared chrome
- Location: `src/App.js`
- Contains: `BrowserRouter`, `Routes`, `Suspense`, `AppHeader`, `AppFooter`, `ScrollToTop`, `UseScrollToTop`
- Depends on: `react-router-dom`, `framer-motion`, `src/data/projects.js` (for `capabilitiesTitle`), pages, shared components
- Used by: `src/index.js`

**Page layer:**
- Purpose: One file per route; compose feature components and wrap in needed Context providers
- Location: `src/pages/*.jsx`
- Contains: Provider wrappers + composition, occasional inline data fetch (`Materials.jsx`)
- Depends on: feature components, context providers
- Used by: `src/App.js` via `React.lazy`

**Feature component layer:**
- Purpose: UI building blocks scoped per feature folder
- Location: `src/components/{home,projects,about,contact,reusable,shared}/`, `src/materials/`
- Contains: `.jsx` presentational components, container components that consume Context
- Depends on: contexts, `react-icons`, `framer-motion`, Sanity client (in some leaves)
- Used by: pages

**Data / integration layer:**
- Purpose: Talk to Sanity CMS and external POST endpoint
- Location: `src/utilities/sanityClient.jsx`, `src/utilities/helpers.jsx`
- Contains: Configured `@sanity/client` instance, image URL helpers (legacy Google Drive fallback)
- Depends on: `@sanity/client`
- Used by: every Context provider and any leaf doing `useEffect` fetches

## Data Flow

### Primary Request Path — viewing the home page

1. Browser hits `/`; `public/index.html` loads the JS bundle (`src/index.js:1`).
2. `<App />` mounts, registers routes, renders `AppHeader` (`src/App.js:34`).
3. React resolves `<Home />` lazy chunk (`src/App.js:16`) and renders `src/pages/Home.jsx`.
4. `Home.jsx` mounts `<ProjectsProvider>` around `<ProjectsGrid />` (`src/pages/Home.jsx:17-19`); other home sections (`QuickInfo`, `OurProcess`, `QuickSpecs`, `Collaborations`) each issue their own Sanity fetch.
5. `ProjectsProvider`'s `useEffect` runs the GROQ query `*[_type == "laser-style"]{...}` against Sanity (`src/context/ProjectsContext.jsx:11-37`) and calls `setProjects`.
6. `ProjectsGrid` reads `projects` from context, sorts by `order`, and renders `ProjectSingle` cards (`src/components/projects/ProjectsGrid.jsx:7-49`).
7. Cards use `react-router-dom` `<Link to={project.slug}>` (`src/components/projects/ProjectSingle.jsx:16`) so clicks switch routes without full reloads.

### Single-project drill-in

1. Click on a card navigates to `/styles/:capability` (`src/App.js:39-42`).
2. `ProjectSingle` page mounts `<ProjectsProvider>` followed by `<SingleProjectProvider>` (`src/pages/ProjectSingle.jsx:21-22`).
3. `SingleProjectProvider` calls `useParams()` for `capability`, reads `projects` from `ProjectsContext`, and `find`s the matching style by `slug` (`src/context/SingleProjectContext.jsx:9-16`).
4. `ProjectHeader`, `ProjectGallery`, and `ProjectInfo` consume `SingleProjectContext` and render header text, image grid (with manual show/hide modal via `document.getElementById('modal')`), and copy.

### Materials page (no Context)

1. `src/pages/Materials.jsx` itself runs the `*[_type == "material"]` GROQ query inside `useEffect` (`src/pages/Materials.jsx:9-33`).
2. Sorted results render through `src/materials/MaterialSingle.jsx`.

### Contact form submission

1. User fills `<ContactForm />` (`src/components/contact/ContactForm.jsx`).
2. On submit, the handler URL-encodes the form (including a `bot-field` honeypot) and `fetch`es `https://shapesmith.studio/` via POST (`src/components/contact/ContactForm.jsx:29-49`).
3. `public/index.html` declares a hidden `<form name="contact-form" netlify netlify-honeypot="bot-field" hidden>` (`public/index.html:34-45`) so Netlify Forms picks the submission up at deploy time.
4. On success the component flips `formSubmitted` and shows a thank-you panel.

**State Management:**
- React Context for cross-component CMS data (`ProjectsContext`, `SingleProjectContext`, `AboutMeContext`).
- Local `useState` for ephemeral UI state (menu toggles, modal visibility, form fields, scroll position).
- `localStorage.setItem('theme', 'dark')` is written once in `App.js` but never read — effectively a no-op persistence.
- No Redux, Zustand, React Query, or SWR.

## Key Abstractions

**Sanity content type → React component:**
- Purpose: Each Sanity schema corresponds to one or more components that fetch + render it.
- Examples:
  - `laser-style` → `src/context/ProjectsContext.jsx`, consumed by `src/components/projects/ProjectsGrid.jsx` and `src/context/SingleProjectContext.jsx`
  - `profile` → `src/context/AboutMeContext.jsx` → `src/components/about/AboutMeBio.jsx`
  - `material` → `src/pages/Materials.jsx` → `src/materials/MaterialSingle.jsx`
  - `maker-process` → `src/components/home/OurProcess.jsx` (self-contained)
  - `laser-specs` → `src/components/home/QuickSpecs.jsx` (self-contained)
  - `collaboration` → `src/components/home/Collaborations.jsx` (self-contained)
- Pattern: `useEffect(() => sanityClient.fetch(GROQ).then(setState), [])`.

**Capability slug constant:**
- Purpose: `capabilitiesTitle = 'styles'` is the single source for the `/styles` route segment, the matching nav label, and the `useParams` key.
- Location: `src/data/projects.js:22`
- Consumed by: `src/App.js`, `src/components/shared/AppHeader.jsx`, `src/components/projects/ProjectsFilter.jsx`, `src/components/projects/ProjectsGrid.jsx`.

**Shared form input:**
- Purpose: Reusable labelled text input
- Location: `src/components/reusable/FormInput.jsx`
- Pattern: Controlled component with `onChange` callback

## Entry Points

**Browser bootstrap:**
- Location: `src/index.js`
- Triggers: Loaded by `public/index.html` `<div id="root">` after CRA build.
- Responsibilities: Create root, render `<App />` in StrictMode, kick off `reportWebVitals`.

**App component:**
- Location: `src/App.js`
- Triggers: Rendered by `src/index.js`.
- Responsibilities: Force dark mode side-effect, mount `BrowserRouter`, declare every route, lazy-load pages, render persistent `AppHeader`/`AppFooter`/`ScrollToTop`.

**Build/dev entry:**
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

**What happens:** `ProjectGallery.jsx` opens/closes a modal by calling `document.getElementById("modal").classList.add('hidden')` (`src/components/projects/ProjectGallery.jsx:12-19,44-51`).
**Why it's wrong:** Bypasses React's render model — state and DOM can desync, and mounting the same component twice would collide on the duplicated `id="modal"`.
**Do this instead:** Hold modal visibility in `useState` and render the overlay conditionally (`{imgToShow && <Modal ... />}`), then drop the `id` lookup entirely.

### Per-leaf Sanity fetches duplicated alongside Context providers

**What happens:** Some pages use a Context provider (e.g. `ProjectsProvider` in `src/pages/Home.jsx:17-19`), while sibling components on the same page (`OurProcess.jsx`, `QuickSpecs.jsx`, `Collaborations.jsx`) issue their own `useEffect` `sanityClient.fetch` calls.
**Why it's wrong:** Inconsistent — half the screens cache data via Context while the other half refetch on every mount. Also makes future caching/loading-state work two-codepaths.
**Do this instead:** Pick one — promote each schema to a Context provider in `src/context/`, or move all fetches into a thin hook (e.g. `useSanityQuery`) and drop the Context wrappers entirely.

### Force-dark theme as a render side-effect

**What happens:** `App` writes `root.classList.add('dark')` and `localStorage.setItem('theme', 'dark')` on every render (`src/App.js:25-27`).
**Why it's wrong:** Side effects in render bodies violate React's purity contract; it also makes the theme switcher hook unreachable.
**Do this instead:** Either remove the dead `useThemeSwitcher` hook and set `class="dark"` directly on `<html>` in `public/index.html`, or move the toggle into `useEffect` and let `useThemeSwitcher` own it.

### Honeypot field rendered visibly

**What happens:** `ContactForm.jsx` includes the `bot-field` input with a placeholder ("Don't fill this out if you're human.") (`src/components/contact/ContactForm.jsx:88-97`) but doesn't hide it.
**Why it's wrong:** Defeats the purpose of a honeypot — bots and humans both see it.
**Do this instead:** Wrap it in a visually-hidden container or `<div hidden>`, mirroring the hidden form in `public/index.html`.

### Two contact form components

**What happens:** Both `src/components/contact/ContactForm.jsx` and `src/components/contact/contact-form.js` define a contact form; only `ContactForm.jsx` is wired into routing.
**Why it's wrong:** Dead code drift — bug fixes will land in only one of them.
**Do this instead:** Delete `src/components/contact/contact-form.js`.

## Error Handling

**Strategy:** Optimistic happy-path; failures are logged via `console.error` or surfaced via `alert()`.

**Patterns:**
- Sanity fetches: every provider chains `.catch(console.error)` (e.g. `src/context/ProjectsContext.jsx:41`). On failure the component just keeps its initial empty state, leading to silent empty grids.
- Optional chaining at render time: components do `{aboutMe && aboutMe.title}` (`src/components/about/AboutMeBio.jsx:17`) instead of suspense/skeleton — this is the de-facto loading state.
- Form submission: `fetch` `.catch(error => alert(error))` (`src/components/contact/ContactForm.jsx:46-49`) — user-visible but unstyled.
- No error boundary component is registered.

## Cross-Cutting Concerns

**Logging:** `console.log`/`console.error` only. Several call sites are commented out (search for `// console.log`).

**Validation:** Browser-native form validation (`required`, `type="email"`) only. No client-side schema validation.

**Authentication:** None — the site is fully public. Sanity is read-only via the public CDN.

**Animation:** `framer-motion` `AnimatePresence` wraps the whole app in `src/App.js:30`; individual components opt in with `motion.div` + `initial`/`animate` props.

**Styling:** Tailwind utility classes in JSX `className`. Custom palette and container padding live in `tailwind.config.js`. PostCSS pipeline configured by `postcss.config.js`. Some legacy CSS lives in `src/css/App.css`, `src/css/main.css`, `src/index.css`.

**Asset loading:** Images and fonts ship inside the JS bundle from `src/assets/` and `src/fonts/`. Sanity images are served directly from Sanity's CDN URL via `asset->url`.

---

*Architecture analysis: 2026-05-02*
