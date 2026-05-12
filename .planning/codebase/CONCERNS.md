# Codebase Concerns

**Analysis Date:** 2026-05-02

## Tech Debt

**Broken `isProd` helper (always returns `true`):**
- Issue: Both branches of the `if` return `true`, so `isProd()` is hardcoded `true` regardless of `REACT_APP_ENV`. Combined with `getLocalPath()` returning an empty string, the local-vs-prod image switching logic is non-functional dead code.
- Files: `src/utilities/helpers.jsx:2-7`, `src/utilities/helpers.jsx:14-17`
- Impact: Dev/local mode for images is unreachable. Any caller relying on this distinction silently always uses Google Drive paths.
- Fix approach: Either remove the helper entirely (now that Sanity serves images directly via `asset->url`) or correctly branch on `process.env.REACT_APP_ENV === 'prod'`.

**Stale local data files no longer wired into the app:**
- Issue: After the Sanity migration, the local data sources are still in the tree but largely unused by render paths.
- Files: `src/data/projects.js`, `src/data/aboutMeData.js`, `src/data/materials.js`, `src/data/singleProjectData.js`, `src/data/images.js`
- Impact: ~860 lines of dead/duplicated content. `singleProjectData.js` still contains template lorem ipsum, "Company Ltd", `https://company.com`, `555 8888 888`, and `realstoman` social URLs that are easy to ship by accident. Only `capabilitiesTitle` is genuinely consumed (by `App.js`, `AppHeader`, `ProjectsGrid`, `ProjectsFilter`).
- Fix approach: Extract `capabilitiesTitle` to `src/constants.js` (or a Sanity field), delete the rest. The image manifest in `src/data/images.js` references `../images/...` — a directory that is gitignored and likely missing locally.

**Duplicate/abandoned contact form components:**
- Issue: Three contact-form implementations coexist with overlapping logic.
- Files: `src/components/contact/ContactForm.jsx` (active), `src/components/contact/contact-form.js` (orphaned, kebab-case), `src/components/HireMeModal.jsx` (orphaned modal not imported anywhere)
- Impact: Confusion about source of truth; bug fixes risk being applied to the wrong file. `HireMeModal.jsx` references `selectOptions` and `Button` that aren't imported, so it would crash if rendered.
- Fix approach: Delete `contact-form.js` and `HireMeModal.jsx`. Consolidate `encode` helper into a shared util.

**Commented-out theme switcher:**
- Issue: `useThemeSwitcher` hook exists and works, but every consumer has it commented out and the app force-applies dark mode in `App.js`.
- Files: `src/App.js:25-27`, `src/hooks/useThemeSwitcher.jsx`, `src/components/shared/AppHeader.jsx:13,45-55,187-198`, `src/components/shared/AppBanner.jsx:8-10,25-26,66-69`
- Impact: Hook is dead code; "dark:" Tailwind variants throughout the codebase are wasted. Light-mode color tokens in `tailwind.config.js:32-37` are never exercised.
- Fix approach: Either (a) re-enable the toggle and remove the forced `root.classList.add('dark')` side-effect-in-render in `App.js`, or (b) commit to dark-only and strip `dark:` variants and unused light tokens.

**`App.js` performs DOM mutation during render:**
- Issue: `App` calls `root.classList.add('dark')` and `localStorage.setItem('theme', 'dark')` synchronously inside the render body, not in a `useEffect`.
- Files: `src/App.js:25-27`
- Impact: Side effect re-runs on every render, violates React purity rules, breaks SSR/Strict Mode reasoning.
- Fix approach: Move into a `useEffect(() => { ... }, [])`.

**`useScrollToTop` re-attaches scroll listener on every render:**
- Issue: `useEffect` has no dependency array (so it runs every render), AND `window.addEventListener('scroll', scrollToTop)` is also called outside the effect at module-render time. Cleanup only removes the listener once, but new listeners pile up indefinitely.
- Files: `src/hooks/useScrollToTop.jsx:10-15,32`
- Impact: Memory leak and duplicate scroll-handler invocation grows linearly with renders.
- Fix approach: Add `[]` (or proper deps) to `useEffect`, and remove the duplicate `window.addEventListener` on line 32.

**`BackToTop` component is a stub:**
- Issue: Returns an empty `<div>`, with `useEffect` that scrolls to top on a constant `userScrollPosition = 0` (effect never re-fires).
- Files: `src/components/BackToTop.jsx:1-13`
- Impact: Component does nothing useful; appears to be an abandoned earlier attempt at the scroll-to-top feature that `useScrollToTop` now handles.
- Fix approach: Delete file. It is not imported anywhere in the active routes.

**`Shop` page exists but is unrouted:**
- Files: `src/pages/Shop.jsx`, with corresponding nav link commented out in `src/components/shared/AppHeader.jsx:142-148`
- Impact: Dead route, but only ~17 lines so low priority. Decide on roadmap or delete.

## Known Bugs

**`ProjectsFilter` is broken UI placeholder:**
- Symptoms: Default `<option value={setSelectProject}>` sets the value to a function reference; remaining options have no `value` props; nothing in `ProjectsGrid` actually consumes a filter prop.
- Files: `src/components/projects/ProjectsFilter.jsx:10-42`, `src/components/projects/ProjectsGrid.jsx`
- Trigger: Component is not rendered anywhere, so users do not see it — but if re-introduced, it will crash on selection.
- Workaround: Component is currently orphaned; treat as dead code until rewritten.

**`ProjectRelatedProjects` will crash if rendered:**
- Symptoms: References `singleProjectData.RelatedProject.title` and `.Projects.map(...)`, but Sanity data shape (see `ProjectsContext.jsx:13-35`) has no `RelatedProject` field — only `order`, `title`, `description`, `header`, `slug`, `preferredMaterials`, `considerations`, `listImage`, `detailImages`.
- Files: `src/components/projects/ProjectRelatedProjects.jsx:10-22`
- Trigger: Importing this component into `ProjectSingle.jsx` would throw `Cannot read properties of undefined (reading 'title')`.
- Workaround: Component is not imported, so no live crash. Either delete or rebuild against current Sanity schema.

**`ProjectGallery` uses non-existent React key:**
- Symptoms: Uses `image.asset.id` for the React key, but the GROQ projection in `ProjectsContext.jsx:21-34` selects `_id` (with underscore). `image.asset.id` is `undefined`, so all gallery items share key `undefined`.
- Files: `src/components/projects/ProjectGallery.jsx:28,34,53`
- Trigger: Rendering any project's detail gallery — React will warn and reconciliation may misbehave on re-renders.
- Workaround: Change `image.asset.id` to `image.asset._id`.

**Modal opens via direct DOM manipulation instead of React state:**
- Symptoms: `ProjectGallery` toggles a modal by calling `document.getElementById("modal").classList.remove('hidden')`. Mixing imperative DOM with React state is fragile and causes hydration/SSR issues.
- Files: `src/components/projects/ProjectGallery.jsx:9-19,44-54`
- Trigger: Any time multiple `ProjectGallery` instances mount, or React re-renders the modal subtree (the imperative class is not preserved in JSX state).
- Workaround: Refactor to controlled state — `const [isOpen, setIsOpen] = useState(false)` and condition on it in JSX.

**`AboutClients` references context fields that don't exist:**
- Symptoms: Destructures `clientsData` and `clientsHeading` from `AboutMeContext`, but the provider only supplies `aboutMe` / `setAboutMe` (`src/context/AboutMeContext.jsx:33-42`).
- Files: `src/components/about/AboutClients.jsx:6,11,14`
- Trigger: Rendering `AboutClients` would throw `Cannot read properties of undefined (reading 'map')`. Component is not imported anywhere — treat as orphaned.

**`AboutCounter` uses CountUp with hardcoded refs and dummy stats:**
- Symptoms: Displays "Years of experience: 12", "Stars on GitHub: 20k+", "Positive feedback: 92%", "Projects completed: 77%" — all carried over from a different developer's portfolio template (note Stars-on-GitHub for a laser-cutting studio).
- Files: `src/components/about/AboutCounter.jsx:5-8,13-35`
- Trigger: Component is currently not rendered (`AboutMe.jsx` only renders `AboutMeBio`), so users do not see this. If reintroduced as-is it would publish misleading copy.
- Workaround: Delete file or rewrite.

**`isOriginalDesign` truthiness errors in copy:**
- Symptoms: Across `src/data/projects.js` many entries have `isOriginalDesign: false` for designs that are described as original (e.g., `WelcomeToTheShire`, `LadiesSign`, `DavilleCampSign` are listed `true`, but signage page text in copy may not match). Since this file is now mostly unused, it is moot, but the field is also missing from the Sanity schema, so any future revival would lose this metadata.
- Files: `src/data/projects.js:39,44,50,...`

## Security Considerations

**Hardcoded Sanity project ID in source:**
- Risk: `projectId: "qx9kep1e"` is checked into git in plaintext. Sanity treats project ID as semi-public (it's exposed in client requests anyway), so leakage is low-impact, but the lack of any environment-driven config is a smell — it ties dev/staging/prod to a single dataset.
- Files: `src/utilities/sanityClient.jsx:3-8`
- Current mitigation: `useCdn: true` and reads only (no token).
- Recommendations: Move `projectId`, `dataset`, `apiVersion` to `.env` (`REACT_APP_SANITY_PROJECT_ID`, etc.) so dev/staging can point at different datasets without code changes.

**No `rel="noopener noreferrer"` on external links opened in new tabs:**
- Risk: Tabnabbing — opened pages can manipulate `window.opener` and redirect the source.
- Files: `src/components/reusable/SocialLinks.jsx:42`, `src/components/shared/AppFooter.jsx:16` (commented), `src/components/shared/AppFooterCopyright.jsx:7,15` (commented)
- Current mitigation: None. Note: `target="__blank"` (double underscore) is also a typo — only `_blank` is a special browser keyword. The double-underscore form opens a named tab called literally "__blank" rather than a fresh tab, and the noopener concern still applies.
- Recommendations: Replace with `target="_blank" rel="noopener noreferrer"`.

**Contact form posts cross-origin to itself with no CSRF/captcha:**
- Risk: `ContactForm.jsx` does `fetch("https://shapesmith.studio/", { method: "POST", body: encode({...}) })` to the production domain regardless of where the dev server is running. This works on Netlify but has no real bot protection beyond the honeypot field.
- Files: `src/components/contact/ContactForm.jsx:29-49`, `public/index.html:34-45`
- Current mitigation: Netlify honeypot via `bot-field`.
- Recommendations: Add reCAPTCHA / Netlify form spam protection. Make the URL relative (`fetch("/")`) so dev environment posts locally rather than to prod (which the orphaned `contact-form.js:21` already does correctly).

**`alert(error)` leaks raw error objects to user:**
- Risk: Stringifies the entire error (potentially including stack traces or upstream details) into a browser alert.
- Files: `src/components/contact/ContactForm.jsx:48`, `src/components/HireMeModal.jsx:33`, `src/components/contact/contact-form.js:33`
- Recommendations: Display a friendly fixed message; log details to error tracking (Sentry, etc.).

**Google Drive `uc?id=...` link pattern in `helpers.jsx`:**
- Risk: The Drive direct-download endpoint has been deprecated/throttled by Google. If `helpers.jsx`/`images.js` are ever revived, image URLs may return HTML interstitials instead of binaries, breaking the site silently for visitors.
- Files: `src/utilities/helpers.jsx:19-22`, `src/data/images.js`
- Recommendations: Confirm everything has migrated to Sanity asset URLs, then delete.

## Performance Bottlenecks

**Each home-page section issues its own Sanity query:**
- Problem: `Home.jsx` mounts `QuickInfo`, `OurProcess`, `QuickSpecs`, `Collaborations`, and `ProjectsGrid` (via `ProjectsProvider`). Each component opens its own `sanityClient.fetch(...)` in `useEffect`. The page makes 5 sequential round-trips on first paint.
- Files: `src/components/home/QuickInfo.jsx:9-29`, `src/components/home/OurProcess.jsx:8-29`, `src/components/home/QuickSpecs.jsx`, `src/components/home/Collaborations.jsx:9-29`, `src/context/ProjectsContext.jsx:11-42`, `src/pages/Materials.jsx:9-33`
- Cause: No shared client cache; no batched query; no static generation.
- Improvement path: Either (a) issue a single composite GROQ query at the page level and pass data down via context, (b) introduce a query cache like SWR/React Query (Sanity client has `useCdn: true` but each component still triggers a network/HTTP cache lookup), or (c) move to Next.js static generation with the Sanity content baked into the build.

**Doubly-nested context providers re-fetch on `ProjectSingle` mount:**
- Problem: `ProjectSingle.jsx` wraps its content in `<ProjectsProvider><SingleProjectProvider>`, meaning the entire projects list is refetched whenever a user navigates to a detail page (and again when navigating back to `/projects` since the providers are re-mounted).
- Files: `src/pages/ProjectSingle.jsx:21-27`, `src/pages/Projects.jsx:6-10`
- Cause: `ProjectsProvider` is scoped per-page rather than at app root.
- Improvement path: Hoist `ProjectsProvider` into `App.js` once, or use a router-level data loader.

**`SingleProjectProvider` initial state crashes when projects haven't loaded:**
- Problem: `useState(projects.find((cap) => cap.slug.includes(capability)))` runs once with whatever `projects` is at first render — an empty array. `.find()` on `[]` returns `undefined`, so `singleProjectData?.detailImages` is `undefined` (handled), but `singleProjectData.slug.includes(...)` would throw if `slug` were ever a non-string. Also, calling `.includes(capability)` against the slug expects the slug to be a string containing the URL param — Sanity slugs are typically `{ current: "..." }` objects, so this might silently never match.
- Files: `src/context/SingleProjectContext.jsx:12,15`
- Trigger: Verify the Sanity `slug` field type. If `slug.current` is the actual string, every `find` call returns `undefined`.
- Workaround: Defensive `cap?.slug?.current === capability` (or whatever the schema returns).

**Inline sort allocations on every render:**
- Problem: `projects.sort(...)`, `materials.sort(...)`, `processSteps.sort(...)` are called inside the JSX of `ProjectsGrid`, `Materials`, `OurProcess` — each render allocates a new sorted array (and `.sort()` mutates the original).
- Files: `src/components/projects/ProjectsGrid.jsx:39`, `src/pages/Materials.jsx:62`, `src/components/home/OurProcess.jsx:55`
- Improvement path: Sort inside the GROQ query (`*[_type == "..."] | order(order asc)`) or memoize via `useMemo`.

**Heavy unminified font payload:**
- Problem: `src/fonts/` ships 38+ font files (TTF + WOFF + WOFF2 + EOT for many weights of GeneralSans, plus Geologica families) bundled into the build. Many are unreferenced.
- Files: `src/fonts/`, `src/css/App.css`, `src/css/main.css`
- Improvement path: Audit which weights are actually used, drop EOT (IE-only), keep WOFF2 + WOFF fallback only.

## Fragile Areas

**Scroll-to-top hook:**
- Files: `src/hooks/useScrollToTop.jsx`
- Why fragile: Listener leak (described above), plus the function is named `useScrollToTop` but returns JSX rather than state — it is rendered as `<UseScrollToTop />` in `App.js:54`. This conflates "hook" and "component" naming and is confusing for future contributors.
- Safe modification: Rename to `BackToTopButton` (component) and either accept that the leak is per-route or fix dependencies.

**`ProjectGallery` modal:**
- Files: `src/components/projects/ProjectGallery.jsx`
- Why fragile: Imperative `getElementById` modal control breaks if the page mounts more than one gallery, if Strict Mode double-mounts, or if a future a11y refactor moves modal markup elsewhere.
- Safe modification: Convert to React-controlled disclosure; consider a focus-trapping library or a `<dialog>` element.

**Three near-duplicate Sanity fetch boilerplates:**
- Files: `src/components/home/QuickInfo.jsx`, `src/components/home/OurProcess.jsx`, `src/components/home/Collaborations.jsx`, `src/components/home/QuickSpecs.jsx`, `src/pages/Materials.jsx`, `src/context/ProjectsContext.jsx`, `src/context/AboutMeContext.jsx`
- Why fragile: Same pattern (`useEffect → sanityClient.fetch(GROQ).then(setX).catch(console.error)`) repeated 7+ times. A single bug fix (e.g., adding loading/error UI) means changing every site.
- Safe modification: Introduce `useSanityQuery(groq, deps)` hook returning `{ data, loading, error }`.

**`isProd` always-true:**
- Files: `src/utilities/helpers.jsx`
- Why fragile: Comments suggest a dev/prod toggle was intended; both branches return `true`, masking the bug. Anyone reading this and "fixing" the typo (changing the default branch to `false`) without knowing about the Sanity migration could break image loading site-wide.

## Scaling Limits

**No pagination, no lazy-load on image grids:**
- Current capacity: ~6 styles in projects, ~6 materials, ~3 process steps. All loaded at once; full-resolution Sanity image URLs requested per item.
- Limit: Once the gallery exceeds 30–50 items, initial paint will degrade.
- Scaling path: Use Sanity's image-URL builder with `width`/`height`/`quality` params for thumbnails; switch detail images to a lightbox library; consider list virtualization.

**Single Sanity dataset for all environments:**
- Current capacity: One `production` dataset (`src/utilities/sanityClient.jsx:5`).
- Limit: Schema migrations or content experiments require editing live data.
- Scaling path: Add `staging` dataset and env-driven `dataset` config.

## Dependencies at Risk

**Create React App is unmaintained:**
- Risk: The React team officially deprecated CRA in 2025; `react-scripts@5.0.1` is the last release. Webpack 5 + Babel toolchain receives no security updates, and `--openssl-legacy-provider` is required to run on Node 17+ (see `package.json:23-24`), which is itself a workaround.
- Impact: Future Node releases will keep breaking the build; vulnerabilities in transitive deps (postcss, webpack-dev-server) cannot be patched without forking.
- Migration plan: Move to Vite (preserves React + JSX with minimal changes) or Next.js (enables SSG + image optimization + ideal Sanity integration).

**`@babel/plugin-proposal-private-property-in-object` workaround:**
- Risk: Listed in `package.json:48` only to silence a CRA peerDep warning. Indicates upstream brittleness.
- Migration plan: Vanishes when CRA is replaced.

**`styled-components` 6.0.0-rc.3 (release candidate):**
- Risk: `package.json:19` pins to a non-stable release candidate. Searching the source, `styled-components` is not actually imported anywhere — Tailwind handles all styling.
- Impact: Unused dependency adds bundle weight and supply-chain surface.
- Migration plan: Remove from `package.json`.

**`postcss-cli` and `build:css` script duplicate Tailwind processing:**
- Risk: `package.json:11` adds `postcss-cli` as a runtime dependency (not devDependency); the `build:css` script appears redundant since CRA already runs PostCSS via `postcss.config.js`.
- Migration plan: Move `postcss-cli` to devDependencies (or remove); confirm `build:css` is needed and document.

**Mixed package manager state:**
- Risk: `yarn.lock` was deleted in working tree, `pnpm-lock.yaml` is now present but uncommitted. README still references `yarn start`/`yarn build`. Without committing `pnpm-lock.yaml`, contributors and CI will install drifting dep trees.
- Files: `pnpm-lock.yaml` (untracked), `README.md:53`
- Migration plan: Commit `pnpm-lock.yaml`, add `"packageManager": "pnpm@<version>"` to `package.json`, update `README.md` to use `pnpm` commands.

## Missing Critical Features

**No error states or loading states for any Sanity-backed component:**
- Problem: Every fetch boilerplate ends with `.catch(console.error)`. If Sanity is down, sections render empty (e.g., `<img src={undefined}>` or a blank grid) with no user feedback.
- Blocks: Production observability; user trust during outages.

**No analytics, no error tracking:**
- Problem: `reportWebVitals()` is called with no callback, so even web vitals are discarded. No Sentry/Datadog/PostHog integration anywhere.
- Blocks: Knowing whether real users encounter the bugs above.

**No SEO basics:**
- Problem: `public/index.html:9-11` still has the CRA default meta description ("Web site created using create-react-app"). No `<title>` swap per page, no `og:` tags, no JSON-LD, no sitemap.
- Blocks: Discoverability for a portfolio/business site.

**No accessible focus management for modal:**
- Problem: `ProjectGallery` modal does not trap focus, restore focus on close, or expose `role="dialog"` / `aria-modal`.
- Files: `src/components/projects/ProjectGallery.jsx:44-54`
- Blocks: Keyboard and screen-reader users.

**Empty alt text on hero About image:**
- Files: `src/components/about/AboutMeBio.jsx:12`
- Problem: `alt=""` declares the image decorative even though it carries content (the bio portrait).
- Recommendations: Bind to `aboutMe?.images[0]?.altText` (already populated in Sanity) or hardcode a meaningful description.

**Hamburger button uses an empty SVG wrapping React Icons:**
- Files: `src/components/shared/AppHeader.jsx:65-76`
- Problem: An outer `<svg>` wraps `<FiX />` / `<FiMenu />` (which are themselves SVGs). The outer SVG has no children of its own, so the visible icon comes from the inner React Icons component but the wrapper attributes (viewBox, fill) leak into accessibility tree noise.
- Recommendations: Render `<FiMenu />` / `<FiX />` directly without the outer `<svg>`.

## Test Coverage Gaps

**Effectively zero tests:**
- What's not tested: Everything. The single `App.test.js:4-8` test asserts `getByText(/learn react/i)` is in the document — text that does not exist anywhere in the app. This test will always fail.
- Files: `src/App.test.js`
- Risk: Any change can break the production site silently. CI (if any) cannot signal regressions.
- Priority: High. Start with smoke tests for `App` rendering + each route, then add tests for the Sanity-fetching contexts (with mocked client) and `ContactForm` submit happy path.

**No e2e or visual regression testing:**
- Risk: Layout changes (especially the heavy responsive Tailwind classes in `AppHeader`/`AppBanner`) cannot be verified without manual QA.
- Priority: Medium.

## Code Hygiene Notes

**Heavy use of commented-out code:**
- Recent commit `fe89746 refactor: comment out console logs` left dead code instead of deleting it. Examples:
  - `src/components/contact/ContactForm.jsx:22-25,42,76-78`
  - `src/components/shared/AppBanner.jsx:8-10,25-26,66-69`
  - `src/components/shared/AppHeader.jsx:4,8,13,36,44-55,142-148,187-198`
  - `src/components/shared/AppFooter.jsx:7-26`
  - `src/components/shared/AppFooterCopyright.jsx:5-19`
  - `src/components/HireMeModal.jsx:69-140,208-221`
  - `src/components/home/Collaborations.jsx:45-47`
  - `src/components/home/OurProcess.jsx:47-49`
  - `src/components/projects/ProjectHeader.jsx:12-19`
  - `src/components/about/AboutMeBio.jsx:24-26` (residual whitespace)
  - `src/data/materials.js:83-96,115-128`
  - `src/data/projects.js:77-84,109-115`
  - `tailwind.config.js:1-19`
  - `postcss.config.js:1-6`
- Impact: Obscures intent; readers can't tell what is current vs. abandoned.
- Recommendation: Delete; rely on `git log` to retrieve history.

**`var` declarations in modern React:**
- Files: `src/components/projects/ProjectGallery.jsx:7,12,17`
- Issue: `var` is not lexically scoped; mixed with `const` elsewhere creates inconsistency. Linter (CRA's default) does not flag.
- Recommendation: Replace with `const`/`let`.

**Original-template residue:**
- The codebase was forked from `realstoman/react-tailwindcss-portfolio`. Several artifacts remain:
  - `src/css/App.css:3` `* Powered by: @realstoman`
  - `src/components/shared/AppFooterCopyright.jsx:5-19` (Stoman link, commented)
  - `src/data/singleProjectData.js:109-133` (realstoman social URLs)
  - `public/index.html:10` ("Web site created using create-react-app")
  - `src/App.test.js:6` (`learn react` link assertion)
  - `README.md` (untouched CRA boilerplate)
- Recommendation: Search-and-purge `stoman` / `realstoman` / "create-react-app" / "learn react" references; rewrite `README.md` for the actual project.

**`encode()` form helper duplicated in 3 files:**
- Files: `src/components/contact/ContactForm.jsx:13-17`, `src/components/contact/contact-form.js:12-16`, `src/components/HireMeModal.jsx:12-16`
- Recommendation: Extract to `src/utilities/encodeFormData.js`.

**`onChange={(t) => setFormName(t)}` in orphaned forms:**
- Files: `src/components/contact/contact-form.js:59,68,77,85`, `src/components/HireMeModal.jsx:155,164,173,181`
- Issue: Stores the event object instead of `e.target.value` — submitted form values would be `[object Object]`.
- Recommendation: Delete files (orphaned). The active `ContactForm.jsx` uses the correct `e.target.value` pattern via `FormInput`.

---

*Concerns audit: 2026-05-02*
