# Coding Conventions

**Analysis Date:** 2026-05-02

## Language & Type System

**JavaScript only.** No TypeScript is used anywhere in the codebase. No `tsconfig.json`, no `.ts`/`.tsx` files, and no type annotations. PropTypes are also not declared on any component — props are destructured directly without runtime or static validation.

**File extensions:**
- `.jsx` — All React components (in `src/components/`, `src/pages/`, `src/context/`, `src/hooks/`, `src/utilities/`, `src/materials/`)
- `.js` — Non-component JS modules (e.g., `src/data/projects.js`, `src/data/aboutMeData.js`, `src/reportWebVitals.js`, `src/setupTests.js`, `src/index.js`, `src/App.js`)
- A few `.js` files contain JSX (e.g., `src/App.js`, `src/components/contact/contact-form.js`) — extension is inconsistent.

## File Naming Patterns

**Components:** `PascalCase.jsx`
- `src/components/projects/ProjectsGrid.jsx`
- `src/components/shared/AppHeader.jsx`
- `src/components/reusable/FormInput.jsx`

**Pages:** `PascalCase.jsx`
- `src/pages/Home.jsx`
- `src/pages/ProjectSingle.jsx`

**Hooks:** `useCamelCase.jsx`
- `src/hooks/useScrollToTop.jsx`
- `src/hooks/useThemeSwitcher.jsx`

**Context:** `<Domain>Context.jsx`
- `src/context/ProjectsContext.jsx`
- `src/context/SingleProjectContext.jsx`
- `src/context/AboutMeContext.jsx`

**Data modules:** `camelCase.js`
- `src/data/projects.js`, `src/data/aboutMeData.js`, `src/data/images.js`

**Inconsistency:** `src/components/contact/contact-form.js` uses kebab-case + `.js` while a sibling `src/components/contact/ContactForm.jsx` uses PascalCase + `.jsx`. The `.js` file appears to be a legacy/unused alternate version.

## Directory Structure

```
src/
├── App.js, App.test.js, index.js, setupTests.js
├── assets/         # static images, logos
├── components/     # subdivided by feature: about/, contact/, home/, projects/, shared/, reusable/
├── context/        # React Context providers (one per data domain)
├── css/            # App.css, index.css, tailwind.css, main.css (compiled)
├── data/           # static content + Sanity-shaped fallback data
├── fonts/          # local font files
├── hooks/          # custom React hooks
├── materials/      # one-off MaterialSingle.jsx (sibling-of-pages oddity)
├── pages/          # route-level components
└── utilities/      # sanityClient.jsx, helpers.jsx
```

`src/materials/` sits alongside `src/components/` rather than under it — `src/pages/Materials.jsx` imports `../materials/MaterialSingle`. This is structural drift from the otherwise feature-grouped components convention.

## Component Patterns

**Standard form:** named arrow-function expression assigned to a `const`, then default-exported at the bottom.

```jsx
// src/components/projects/ProjectsGrid.jsx
import { useContext } from 'react';
import ProjectSingle from './ProjectSingle';
import { ProjectsContext } from '../../context/ProjectsContext';

const ProjectsGrid = () => {
	const { projects } = useContext(ProjectsContext);
	return (
		<section className="py-5 sm:py-10 mt-5 sm:mt-10">
			{/* ... */}
		</section>
	);
};

export default ProjectsGrid;
```

**Function-declaration form** is rare but appears (`src/components/reusable/Button.jsx`, `src/components/contact/contact-form.js`).

**Props:** destructured in the parameter list; never spread. No default values declared.

```jsx
// src/components/reusable/FormInput.jsx
const FormInput = ({ inputLabel, labelFor, inputType, inputId, inputName, placeholderText, ariaLabelName, onChange, required }) => { ... };
```

**Export style:** `export default ComponentName;` on the final line. No barrel `index.js` files anywhere in `src/`.

## Hooks Usage

- `useState` and `useEffect` are the workhorses. `useContext` is used in every page that consumes Sanity data.
- Effects fetch from Sanity directly inside the component or context provider — no abstraction layer (see `src/context/ProjectsContext.jsx`, `src/components/home/OurProcess.jsx`, `src/pages/Materials.jsx`, etc.).
- Custom hooks live in `src/hooks/`. `useScrollToTop` returns JSX (a button); `useThemeSwitcher` returns a `[value, setter]` tuple. Naming + return shape are inconsistent.
- `useScrollToTop` registers the same scroll listener twice — once inside `useEffect` (with cleanup) and once at module render time without cleanup. This is a bug, not a convention to follow.

## Context Patterns

Two different export shapes coexist:

```jsx
// Pattern A — named export of context (src/context/ProjectsContext.jsx)
export const ProjectsContext = createContext();
export const ProjectsProvider = (props) => { ... };
```

```jsx
// Pattern B — default export of context (src/context/SingleProjectContext.jsx, AboutMeContext.jsx)
const SingleProjectContext = createContext();
export const SingleProjectProvider = ({ children }) => { ... };
export default SingleProjectContext;
```

Consumers correspondingly use named or default imports. New context modules should pick one — Pattern B (default export of context, named export of provider) matches the majority.

Provider parameter shape also varies: `ProjectsProvider = (props) => { ... props.children }` vs. `SingleProjectProvider = ({ children }) => { ... }`. Prefer the destructured `{ children }` form.

## Styling Conventions

**Tailwind CSS** is the styling system (`tailwind.config.js`, `darkMode: 'class'`). All visual styling happens via `className` strings on JSX elements; there are no CSS Modules and no `styled-components` usage despite `styled-components` being in `package.json`.

**Theme tokens** (defined in `tailwind.config.js`):
- Colors: `primary-light`, `secondary-light`, `ternary-light` (note typo: "ternary" instead of "tertiary" — used consistently throughout the codebase, must be preserved), `primary-dark`, `secondary-dark`, `ternary-dark`, `secondary-section-light/dark`, `ternary-section-dark`, `accent`, `accent-highlight`.
- Always pair light/dark variants: `text-primary-dark dark:text-primary-light`, `bg-secondary-light dark:bg-ternary-dark`.

**Custom font utility classes** (defined in `src/css/App.css` via `@font-face` + utility class):
- `font-general-regular`, `font-general-medium`, `font-display`, `font-general-variable`, `font-general-variable-italic`, `font-general-extralight`.

**Indentation:** **Tabs**, not spaces, inside JSX/JS files. JSON files (`package.json`, `tailwind.config.js` initial content) use 2-space indent. Maintain tabs in `.jsx`/`.js`.

**Quote style:** single quotes for JS strings (`import 'react'`); double quotes inside JSX attribute values (`className="..."`). Mixed in a few places — match the surrounding file.

## Import Organization

No enforced order. Observed convention (loose):

1. Third-party packages (`react`, `framer-motion`, `react-router-dom`, `react-icons/fi`)
2. Local components (relative paths)
3. Context, hooks, utilities, data
4. CSS / asset imports last

```jsx
// src/App.js
import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import AppFooter from './components/shared/AppFooter';
import AppHeader from './components/shared/AppHeader';
import './css/App.css';
import UseScrollToTop from './hooks/useScrollToTop';
import { capabilitiesTitle } from '../src/data/projects';
import Materials from './pages/Materials';
```

No path aliases — all imports are relative (`../../context/...`). One import in `App.js` uses an awkward `'../src/data/projects'` form that should just be `'./data/projects'`.

**Lazy loading** is used for top-level routes via `React.lazy(() => import('./pages/Foo'))` with a `<Suspense fallback={""}>` boundary in `src/App.js`. Note: the fallback is an empty string rather than `null` — keep this if you don't want a loading flash.

## Error Handling

**Pattern:** `.catch(console.error)` after every Sanity fetch.

```jsx
// src/context/ProjectsContext.jsx
sanityClient.fetch(`*[_type == "laser-style"]{...}`)
	.then((data) => { setProjects(data); })
	.catch(console.error);
```

There is no error boundary, no retry, no user-visible error UI. Loading states are handled by rendering `data && data.field` guards rather than tracking a loading flag.

The contact form uses `alert()` for both success and error feedback (`src/components/contact/ContactForm.jsx`). Avoid extending this pattern — prefer in-page UI feedback.

## Logging

Only `console.error` (via `.catch(console.error)`) and a few `console.log` calls that are now commented out (per recent commit `fe89746 refactor: comment out console logs`). Do not introduce `console.log` in new code.

## Comments & Dead Code

The codebase carries a high volume of commented-out code blocks: alternate JSX layouts inside `src/components/projects/ProjectGallery.jsx`, `src/materials/MaterialSingle.jsx`, `src/pages/Materials.jsx`; commented-out theme-switcher logic in `src/components/shared/AppHeader.jsx`; entire commented import blocks in `src/data/projects.js`. Comments are also used as prose-style notes (`// NOTE: This scroll to top is the actual working scroll to top...`).

When editing these files, leave the existing commented blocks alone unless the user asks for cleanup — they appear to be intentional in-progress alternates.

## Function Design

- Components are typically 30–200 lines; the contact form (`src/components/contact/ContactForm.jsx`, 167 lines) is the largest.
- Helpers are small pure functions (`src/utilities/helpers.jsx`).
- No utility module re-exports; consumers import functions directly.

## Linting & Formatting

- ESLint config: `package.json#eslintConfig` extends `react-app` and `react-app/jest` (CRA defaults). No custom rules.
- No Prettier config (`.prettierrc*` absent). No EditorConfig. No Husky / lint-staged.
- No CI workflow (`.github/workflows` does not exist).
- The CRA scripts `start` and `build` pass `--openssl-legacy-provider`, indicating Node 17+ workaround for legacy webpack/CRA.

**Practical implication:** there is no automated style enforcement. Match the file you are editing — tabs, single quotes in JS, double quotes in JSX, arrow components, default export.

## Module Design

**Exports:**
- Components: one `default` export per file; the file name matches the component name.
- Data modules: named exports only (`export const capabilitiesTitle = 'styles'`).
- Context modules: provider as named export; context object as either named or default (see Context Patterns above).

**No barrel files.** Every consumer imports directly from the implementing module.

## Routing

All routes are declared in `src/App.js` inside a `<Routes>` block. Dynamic params use `:param` (`/styles/:capability`) and are read with `useParams()` in `SingleProjectProvider`. The `capabilitiesTitle` constant from `src/data/projects.js` is used to construct route paths so the URL slug stays in one place.

---

*Convention analysis: 2026-05-02*
