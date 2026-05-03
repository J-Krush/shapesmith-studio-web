# Phase 1: Foundation — refactor + env pinning - Pattern Map

**Mapped:** 2026-05-03
**Files analyzed:** 22 (4 new, 17 modified, 1 deleted)
**Analogs found:** 4 / 4 new files have analogs in-tree

---

## File Classification

### New Files

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/hooks/useSanityQuery.jsx` | hook (data hook) | request-response (Sanity GROQ) | `src/context/ProjectsContext.jsx` (fetch body) + `src/hooks/useScrollToTop.jsx` (file shape only) | role+flow match for body, role match for file shape |
| `src/data/services.js` | data module (constants) | static config | `src/data/projects.js` (`capabilitiesTitle` export + `.js` extension) | exact (data-module convention) |
| `.nvmrc` | config | static | none in-tree | n/a — single line literal |
| `netlify.toml` | config | static | none in-tree | n/a — see Netlify Forms hint in `public/index.html:34-45` |

### Modified Files (FOUND-01: fetch-site migration)

| Modified File | Role | Data Flow | Pattern Source |
|---------------|------|-----------|----------------|
| `src/context/ProjectsContext.jsx` | context provider | request-response | self (current `useEffect` body → swap for `useSanityQuery`) |
| `src/context/AboutMeContext.jsx` | context provider | request-response | self (current `useEffect` body → swap for `useSanityQuery`) |
| `src/components/home/QuickInfo.jsx` | leaf component | request-response | self — note: file in CONTEXT was listed as `about/QuickInfo.jsx`; **actual path is `src/components/home/QuickInfo.jsx`**. The current file has NO fetch (it's pure JSX). The fetch site is `src/components/home/QuickSpecs.jsx`. Planner: re-verify scope — see "Discrepancy Notes" below. |
| `src/components/home/OurProcess.jsx` | leaf component | request-response | self |
| `src/components/home/QuickSpecs.jsx` | leaf component | request-response | self (this is the actual `laser-specs` fetch site mislabeled as `QuickInfo` in CONTEXT) |
| `src/components/home/Collaborations.jsx` | leaf component | request-response | self |
| `src/pages/Materials.jsx` | page | request-response | self |

### Modified Files (FOUND-02: capabilitiesTitle → SERVICES)

| Modified File | Role | Data Flow | What Changes |
|---------------|------|-----------|--------------|
| `src/App.js` | app root | routing config | `import { capabilitiesTitle }` → `import { SERVICES }`; route paths derive from `SERVICES.find(s => s.key === 'laser').urlSegment` |
| `src/components/shared/AppHeader.jsx` | shared chrome | routing/nav | nav `<Link>` label + path read from `SERVICES` |
| `src/components/projects/ProjectsFilter.jsx` | leaf component | UI (orphaned per CONCERNS) | swap import only — component unrendered, but kept in scope per D-13 |
| `src/components/projects/ProjectsGrid.jsx` | leaf component | UI | swap `capabilitiesTitle` → `SERVICES.find(...).navLabel` |
| `src/data/projects.js` | data module | static | DELETE the `export const capabilitiesTitle` line only; leave the rest (VIS-05 owns) |

### Modified Files (FOUND-03: dark theme)

| Modified File | Role | Data Flow | What Changes |
|---------------|------|-----------|--------------|
| `src/App.js` | app root | side-effect removal | DELETE lines 25-27 (`root.classList.add('dark')` + `localStorage.setItem`) |
| `public/index.html` | HTML shell | static | Add `class="dark"` to `<html>` tag (line 2) |
| `src/components/shared/AppHeader.jsx` | shared chrome | UI | DELETE commented theme-toggle markup (lines 4, 13, 36, 44-55, 187-198) |
| `src/components/shared/AppBanner.jsx` | shared chrome | UI | DELETE commented theme-toggle markup (lines 8-10, 25-26, 66-69) |
| `tailwind.config.js` | config | static | DELETE `-light` color keys only (lines 32-34, 36); keep `darkMode: 'class'` and `*-dark`/`accent` keys |

### Modified Files (FOUND-04: gallery modal)

| Modified File | Role | Data Flow | What Changes |
|---------------|------|-----------|--------------|
| `src/components/projects/ProjectGallery.jsx` | leaf component | UI state | Replace `document.getElementById("modal").classList...` with `useState`-driven conditional; also fix `image.asset.id` → `image.asset._id` (per D-11) |

### Modified Files (FOUND-05: env pin)

| Modified File | Role | Data Flow | What Changes |
|---------------|------|-----------|--------------|
| `package.json` | config | static | Add `"engines": { "node": ">=20" }` and `"packageManager": "pnpm@9.0.0"` |

### Modified Files (FOUND-06: smoke test)

| Modified File | Role | Data Flow | What Changes |
|---------------|------|-----------|--------------|
| `src/App.test.js` | test | unit | Replace boilerplate with mount-without-crashing; `MemoryRouter` + `jest.mock('./utilities/sanityClient')` |

### Deleted Files

| Deleted File | Reason |
|--------------|--------|
| `src/hooks/useThemeSwitcher.jsx` | FOUND-03 — dead code per D-07 |
| `yarn.lock` | Already deleted in working tree per `git status`; D-21 confirms |

---

## Pattern Assignments

### NEW: `src/hooks/useSanityQuery.jsx` (hook, request-response)

**Decision recap:** D-01 API `{ data, loading, error, refetch }`; D-02 AbortController cancellation; D-03 deps `[query, ...deps]` (no auto-stringify of params); D-05 `.jsx` extension to match hook directory convention.

**Analog A — file-shape convention (`.jsx` for hooks, default export):** `src/hooks/useThemeSwitcher.jsx`

```jsx
// src/hooks/useThemeSwitcher.jsx (lines 1-22) — to be DELETED in this phase
import { useEffect, useState } from 'react';

const useThemeSwitcher = () => {

	// Defaulting to dark theme.
	const [theme, setTheme] = useState('dark');


	const activeTheme = theme === 'dark' ? 'light' : 'dark';

	useEffect(() => {
		const root = window.document.documentElement;

		root.classList.remove(activeTheme);
		root.classList.add(theme);
		localStorage.setItem('theme', theme);
	}, [theme, activeTheme]);

	return [activeTheme, setTheme];
};

export default useThemeSwitcher;
```

What to copy:
- File header style: bare `import { ... } from 'react'`; tabs for indentation; no PropTypes; no JSDoc.
- Arrow-function-assigned-to-const + `export default` at bottom.
- `.jsx` extension (despite no JSX in this hook).

### Analog B — Sanity fetch body (current usage to be replaced): `src/context/ProjectsContext.jsx`

```jsx
// src/context/ProjectsContext.jsx (lines 1-54) — current state
import { useState, useEffect, createContext } from 'react';
import sanityClient from '../utilities/sanityClient';

// Create projects context
export const ProjectsContext = createContext();

// Create the projects context provider
export const ProjectsProvider = (props) => {
	const [projects, setProjects] = useState([]);

	useEffect(() => {
		sanityClient.fetch(
			`*[_type == "laser-style"]{
				order,
				title,
				description,
				header,
				slug,
				preferredMaterials,
				considerations,
				listImage{
					altText,
					asset->{
						_id,
						url
					},
				},
				detailImages[]{
					altText,
					asset->{
						_id,
						url
					},
				}
			  }
			  `
		)
		.then((data) => {
			setProjects(data);
		})
		.catch(console.error);
	}, []);

	return (
		<ProjectsContext.Provider
			value={{
				projects,
				setProjects,
			}}
		>
			{props.children}
		</ProjectsContext.Provider>
	);
};
```

What to copy into `useSanityQuery`:
- The `sanityClient.fetch(query)` invocation (no second-arg params today — but the new hook should accept `params` as the 2nd arg per D-01).
- The `.catch(console.error)` swallow-and-render-empty behavior is the **established error contract** — preserve it (D-04: "graceful empty-render"). Hook should expose `error` for callers that opt in, but not throw.

### Sanity client import path (used by every fetch site)

```jsx
// All seven fetch sites use this exact import shape:
import sanityClient from '../utilities/sanityClient';     // contexts (1 level up)
import sanityClient from '../../utilities/sanityClient';  // home/* and projects/* leaves (2 levels up)
```

The hook itself lives at `src/hooks/useSanityQuery.jsx` → `import sanityClient from '../utilities/sanityClient';`.

### Suggested hook body (the planner can hand this to the executor verbatim or adapt)

```jsx
// src/hooks/useSanityQuery.jsx — NEW
import { useState, useEffect, useCallback } from 'react';
import sanityClient from '../utilities/sanityClient';

const useSanityQuery = (query, params = {}, deps = []) => {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [refetchIndex, setRefetchIndex] = useState(0);

	const refetch = useCallback(() => setRefetchIndex((i) => i + 1), []);

	useEffect(() => {
		const controller = new AbortController();
		setLoading(true);
		setError(null);

		sanityClient
			.fetch(query, params, { signal: controller.signal })
			.then((result) => {
				setData(result);
				setLoading(false);
			})
			.catch((err) => {
				if (err.name === 'AbortError') return;
				console.error(err);
				setError(err);
				setLoading(false);
			});

		return () => controller.abort();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query, refetchIndex, ...deps]);

	return { data, loading, error, refetch };
};

export default useSanityQuery;
```

Notes for planner:
- Per D-03, `params` is intentionally NOT in the deps array — caller passes any param-derived primitives via `deps`.
- `console.error` preserved to match current `.catch(console.error)` contract.
- `useCallback` is the only addition vs. the bare-bones contexts; it's part of `react`'s standard hooks (no new deps).

### NEW: `src/data/services.js` (data module, static config)

**Decision recap:** D-12 — exports `SERVICES = [{ key, urlSegment, navLabel, sanityType, contactSubject }]` with two entries (`laser`, `print`); only `laser` is consumed in Phase 1.

**Analog:** `src/data/projects.js` (lines 22, 24) — the file from which `capabilitiesTitle` is being extracted.

```js
// src/data/projects.js (line 22) — current
export const capabilitiesTitle = 'styles';

// src/data/projects.js (line 24+) — current array shape
export const capabilitiesData = [
	{
		id: 'layered-wall-art',
		title: 'Layered Wall Art',
		// ...
	},
	// ...
];
```

What to copy:
- `.js` (not `.jsx`) extension — matches `src/data/*.js` convention (CONVENTIONS.md line 34).
- `export const NAME = ...` named-exports only — no default export from data modules.
- camelCase filename (`services.js`) — matches `aboutMeData.js`, `projects.js`, `materials.js`.

### Suggested file body (planner can hand to executor)

```js
// src/data/services.js — NEW
export const SERVICES = [
	{
		key: 'laser',
		urlSegment: 'styles',
		navLabel: 'styles',
		sanityType: 'laser-style',
		contactSubject: 'Laser cutting',
	},
	{
		key: 'print',
		urlSegment: '3d-printing',
		navLabel: '3D Printing',
		sanityType: 'print-style',
		contactSubject: '3D printing',
	},
];
```

Notes for planner:
- `urlSegment: 'styles'` for `laser` is **identical** to the current `capabilitiesTitle = 'styles'` value — this preserves URL stability (`/styles` and `/styles/:capability` keep working).
- `navLabel: 'styles'` (lowercase) matches current header rendering — `AppHeader.jsx:103,154` renders `{capabilitiesTitle}` directly inside Tailwind `capitalize` class.
- Only the `laser` entry is referenced by Phase 1 code; `print` is declared so Phase 2 can light it up without schema changes.

### NEW: `.nvmrc`

**Decision recap:** D-19 — contains literally `20` (major-only).

```
20
```

No analog needed; one line, no trailing newline policy enforced. Planner: confirm executor uses LF line ending.

### NEW: `netlify.toml`

**Decision recap:** D-20 — `[build]` block with pnpm + Node 20 pin.

**Analog:** none in-tree. The only Netlify-related config currently is the prerender form in `public/index.html:34-45` (referenced for context, not pattern):

```html
<!-- public/index.html (lines 34-45) — current -->
<form
  name="contact-form"
  netlify
  netlify-honeypot="bot-field"
  hidden
>
  <input type="text" name="bot-field" />
  <input type="text" name="name" />
  <input type="email" name="email" />
  <textarea name="message" />
  <input type="submit" value="Submit">
</form>
```

### Suggested file body

```toml
[build]
  command = "pnpm build"
  publish = "build"

[build.environment]
  NODE_VERSION = "20"
```

Notes:
- `publish = "build"` matches CRA's default output directory.
- Per D-20, `--openssl-legacy-provider` stays in `package.json` scripts; `pnpm build` already invokes the existing script `react-scripts build --openssl-legacy-provider`. No flag duplication needed in `netlify.toml`.

---

## Modified-File Pattern Excerpts (current state for executor reference)

### `src/App.js` (modified by FOUND-02 + FOUND-03)

```jsx
// src/App.js (current — full file, lines 1-60)
import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import AppFooter from './components/shared/AppFooter';
import AppHeader from './components/shared/AppHeader';
import './css/App.css';
import UseScrollToTop from './hooks/useScrollToTop';
import { capabilitiesTitle } from '../src/data/projects';   // ← FOUND-02: replace
import Materials from './pages/Materials';

const About = lazy(() => import('./pages/AboutMe'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Home = lazy(() => import('./pages/Home'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectSingle = lazy(() => import('./pages/ProjectSingle.jsx'));

function App() {

	const root = window.document.documentElement;          // ← FOUND-03: DELETE lines 25-27
	root.classList.add('dark');
	localStorage.setItem('theme', 'dark');

	return (
		<AnimatePresence>
			<div className=" bg-secondary-light dark:bg-primary-dark transition duration-300">
				<Router>
					<ScrollToTop />
					<AppHeader />
					<Suspense fallback={""}>
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path={`/${capabilitiesTitle}`} element={<Projects />} />          {/* ← FOUND-02 */}
							<Route
								path={`/${capabilitiesTitle}/:capability`}                          {/* ← FOUND-02 */}
								element={<ProjectSingle />}
							/>
							<Route path="/materials" element={<Materials />} />
							<Route path="about" element={<About />} />
							<Route path="contact" element={<Contact />} />
						</Routes>
					</Suspense>
					<AppFooter />
				</Router>
				<UseScrollToTop />
			</div>
		</AnimatePresence>
	);
}

export default App;
```

What changes:
1. Line 9: `import { capabilitiesTitle } from '../src/data/projects';` → `import { SERVICES } from './data/services';` (also fixes the awkward `'../src/'` typo flagged in CONVENTIONS.md line 157).
2. Lines 25-27: DELETE entirely (FOUND-03).
3. Lines 38, 40: `${capabilitiesTitle}` → derived from `SERVICES`. Suggested local: `const laser = SERVICES.find((s) => s.key === 'laser');` then `path={`/${laser.urlSegment}`}`.
4. Note: `bg-secondary-light` on line 31 references a `-light` color token that FOUND-03 removes from `tailwind.config.js`. Per D-08 (`dark:` variants stay, only token defs removed) the class will become a no-op rather than an error — but the executor should also strip `bg-secondary-light` here to be tidy (or leave for VIS-05 if scope-creep concern dominates). **Planner decides.**

### `src/components/shared/AppHeader.jsx` (modified by FOUND-02 + FOUND-03)

Current state for the four `capabilitiesTitle` touchpoints + commented-theme blocks:

```jsx
// Line 4:        // import useThemeSwitcher from '../../hooks/useThemeSwitcher';     ← DELETE (FOUND-03)
// Line 7:        import { capabilitiesTitle } from '../../data/projects';           ← swap to SERVICES (FOUND-02)
// Line 13:       // const [activeTheme, setTheme] = useThemeSwitcher();             ← DELETE (FOUND-03)
// Lines 36, 44-55, 187-198: commented theme-toggle/<FiMoon/FiSun> markup           ← DELETE (FOUND-03)
// Lines 97, 99, 102, 150, 152, 154: ${capabilitiesTitle} / {capabilitiesTitle}     ← read from SERVICES (FOUND-02)
```

Active rendering of the nav label (lines 96-103, mobile):

```jsx
<Link
	to={`/${capabilitiesTitle}`}
	className="capitalize block text-left text-lg text-primary-dark dark:text-ternary-light hover:text-secondary-dark dark:hover:text-secondary-light  sm:mx-4 mb-2 sm:py-2 border-t-2 pt-3 sm:border-t-0 border-primary-light dark:border-secondary-dark"
	aria-label={capabilitiesTitle}
	onClick={() => setShowMenu(false)}
>
	{capabilitiesTitle}
</Link>
```

Replace with (executor reference):

```jsx
const laser = SERVICES.find((s) => s.key === 'laser');
// ...
<Link
	to={`/${laser.urlSegment}`}
	aria-label={laser.navLabel}
	className="capitalize block ..."
	onClick={() => setShowMenu(false)}
>
	{laser.navLabel}
</Link>
```

Note the `capitalize` Tailwind class is what makes lowercase `'styles'` render as `Styles` — preserve it.

### `src/components/projects/ProjectGallery.jsx` (modified by FOUND-04 + D-11)

```jsx
// src/components/projects/ProjectGallery.jsx (current — full file, lines 1-60)
import { useContext, useState } from 'react';
import SingleProjectContext from '../../context/SingleProjectContext';

const ProjectGallery = () => {
	const { singleProjectData } = useContext(SingleProjectContext);

	var [imgToShow, setImgToShow] = useState();          // ← `var` smell (CONCERNS line 274); also rename to openImage per D-09

	const showModal = (img) => {                          // ← REPLACE: setOpenImage(img)
		setImgToShow(img);

		var modal = document.getElementById("modal");     // ← DELETE imperative DOM
		modal.classList.remove('hidden');
	}

	const closeModal = () => {                            // ← REPLACE: setOpenImage(null)
		var modal = document.getElementById("modal");     // ← DELETE imperative DOM
		modal.classList.add('hidden');
	}

	return (
		<div>
			<div className="container mx-auto px-5 py-2 lg:px-32 lg:pt-12">
				<div className="-m-1 flex flex-wrap md:-m-2">
					{singleProjectData && singleProjectData.detailImages.map((image) => {

						return (
							<div className="flex w-1/3 flex-wrap" key={image.asset.id}>     {/* ← D-11: .id → ._id */}
								<div className="w-full p-1 md:p-2">
									<img
										src={image.asset.url}
										className="rounded-xl cursor-pointer shadow-lg sm:shadow-none"
										alt={image.altText}
										key={image.asset.id}                                {/* ← D-11: .id → ._id (also redundant key on inner img) */}
										onClick={() => showModal(image.asset.url)}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</div>
			
			<div id="modal"
				className="hidden fixed top-0 left-0 z-80 w-screen h-screen bg-black/70 flex justify-center items-center">
				{/* ← REPLACE entire modal div with `{openImage && (<div ...>...</div>)}` conditional */}

				<button className="fixed z-90 top-6 right-8 text-white text-5xl font-bold hover:cursor-pointer"
					onClick={(event) => {
						event.preventDefault();
						closeModal()
					}}>&times;</button>

				<img id="modal-img" className="max-w-[800px] max-h-[600px] object-cover" src={imgToShow} key={imgToShow} alt="Modal Zoom"/>
			</div>
		</div>
	);
};

export default ProjectGallery;
```

Replacement pattern (executor reference, per D-09):

```jsx
const [openImage, setOpenImage] = useState(null);
// ...
<img
	src={image.asset.url}
	alt={image.altText}
	onClick={() => setOpenImage(image.asset.url)}
	className="..."
/>
// ...
{openImage && (
	<div className="fixed top-0 left-0 z-80 w-screen h-screen bg-black/70 flex justify-center items-center">
		<button onClick={() => setOpenImage(null)} className="...">&times;</button>
		<img src={openImage} alt="Modal Zoom" className="..." />
	</div>
)}
```

Notes:
- Replace `var` → `const` in the same diff (CONCERNS line 274 already aware; this is free since the line is being touched).
- Per D-10: do NOT extract `<Modal>` component yet.
- Outer key on the wrapping `<div>` is the one that matters; the duplicate `key` on the inner `<img>` (line 34) can be removed entirely.

### `tailwind.config.js` (modified by FOUND-03)

```js
// tailwind.config.js (current — lines 22-64)
const colors = require('tailwindcss/colors');

module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	darkMode: 'class',                                   // ← KEEP
	theme: {
		extend: {
			colors: {
				'primary-light': '#F7F8FC',              // ← DELETE
				'secondary-light': '#FFFFFF',            // ← DELETE
				'ternary-light': '#f6f7f8',              // ← DELETE (note "ternary" typo preserved per CONVENTIONS)

				'secondary-section-light': '#d1d1d1ff',  // ← DELETE

				'primary-dark': '#291c30',               // ← KEEP
				'secondary-dark': '#102D44',             // ← KEEP
				'ternary-dark': '#1E3851',               // ← KEEP

				'secondary-section-dark': '#594a60',     // ← KEEP
				'ternary-section-dark': '#94989c',       // ← KEEP

				'accent': '#348bd8',                     // ← KEEP
				'accent-highlight': '#3c6eb1',           // ← KEEP
			},
			container: {
				padding: {
					DEFAULT: '1rem',
					sm: '2rem',
					lg: '5rem',
					xl: '6rem',
					'2xl': '8rem',
				},
			},
		},
	},
	variants: {
		extend: { opacity: ['disabled'] },
	},
	plugins: ['@tailwindcss/forms'],                     // ← KEEP
};
```

What to delete: only the four `*-light` keys (lines 32, 33, 34, 36). Everything else stays.

Why this works without breaking dark mode: Tailwind's `dark:` variants like `dark:text-primary-light` resolve at build time. Deleting the `primary-light` key means `dark:text-primary-light` will fall back to a Tailwind error at build (Tailwind v3 silently treats unknown utilities as no-ops in JIT — verify in build). **Planner: flag a build-verify step in the FOUND-03 commit.** If Tailwind warns, the executor must either (a) replace `dark:text-primary-light` everywhere with a real dark-mode color (e.g., `dark:text-white`) — out of scope, defer to Phase 2, OR (b) keep the key for now and revisit. Per D-08 the spirit is "keep dark:variants in component files, just remove dead light tokens" — if (a) is needed, executor falls back to keeping the dead tokens and notes it for Phase 2.

### `package.json` (modified by FOUND-05)

```json
// package.json (current — lines 1-5)
{
  "name": "shapesmith-studio-web",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
```

What to add (sibling-of `"private": true`):

```json
  "engines": {
    "node": ">=20"
  },
  "packageManager": "pnpm@9.0.0",
```

Notes:
- Use 2-space indent (matches existing `package.json`).
- Per D-19: pnpm version should match the lockfile's `lockfileVersion: '9.0'` — `pnpm@9.0.0` is a safe floor. Executor should confirm by running `pnpm --version` locally; if installed pnpm is e.g. `9.12.x`, prefer pinning to that exact version per pnpm's `packageManager` corepack behavior.

### `src/App.test.js` (modified by FOUND-06)

```jsx
// src/App.test.js (current — full file, lines 1-8)
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
```

**Analog:** the current file (CRA boilerplate). It uses 2-space indent — this is one of the two files in the codebase that doesn't use tabs (matches `package.json` JSON convention). Keep 2-space.

### Suggested replacement body (executor reference, per D-16/D-17/D-18)

```jsx
// src/App.test.js — REPLACED
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./utilities/sanityClient', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() => Promise.resolve([])),
  },
}));

test('App mounts without crashing', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  // Header renders persistent nav links — at least one of them should appear.
  expect(screen.getByText(/contact/i)).toBeInTheDocument();
});
```

Notes for planner:
- `App.js` already wraps content in `<BrowserRouter>` internally (line 32). Wrapping again in `<MemoryRouter>` will throw "You cannot render a <Router> inside another <Router>". Two options:
  - **Option A (preferred for minimal diff):** since `App.js` provides its own router, drop the `<MemoryRouter>` wrapper in the test and simply `render(<App />)`.
  - **Option B (cleaner long-term):** lift the `<BrowserRouter>` from `App.js` into `src/index.js`, then wrap `App` in `MemoryRouter` in tests. This is a real refactor; out of scope per "don't refactor too much" guidance — defer.
- **Planner: choose Option A.** The mock + assertion stay the same; just remove the MemoryRouter wrapper. Document this divergence from D-16 in the plan.
- `screen.getByText(/contact/i)` matches the "Contact" `<Link>` rendered in `AppHeader.jsx:128, 182`. If brittle, fall back to `screen.getByRole('navigation')` (the `<motion.nav id="nav">` at `AppHeader.jsx:24-27`).

---

## Shared Patterns (cross-cutting)

### Pattern S1 — Sanity fetch boilerplate (the thing being consolidated)

**Source:** repeated 7× across the codebase. Canonical instance: `src/context/ProjectsContext.jsx:11-42`.

**Apply to (replace with `useSanityQuery`):**
1. `src/context/ProjectsContext.jsx` lines 11-42
2. `src/context/AboutMeContext.jsx` lines 10-30 (note: stores `data[0]` not `data` — single-document pattern; the hook's caller does the indexing)
3. `src/components/home/QuickSpecs.jsx` lines 9-29 (selects two distinct items from one query result via `.find()` — caller-side post-processing)
4. `src/components/home/OurProcess.jsx` lines 8-29
5. `src/components/home/Collaborations.jsx` lines 9-29 (also stores `data[0]`)
6. `src/pages/Materials.jsx` lines 9-33

**Replacement template** (executor reference):

```jsx
// Before:
const [projects, setProjects] = useState([]);
useEffect(() => {
	sanityClient.fetch(`*[_type == "laser-style"]{ ... }`)
		.then((data) => setProjects(data))
		.catch(console.error);
}, []);

// After:
const { data: projects } = useSanityQuery(`*[_type == "laser-style"]{ ... }`);
// — falsy `projects` (null) before load; existing `projects && ...` guards already handle this.
// — for single-doc patterns: `const { data } = useSanityQuery(query); const aboutMe = data?.[0];`
```

Critical preservation note: every existing call site uses `data && data.field` or `array.map` against arrays. The hook returns `data: null` initially; for fetch sites that do `useState([])` (array initial), executor must default at the call site — `const projects = data ?? [];` — to keep `.map()`/`.sort()` working. Five of seven sites use array-initial state; only `AboutMeContext` and `Collaborations` use single-object pattern.

### Pattern S2 — Tailwind dark-pair className convention

**Source:** ubiquitous. Example `src/components/home/OurProcess.jsx:35`:

```jsx
className="font-display font-bold text-4xl ... text-ternary-dark dark:text-ternary-light"
```

**Apply to:** any new JSX in this phase (mainly the modal in FOUND-04). Phase 1 should NOT strip the `dark:` variants per D-08 — they stay until Phase 2.

### Pattern S3 — Component file shape (arrow + default export)

**Source:** every `.jsx` file under `src/components/` and `src/hooks/`.

```jsx
import { useState, useEffect } from 'react';
// ...other imports...

const ComponentName = ({ prop1, prop2 }) => {
	// hooks
	// handlers
	return (
		<element>...</element>
	);
};

export default ComponentName;
```

**Apply to:** `useSanityQuery.jsx` (hook follows same shape with no JSX).

### Pattern S4 — Tab indentation in `.jsx`/`.js`, 2-space in JSON/config

**Source:** all `.jsx`/`.js` source files vs. `package.json`/`tailwind.config.js`.

**Apply to:**
- Tabs: `useSanityQuery.jsx`, `services.js`, modified `.jsx` files, modified `App.test.js` (current file is 2-space — but executor should match the CONVENTIONS.md guidance which says tabs for `.js`. **Planner: choose tabs for the new test, since it's a fresh write.** Confirm with executor.)
- 2-space: `package.json` additions, `netlify.toml` (TOML convention), `.nvmrc` (no indent).

### Pattern S5 — Error contract: silent empty-render

**Source:** `.catch(console.error)` after every Sanity fetch (e.g., `src/context/ProjectsContext.jsx:41`).

**Apply to:** `useSanityQuery` hook. The hook's `error` return value is OPT-IN — existing call sites don't read it, so they continue to render empty on error (per D-04). Hook still calls `console.error` internally to preserve current logging.

---

## No Analog Found

| File | Role | Reason |
|------|------|--------|
| `.nvmrc` | env config | No `.nvmrc`, `.node-version`, or similar in tree. Single-line literal — no analog needed. |
| `netlify.toml` | deploy config | No `netlify.toml`, `vercel.json`, or similar in tree. Netlify config is currently dashboard-only (per STACK.md line 89). RESEARCH.md should be the authority for the toml schema. |

---

## Discrepancy Notes (for planner)

1. **`QuickInfo.jsx` is in `home/`, not `about/`.** CONTEXT.md line 25 lists `QuickInfo` among fetch sites and the orchestrator's `<files_to_read>` block lists `src/components/about/QuickInfo.jsx`. The actual file at `src/components/home/QuickInfo.jsx` has **NO `useEffect`/`sanityClient.fetch` body** — it's pure JSX (verified above). The actual `laser-specs` fetch is in `src/components/home/QuickSpecs.jsx`. The 7-fetch-site count in D-04 still holds (ProjectsContext, AboutMeContext, QuickSpecs, OurProcess, Collaborations, Materials = 6 sites; CONCERNS.md adds `QuickInfo` only by accident — it has no fetch). **Planner: confirm scope is 6 fetch sites, not 7. Update D-04 accordingly or note the correction in the plan.**

2. **`App.js` already has `<BrowserRouter>` internally.** The smoke test plan in D-16 prescribes wrapping `<App />` in `<MemoryRouter>`. This will throw at runtime ("You cannot render a `<Router>` inside another `<Router>`"). See "Suggested replacement body" notes above for resolution (Option A: drop the wrapper).

3. **`tailwind.config.js` light-token deletion may break build.** `dark:text-primary-light` etc. are referenced in components (verified in `AppHeader.jsx:51` commented + many active usages). Deleting the `primary-light` key in `tailwind.config.js` may cause Tailwind JIT to silently drop those utilities or warn. Planner should sequence FOUND-03 to include a `pnpm build` verification step **before** committing.

4. **`bg-secondary-light` on `App.js:31` is a `-light` token** — directly affected by FOUND-03. Either strip from the className or accept that it'll silently no-op after token deletion. Decided: planner pick.

5. **`yarn.lock` deletion already in working tree.** Per `git status` it's already `D`. Phase 1 commits should ensure the deletion is committed (no resurrection).

---

## Metadata

- **Analog search scope:** `src/`, `public/`, repo root config files
- **Files Read:** `src/hooks/useScrollToTop.jsx`, `src/hooks/useThemeSwitcher.jsx`, `src/utilities/sanityClient.jsx`, `src/context/ProjectsContext.jsx`, `src/context/AboutMeContext.jsx`, `src/data/projects.js`, `src/components/home/QuickInfo.jsx`, `src/components/home/QuickSpecs.jsx`, `src/components/home/OurProcess.jsx`, `src/components/home/Collaborations.jsx`, `src/pages/Materials.jsx`, `src/App.js`, `src/components/projects/ProjectGallery.jsx`, `src/components/projects/ProjectsFilter.jsx`, `src/components/projects/ProjectsGrid.jsx`, `src/components/shared/AppHeader.jsx`, `src/components/shared/AppBanner.jsx`, `tailwind.config.js`, `package.json`, `public/index.html`, `src/App.test.js`, `src/setupTests.js`
- **Pattern extraction date:** 2026-05-03
