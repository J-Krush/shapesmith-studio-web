# Phase 2: Bundle 1 Relaunch — 3D printing + spruce + content + SEO + shop stub — Pattern Map

**Mapped:** 2026-05-06
**Files analyzed:** 47 (29 NEW, 16 MODIFIED, 13 DELETED)
**Analogs found:** 27 / 29 new files have an in-tree analog. 2 (`SEOHead`, `JsonLdLocalBusiness`) are new component categories — patterns sourced from `02-RESEARCH.md` §"Code Examples".

---

## How To Read This Document

This file is the planner's reference. Every PLAN.md `<read_first>` block should cite a row from §"Pattern Assignments" below by file path. Code excerpts are line-anchored and verified by `Read` tool against the working tree at the time of mapping. The §"Shared Patterns" section captures cross-cutting concerns (auth shape, error handling, GROQ projection contract) that apply to multiple new files.

When the analog match is **role-only** (no data-flow analog exists yet), the row says so explicitly and points to `02-RESEARCH.md` for the missing pattern. When a deviation from the analog is required (e.g., generalization for `serviceKey`), the row lists the deviation and the rationale.

---

## File Classification

### New Files (29)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/context/ServicesContext.jsx` | context provider | Sanity GROQ → context → grid | `src/context/ProjectsContext.jsx` | exact (role + flow); deviation = parameterized by `serviceKey` |
| `src/context/SingleServiceContext.jsx` | context provider | derives single from list | `src/context/SingleProjectContext.jsx` | exact; deviation = consumes `ServicesContext`, not `ProjectsContext`; param normalization `slug` vs `capability` |
| `src/pages/PrintStyles.jsx` | page route | provider wrap → grid | `src/pages/Projects.jsx` | exact mirror — generalization preferred (D-01: one `Projects.jsx` file accepting `serviceKey` prop, not two parallel pages) |
| `src/pages/PrintStyleSingle.jsx` | page route | nested providers + section composition | `src/pages/ProjectSingle.jsx` | exact mirror — same generalization preference |
| `src/pages/NotFound.jsx` | page route | static UI | `src/pages/Shop.jsx` (current 17-line stub shape) | role-only |
| `src/components/services/ServicesGrid.jsx` (rename of `ProjectsGrid.jsx`) | leaf component | useContext → render | `src/components/projects/ProjectsGrid.jsx` | exact — the file IS the analog (rename + generalize) |
| `src/components/services/ServiceCard.jsx` (rename of `ProjectSingle.jsx` (component)) | leaf component | props → render | `src/components/projects/ProjectSingle.jsx` (component, not page) | exact — same |
| `src/components/services/ServiceGallery.jsx` (rename of `ProjectGallery.jsx`) | leaf component | useContext + state-driven modal | `src/components/projects/ProjectGallery.jsx` | exact (Phase 1 already converted to state-driven) |
| `src/components/services/ServiceHeader.jsx` (rename of `ProjectHeader.jsx`) | leaf component | useContext → render | `src/components/projects/ProjectHeader.jsx` | exact |
| `src/components/services/ServiceInfo.jsx` (rename of `ProjectInfo.jsx`) | leaf component | useContext → render | `src/components/projects/ProjectInfo.jsx` | exact |
| `src/components/services/MaterialsSection.jsx` | leaf component (in-page section) | Sanity GROQ → list filtered by serviceKey | `src/pages/Materials.jsx` (existing top-level page) + `src/materials/MaterialSingle.jsx` (renderer) | role + flow — analog is the page being decommissioned; new file is a section, not a page |
| `src/components/services/FAQ.jsx` | leaf component | Sanity GROQ → `<details>`/`<summary>` list | none in-tree (no FAQ surface yet) | no analog — pattern from RESEARCH §"Don't Hand-Roll" + §"Sanity Schema Specifications §faq" |
| `src/components/services/WontMake.jsx` | leaf component | portable text → render | none in-tree (no portable-text rendering yet) | no analog — pattern from RESEARCH §"Sanity Schema Specifications §laser-style extension" |
| `src/components/services/TrustCopyBlock.jsx` | leaf component | Sanity studio-info + per-service overrides → render | `src/components/home/QuickInfo.jsx` (closest visual peer — banded panel) | role-only; flow new (cross-doc Sanity merge) |
| `src/components/shared/SEOHead.jsx` | shared component (SEO) | props → react-helmet-async `<Helmet>` | none in-tree (no react-helmet usage yet) | NEW CATEGORY — pattern from RESEARCH §"Code Examples §SEOHead" |
| `src/components/shared/JsonLdLocalBusiness.jsx` | shared component (SEO) | Sanity studio-info → JSON-LD `<script>` via `<Helmet>` | none in-tree | NEW CATEGORY — pattern from RESEARCH §"Code Examples §JsonLdLocalBusiness" |
| `src/components/shared/Placeholder.jsx` | shared component (visual) | static props → branded card | none — but MaterialSingle renders empty `<img>` slots that are the failure mode | NEW — pattern from UI-SPEC §"Photography placeholder color (D-11)" |
| `src/utilities/sanityImage.jsx` | utility (image builder) | wraps `@sanity/image-url` | `src/utilities/sanityClient.jsx` (single-export utility shape) | role-only |
| `src/components/shared/SanityImage.jsx` | leaf component | props → `<img srcSet>` via `urlFor` | `src/materials/MaterialSingle.jsx:19-23` (current `<img src=...>`) | role-only; flow new (srcSet) |
| `src/utilities/encodeFormData.jsx` (optional extraction) | utility (form helper) | encodes `data` object to URL-form body | `src/components/contact/ContactForm.jsx:13-17` (the inline `encode` fn) | exact — the source IS the inline analog being extracted |
| `scripts/generate-sitemap.cjs` | build script (Node) | Sanity GROQ → write `build/sitemap.xml` | none — no scripts/ dir exists yet | NEW CATEGORY — pattern from RESEARCH §"Pattern 5" |
| `public/_redirects` | Netlify config (static) | redirect `/materials` → `/styles#materials` | none — Netlify-config-as-file new for repo | NEW CATEGORY — pattern from RESEARCH §"Pattern 3 Note 1" |
| `public/og-default.png` | static asset | image | `public/favicon.png` | role-only (image asset placement) |
| `README.md` (full rewrite) | docs | static | none — current is CRA boilerplate (71 lines) | NEW CATEGORY — pattern from CONTEXT D-31 + RESEARCH §"User Constraints" |
| Sanity schema spec doc (planning artifact, not source code) | docs (owner-prep) | static schema definitions | none in-tree | NEW — content sourced from RESEARCH §"Sanity Schema Specifications" |
| `src/components/home/Hero.jsx` (NOT new — same file as `AppBanner.jsx`, listed for clarity) | shared component | dual-service framing | `src/components/shared/AppBanner.jsx` | exact — file is being modified, not created |
| `src/pages/PrintStyles.jsx` consolidated above | — | — | — | — |
| `src/pages/PrintStyleSingle.jsx` consolidated above | — | — | — | — |
| The `src/components/projects/` → `src/components/services/` directory rename is one operation; counts above split per-file | — | — | — | — |

> **Note on the rename block:** Per CONTEXT.md D-02 + RESEARCH §"Migration sequence per D-02," the planner should treat `src/components/projects/*` → `src/components/services/*` as a directory rename (not new files). The five files (`ProjectsGrid`, `ProjectSingle`-component, `ProjectGallery`, `ProjectHeader`, `ProjectInfo`) become `ServicesGrid`, `ServiceCard`, `ServiceGallery`, `ServiceHeader`, `ServiceInfo` respectively. Each file's contents are MODIFIED (generalize hard-coded laser copy, swap context import); the path move is a rename.

### Modified Files (16)

| Modified File | Role | Data Flow | What Changes | Analog (for new code added) |
|---------------|------|-----------|--------------|-----------------------------|
| `src/App.js` | app root | routing | wrap with `<HelmetProvider>`; iterate `SERVICES.map` to define both service routes; add `/shop`, `/404`, `/materials` `<Navigate>` redirect; lazy-load new pages | self (existing route declaration) + RESEARCH §"Pattern 3" |
| `src/components/shared/AppHeader.jsx` | shared chrome | nav | refresh nav for peer-equal services + `/shop` link; drop `/materials`; iterate `SERVICES.map` to render entries | self (current laser-only nav block lines 81-88, 134-140) |
| `src/components/shared/AppBanner.jsx` | shared chrome | hero | refactor to dual-service hero per UI-SPEC §"Hero composition" (50/50 split desktop, stacked mobile) | self — the file IS the structural analog being refactored |
| `src/components/shared/AppFooter.jsx` | shared chrome | UI | spruce sweep (D-09); `target="__blank"` typo fix (line 16) | self |
| `src/components/shared/AppFooterCopyright.jsx` | shared chrome | UI | `target="__blank"` typo fix (lines 7, 15) | self |
| `src/components/reusable/SocialLinks.jsx` | shared chrome | UI | `target="__blank"` typo fix (line 42) + `rel="noopener noreferrer"` | self |
| `src/components/contact/ContactForm.jsx` | leaf component | form submit | add `service` field + pre-fill `useEffect` (CTC-01); CSS-hide honeypot (CTC-03); change submit URL `https://shapesmith.studio/` → `/`; swap `bg-indigo-500` → `bg-accent`; render response-time promise (CTC-04) | self + RESEARCH §"Code Examples §Contact form pre-fill" |
| `src/pages/Contact.jsx` | page | composition | mount `<SEOHead />`; surface response-time promise wrapper if not in form | self |
| `src/pages/Home.jsx` | page | composition | mount `<SEOHead />` + `<JsonLdLocalBusiness />`; replace `<QuickInfo />` laser-only copy with service-agnostic block; preserve OurProcess/QuickSpecs/Collaborations | self |
| `src/pages/Shop.jsx` | page | form submit | replace 17-line stub with Coming Soon page; mount `<SEOHead />` + email form posting to `shop-notify` Netlify form | self (current shape) + RESEARCH §"Code Examples §Example 5" |
| `src/pages/AboutMe.jsx` | page | composition | spruce sweep (D-09); mount `<SEOHead />`; verify no orphaned `AboutClients` / `AboutCounter` references | self |
| `src/pages/Projects.jsx` | page | provider wrap | generalize: accept `serviceKey` prop, wrap in `<ServicesProvider serviceKey={serviceKey}>` | self |
| `src/pages/ProjectSingle.jsx` | page | nested providers | generalize: accept `serviceKey` prop; nest `<ServicesProvider>` + `<SingleServiceProvider>`; mount `<SEOHead />` with Sanity-driven seo block | self |
| `src/components/home/QuickInfo.jsx` | leaf component | static UI | replace laser-only copy ("We cut and engrave...") with service-agnostic "What we make" panel; remove `/materials` link (route is dropped); swap `hover:text-indigo-300` → `hover:text-accent` | self |
| `tailwind.config.js` | config | static | token diff per D-09 (planner-discretion content); preserve `darkMode: 'class'`, palette, container | self (lines 30-56 are the canonical token block) |
| `package.json` | config | dependencies | add `@sanity/image-url@^2.1.1`, `react-helmet-async@^2.0.5`; remove `styled-components`; add `postbuild` script | self |
| `public/index.html` | HTML shell | static | extend hidden `contact-form` with `service` field; add `shop-notify` form; replace static meta description with Phase 2 default; add `og:image` defaults; replace `theme-color` `#000000` → `#291c30` | self (lines 34-45 are the form prerender analog) |
| `public/robots.txt` | config | static | reference `Sitemap: https://shapesmith.studio/sitemap.xml` | self |
| `src/hooks/useScrollToTop.jsx` | hook | DOM event | folded into VIS-05: add `[]` deps to `useEffect` (line 15); delete duplicate module-level `addEventListener` (line 32) | self |

### Deleted Files (13)

| Deleted File | Lines (verified) | Imported by anything? | Notes |
|--------------|------------------|------------------------|-------|
| `src/data/projects.js` | 265 | No (Phase 1 already removed `capabilitiesTitle` consumers) | Verified by `rg` 2026-05-06; D-29 owner |
| `src/data/aboutMeData.js` | 10 | Only commented-out import in `AboutMeContext.jsx:3` | Safe; planner may also delete the comment in same edit |
| `src/data/materials.js` | 148 | No | — |
| `src/data/singleProjectData.js` | 162 | No | — |
| `src/data/images.js` | 193 | No | — |
| `src/components/contact/contact-form.js` | 114 | No | Duplicate of `ContactForm.jsx`; pre-Phase-1 residue |
| `src/components/HireMeModal.jsx` | 229 | No (self-references only) | Template residue — was a portfolio "Hire Me" feature |
| `src/components/BackToTop.jsx` | 13 | No (self-references only) | Stub — duplicates `useScrollToTop` |
| `src/components/projects/ProjectsFilter.jsx` | 46 | No (self-references only) | Orphaned — has wrong copy ("Web Application" etc.) per CONCERNS.md |
| `src/components/projects/ProjectRelatedProjects.jsx` | 29 | No (self-references only) | Crashes if rendered (refs `singleProjectData.RelatedProject` which doesn't exist in current Sanity shape) |
| `src/components/about/AboutClients.jsx` | 26 | No | Refs `clientsData`/`clientsHeading` which don't exist in `AboutMeContext` |
| `src/components/about/AboutCounter.jsx` | 41 | No | Template residue — `useCountUp` for "Years of experience" / "Stars on GitHub" |
| `src/utilities/helpers.jsx` | 21 | Self-references only (`isProd`, `getImageUrl`, `getGoogleDriveLink`) | All three functions are dead per `rg` |
| `src/pages/Materials.jsx` | 75 | Imported by `src/App.js:10, 41-43` (route handler) | Replaced by `<Navigate to="/styles#materials" replace />` redirect (MAT-03) |
| `src/components/about/AboutClientSingle.jsx` | n/a — only consumer is `AboutClients.jsx`, which is being deleted | If unreferenced after `AboutClients` delete, also delete; planner verifies |

**Cross-cutting deletion: `styled-components` from `package.json`** — verified no `import` of styled-components remains in `src/`. Removal is a one-line `pnpm remove styled-components`.

---

## Pattern Assignments

### `src/context/ServicesContext.jsx` (NEW — context provider, Sanity GROQ → context)

**Analog:** `src/context/ProjectsContext.jsx` (49 lines)

**Imports pattern** (from analog lines 1-2):
```jsx
import { createContext } from 'react';
import useSanityQuery from '../hooks/useSanityQuery';
```

**Provider shape pattern** (from analog lines 7-48):
```jsx
export const ProjectsContext = createContext();

export const ProjectsProvider = (props) => {
	const { data } = useSanityQuery(
		`*[_type == "laser-style"]{ ... }`
	);
	const projects = data ?? [];
	return (
		<ProjectsContext.Provider value={{ projects, setProjects: () => {} }}>
			{props.children}
		</ProjectsContext.Provider>
	);
};
```

**Required deviations** (per CONTEXT D-01..D-05 + RESEARCH §"Pattern 1"):
1. Accept `serviceKey` as a prop (not hardcoded `laser-style`).
2. Resolve `sanityType` from `SERVICES.find(s => s.key === serviceKey).sanityType`.
3. Pass `sanityType` as a GROQ param: `useSanityQuery(QUERY, { sanityType }, [sanityType])`.
4. GROQ uses `*[_type == $sanityType]` parameterization (D-05 shared projection).
5. Extend projection with new Phase-2 fields: `turnaround`, `wontMakeScope`, `seo{ metaTitle, metaDescription, ogImage{...} }`, `_id`, `order`, `| order(order asc)`. Add `altText` reads on `asset->{ _id, url, altText }`.
6. Provider value also exposes `serviceKey`, `service` (full SERVICES entry), `loading`, `error`, `refetch` (the full `useSanityQuery` return shape — RESEARCH `02-RESEARCH.md` lines 372-435).
7. **NEW:** wrap unknown-key in `throw new Error(\`Unknown serviceKey: ${serviceKey}\`)` for fail-fast semantics (D-01).

**Concrete starter code:** see RESEARCH §"Pattern 1: Generalized `ServicesContext`" (lines 372-435).

---

### `src/context/SingleServiceContext.jsx` (NEW — context provider, slug lookup)

**Analog:** `src/context/SingleProjectContext.jsx` (28 lines)

**Imports pattern** (from analog lines 1-3):
```jsx
import { useState, useContext, createContext, useEffect } from 'react';
import { useParams } from "react-router-dom"
import { ProjectsContext } from '../context/ProjectsContext';
```

**Param-resolution pattern** (from analog lines 7-16):
```jsx
const { capability } = useParams();
const { projects } = useContext(ProjectsContext);

const [singleProjectData, setSingleProjectData] = useState(
	projects.find((cap) => cap.slug.includes(capability))
);

useEffect(() => {
	setSingleProjectData(projects.find((cap) => cap.slug.includes(capability)));
}, [capability, projects]);
```

**Required deviations:**
1. Consume `ServicesContext` instead of `ProjectsContext`. Drop the `useState` + `useEffect` rewrap — `useMemo` against the array works because `useSanityQuery` already manages identity.
2. Read `slug` from `useParams()` rather than `capability` (RESEARCH §"Pattern 3 Note 2": Phase 2 normalizes route segment to `:slug`).
3. The slug-shape ambiguity (Sanity may return `slug` as `{ current: "..." }` object OR string — RESEARCH A2): defensive lookup `s.slug?.current === slug || s.slug?.includes?.(slug)`. Plan should add a Wave 1 spike to confirm and remove the fallback.
4. Provider value: `{ singleService, loading, error }` (no `setSingleService` — `ProjectsContext` exposes a no-op setter for legacy reasons that doesn't need to be carried forward).

**Concrete starter code:** see RESEARCH §"Pattern 1 — SingleServiceContext snippet" (lines 437-465).

---

### `src/pages/PrintStyles.jsx` and `src/pages/PrintStyleSingle.jsx` (NEW — page routes)

**RESEARCH-PREFERRED ALTERNATIVE:** Per CONTEXT D-01 generalization, the planner SHOULD generalize `src/pages/Projects.jsx` and `src/pages/ProjectSingle.jsx` to accept a `serviceKey` prop (driven from `App.js` `<Route element={<Projects serviceKey={s.key} />} />`) rather than create two parallel page files. Two-file form is documented here for completeness; one-file generalized form is the recommended shape per RESEARCH §"Pattern 1" + §"Pattern 3" (lines 599-604).

**Analog (one-file generalized form):** `src/pages/Projects.jsx` (15 lines) + `src/pages/ProjectSingle.jsx` (33 lines)

**Provider-wrap pattern** (from `Projects.jsx` lines 1-12):
```jsx
import ProjectsGrid from '../components/projects/ProjectsGrid';
import { ProjectsProvider } from '../context/ProjectsContext';

const Projects = () => {
	return (
		<ProjectsProvider>
			<div className="container mx-auto">
				<ProjectsGrid />
			</div>
		</ProjectsProvider>
	);
};
```

**Nested-providers pattern** (from `ProjectSingle.jsx` lines 6-29):
```jsx
const ProjectSingle = () => {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1, delay: 1 }}
			transition={{ ease: 'easeInOut', duration: 0.6, delay: 0.15 }}
			className="container mx-auto mt-5 sm:mt-10"
		>
			<ProjectsProvider>
				<SingleProjectProvider >
					<ProjectHeader />
					<ProjectGallery />
					<ProjectInfo />
				</SingleProjectProvider>
			</ProjectsProvider>
		</motion.div>
	);
};
```

**Required deviations (generalized form):**
1. Component accepts `{ serviceKey }` prop.
2. Replace `<ProjectsProvider>` with `<ServicesProvider serviceKey={serviceKey}>`.
3. Replace `<SingleProjectProvider>` with `<SingleServiceProvider>`.
4. Detail page composes new sections per UI-SPEC §"Component Inventory": `<ServiceHeader />`, `<ServiceGallery />`, `<ServiceInfo />`, `<TrustCopyBlock serviceKey={serviceKey} />`, `<MaterialsSection serviceKey={serviceKey} />`, `<FAQ serviceKey={serviceKey} />`, `<WontMake serviceKey={serviceKey} />`.
5. Mount `<SEOHead />` near the top of each page using Sanity-driven seo block (`singleService?.seo?.metaTitle`, etc.).

**Lazy-load pattern** (analog: `src/App.js:14-18`):
```jsx
const Projects = lazy(() => import('./pages/Projects'));
const ProjectSingle = lazy(() => import('./pages/ProjectSingle.jsx'));
```
New pages follow the same lazy-load pattern in `App.js`.

---

### `src/pages/NotFound.jsx` (NEW — 404 page)

**Analog:** `src/pages/Shop.jsx` (current 17-line stub) — same minimal page shape

**Page shell pattern** (from `Shop.jsx` lines 1-17):
```jsx
const Shop = () => {
	return (
		<section className="py-5 sm:py-10 mt-5 sm:mt-10">
			<div className="container mx-auto">
				<div className="text-center">
					<p className="capitalize font-display font-bold text-2xl sm:text-4xl mb-1 text-ternary-dark dark:text-ternary-light">
						Shop Coming Soon!
					</p>
				</div>
			</div>
		</section>
	);
};
```

**Required deviations:**
1. H1 "We couldn't find that page." per UI-SPEC §"Empty / pending states".
2. Body copy "It might have moved, or the link might be wrong. [Back to home](/) or [contact us](/contact) if you were looking for something specific."
3. Primary CTA "Back to home" linking to `/` (accent button).
4. Mount `<SEOHead title="Page not found" noindex={true} />` (UI-SPEC table row for `/404`).
5. Centered, accent CTA, branded — matches "looks legit" core value.

---

### `src/components/services/MaterialsSection.jsx` (NEW — in-page section, Sanity GROQ)

**Analog:** `src/pages/Materials.jsx` (75 lines, being deleted) + `src/materials/MaterialSingle.jsx` (84 lines, kept)

**Imports + GROQ pattern** (from `Materials.jsx` lines 1-25):
```jsx
import useSanityQuery from '../hooks/useSanityQuery';
import MaterialSingle from "../materials/MaterialSingle";

const Materials = () => {
	const { data } = useSanityQuery(
		`*[_type == "material"]{
			_id, order, title, processes, cuttingSpecs,
			description, disclaimer,
			listImage{
				altText,
				asset->{ _id, url }
			}
		}`
	);
	const materials = data ?? [];
	// ...
};
```

**Render pattern** (from `Materials.jsx` lines 54-66):
```jsx
{materials
	.sort((a,b) => a.order < b.order ? -1 : 1)
	.map((material) => (
		<MaterialSingle
			title={material.title}
			image={material.listImage.asset.url}
			key={material.title}
			description={material.description}
			materialThickness={material.cuttingSpecs}
			processes={material.processes}
			disclaimer={material.disclaimer}
		/>
	))}
```

**Required deviations** (per CONTEXT D-06, D-17 + RESEARCH §"Pattern 2"):
1. Accept `serviceKey` prop.
2. GROQ filter: `*[_type == "material" && $serviceKey in processes[]->key] | order(order asc){ ... }` (reference array form, D-06 target shape). FALLBACK: `*[_type == "material" && $serviceKey in processes]` if owner reports schema migration is too painful (D-07 free-text strings).
3. Sort via GROQ `| order(order asc)`, not in JS — matches the new convention in `ServicesContext`.
4. Section wrapper `<section id="materials" className="py-12 sm:py-24">` (anchor link target per D-17).
5. Empty-state per UI-SPEC §"Empty / pending states": "Materials coming soon. Contact us for special-order materials."
6. Heading: "Materials" (not "Laser Cutting Materials" — service-agnostic).
7. **CRITICAL:** Reuse `MaterialSingle` component **as-is** (do NOT duplicate). Visual surface unchanged per D-17.
8. Drop `processes={material.processes}` prop on `MaterialSingle` — section is per-service, no need to badge.

**Concrete starter code:** see RESEARCH §"Pattern 2: Component shape" (lines 521-562).

---

### `src/components/services/FAQ.jsx` (NEW — accordion via native `<details>`)

**Analog:** none in tree — RESEARCH §"Don't Hand-Roll" recommends native `<details>`/`<summary>`

**Pattern source:** RESEARCH §"Sanity Schema Specifications §faq" (lines 1019-1057):
```jsx
// GROQ
*[_type == "faq" && $serviceKey in service[]->key] | order(order asc){
	_id, question, answer, order
}
```

**Required pattern:**
1. Accept `serviceKey` prop.
2. `useSanityQuery(FAQ_QUERY, { serviceKey })`.
3. Render each item as `<details><summary>{question}</summary><div>{answer (portable text)}</div></details>` — zero JS, keyboard-accessible by default.
4. Empty-state per UI-SPEC: "FAQ coming soon. Have a question we haven't covered? Contact us."
5. Section wrapper `<section className="py-12 sm:py-24">` matches MaterialsSection rhythm.

**Imports pattern (mirror of MaterialsSection):**
```jsx
import useSanityQuery from '../../hooks/useSanityQuery';
```

**Portable text rendering:** RESEARCH does not specify a portable-text renderer. Two options:
- Inline minimal: render `answer[].children[].text` as `<p>` lines (works for plain text).
- Add `@portabletext/react` dependency — NOT in CONTEXT D-29 install list. Default: skip; render plain children.

Plan should commit to inline rendering and flag the limitation (no rich-text styling) in PLAN.md deviation log.

---

### `src/components/services/WontMake.jsx` (NEW — "what we won't make" block)

**Analog:** none in tree — pattern from RESEARCH §"Sanity Schema Specifications §laser-style extension" (D-14)

**Required pattern:**
1. Accept `wontMakeScope` (portable text array) as prop, OR accept `serviceKey` and read from `singleService` context. Lighter prop signature wins — accept `wontMakeScope` prop, let parent (PrintStyleSingle) pass it down from `singleService.wontMakeScope`.
2. Render heading "What we won't make" (UI-SPEC §"Component Inventory" — planner picks "What we won't make" or "Out of scope").
3. Render portable text body (same plain-text limitation as FAQ — flag in PLAN.md).
4. Single block, no provider needed — pure presentational.

**File-shape analog (visual parallel):** `src/components/projects/ProjectInfo.jsx` (47 lines) — same `block sm:flex gap-0 sm:gap-10` row pattern, single section, no fetch.

---

### `src/components/services/TrustCopyBlock.jsx` (NEW — turnaround + pickup + serviceArea + response-time)

**Analog:** `src/components/home/QuickInfo.jsx` (29 lines — the closest "compact panel" peer)

**Imports pattern** (none — pure presentational with optional `useSanityQuery`):
```jsx
import useSanityQuery from '../../hooks/useSanityQuery';
```

**Banded panel pattern** (from QuickInfo.jsx lines 4-25):
```jsx
<section className="py-5 sm:py-10 mt-5 sm:mt-10 bg-secondary-section-light dark:bg-secondary-section-dark">
	<div className="container mx-auto my-24">
		<div className='text-center'>
			<h1 className='font-display font-black text-3xl md:text-center sm:text-left text-ternary-dark dark:text-primary-light'>
				...
			</h1>
		</div>
	</div>
</section>
```

**Required deviations:**
1. Accept `serviceKey` prop. Internally fetch `studio-info` + the per-service `turnaround` (the per-service value comes from `singleService` context if available, or via a separate query).
2. Render four facts: `turnaround` (per-service override), `pickupAvailability` (studio-info), `serviceArea` (studio-info), response-time promise (studio-info, also surfaced on /contact).
3. Layout: "Keep on a single row on desktop, stacked on mobile" (UI-SPEC). `block sm:flex sm:gap-10` matches the ProjectInfo row pattern.
4. Use `bg-secondary-section-dark` (existing token, banded panel color).

---

### `src/components/shared/SEOHead.jsx` (NEW — react-helmet-async wrapper) — NEW CATEGORY

**Analog:** none in tree.

**Pattern source:** RESEARCH §"Code Examples §Example 4" (lines 644-669):
```jsx
import { Helmet } from 'react-helmet-async';

const SEOHead = ({
	title,
	description,
	ogImage,           // {url, altText} — defaults to studio-branded fallback
	ogUrl,             // canonical URL for this route
	noindex = false,   // /404 sets this true
}) => {
	const fullTitle = title ? `${title} — Shapesmith Studio` : 'Shapesmith Studio';
	return (
		<Helmet>
			<title>{fullTitle}</title>
			{description && <meta name="description" content={description} />}
			<meta property="og:title" content={fullTitle} />
			{description && <meta property="og:description" content={description} />}
			{ogImage?.url && <meta property="og:image" content={ogImage.url} />}
			{ogImage?.altText && <meta property="og:image:alt" content={ogImage.altText} />}
			{ogUrl && <meta property="og:url" content={ogUrl} />}
			<meta property="og:type" content="website" />
			{noindex && <meta name="robots" content="noindex" />}
		</Helmet>
	);
};

export default SEOHead;
```

**HelmetProvider mount-point:** Wrap `<App />`'s body with `<HelmetProvider>` outside `<AnimatePresence>` (RESEARCH §"Pattern 4 HelmetProvider placement" lines 638). Per-route mount: each page component renders `<SEOHead ... />` near the top.

**Static defaults belt-and-suspenders:** Per Pitfall 6, also set sensible static defaults in `public/index.html` `<head>` so non-JS crawlers see something — current `<meta name="description" content="Web site created using create-react-app" />` (line 9 of public/index.html) is replaced.

---

### `src/components/shared/JsonLdLocalBusiness.jsx` (NEW — homepage JSON-LD) — NEW CATEGORY

**Analog:** none in tree.

**Pattern source:** RESEARCH §"Code Examples §Example 2" (lines 1267-1321):
```jsx
import { Helmet } from 'react-helmet-async';
import useSanityQuery from '../../hooks/useSanityQuery';

const STUDIO_INFO_QUERY = `*[_type == "studio-info"][0]{
	name, description, serviceArea, telephone, url,
	address{ streetAddress, addressLocality, addressRegion, postalCode, addressCountry },
	sameAs, openingHours, areaServed, makesOffer,
	ogImage{ asset->{ url } }
}`;

const JsonLdLocalBusiness = () => {
	const { data } = useSanityQuery(STUDIO_INFO_QUERY);
	if (!data) return null;

	const ld = {
		'@context': 'https://schema.org',
		'@type': 'LocalBusiness',
		name: data.name ?? 'Shapesmith Studio',
		description: data.description,
		url: data.url ?? 'https://shapesmith.studio',
		// ... see RESEARCH for full ld build
	};

	return <Helmet><script type="application/ld+json">{JSON.stringify(ld)}</script></Helmet>;
};
```

**Mount-point:** Homepage only — `src/pages/Home.jsx` (per D-21).
**Validation:** After deploy, paste homepage URL into Google Rich Results Test.

---

### `src/components/shared/Placeholder.jsx` (NEW — branded image placeholder, D-11)

**Analog:** none in tree.

**Pattern source:** RESEARCH §"Code Examples §Placeholder" (lines 1238-1251) + UI-SPEC §"Photography placeholder color (D-11)":
```jsx
import { FiImage } from 'react-icons/fi';

const Placeholder = ({ caption = 'Image coming soon', className = '' }) => (
	<div className={`flex flex-col items-center justify-center bg-secondary-section-dark aspect-square rounded-xl ${className}`}>
		<FiImage className="text-4xl text-ternary-section-dark opacity-50" aria-hidden="true" />
		<p className="text-sm font-general-medium text-ternary-section-dark opacity-80 mt-2">
			{caption}
		</p>
	</div>
);
```

**Required tokens** (UI-SPEC verbatim):
- `bg-secondary-section-dark` (`#594a60`)
- `text-ternary-section-dark` (`#94989c`) at `opacity-50` (icon) / `opacity-80` (caption)
- `aspect-square` for grid cards; pass `aspect-[4/3]` via className for detail-page galleries
- Caption: "3D print example coming soon" (print) or "Laser cut example coming soon" (laser) — driven by parent `placeholderCaption` prop

**Icon:** `FiImage` from `react-icons/fi` (existing icon library lock — UI-SPEC).

---

### `src/utilities/sanityImage.jsx` (NEW — `@sanity/image-url` wrapper)

**Analog:** `src/utilities/sanityClient.jsx` (10 lines — single-export utility shape)

**Imports + single-export pattern** (from sanityClient.jsx lines 1-10):
```jsx
import { createClient } from "@sanity/client";

const sanityClient = createClient({
  projectId: "qx9kep1e",
  dataset: "production",
  useCdn: true,
  apiVersion: '2023-06-16'
});

export default sanityClient;
```

**Required pattern (RESEARCH §"Code Examples §Example 1" lines 1180-1193):**
```jsx
import imageUrlBuilder from '@sanity/image-url';
import sanityClient from './sanityClient';

const builder = imageUrlBuilder(sanityClient);

export const urlFor = (source) => builder.image(source);

export const urlAt = (source, width) =>
	urlFor(source).width(width).auto('format').quality(80).url();
```

**Naming convention:** Match existing `.jsx` extension for utilities (CLAUDE.md §"File extensions" — `.jsx` for utilities under `src/utilities/`).

---

### `src/components/shared/SanityImage.jsx` (NEW — responsive `<img srcSet>`)

**Analog (closest "image rendering" peer):** `src/materials/MaterialSingle.jsx` lines 19-23 + `src/components/projects/ProjectSingle.jsx` (component) lines 20-24

**Current `<img>` pattern** (from `MaterialSingle.jsx:19-23`):
```jsx
<img
	src={image}
	className="rounded-xl border-none"
	alt={title}
/>
```

**Current `<img>` pattern** (from `ProjectSingle.jsx` component lines 20-24):
```jsx
<img
	src={imageUrl}
	className="aspect-square object-cover rounded-xl border-none"
	alt={title}
/>
```

**Required pattern (RESEARCH §"Code Examples §Example 1" lines 1196-1234):**
```jsx
import { urlFor } from '../../utilities/sanityImage';
import Placeholder from './Placeholder';

const DEFAULT_WIDTHS = [400, 800, 1200, 1600];

const SanityImage = ({
	source, alt, sizes = '(max-width: 768px) 100vw, 50vw',
	loading = 'lazy', className = '', placeholderCaption,
}) => {
	const altText = alt ?? source?.altText ?? source?.asset?.altText ?? '';
	if (!source?.asset) return <Placeholder caption={placeholderCaption} className={className} />;

	const srcSet = DEFAULT_WIDTHS
		.map((w) => `${urlFor(source).width(w).auto('format').quality(80).url()} ${w}w`)
		.join(', ');
	const fallbackSrc = urlFor(source).width(800).auto('format').quality(80).url();

	return <img src={fallbackSrc} srcSet={srcSet} sizes={sizes} alt={altText} loading={loading} className={className} />;
};
```

**Required deviations from analog:**
1. `<Placeholder />` graceful degradation when `source.asset` is missing (D-11).
2. Always read alt text (CNT-04 — D-18: never empty strings, never filename fallbacks).
3. Native `loading="lazy"` (RESEARCH §"Don't Hand-Roll" — IntersectionObserver is overkill).
4. Hero LCP exception: pass `loading="eager"` for the homepage hero image so it doesn't lazy-load.

**Replaces (in order of priority):** Every direct `<img src={listImage.asset.url}>` in services/projects, materials section, gallery. Plan should sweep these during Wave 2/3.

---

### `src/utilities/encodeFormData.jsx` (NEW — optional extraction)

**Analog:** `src/components/contact/ContactForm.jsx` lines 13-17 (the inline `encode` function being extracted)

**Pattern (verbatim from analog):**
```jsx
const encode = (data) => {
	return Object.keys(data)
		.map(key => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
		.join("&");
}
```

**Required deviations (per RESEARCH §"Cleanup Scope" lines 1586-1598):**
1. Default-export (matches `sanityClient.jsx` shape).
2. Both `ContactForm.jsx` and the new `Shop.jsx` import from this utility — eliminates duplication.
3. **Optional** — only worth extracting if used in 2+ places. Plan can choose to inline the helper in both forms instead and skip the extraction.

---

### `src/pages/Shop.jsx` (MODIFIED — replace stub with Coming Soon page)

**Analog:** `src/pages/Shop.jsx` itself (current 17-line stub) + `src/components/contact/ContactForm.jsx` (form-submit pattern)

**Current shape** (lines 1-17):
```jsx
const Shop = () => {
	return (
		<section className="py-5 sm:py-10 mt-5 sm:mt-10">
			<div className="container mx-auto">
				<div className="text-center">
					<p className="capitalize font-display font-bold text-2xl sm:text-4xl mb-1 text-ternary-dark dark:text-ternary-light">
						Shop Coming Soon!
					</p>
				</div>
			</div>
		</section>
	);
};
```

**Form-submit pattern** (from `ContactForm.jsx` lines 13-49 — encoder + handleSubmit):
```jsx
const encode = (data) => Object.keys(data).map(...).join("&");

const handleSubmit = e => {
	e.preventDefault();
	fetch("https://shapesmith.studio/", {            // CHANGE to "/"
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: encode({
			"form-name": "contact-form",                // CHANGE to "shop-notify"
			...
			"bot-field": formBotField
		})
	})
		.then(() => { setFormSubmitted(true); })
		.catch(error => alert(error));                 // CHANGE: console.error, no alert
};
```

**Required deviations (per RESEARCH §"Code Examples §Example 5" lines 1466-1539):**
1. Replace stub with full Coming Soon page: H1 + 1-2 sentence promise + email input + "Notify me when it launches" button.
2. Form posts to `shop-notify` Netlify form (NOT `contact-form`) — separate hidden form in `public/index.html` per D-23.
3. Use relative URL `"/"` (RESEARCH §"Pitfall 5"), not `https://shapesmith.studio/`.
4. CSS-hidden honeypot per D-26.
5. Confirmation message replaces the form on success (D-23: "Thanks — we'll let you know.").
6. Mount `<SEOHead title="Shop — coming soon" description="..." />`.
7. Submit button uses `bg-accent hover:bg-accent-highlight` (UI-SPEC §"Color §Accent reserved for").
8. Email input uses `@tailwindcss/forms` baseline styling (already configured plugin).

---

### `src/components/home/Hero.jsx` (lives at `src/components/shared/AppBanner.jsx`) (MODIFIED — dual-service hero)

**Analog:** `src/components/shared/AppBanner.jsx` itself (71 lines) — file IS the structural analog being refactored.

**Current shape** (lines 1-69):
- Imports `heroLight` (laser-only photo) and `brandMultiFont` (wordmark).
- Outer `<div className="container mx-auto h-full">` wraps `motion.section`.
- `motion.section` has `flex flex-col sm:justify-between items-center sm:flex-row mt-12 md:mt-2 mb-24` — left-right split with brand wordmark + H1 ("Maker Studio & Custom Laser Cutting") + p-subhead on the LEFT, hero image on the RIGHT.

**Required refactor (per UI-SPEC §"Hero composition" + D-10):**

1. **Layout switch** — from "left/right text+image split" to "stacked: brand wordmark on top → H1 → subhead → 50/50 service-card split → shared CTA below."
2. **H1 content**: "Maker Studio — Custom Laser Cutting & 3D Printing" (UI-SPEC verbatim).
3. **Subhead**: "No idea too big or too small. We cut, engrave, and now print the things you have in mind." (UI-SPEC verbatim, replaces current "We just love making stuff!").
4. **Two service cards** (`w-full sm:w-1/2`, equal-width, equal padding `p-6` (UI-SPEC §"Spacing"), `dark:bg-ternary-dark`, `rounded-xl` — match `ProjectSingle.jsx` component card pattern):
   - Left card: "LASER CUTTING" H2 + 1-line material list ("hardwood, plywood, acrylic, leather, …") + "See examples →" text-arrow link to `/styles`
   - Right card: "3D PRINTING" H2 + 1-line material list ("PLA, PETG, TPU, more") + "See examples →" text-arrow link to `/3d-printing`
5. **Shared CTA below split**: "Contact us" accent button → `/contact` (single button, neither service favored).
6. **Mobile order**: cards stack vertically (`flex-col`); laser first, print second (UI-SPEC).
7. **Preserve** the existing `motion.section` wrapper with `framer-motion` `initial`/`animate`/`transition` props (UI-SPEC §"Component Inventory" — "Existing `framer-motion` `motion.section` wrapper preserved").
8. **Brand wordmark** stays as the LCP image; pass `loading="eager"` if SanityImage is used (or keep direct `<img>` for the asset import).
9. **Drop** the `heroLight` photo import — no laser-only hero photo on the homepage anymore.

---

### `src/components/shared/AppHeader.jsx` (MODIFIED — peer-equal nav refresh)

**Analog:** the file itself (179 lines) — refactor target.

**Current laser-only nav block** (lines 81-88, 134-140):
```jsx
<Link
	to={`/${laser.urlSegment}`}
	className="capitalize block text-left text-lg text-primary-dark dark:text-ternary-light hover:text-secondary-dark dark:hover:text-secondary-light  sm:mx-4 mb-2 sm:py-2 ..."
	aria-label={laser.navLabel}
	onClick={() => setShowMenu(false)}
>
	{laser.navLabel}
</Link>
```

**Current accent CTA pattern** (lines 105-115, 158-170 — already correct):
```jsx
<span className="block text-center text-md font-semibold bg-accent hover:bg-accent-highlight text-white shadow-sm rounded-md px-5 py-2.5 duration-300 cursor-pointer">
	<Link to="/contact" aria-label="contact-us">Contact</Link>
</span>
```

**Required deviations (per UI-SPEC §"Nav refresh" + D-32):**
1. Replace `const laser = SERVICES.find((s) => s.key === 'laser');` (line 12) with iteration: render one `<Link>` per service via `SERVICES.map(...)`.
2. Drop the `<Link to="/materials">Materials</Link>` entry (lines 89-96, 141-147) — `/materials` is now a redirect to `/styles#materials` (MAT-03).
3. Add `<Link to="/shop">Shop</Link>` entry between About and the Contact CTA (the commented-out `/shop` block on lines 127-133 is the placeholder; uncomment and refresh).
4. Active route gets `border-b-2 border-accent` underline (UI-SPEC §"Nav refresh" Desktop block) AND `aria-current="page"` (UI-SPEC §"a11y").
5. Mobile + desktop blocks both refreshed — ordering: Home, Laser Cutting, 3D Printing, About, Shop, [Contact CTA].
6. Both service entries are peer-equal — no "Services" group label, no dropdown.
7. Each service `<Link>` reads `to={`/${s.urlSegment}`}` and renders `{s.navLabel}` driven from `SERVICES`.

---

### `src/components/contact/ContactForm.jsx` (MODIFIED — service field + pre-fill + honeypot fix)

**Analog:** the file itself (167 lines) — modify in place.

**Current form structure** (lines 75-160):
- Form state: `formName`, `formEmail`, `formSubject`, `formMessage`, `formBotField`, `formSubmitted`.
- Inline `encode` helper (lines 13-17) — extract to `src/utilities/encodeFormData.jsx` per VIS-05 cleanup.
- `fetch("https://shapesmith.studio/", ...)` (line 29) — change to `"/"` (RESEARCH Pitfall 5).
- Honeypot rendered as VISIBLE `FormInput` with placeholder "Don't fill this out if you're human." (lines 87-97) — bug.
- Submit button uses `bg-indigo-500 hover:bg-indigo-600` (line 153) — template residue.
- `alert("Success!")` (line 43) and `alert(error)` (line 48) — UI debt.

**Required deviations (per CONTEXT D-24..D-28 + RESEARCH §"Code Examples §Example 3" lines 1342-1456):**

1. **Add `service` state**: `const [formService, setFormService] = useState('');`
2. **Add pre-fill `useEffect`** reading from `?service=` query string OR `document.referrer` matched against `SERVICE_PREFILL_RULES` derived from `SERVICES`:
   ```jsx
   useEffect(() => {
     const queryService = new URLSearchParams(window.location.search).get('service');
     if (queryService) {
       const match = SERVICES.find((s) => s.key === queryService || s.urlSegment === queryService);
       if (match) { setFormService(match.contactSubject); return; }
     }
     const referrer = document.referrer ?? '';
     const rule = SERVICE_PREFILL_RULES.find((r) => referrer.includes(r.match));
     if (rule) setFormService(rule.contactSubject);
   }, []);
   ```
3. **Add `service` `<select>` field** with options from `SERVICES.map(s => s.contactSubject)` plus a literal "Other" (UI-SPEC §"Form labels & hints").
4. **CSS-hide honeypot** per D-26 — wrap `bot-field` input in `<div className="absolute left-[-10000px] top-auto w-px h-px overflow-hidden" aria-hidden="true">` with `tabIndex={-1}`. Remove the visible "Don't fill this out if you're human" placeholder text.
5. **Change submit URL** `https://shapesmith.studio/` → `/` (RESEARCH Pitfall 5: dev posts go to local origin, not prod).
6. **Swap submit button color** `bg-indigo-500 hover:bg-indigo-600` → `bg-accent hover:bg-accent-highlight` + `focus:ring-1 focus:ring-accent` (UI-SPEC §"Color").
7. **Replace `alert()` calls** with `setFormSubmitted(true)` (already exists) + `console.error('Contact form submit failed:', err)` for the catch.
8. **Add response-time promise rendering** (CTC-04 / D-27): fetch `studio-info.responseTimePromise` via `useSanityQuery` and render below the submit button when present.
9. **Add CONTRACT comment at top** (RESEARCH §"Pitfall 4 mitigation"):
   ```jsx
   // CONTACT-FORM CONTRACT: every field below MUST also appear in `public/index.html`'s
   // hidden `<form name="contact-form">` block. See D-28.
   ```

**Encode helper:** Use `import encodeFormData from '../../utilities/encodeFormData';` if extracted, otherwise leave inline.

---

### `public/index.html` (MODIFIED — Netlify form prerender + static SEO defaults)

**Analog:** the file itself (57 lines) — extend in place.

**Current form prerender** (lines 34-45):
```html
<form name="contact-form" netlify netlify-honeypot="bot-field" hidden>
	<input type="text" name="bot-field" />
	<input type="text" name="name" />
	<input type="email" name="email" />
	<textarea name="message" />
	<input type="submit" value="Submit">
</form>
```

**Required deviations (per CONTEXT D-28 + D-23 + RESEARCH §"Pattern 6"):**

1. **Extend `contact-form`** with the `service` field and `subject` field (subject already in React form but missing from prerender):
   ```html
   <form name="contact-form" netlify netlify-honeypot="bot-field" hidden>
     <input type="text" name="bot-field" />
     <input type="text" name="name" />
     <input type="email" name="email" />
     <input type="text" name="service" />        <!-- NEW per CTC-02 -->
     <input type="text" name="subject" />
     <textarea name="message"></textarea>
     <input type="submit" value="Submit">
   </form>
   ```

2. **Add new `shop-notify` hidden form** (D-23 / SHOP-02):
   ```html
   <form name="shop-notify" netlify netlify-honeypot="bot-field" hidden>
     <input type="text" name="bot-field" />
     <input type="email" name="email" />
     <input type="submit" value="Submit">
   </form>
   ```

3. **Replace static meta description** (line 9) — current "Web site created using create-react-app" → "Shapesmith Studio — custom laser cutting and 3D printing for local hobbyists and small businesses." (RESEARCH §"Pattern 4 SPA crawler caveat" lines 700-712).

4. **Add og: defaults**:
   ```html
   <meta property="og:title" content="Shapesmith Studio" />
   <meta property="og:description" content="Custom laser cutting and 3D printing." />
   <meta property="og:image" content="/og-default.png" />
   <meta property="og:type" content="website" />
   ```

5. **Update theme-color** (line 7) `#000000` → `#291c30` (matches `primary-dark` token; mobile address-bar matches site bg).

**Field-name correspondence rule** (RESEARCH §"Pattern 6"): every field on the React `<form>` must appear in this hidden form. Mismatch = Netlify silently drops submissions.

---

### `tailwind.config.js` (MODIFIED — token-first spruce diff per D-09)

**Analog:** the file itself (62 lines) — token block already canonical.

**Current shape** (lines 30-56):
```js
extend: {
	colors: {
		'primary-light': '#F7F8FC',
		'secondary-light': '#FFFFFF',
		'ternary-light': '#f6f7f8',
		'primary-dark': '#291c30',
		'secondary-dark': '#102D44',
		'ternary-dark': '#1E3851',
		'secondary-section-light': '#d1d1d1ff',
		'secondary-section-dark': '#594a60',
		'ternary-section-dark': '#94989c',
		'accent': '#348bd8',
		'accent-highlight': '#3c6eb1',
	},
	container: {
		padding: {
			DEFAULT: '1rem', sm: '2rem', lg: '5rem',
			xl: '6rem', '2xl': '8rem',
		},
	},
},
```

**Constraints (per D-08):**
1. NO color changes — the palette above is canonical.
2. NO typography changes — no new fonts, no size-token changes.
3. NO new spacing tokens — Tailwind's default 4-pt scale is sufficient (UI-SPEC §"Spacing").

**Where the spruce token diff slots in (D-09 leaves content to planner):**
- IF the planner introduces section-rhythm tokens (e.g., a `spacing.section` value), it slots into `theme.extend.spacing` — not in `theme.extend.colors`.
- IF the planner introduces a CSS-variable-driven approach instead of a Tailwind token (CONTEXT D-09 alternative), it goes in `src/css/tailwind.css` as a `:root { --section-y: 6rem; }` block. Tailwind config is NOT touched in that case.
- The planner picks one approach (Tailwind tokens OR CSS variables) — D-09 leaves the choice open. Default in auto-mode: prefer NO new tokens; rely on existing scale per UI-SPEC §"Spacing".

**Preserve verbatim:** `darkMode: 'class'`, the `ternary` typo (CLAUDE.md), the container padding scale, the `@tailwindcss/forms` plugin reference (line 61).

---

### `package.json` (MODIFIED — install + remove deps)

**Analog:** the file itself (60 lines).

**Current `dependencies`** (lines 9-25):
- Has `styled-components: "^6.0.0-rc.3"` (line 23) — REMOVE (no `import` of styled-components remains; verified by `rg`).

**Required diffs (per CONTEXT D-29 + RESEARCH §"Standard Stack New for Phase 2"):**
1. Add `"@sanity/image-url": "^2.1.1"` to `dependencies`.
2. Add `"react-helmet-async": "^2.0.5"` to `dependencies`.
3. Remove `"styled-components": "^6.0.0-rc.3"` from `dependencies`.
4. Add `"postbuild": "node scripts/generate-sitemap.cjs"` to `scripts` (RESEARCH §"Pattern 5"):
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

**Install command** (RESEARCH lines 213-216):
```bash
pnpm add @sanity/image-url@^2.1.1 react-helmet-async@^2.0.5
pnpm remove styled-components
```

**Pin rationale:** `react-helmet-async@^2.0.5` not `^3.0.0` (RESEARCH §"Pitfall 7" — v3 is 2 months old as of writing, no production track record on React 18).

---

### `scripts/generate-sitemap.cjs` (NEW — postbuild Node script)

**Analog:** none in tree (no `scripts/` dir exists).

**Pattern source:** RESEARCH §"Pattern 5" (lines 718-758):
```js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');

const STATIC_ROUTES = ['/', '/styles', '/3d-printing', '/about', '/contact', '/shop'];
const BASE_URL = 'https://shapesmith.studio';

const client = createClient({
	projectId: 'qx9kep1e',
	dataset: 'production',
	useCdn: true,
	apiVersion: '2023-06-16',
});

const QUERY = `{
	"laserSlugs": *[_type == "laser-style" && defined(slug.current)].slug.current,
	"printSlugs": *[_type == "print-style" && defined(slug.current)].slug.current
}`;

(async () => {
	const { laserSlugs = [], printSlugs = [] } = await client.fetch(QUERY);
	const dynamic = [
		...laserSlugs.map((s) => `/styles/${s}`),
		...printSlugs.map((s) => `/3d-printing/${s}`),
	];
	const today = new Date().toISOString().slice(0, 10);
	const urls = [...STATIC_ROUTES, ...dynamic].map(
		(u) => `\t<url><loc>${BASE_URL}${u}</loc><lastmod>${today}</lastmod></url>`
	).join('\n');
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
	fs.writeFileSync(path.join(__dirname, '..', 'build', 'sitemap.xml'), xml);
	console.log(`sitemap.xml written with ${STATIC_ROUTES.length + dynamic.length} URLs`);
})();
```

**File extension:** `.cjs` (CommonJS) — required because `package.json` has no `"type": "module"`. Node treats `.js` as CommonJS by default but `.cjs` is explicit. RESEARCH lines 357 + 720 confirm.

**Auto-trigger:** `pnpm` runs `postbuild` automatically after `pnpm build` per npm/pnpm lifecycle hooks (RESEARCH §"Netlify behavior" lines 775).

**Hardcoded `projectId` / `dataset` / `apiVersion`:** Match `src/utilities/sanityClient.jsx` exactly. CONTEXT.md defers env-driven config to Phase 4 (Vite migration).

---

### `public/_redirects` (NEW — Netlify static redirect)

**Analog:** none in tree.

**Pattern source:** RESEARCH §"Pattern 3 Note 1" (lines 626-630):
```
# public/_redirects (NEW — Netlify reads this verbatim)
/materials  /styles#materials  301
```

**Why both this AND the SPA `<Navigate>`:** `<Navigate>` handles client-side hops within the SPA after JS loads. `_redirects` handles direct hits, crawler requests, and link previews — gives a real 301 status code that search engines respect for index updates.

**File location:** `public/_redirects` (Netlify reads from build output; CRA copies `public/` to `build/` verbatim).

---

### `README.md` (FULL REWRITE — replace CRA boilerplate)

**Analog:** none — current README.md (71 lines) is CRA boilerplate template; nothing to copy from.

**Pattern source:** CONTEXT D-31 verbatim:
- Project overview (1 paragraph)
- Tech stack (1-2 sentences)
- Quickstart (`pnpm install` / `pnpm start` / `pnpm build` with `--openssl-legacy-provider` note)
- Content-update guide (how owner edits Sanity for studio-info / faq / styles)
- Deploy notes (Netlify)
- Links to `.planning/PROJECT.md` for deeper context

**This is a full rewrite, not an edit.** The existing `# Getting Started with Create React App` heading and all sub-headings should be replaced wholesale.

---

## Shared Patterns (Cross-Cutting)

### Sanity Fetch Contract

**Source:** `src/hooks/useSanityQuery.jsx` (37 lines)

**Apply to:** Every new context provider, every new in-page section that fetches Sanity data. Banned: inline `useEffect(() => sanityClient.fetch(...).then(setX))` patterns (CONTEXT.md anti-pattern; Phase 1 retrofitted them all).

**Concrete excerpt (analog lines 1-37):**
```jsx
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
			.then((result) => { setData(result); setLoading(false); })
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
```

**Usage rule for Phase 2:** Every Sanity fetch goes through `useSanityQuery`. Pass GROQ params via the `params` argument (not string interpolation), and include any param keys in `deps` so the hook re-fetches on change.

---

### GROQ Projection Contract (D-05)

**Source:** RESEARCH §"Pattern 1" lines 380-405 + §"Pitfall 3"

**Rule:** The shared GROQ projection in `ServicesContext` must only project fields that exist in BOTH `laser-style` AND `print-style` schemas. Service-specific fields (e.g., laser's `kerf` if added later) go in a per-service GROQ extension layered on top, not in the shared projection.

**Apply to:** `ServicesContext.jsx`, schema spec doc.

**Field list (Phase 2 baseline)** — both schemas mirror these exactly:
```
_id, order, title, description, header, slug,
preferredMaterials, considerations,
turnaround, wontMakeScope,
seo{ metaTitle, metaDescription, ogImage{ asset->{ _id, url, altText } } },
listImage{ altText, asset->{ _id, url, altText } },
detailImages[]{ altText, asset->{ _id, url, altText } }
```

---

### Error Handling Pattern (silent-empty)

**Source:** Phase 1's `useSanityQuery.jsx:23-28` (catches into state) + AboutMeContext / ProjectsContext silent-empty rendering pattern.

**Apply to:** Every section component that fetches via `useSanityQuery`. When `loading` is false and `data` is empty, render the section's empty-state copy from UI-SPEC §"Empty / pending states". Do NOT alert, do NOT throw — silent empty.

**Discretionary polish (UI-SPEC Open Question 5):** Inline 1-line "Couldn't load this section. Please refresh, or contact us if it keeps happening." note when `error` is set. Default in auto-mode: planner's discretion — include only if there's a clean place to render it without designing a global error UI. Phase 1 left `.catch(console.error)` in the hook; Phase 2 is not the moment to introduce a global error boundary.

---

### Form Submit Pattern (Netlify Forms)

**Source:** `src/components/contact/ContactForm.jsx` lines 13-49 (encoder + handleSubmit + state-driven success).

**Apply to:** Both `ContactForm.jsx` (modified) and `Shop.jsx` (Coming Soon email form).

**Required shape:**
1. `useState` for each field.
2. `encode` helper (or shared `encodeFormData` utility).
3. `fetch("/", { method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"}, body: encode({...}) })` — relative URL (RESEARCH Pitfall 5).
4. Hidden `<input type="hidden" name="form-name" value="contact-form" />` (or `shop-notify`) — first field.
5. CSS-hidden honeypot field per D-26 (`bot-field`).
6. Success branch: `setFormSubmitted(true)` → render confirmation message, hide form.
7. Error branch: `console.error(err)`, optional inline error message — no `alert()`.
8. Field names must match the hidden `<form>` declaration in `public/index.html` exactly (RESEARCH Pitfall 4).

---

### CSS-Hidden Honeypot Pattern (D-26)

**Source:** RESEARCH §"Code Examples §Example 4" (line 1462) + UI-SPEC §"Form labels & hints":

```jsx
<div className="absolute left-[-10000px] top-auto w-px h-px overflow-hidden" aria-hidden="true">
	<label htmlFor="bot-field">Don't fill this out if you're human:</label>
	<input
		id="bot-field"
		name="bot-field"
		type="text"
		tabIndex={-1}
		autoComplete="off"
		value={formBotField}
		onChange={(e) => setFormBotField(e.target.value)}
	/>
</div>
```

**Apply to:** `ContactForm.jsx` (replaces visible honeypot at lines 87-97), `Shop.jsx` (new Coming Soon form).

**Forbidden:** `display: none`. D-26 explicitly forbids it (some bots skip those). The Tailwind `.sr-only` utility is also acceptable as an alternative — same CSS-hidden semantics.

---

### External Link Safety Pattern (D-30)

**Source:** Affected files: `src/components/shared/AppFooter.jsx:16`, `src/components/shared/AppFooterCopyright.jsx:7,15`, `src/components/reusable/SocialLinks.jsx:42`.

**Required fix:**
1. `target="__blank"` (typo, double underscore) → `target="_blank"` (single underscore — the canonical HTML attribute).
2. Add `rel="noopener noreferrer"` to every `target="_blank"` link touched during the spruce sweep.

**Scope-limited (D-30):** Only links touched during the per-route sweep, not a separate audit. The four files above ARE touched during the sweep (footer is on every route, SocialLinks is on Contact + About).

---

### Spruce Token Sweep (D-09)

**Source:** UI-SPEC §"Per-Route Spruce Checklist" (9 routes named explicitly: `/`, `/styles`, `/styles/:slug`, `/3d-printing`, `/3d-printing/:slug`, `/about`, `/contact`, `/shop`, `/404`).

**Apply to:** Every page component during the visual spruce wave.

**Acceptance test:** Open every route on a single deploy preview. Background, surface colors, typography rhythm, button color all consistent. No `bg-indigo-500` survives. No `accent` fill outside the 10% reserved-for list (UI-SPEC §"Color §Accent reserved for").

---

### Indigo → Accent CTA Swap (UI-SPEC Open Question 2)

**Source:** UI-SPEC §"Color §Indigo CTA (legacy — to remove)".

**Affected files (auto-mode default = swap):**
- `src/components/contact/ContactForm.jsx:153` — `bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-900` → `bg-accent hover:bg-accent-highlight focus:ring-accent`.
- `src/components/home/QuickInfo.jsx:14` — `hover:text-indigo-600 dark:hover:text-indigo-300` → `hover:text-accent` (resting state stays neutral).
- `src/components/projects/ProjectsGrid.jsx:31` — `hover:text-indigo-600 dark:hover:text-indigo-300` → `hover:text-accent` (during the rename to `services/ServicesGrid.jsx`).
- `src/components/reusable/SocialLinks.jsx:44` — `hover:text-indigo-500 dark:hover:text-indigo-400` → `hover:text-accent`.

---

## No Analog Found

Files with no close match in the codebase. Planner should use RESEARCH.md patterns instead, or accept the file as a new component category:

| File | Role | Data Flow | Reason | Pattern Source |
|------|------|-----------|--------|----------------|
| `src/components/shared/SEOHead.jsx` | shared component (SEO) | props → Helmet | No react-helmet usage anywhere yet | RESEARCH §"Code Examples §Example 4" |
| `src/components/shared/JsonLdLocalBusiness.jsx` | shared component (SEO) | Sanity → JSON-LD | No JSON-LD usage anywhere yet | RESEARCH §"Code Examples §Example 2" |
| `src/components/shared/Placeholder.jsx` | shared component (visual) | static props | No graceful-degradation placeholders exist | UI-SPEC §"Photography placeholder color (D-11)" |
| `src/components/services/FAQ.jsx` | leaf component | Sanity → list | No FAQ surface exists | RESEARCH §"Don't Hand-Roll" + §"Sanity Schema Specifications §faq" |
| `src/components/services/WontMake.jsx` | leaf component | portable text → render | No portable-text rendering exists | RESEARCH §"Sanity Schema Specifications" |
| `src/components/services/TrustCopyBlock.jsx` | leaf component | cross-doc Sanity merge | No cross-doc fact panels exist | UI-SPEC §"Component Inventory" + RESEARCH §"Standard Stack" |
| `src/utilities/sanityImage.jsx` | utility | image-builder wrap | No `@sanity/image-url` use yet | RESEARCH §"Code Examples §Example 1" |
| `src/components/shared/SanityImage.jsx` | leaf component | srcSet image | No responsive srcSet usage yet | RESEARCH §"Code Examples §Example 1" |
| `scripts/generate-sitemap.cjs` | build script | Sanity → file | No build scripts exist (no `scripts/` dir) | RESEARCH §"Pattern 5" |
| `public/_redirects` | Netlify config | static | No Netlify config files in repo (config is dashboard-driven currently) | RESEARCH §"Pattern 3 Note 1" |
| `public/og-default.png` | static asset | image | New asset — owner-supplied or planner-supplied logo on dark bg | UI-SPEC §"og:image strategy" (D-20) |
| `README.md` (rewrite) | docs | static | Current is CRA boilerplate — full rewrite | CONTEXT D-31 |
| Sanity schema spec doc (`SCHEMA-SPEC.md` in phase dir or owner's Studio repo) | docs | static | New planning artifact | RESEARCH §"Sanity Schema Specifications" |

---

## Anti-Patterns Banned (Cross-Phase)

These are forbidden in any new file or modification in Phase 2:

1. **`if (serviceKey === 'shop') { ... }` branches inside `ServicesContext`** — D-04 forbids it. Shop gets its own context in Bundle 3.
2. **Hardcoded `#hex` values in JSX** — Pitfall 4 (half-spruce) flag. Use Tailwind tokens (`bg-accent`, `dark:text-primary-light`) or arbitrary `bg-[#xxx]` only as last resort. Currently zero `#hex` literals in `src/` JSX/CSS modules — preserve.
3. **Inline `useEffect(() => sanityClient.fetch(GROQ).then(setX))` in components** — Phase 1 banned this; every fetch goes through `useSanityQuery`.
4. **`document.getElementById` for modal open/close** — Phase 1 fixed this. New modal/lightbox uses React state (state-driven `ProjectGallery.jsx` is already the canonical pattern).
5. **`encode(...)` helper duplicated across files** — extract to `src/utilities/encodeFormData.jsx` if used in 2+ places.
6. **Hidden form prerender drift** — every field on the React form must appear on the hidden form. Lint manually during the per-route sweep.
7. **`<Helmet>` mounted inside `<Suspense>` fallback** — would unmount on route change. Mount inside the page component itself, not in the lazy boundary.
8. **`alert()` in form handlers** — VIS-05 cleanup. Replace with state-driven feedback.
9. **`display: none` honeypot** — D-26 explicitly forbids it.
10. **`target="__blank"` (double underscore typo)** — fix to `target="_blank"` everywhere it appears (4 sites).
11. **New color tokens or font families in `tailwind.config.js`** — D-08 forbids.
12. **Splitting `/materials` into per-service routes** — D-17 commits to in-page sections; `<Navigate>` redirect for the legacy route.

---

## Metadata

**Analog search scope:**
- `src/context/` (3 files: ProjectsContext, SingleProjectContext, AboutMeContext)
- `src/pages/` (8 files including Shop, Materials, Home, Contact, AboutMe, Projects, ProjectSingle)
- `src/components/projects/` (5 files — being renamed to services/)
- `src/components/shared/` (5 files — AppHeader, AppBanner, AppFooter, AppFooterCopyright, ScrollToTop)
- `src/components/home/` (5 files — Collaborations, QuickInfo, HowLasersWork, QuickSpecs, OurProcess)
- `src/components/contact/` (3 files — ContactDetails, ContactForm, contact-form.js)
- `src/components/reusable/` (3 files — FormInput, Button, SocialLinks)
- `src/components/about/` (5 files — AboutMeBio, CounterItem, AboutClients, AboutClientSingle, AboutCounter)
- `src/components/HireMeModal.jsx`, `src/components/BackToTop.jsx`, `src/components/ScrollToTop.jsx`
- `src/hooks/` (2 files: useSanityQuery, useScrollToTop)
- `src/utilities/` (2 files: helpers, sanityClient)
- `src/data/` (6 files including services.js)
- `src/materials/MaterialSingle.jsx`
- `src/App.js`, `src/index.js`, `src/App.test.js`
- `public/index.html`, `public/robots.txt`, `tailwind.config.js`, `package.json`, `README.md`

**Files scanned:** 53 source files in working tree (verified by `find src -type f`).

**Verification commands run during this mapping:**
- `wc -l` for cleanup-target line counts (matches RESEARCH §"Cleanup Scope" verification 2026-05-06)
- `grep -rn 'target="__blank"'` — 4 hits in 3 files: AppFooter.jsx, AppFooterCopyright.jsx, SocialLinks.jsx (matches CONCERNS.md)
- `grep -rn 'styled-components'` — 0 hits in `src/` (safe to remove from package.json)
- `grep -rn 'getImageUrl\|isProd'` — only self-references in `src/utilities/helpers.jsx` (safe to delete)

**Pattern extraction date:** 2026-05-06

**Open Questions for Planner (carried from RESEARCH):**
1. Sanity slug shape (`{ current: "..." }` object vs string) — Wave 1 spike resolves.
2. `material.processes` current shape (reference array vs string array) — Wave 1 spike + owner verification resolves.
3. Hero composition (split-cards-with-shared-CTA vs single-composition) — UI-SPEC defaults to split-cards; planner may swap.
4. Indigo → accent swap auto-applied in spruce sweep (UI-SPEC defaults: yes).
5. `/404` route inclusion (UI-SPEC defaults: yes).
6. Active-state nav indicator (UI-SPEC defaults: `border-b-2 border-accent`).
7. Inline Sanity-fetch error copy (UI-SPEC defaults: planner discretion).
