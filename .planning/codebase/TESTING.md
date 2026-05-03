# Testing Patterns

**Analysis Date:** 2026-05-02

## Summary: Effectively No Test Coverage

This codebase has **one test file**, and that test is **broken** — it asserts on text that does not exist in the rendered application. There is no meaningful test coverage, no CI to run tests, and no plan visible in the repo for adding any. The only test is the boilerplate scaffold left over from `create-react-app`.

For any GSD phase that touches behavior, treat "add a regression test" as net-new work rather than "extend an existing pattern."

## Test Framework

**Runner:** Jest, provided transitively by `react-scripts` 5.0.1 (Create React App). There is no project-local Jest config — `jest.config.*` does not exist; CRA owns it.

**React testing utilities** (declared in `package.json`):
- `@testing-library/react@^13.4.0`
- `@testing-library/jest-dom@^5.16.5`
- `@testing-library/user-event@^13.5.0`
- `@testing-library/dom@^9.3.0` (devDependency)

**Run command:**
```bash
npm test                 # CRA interactive watch mode
CI=true npm test         # single run (no watch)
npm test -- --coverage   # coverage report (CRA flag pass-through)
```

There are no separate `test:unit`, `test:integration`, or `test:e2e` scripts. Playwright/Cypress are not installed.

## Test File Locations

```
src/
├── App.test.js          # the only test file
└── setupTests.js        # imports '@testing-library/jest-dom'
```

`find src -name "*.test.*" -o -name "*.spec.*"` returns exactly one match: `src/App.test.js`.

## The Existing Test (and Why It Doesn't Run Green)

```js
// src/App.test.js
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
```

This is the unmodified CRA template test. The current `src/App.js` renders the Shapesmith routing tree (Home/Projects/About/Contact/Materials) — it never renders the string "learn react", so this test fails if executed. It also will throw before reaching the assertion because `src/App.js` calls `window.document.documentElement.classList.add('dark')` and `localStorage.setItem(...)` at component-body evaluation time, requiring a jsdom environment (which CRA provides) but also coupling the test to side effects on the DOM root.

## Test Setup

```js
// src/setupTests.js
// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';
```

CRA auto-loads this file before the test suite. It only enables jest-dom matchers (`toBeInTheDocument`, `toHaveTextContent`, etc.). There is no mock setup, no MSW, no test-data factories, no provider-wrapping helper.

## Mocking

**None exists.** No `jest.mock(...)` calls anywhere in the repo. The Sanity client (`src/utilities/sanityClient.jsx`) is imported directly by every page and context provider that needs data; tests would have to either mock `@sanity/client` or wrap the network with MSW. Neither is in place.

When writing new tests, expect to:
- Mock `../utilities/sanityClient` with `jest.mock` returning a stub `{ fetch: jest.fn().mockResolvedValue([...]) }`, **or**
- Wrap render with the relevant `*Provider` and pre-seed it with fixture data (requires refactoring the providers to accept an initial value prop — they currently always fetch on mount).

## Fixtures and Factories

No test fixtures. The closest things to fixture data are `src/data/projects.js` and `src/data/aboutMeData.js`, which are static content modules used in the running app, not in tests. Reusing them in tests would tie tests to product copy.

## Coverage

No coverage thresholds configured. No `jest.coverage*` keys in `package.json`. No `coverage/` directory is committed (ignored via `/coverage` in `.gitignore`). Effective coverage today is 0% of meaningful behavior.

## CI

No CI configuration is present:
- `.github/workflows/` does not exist
- No `.gitlab-ci.yml`, `.circleci/`, `azure-pipelines.yml`, etc.

Tests are not run automatically on push, on PR, or before deploy. The single broken test would not block anything.

## Common Patterns (Aspirational — None Currently in Use)

Because there are no patterns to follow, here are the patterns a new test should establish, derived from the libraries already installed and the component shapes in the codebase:

**Rendering a page that depends on Sanity data:**
```jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../utilities/sanityClient', () => ({
  __esModule: true,
  default: { fetch: jest.fn().mockResolvedValue([]) },
}));

import Home from './Home';

test('renders the home page banner', async () => {
  render(<MemoryRouter><Home /></MemoryRouter>);
  expect(await screen.findByText(/Size Matters/i)).toBeInTheDocument();
});
```

**User interaction:**
```jsx
import userEvent from '@testing-library/user-event';
// userEvent v13 syntax (matches the installed version)
userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
userEvent.click(screen.getByRole('button', { name: /send/i }));
```

Note: `@testing-library/user-event` is pinned at `^13.5.0`, which uses the **synchronous** API (`userEvent.type(...)`). The v14 async/`setup()` API is **not** what this project ships — do not use `await userEvent.setup()` here.

## What's Untested (Risk Inventory)

Every behavior in the app is currently unverified by automated tests:

- **Routing** — `src/App.js` lazy-loads five route components; no test confirms any route resolves.
- **Sanity data fetching** — every fetch in `src/context/*Context.jsx`, `src/pages/Materials.jsx`, `src/components/home/OurProcess.jsx`, `src/components/home/QuickSpecs.jsx`, `src/components/home/Collaborations.jsx` is unmocked and untested.
- **Contact form submission** — `src/components/contact/ContactForm.jsx` `fetch`-POSTs to `https://shapesmith.studio/`; no test, no validation coverage, side-effects via `alert()`.
- **Scroll behavior** — `src/components/ScrollToTop.jsx` and `src/hooks/useScrollToTop.jsx` (which has a known double-listener bug — see `CONCERNS.md`) are untested.
- **Theme application** — the dark-mode forcing in `src/App.js` (mutates `document.documentElement` and `localStorage`) is untested.
- **Project filtering / single-project lookup** — `src/context/SingleProjectContext.jsx` does `projects.find((cap) => cap.slug.includes(capability))` with no test for the empty-projects race or missing-slug case.

## Recommendations for New Phases That Require Tests

1. **Replace `src/App.test.js`** before adding new tests — the current contents are misleading and will fail any CI you wire up.
2. **Add `jest.mock('../utilities/sanityClient', ...)`** as the standard mocking convention; document it in this file once established.
3. **Wrap router-dependent components in `<MemoryRouter>`** when rendering in tests; `App` itself uses `BrowserRouter` and is awkward to test directly.
4. **Add a CI workflow** (`.github/workflows/ci.yml`) that runs `CI=true npm test` before any test work matters — otherwise tests can silently rot again.

---

*Testing analysis: 2026-05-02*
