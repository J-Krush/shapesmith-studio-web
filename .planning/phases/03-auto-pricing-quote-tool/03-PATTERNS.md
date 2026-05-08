# Phase 3: Auto-Pricing Quote Tool — Pattern Map

**Mapped:** 2026-05-07
**Files analyzed:** 22 (across Plans 03-01..03-NN)
**Analogs found:** 18 / 22

> Phase 3 ships across multiple plans. Plan 03-01 = stub (route + tabs + dropzone + geometry readouts). Plans 03-02..03-NN = pricing-rule schema, material picker, quantity, price-range display, Netlify Function + Resend submission, reCAPTCHA v3, DOMPurify, localStorage persistence. This PATTERNS.md maps every file likely to be touched across the whole phase.

---

## File Classification

| New/Modified File | Plan | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|------|-----------|----------------|---------------|
| `src/pages/Quote.jsx` | 03-01 | page (route shell) | request-response | `src/pages/Contact.jsx` | exact (page + SEOHead + framer-motion wrapper) |
| `src/App.js` (MODIFY) | 03-01 | router config | route-registration | self (existing lazy-load block, lines 14-20, 35-65) | exact (in-file) |
| `scripts/generate-sitemap.cjs` (MODIFY) | 03-01 | build script | static-list | self (line 17 `STATIC_ROUTES`) | exact (in-file) |
| `src/components/quote/QuoteTabs.jsx` | 03-01 | UI component (state-owning) | event-driven (tab clicks + URL/referrer pre-fill) | `src/components/contact/ContactForm.jsx` (lines 13-52, pre-fill cascade) + `src/components/shared/AppHeader.jsx` (lines 42-50, active-route border-b-2 border-accent) | role-match (no existing tabs in repo — first tabs UI; pre-fill cascade is exact analog) |
| `src/components/quote/FileDropzone.jsx` | 03-01 | UI component (controlled) | event-driven (drag/drop/picker) | none — first dropzone in repo. Style anchors: `FormInput.jsx` (input styling, lines 15-32), `Shop.jsx` honeypot/hidden-input (lines 64-80), `MaterialsSection.jsx` empty-state (lines 27-39) | no analog — extrapolate from styling patterns |
| `src/components/quote/GeometrySummary.jsx` | 03-01 | UI component (presentational) | render-only | `src/components/services/FAQ.jsx` (panel + heading rhythm, lines 50-72) | partial-match (panel styling; definition-list rhythm is new) |
| `src/utilities/quote/parseStl.js` | 03-01 | pure parser | transform (ArrayBuffer → metadata) | `src/utilities/encodeFormData.jsx` (small pure function, named export) | partial-match (utility shape only; STL math is new) |
| `src/utilities/quote/parseObj.js` | 03-01 | pure parser | transform (text → metadata) | `parseStl.js` (sibling) | role-match |
| `src/utilities/quote/parseSvg.js` | 03-01 | pure parser | transform (text → metadata) | `parseStl.js` (sibling) | role-match |
| `src/components/shared/AppHeader.jsx` (MODIFY) | 03-01 | nav update | static-list | self (line 15-26 `NAV_ITEMS`) | exact (in-file) |
| `src/data/services.js` (POSSIBLY MODIFY) | 03-01 | static config | data | self (lines 1-16) | exact (in-file) |
| `src/components/services/ServiceHeader.jsx` or service grid (MODIFY for hero CTA) | 03-01 | UI component | render-only | self + `Projects.jsx` (lines 41-46 — `text-accent` link pattern) | exact (in-file insertion point) |
| `studio/schemas/pricing-rule.js` | 03-02+ | Sanity schema | data | Phase 2 `02-SCHEMA-SPEC.md` (FAQ + studio-info schema rollout) | role-match (schema rollout pattern; pricing-rule is a new doc type) |
| `src/components/quote/MaterialPicker.jsx` | 03-02+ | UI component (Sanity-driven `<select>`) | request-response (Sanity) | `src/components/contact/ContactForm.jsx` lines 162-186 (`<select>` styling + SERVICES.map options) + `src/components/services/MaterialsSection.jsx` lines 12-18 (`useSanityQuery` filtered by service) | exact (composite) |
| `src/components/quote/QuantityInput.jsx` | 03-02+ | UI component | event-driven | `src/components/reusable/FormInput.jsx` (lines 14-33) | exact (number-typed variant) |
| `src/components/quote/PriceRange.jsx` | 03-02+ | UI component (presentational) | render-only | `src/components/services/FAQ.jsx` panel rhythm + `ContactForm.jsx` line 220 (accent CTA color) | partial-match |
| `src/utilities/quote/calculatePrice.js` | 03-02+ | pure helper | transform | `parseStl.js` shape (named export, plain `.js`, no JSX) | role-match |
| `src/hooks/useLocalStorageState.jsx` | 03-02+ | hook | client-state | `src/hooks/useSanityQuery.jsx` (hook structure + lines 4-35) | partial-match (hook shape; no Sanity, no AbortController) |
| `netlify/functions/submit-quote/submit-quote.js` | 03-02+ | Netlify Function (serverless) | request-response (POST → email) | none — first Netlify Function in repo. Style anchors: `scripts/generate-sitemap.cjs` (CommonJS Node module shape) | no analog (new tier) |
| `netlify/functions/submit-quote/package.json` | 03-02+ | function-local config | static config | none — first function-local package.json. Anchor: root `package.json` shape | no analog |
| `netlify.toml` | 03-02+ | platform config | static config | none — first netlify.toml. RESEARCH.md Pattern 5 has the exact 3-line block | no analog |
| `src/components/quote/QuoteSubmitForm.jsx` | 03-02+ | UI component (form) | request-response (POST to function) | `src/components/contact/ContactForm.jsx` (lines 1-247 — full form lifecycle) + `src/pages/Shop.jsx` (lines 14-32 — fetch-based submit handler) | exact (composite — submission shape differs: JSON to function, not URL-encoded to Netlify Forms) |
| `public/index.html` (MODIFY) | 03-02+ | static HTML | static config | self + Phase 2 prerender form pattern (lines 34-45) | exact (in-file) |

---

## Pattern Assignments

### `src/pages/Quote.jsx` (page, request-response) — Plan 03-01

**Analog:** `src/pages/Contact.jsx` (lines 1-46) — same shape: `SEOHead` + `motion.div` wrapper + composition of feature components. `src/pages/Shop.jsx` is a secondary anchor (lines 34-110) for the H1 + container/section rhythm.

**Imports + SEOHead pattern** (from `Contact.jsx:1-15`):
```jsx
import { motion } from 'framer-motion';
import SEOHead from '../components/shared/SEOHead';
// ...feature components

const Quote = () => {
	return (
		<>
			<SEOHead
				title="Get a Quote"
				description="Upload your STL, OBJ, or SVG and get an instant ballpark estimate."
				ogUrl="https://shapesmith.studio/quote"
				ogImage={{ url: '/og-default.png', altText: 'Shapesmith Studio quote tool' }}
			/>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ ease: 'easeInOut', duration: 0.5, delay: 0.1 }}
			>
				{/* QuoteTabs + active panel */}
			</motion.div>
		</>
	);
};

export default Quote;
```

**Section rhythm pattern** (from `Shop.jsx:42-43`):
```jsx
<section className="py-12 sm:py-24 mt-12 sm:mt-24">
	<div className="container mx-auto text-center max-w-xl px-4">
		<h1 className="font-display font-black text-3xl sm:text-4xl text-primary-dark dark:text-primary-light mb-6">
			Get an instant ballpark.
		</h1>
		{/* subhead + tabs */}
```

Notes:
- `dark:` pairing on every color/text token. Page is rendered dark-only but the pairing is the convention.
- `font-display font-black text-3xl sm:text-4xl` for H1 (matches UI-SPEC §Typography Display row).
- Use `font-display font-bold text-2xl sm:text-3xl` for any sub-section heading (matches `MaterialsSection.jsx:24` and `FAQ.jsx:53`).

---

### `src/App.js` (router config, route-registration) — Plan 03-01

**Analog:** Self — existing lazy-load block in `App.js:14-20` and route block in `App.js:35-65`.

**Lazy import pattern** (insert next to existing lazies, `App.js:14-20`):
```jsx
const About = lazy(() => import('./pages/AboutMe'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Home = lazy(() => import('./pages/Home'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectSingle = lazy(() => import('./pages/ProjectSingle.jsx'));
const Shop = lazy(() => import('./pages/Shop'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Quote = lazy(() => import('./pages/Quote'));   // ADD
```

**Route registration pattern** (insert into `<Routes>` block before `<Route path="*">`, `App.js:35-65`):
```jsx
<Route path="/quote" element={<Quote />} />
```

Notes:
- Suspense fallback is the empty string `""` (intentional, see ARCHITECTURE.md Layers section). Do not change.
- The `/404` catch-all `<Route path="*" element={<NotFound />} />` MUST stay last (`App.js:64` comment).
- DO NOT touch the existing `SERVICES.map` block at `App.js:36-47` — `/quote` is a single surface (D-04), not service-derived.

---

### `scripts/generate-sitemap.cjs` (build script, static-list) — Plan 03-01

**Analog:** Self — `STATIC_ROUTES` array on line 17.

**Pattern** (modify line 17):
```cjs
// Before:
const STATIC_ROUTES = ['/', '/styles', '/3d-printing', '/about', '/contact', '/shop'];
// After:
const STATIC_ROUTES = ['/', '/styles', '/3d-printing', '/about', '/contact', '/shop', '/quote'];
```

Notes:
- The header comment on line 14 says "keep in sync with src/App.js when routes are added." Acknowledge in the plan.
- Sanity-driven slugs are queried separately at line 29 — `/quote` does NOT need a slug fan-out (single static route).

---

### `src/components/quote/QuoteTabs.jsx` (UI component, event-driven) — Plan 03-01

**Analog (composite):**
1. `src/components/contact/ContactForm.jsx` (lines 13-52) — `?service=` + `document.referrer` pre-fill cascade. Mirror this verbatim (same SERVICE_PREFILL_RULES idiom).
2. `src/components/shared/AppHeader.jsx` (lines 42-50) — active-route `border-b-2 border-accent` styling. UI-SPEC §"Tab UI Visual treatment" cites this verbatim.
3. RESEARCH.md Pattern 3 — WAI-ARIA tabs skeleton (no library; `role="tablist"` / `role="tab"` / `role="tabpanel"` with arrow-key nav).

**Pre-fill cascade pattern** (from `ContactForm.jsx:13-52`):
```jsx
import { useEffect, useState } from 'react';
import { SERVICES } from '../../data/services';

// Mirrors ContactForm.jsx D-24 cascade verbatim. Keep the two pre-fill
// idioms identical so future maintainers don't have to learn two.
const SERVICE_PREFILL_RULES = SERVICES.map((s) => ({
	match: `/${s.urlSegment}`,
	key: s.key,
}));

const QuoteTabs = () => {
	const [activeKey, setActiveKey] = useState('print'); // 3D default per UI-SPEC

	useEffect(() => {
		const queryService = new URLSearchParams(window.location.search).get('service');
		if (queryService) {
			const m = SERVICES.find(
				(s) => s.key === queryService || s.urlSegment === queryService
			);
			if (m) {
				setActiveKey(m.key);
				return;
			}
		}
		const referrer =
			(typeof document !== 'undefined' && document.referrer) || '';
		const rule = SERVICE_PREFILL_RULES.find((r) => referrer.includes(r.match));
		if (rule) setActiveKey(rule.key);
		// else stay at 'print' default
	}, []);

	// ... render
};
```

**Active-tab styling pattern** (from `AppHeader.jsx:47-50`):
```jsx
const tabClasses = (key) =>
	activeKey === key
		? 'text-primary-light font-general-medium border-b-2 border-accent pb-2'
		: 'text-ternary-section-dark hover:text-primary-light pb-2';
```

Notes:
- URL is NOT updated when the user clicks the other tab (UI-SPEC §"Tab UI" — read-only on mount, mirroring ContactForm).
- `framer-motion` `<AnimatePresence mode="wait">` wraps the active panel; `motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}` per UI-SPEC §"Tab UI Motion".
- Tab labels are hardcoded "3D Printing" / "Laser Cutting" per UI-SPEC §Copywriting Contract — do NOT use `s.navLabel` directly (UI-SPEC overrides nav-label casing).

---

### `src/components/quote/FileDropzone.jsx` (UI component, event-driven) — Plan 03-01

**Analog:** None directly — first dropzone in repo. Style anchors:
- `src/components/reusable/FormInput.jsx` (lines 15-32) — input + label rhythm.
- `src/pages/Shop.jsx` (lines 64-80) — off-screen hidden input pattern (re-used here for the `sr-only` `<input type="file">`).
- `src/components/services/FAQ.jsx` (lines 50-71) — panel-card aesthetic (`bg-secondary-section-dark p-6 rounded-xl`) for format-chip row + post-drop summary card.
- RESEARCH.md Pattern 4 (lines 396-461) — full skeleton, including the CRITICAL `e.preventDefault()` on BOTH `onDragOver` AND `onDrop` (Pitfall 6).

**Skeleton to copy** (from RESEARCH.md Pattern 4):
```jsx
import { useRef, useState } from 'react';
import { FiUploadCloud } from 'react-icons/fi';

const FileDropzone = ({ acceptedExtensions, maxBytes, onFile, onError }) => {
	const inputRef = useRef(null);
	const [dragActive, setDragActive] = useState(false);
	const [error, setError] = useState('');

	const validate = (file) => {
		const ext = file.name.split('.').pop().toLowerCase();
		if (!acceptedExtensions.includes(ext)) {
			return { code: 'WRONG_FORMAT', ext };
		}
		if (file.size > maxBytes) {
			return { code: 'TOO_LARGE', sizeMB: (file.size / 1024 / 1024).toFixed(1) };
		}
		return null;
	};

	const handleFile = (file) => {
		const err = validate(file);
		if (err) {
			setError(formatError(err)); // copy from UI-SPEC §"File-rejection error copy"
			onError?.(err);
			return;
		}
		setError('');
		onFile(file);
	};

	return (
		<div
			role="region"
			aria-label="File upload"
			onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
			onDragLeave={() => setDragActive(false)}
			onDrop={(e) => {
				e.preventDefault();
				setDragActive(false);
				const file = e.dataTransfer.files?.[0];
				if (file) handleFile(file);
			}}
			className={dragActive
				? 'border-2 border-solid border-accent bg-ternary-dark rounded-xl p-12 text-center'
				: 'border-2 border-dashed border-secondary-section-dark bg-ternary-dark/40 rounded-xl p-12 text-center cursor-pointer'}
		>
			<label htmlFor="quote-file" className="cursor-pointer block">
				<FiUploadCloud className="mx-auto text-5xl text-ternary-section-dark mb-3" />
				{dragActive
					? <p>Drop the file to upload.</p>
					: <p>Drop your {acceptedExtensions.map(e => e.toUpperCase()).join(' or ')} here. Or click to choose a file. (max {maxBytes / 1024 / 1024}MB)</p>}
			</label>
			<input
				ref={inputRef}
				id="quote-file"
				type="file"
				accept={acceptedExtensions.map(e => `.${e}`).join(',')}
				onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
				className="sr-only"
			/>
			{error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}
		</div>
	);
};
```

**Format-chip row styling** (from UI-SPEC §"File upload dropzone"):
```jsx
<span className="inline-block px-2 py-1 rounded bg-secondary-section-dark text-primary-light text-xs font-general-medium uppercase tracking-wide">STL</span>
```

Notes:
- Error copy strings come from UI-SPEC §"File-rejection error copy" — do NOT invent new wording.
- File picker is a `<label>` wrapping a `sr-only` `<input type="file">` so click-anywhere-on-zone works without nesting buttons.
- Min-height (`min-h-[12rem]` mobile / `sm:min-h-[14rem]` desktop) is per UI-SPEC §Spacing Scale "Exceptions" — these are off-scale by design.
- `react-icons/fi` is the only icon set in repo (CONVENTIONS.md Key Dependencies); use `FiUploadCloud`, `FiFile`, `FiX` only.

---

### `src/components/quote/GeometrySummary.jsx` (UI component, render-only) — Plan 03-01

**Analog:** `src/components/services/FAQ.jsx` (lines 50-72) — panel-card aesthetic (`bg-secondary-section-dark p-6 rounded-xl`). Definition-list rhythm itself has no analog in repo.

**Panel container pattern** (from `FAQ.jsx:60`):
```jsx
<div className="bg-ternary-dark rounded-xl p-6 mt-6">
	<h3 className="font-display font-bold text-2xl sm:text-3xl text-ternary-dark dark:text-ternary-light mb-8">
		Geometry summary
	</h3>
	<dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3">
		<dt className="text-sm font-general-regular text-ternary-section-dark">Volume</dt>
		<dd className="text-base font-general-medium text-primary-light">
			24.5 cm³
			<div className="text-sm text-ternary-section-dark">1.49 in³</div>
		</dd>
		{/* ...repeat for bbox, triangles, file size */}
	</dl>
</div>
```

**Loading-shimmer pattern** (Tailwind `animate-pulse`, no new utility):
```jsx
<span className="inline-block w-16 h-4 bg-secondary-section-dark/50 rounded animate-pulse" />
```

**Empty/loading guard pattern** (mirrors `MaterialsSection.jsx:27-29` `!loading && materials.length === 0`):
```jsx
{!geometry ? <ShimmerRows /> : <GeometryRows geometry={geometry} />}
```

Notes:
- UI-SPEC §"Geometry readout panel" locks: `<dl>` (NOT a card grid, NOT a table).
- SVG unit-warning footnote is `text-sm text-ternary-section-dark mt-2` with `border-l-2 border-ternary-section-dark pl-3` — appears INSIDE the panel, directly under the bbox row.
- "Reading your file…" heading (computing state) replaces "Geometry summary" — same panel, same layout.

---

### `src/utilities/quote/parseStl.js` (pure parser, transform) — Plan 03-01

**Analog (shape only):** `src/utilities/encodeFormData.jsx` (small pure named-export module). Math itself is from RESEARCH.md §Code Examples "STL parsing + signed-tetrahedra volume".

**Module shape** (from `encodeFormData.jsx:1-12`):
```js
// Pure, named export, plain .js (no JSX). No console.log.
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const loader = new STLLoader();

export const parseStl = (arrayBuffer, fileSizeBytes) => {
	const geometry = loader.parse(arrayBuffer);
	// ... signed-tetrahedra loop from RESEARCH.md
	return {
		mode: '3d',
		triangleCount,
		volumeCm3: Number(volumeCm3.toFixed(2)),
		volumeIn3: Number((volumeCm3 / 16.387).toFixed(2)),
		bbox: { w, d, h },
		fileSizeMB: Number((fileSizeBytes / 1024 / 1024).toFixed(2)),
	};
};
```

Notes:
- File extension is `.js` (NOT `.jsx`) per CONVENTIONS.md "Non-component JS modules". RESEARCH.md "Recommended Project Structure" lists these as `parseStl.js` / `parseObj.js` / `parseSvg.js`.
- Use **subpath import** `'three/examples/jsm/loaders/STLLoader.js'` (NEVER `import * as THREE from 'three'`) per RESEARCH.md Anti-Patterns + Pitfall 7.
- `Math.abs(signedVolumeMm3)` is mandatory — winding-flip safety per Pitfall 2.
- Throw a typed error `throw new Error('PARSE_FAILED')` on bad input so the dropzone can surface UI-SPEC's "Malformed STL" copy.

---

### `src/utilities/quote/parseObj.js` (pure parser, transform) — Plan 03-01

**Analog:** Sibling `parseStl.js` (same shape; same volume math; OBJLoader replaces STLLoader). RESEARCH.md §Code Examples "OBJ parsing (same volume math)" lines 911-931 has the skeleton.

```js
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const loader = new OBJLoader();

export const parseObj = (text, fileSizeBytes) => {
	const group = loader.parse(text);
	const positions = [];
	group.traverse((obj) => {
		if (obj.isMesh && obj.geometry?.attributes?.position) {
			const p = obj.geometry.attributes.position.array;
			for (let i = 0; i < p.length; i++) positions.push(p[i]);
		}
	});
	// then identical signed-tetrahedra + bbox loop as parseStl
};
```

---

### `src/utilities/quote/parseSvg.js` (pure parser, transform) — Plan 03-01

**Analog:** Sibling `parseStl.js` (module shape). Math + DOM trick are from RESEARCH.md §Code Examples "SVG parsing" lines 933-1000.

**Critical safety pattern** (RESEARCH.md Pitfall 5):
- Parse via `new DOMParser().parseFromString(text, 'image/svg+xml')` into an *isolated* document.
- For `getTotalLength()` to compute, the SVG MUST be in the live DOM — append `cloneNode(true)` to a hidden offscreen container (`position:absolute; left:-99999px`), read lengths, remove. NEVER append the user SVG to a visible container in Plan 03-01 (DOMPurify isn't yet wired).

**Skeleton:**
```js
const PX_PER_MM = 96 / 25.4;

const parseUnit = (val) => { /* returns mm or null */ };

export const parseSvg = (text, fileSizeBytes) => {
	const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
	const svg = doc.documentElement;
	if (svg.tagName !== 'svg') throw new Error('NOT_SVG');

	const vb = svg.getAttribute('viewBox')?.split(/\s+|,/).map(Number);
	const widthAttr = svg.getAttribute('width');
	const widthMm = parseUnit(widthAttr);
	let scale = 1;
	let unitWarning = false;
	if (vb && widthMm && vb[2] > 0) scale = widthMm / vb[2];
	else if (!widthMm && !vb) unitWarning = true;

	// Hidden host trick for getTotalLength()
	const host = document.createElement('div');
	host.style.cssText = 'position:absolute;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden';
	document.body.appendChild(host);
	let pathLengthMm = 0;
	let bbox = { w: 0, h: 0 };
	try {
		host.appendChild(svg.cloneNode(true));
		const liveSvg = host.querySelector('svg');
		liveSvg.querySelectorAll('path').forEach((p) => {
			pathLengthMm += p.getTotalLength() * scale;
		});
		const box = liveSvg.getBBox();
		bbox = { w: Number((box.width * scale).toFixed(1)), h: Number((box.height * scale).toFixed(1)) };
	} finally {
		host.remove();
	}

	return { mode: 'laser', pathLengthMm: Number(pathLengthMm.toFixed(1)), bbox, unitWarning, fileSizeMB: Number((fileSizeBytes / 1024 / 1024).toFixed(2)) };
};
```

Notes:
- D-16: planner choice on whether to include `<rect>`/`<circle>`/`<line>`/`<polyline>`/`<polygon>` (each is `SVGGeometryElement` and supports `getTotalLength()`). Plan-01 may include or defer.
- D-17 / Pitfall 4: `width`/`viewBox` ambiguity → emit `unitWarning: true` so `GeometrySummary.jsx` can render the footnote.

---

### `src/components/shared/AppHeader.jsx` (nav update, static-list) — Plan 03-01 (D-06)

**Analog:** Self — `NAV_ITEMS` block on lines 15-26.

**Pattern** (modify `NAV_ITEMS` lines 15-26):
```jsx
const NAV_ITEMS = [
	{ to: '/', label: 'Home', match: '/' },
	...SERVICES.map((s) => ({
		to: `/${s.urlSegment}`,
		label: s.navLabel === 'styles' ? 'Laser Cutting' : s.navLabel,
		match: `/${s.urlSegment}`,
	})),
	{ to: '/about', label: 'About', match: '/about' },
	{ to: '/shop', label: 'Shop', match: '/shop' },
	{ to: '/quote', label: 'Get a Quote', match: '/quote' },   // ADD per UI-SPEC §Top-level CTA placement
];
```

Notes:
- UI-SPEC suggests "between Shop and Contact"; Contact is a CTA pill (lines 109-117 + 138-143), not a `NAV_ITEMS` entry, so `Get a Quote` slots after `/shop`.
- Active-state styling is automatic via existing `navLinkClasses` (lines 47-50) — `border-b-2 border-accent` will apply when the user is on `/quote`.

---

### `src/data/services.js` (POSSIBLY MODIFY) (static config, data) — Plan 03-01

**Analog:** Self (lines 1-16).

**Optional extension** (planner discretion per CONTEXT.md "Reusable Assets"):
```js
export const SERVICES = [
	{
		key: 'laser',
		urlSegment: 'styles',
		navLabel: 'styles',
		sanityType: 'laser-style',
		contactSubject: 'Laser cutting',
		// OPTIONAL: surface acceptedFileFormats per service for dropzone reuse
		// acceptedFileFormats: ['svg'],
	},
	// ...
];
```

Notes:
- The service-page hero CTA (`Projects.jsx`) routes to `/quote?service=${s.urlSegment}` (NOT `?service=${s.key}`) so existing pre-fill cascade matches both `s.key` AND `s.urlSegment`.
- If `acceptedFileFormats` is added, the dropzone reads from SERVICES instead of receiving a prop literal — saves a magic-list duplication.

---

### Service-page hero CTA insertion (UI component, render-only) — Plan 03-01 (D-06)

**Analog:** `src/pages/Projects.jsx` lines 41-46 — the existing `text-accent` link pattern (`See materials ↓`). Insert the new CTA next to it OR below `<TrustCopyBlock />`.

**CTA pattern** (style from UI-SPEC §"Top-level CTA placement" + matching `ContactForm.jsx:220` button):
```jsx
import { Link } from 'react-router-dom';

<Link
	to={`/quote?service=${service.urlSegment}`}
	className="inline-block bg-accent hover:bg-accent-highlight text-white font-general-medium px-5 py-2.5 rounded-md duration-300"
>
	Estimate this in our quote tool
</Link>
```

Notes:
- Insertion point per UI-SPEC: "below the service header, above the materials section". Concretely: between `<TrustCopyBlock />` and `<MaterialsSection />` in `Projects.jsx:48-49`.
- Use `?service=${service.urlSegment}` (e.g. `styles`, `3d-printing`) so the cascade matches both `s.key` and `s.urlSegment` per `ContactForm.jsx:40-43`.

---

### `studio/schemas/pricing-rule.js` (Sanity schema, data) — Plan 03-02+

**Analog:** Phase 2 schema rollout pattern from `02-SCHEMA-SPEC.md` (FAQ + studio-info + material extension). Each plan that lands a schema ships a `03-NN-SCHEMA-SPEC.md` with the schema definition + an owner-prep checklist.

**Schema sketch** (from RESEARCH.md Pattern 6 lines 580-645):
```js
import { defineType, defineField } from 'sanity';

export default defineType({
	name: 'pricing-rule',
	type: 'document',
	title: 'Pricing Rule',
	fields: [
		defineField({
			name: 'material',
			type: 'reference',
			to: [{ type: 'material' }],
			validation: (Rule) => Rule.required(),
		}),
		defineField({ name: 'ratePerCm3', type: 'number', title: 'Rate per cm³ (USD) — 3D printing' }),
		defineField({ name: 'ratePerMm', type: 'number', title: 'Rate per mm of cut length (USD) — laser' }),
		defineField({ name: 'machineTimeMultiplier', type: 'number', initialValue: 1.0 }),
		defineField({ name: 'setupFee', type: 'number', title: 'Setup fee (USD)' }),
		defineField({ name: 'density', type: 'number', title: 'Density (g/cm³) — 3D only' }),
		defineField({ name: 'markupBufferLow', type: 'number', initialValue: 15 }),
		defineField({ name: 'markupBufferHigh', type: 'number', initialValue: 25 }),
	],
});
```

**Cardinality decision** (RESEARCH.md): one `pricing-rule` per `material` (1:1 reference from rule → material). Do NOT embed in `material` — keeps Phase 2's material schema unchanged + lets the owner publish/unpublish pricing without unpublishing the material.

Notes:
- Schema lives in the `studio/` Sanity project (separate from the SPA repo); same approach as Phase 2's faq + studio-info.
- The plan shipping this schema MUST include an owner-prep checkpoint with the schema file + a "publish at least one pricing-rule for an existing material before frontend lands" instruction (mirrors `02-SCHEMA-SPEC.md` rollout).

---

### `src/components/quote/MaterialPicker.jsx` (UI component, request-response) — Plan 03-02+

**Analog (composite):**
1. `src/components/contact/ContactForm.jsx` lines 162-186 — `<select>` styling + SERVICES.map options pattern.
2. `src/components/services/MaterialsSection.jsx` lines 12-18 — `useSanityQuery` filtered by service via GROQ `$serviceKey in services`.
3. `src/components/services/MaterialsSection.jsx` lines 27-39 — empty-state copy with `/contact` link.

**Sanity query + select pattern**:
```jsx
import useSanityQuery from '../../hooks/useSanityQuery';

// Mirrors MaterialsSection.MATERIALS_QUERY shape, extended with pricing-rule join.
const MATERIALS_QUERY = `*[_type == "material" && $serviceKey in services] | order(order asc){
	_id, title,
	"pricing": *[_type == "pricing-rule" && references(^._id)][0]{
		ratePerCm3, ratePerMm, machineTimeMultiplier, setupFee, density,
		markupBufferLow, markupBufferHigh
	}
}`;

const MaterialPicker = ({ serviceKey, value, onChange }) => {
	const { data, loading } = useSanityQuery(MATERIALS_QUERY, { serviceKey }, [serviceKey]);
	const materials = data ?? [];

	if (!loading && materials.length === 0) {
		return (
			<div>
				<p className="text-ternary-dark dark:text-ternary-light">
					We don't have any materials listed for this service yet.{' '}
					<a href="/contact" className="hover:text-accent">Contact us</a> and we'll talk through options.
				</p>
			</div>
		);
	}

	return (
		<div className="font-general-regular mb-4">
			<label className="block text-lg text-primary-dark dark:text-primary-light mb-1" htmlFor="material">
				Material
			</label>
			<select
				id="material"
				name="material"
				value={value}
				onChange={onChange}
				disabled={loading}
				className="w-full px-5 py-2 border border-gray-300 dark:border-primary-dark border-opacity-50 text-primary-dark dark:text-secondary-light bg-ternary-light dark:bg-ternary-dark rounded-md shadow-sm text-md"
			>
				<option value="">{loading ? 'Loading materials…' : 'Pick a material…'}</option>
				{materials.map((m) => (
					<option key={m._id} value={m._id}>
						{m.title}{!m.pricing && ' (pricing not configured)'}
					</option>
				))}
			</select>
		</div>
	);
};
```

Notes:
- Reuses the EXACT `<select>` className string from `ContactForm.jsx:176` — do not deviate (UI-SPEC §"Material + quantity picker" cites it).
- `useSanityQuery` returns `{ data, loading, error, refetch }` — destructure as in `MaterialsSection.jsx:18`.
- Empty-state copy is from UI-SPEC §Copywriting Contract; do not invent.
- `disabled={loading}` matches the loading state requirement in UI-SPEC §"Material + quantity picker Empty/loading states".

---

### `src/components/quote/QuantityInput.jsx` (UI component, event-driven) — Plan 03-02+

**Analog:** `src/components/reusable/FormInput.jsx` (lines 14-33). Same input shell, `type="number"`.

**Pattern** (mirror `FormInput.jsx`):
```jsx
const QuantityInput = ({ value, onChange }) => (
	<div className="font-general-regular mb-4">
		<label className="block text-lg text-primary-dark dark:text-primary-light mb-1" htmlFor="quantity">
			Quantity
		</label>
		<input
			className="w-24 px-5 py-2 border border-gray-300 dark:border-primary-dark border-opacity-50 text-primary-dark dark:text-secondary-light bg-ternary-light dark:bg-ternary-dark rounded-md shadow-sm text-md"
			type="number"
			id="quantity"
			name="quantity"
			min="1"
			max="999"
			value={value}
			onChange={onChange}
			aria-label="Quantity"
		/>
	</div>
);
```

Notes:
- `w-24` (compact width) per UI-SPEC §"Material + quantity picker Quantity input".
- Default value `1`. Browser-native steppers (no custom +/− buttons per UI-SPEC).

---

### `src/components/quote/PriceRange.jsx` (UI component, render-only) — Plan 03-02+

**Analog:** `FAQ.jsx` panel rhythm (lines 50-72) for container; `ContactForm.jsx:220` for the accent color reference (the only other accent-on-content instance in the codebase).

**Pattern**:
```jsx
import { motion } from 'framer-motion';

const formatRange = ({ low, high }) => {
	const fmt = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;
	return `${fmt(low)} – ${fmt(high)}`;
};

const PriceRange = ({ range }) => (
	<div className="mt-8 mb-2">
		<p className="text-base font-general-medium text-ternary-light mb-2">
			Ballpark estimate
		</p>
		<motion.span
			key={`${range.low}-${range.high}`}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.15 }}
			className="text-3xl sm:text-4xl font-display font-bold text-accent"
		>
			{formatRange(range)}
		</motion.span>
		<p className="text-sm text-ternary-section-dark mt-2">
			This is an estimate. Final price comes after we review your file — not a binding quote.
		</p>
	</div>
);
```

Notes:
- `text-accent` here is THE ONLY non-CTA accent-color content use in the entire site (UI-SPEC §Color "Accent reserved for" #6). Document this in the plan.
- `Intl.NumberFormat` is acceptable for thousands-separator if the planner prefers; `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })` returns `$1,234`.
- Disclaimer is NEVER dismissable, NEVER moved into a tooltip per UI-SPEC §"Disclaimer placement" (legal-posture lock).

---

### `src/utilities/quote/calculatePrice.js` (pure helper, transform) — Plan 03-02+

**Analog:** `parseStl.js` shape (named export, plain `.js`). Math from RESEARCH.md Pattern 6 lines 661-674.

```js
// Pure calculator. No imports. Input: geometry + pricing fields. Output: { low, high }.
export const calculatePrice = (geometry, pricing, quantity) => {
	const base =
		geometry.mode === '3d'
			? (geometry.volumeCm3 * pricing.ratePerCm3 + pricing.setupFee) *
				pricing.machineTimeMultiplier *
				quantity
			: (geometry.pathLengthMm * pricing.ratePerMm + pricing.setupFee) *
				pricing.machineTimeMultiplier *
				quantity;

	const low = base * (1 + pricing.markupBufferLow / 100);
	const high = base * (1 + pricing.markupBufferHigh / 100);
	return { low, high };
};
```

Notes:
- QTE-05 lock: ALWAYS return `{ low, high }`. Even if `markupBufferLow === markupBufferHigh`, the consumer renders `$X – $X` (em-dash format never collapses).
- File extension `.js`. Lives at `src/utilities/quote/calculatePrice.js` next to the parsers.

---

### `src/hooks/useLocalStorageState.jsx` (hook, client-state) — Plan 03-02+

**Analog:** `src/hooks/useSanityQuery.jsx` (hook structure, lines 4-35). Same `useState`+`useEffect` shape; no AbortController; no GROQ.

**Pattern** (from RESEARCH.md Pattern 7):
```jsx
import { useState, useEffect } from 'react';

const useLocalStorageState = (key, initialValue) => {
	const [value, setValue] = useState(() => {
		try {
			const stored = window.localStorage.getItem(key);
			return stored !== null ? JSON.parse(stored) : initialValue;
		} catch {
			return initialValue;
		}
	});

	useEffect(() => {
		try {
			if (value === undefined || value === null) {
				window.localStorage.removeItem(key);
			} else {
				window.localStorage.setItem(key, JSON.stringify(value));
			}
		} catch {
			// QuotaExceededError / disabled — fail silently
		}
	}, [key, value]);

	return [value, setValue];
};

export default useLocalStorageState;
```

Notes:
- File extension is `.jsx` per CONVENTIONS.md (matches `useSanityQuery.jsx`, `useScrollToTop.jsx`, `useThemeSwitcher.jsx`).
- Storage key: `shapesmith-quote-v1` (RESEARCH.md "Storage key").
- Stored shape: `{ tab, materialId, quantity }` ONLY — NEVER file contents (privacy + 5MB cap).
- Auto-clear on submit: pass `setQuoteState(null)` after successful POST.

---

### `netlify/functions/submit-quote/submit-quote.js` (Netlify Function, request-response) — Plan 03-02+

**Analog:** None in the SPA. Closest analog for CommonJS Node module shape: `scripts/generate-sitemap.cjs` (lines 1-72). Skeleton from RESEARCH.md Pattern 5 lines 477-555.

**Skeleton**:
```js
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
	if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

	let payload;
	try { payload = JSON.parse(event.body); }
	catch { return { statusCode: 400, body: 'Invalid JSON' }; }

	const required = ['name', 'email', 'service', 'recaptchaToken', 'metadata'];
	for (const k of required) {
		if (!payload[k]) return { statusCode: 400, body: `Missing ${k}` };
	}

	// reCAPTCHA v3 server verify
	const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			secret: process.env.RECAPTCHA_SECRET_KEY,
			response: payload.recaptchaToken,
		}),
	});
	const verifyJson = await verifyRes.json();
	if (!verifyJson.success || (verifyJson.score ?? 0) < 0.5) {
		return { statusCode: 403, body: 'Spam check failed' };
	}

	try {
		await resend.emails.send({
			from: 'Shapesmith Studio <quotes@shapesmith.studio>',
			to: ['jkrush@shapesmith.studio'],
			reply_to: payload.email,
			subject: `[Quote] ${payload.service} — ${payload.name}`,
			text: formatQuoteText(payload),
		});
	} catch (e) {
		console.error('Resend failed:', e);
		return { statusCode: 502, body: 'Email send failed' };
	}

	return {
		statusCode: 200,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ok: true }),
	};
};
```

Notes:
- CommonJS (`exports.handler`, `require`) — Netlify Functions default. NOT an ES module.
- Threshold `0.5` per Pitfall 9 default; tune up only with real spam data.
- Email body is plain text via `formatQuoteText(p)` helper (RESEARCH.md lines 538-554) — no React Email template, no HTML.
- Sender domain `quotes@shapesmith.studio` MUST be verified in Resend dashboard BEFORE this plan ships (Pitfall 8 + owner-prep checkpoint).
- Range format in email is `$low – $high` per QTE-05 (NEVER a point value, even in the owner email).

---

### `netlify/functions/submit-quote/package.json` (function-local config) — Plan 03-02+

**Analog:** None in repo. Anchor: root `package.json` shape.

**Pattern** (from RESEARCH.md Pattern 5 lines 559-567):
```json
{
	"name": "submit-quote",
	"private": true,
	"dependencies": {
		"resend": "^6.12.3"
	}
}
```

Notes:
- Function-local. Netlify auto-installs at build time.
- The root `package.json` does NOT include `resend` — keeps the SPA bundle clean (RESEARCH.md Anti-Patterns "Bundling resend into the SPA").

---

### `netlify.toml` (platform config) — Plan 03-02+

**Analog:** None. Anchor: RESEARCH.md Pattern 5 lines 467-472.

**Pattern**:
```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

Notes:
- This is the FIRST `netlify.toml` in the repo. Existing Netlify config lives in the dashboard only (per `.planning/codebase/STACK.md` "no `netlify.toml`/`vercel.json` checked in").
- If this plan adds redirects or build env vars, they go in this same file — but stay scoped to function config for this phase.

---

### `src/components/quote/QuoteSubmitForm.jsx` (UI component, request-response) — Plan 03-02+

**Analog (composite):**
1. `src/components/contact/ContactForm.jsx` (lines 1-247) — full form lifecycle: useState fields, pre-fill, handleSubmit, success state full-form replacement, error state inline message.
2. `src/pages/Shop.jsx` (lines 14-32) — `fetch('/' or '/.netlify/functions/...')` with JSON body + `setSubmitted(true)` on resolve.
3. UI-SPEC §"Submit affordance + states" — idle/loading/success/failure states.

**Submission shape difference from ContactForm**: ContactForm POSTs URL-encoded form data to `/` (Netlify Forms). This component POSTs JSON to `/.netlify/functions/submit-quote`. Do NOT use `encodeFormData` — payload is JSON.

**Skeleton** (mirrors `ContactForm.jsx` lifecycle, but JSON + Function endpoint):
```jsx
import { useState } from 'react';

const QuoteSubmitForm = ({ payload, onSubmitted }) => {
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [submitError, setSubmitError] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitError(null);
		setSubmitting(true);

		try {
			const recaptchaToken = await window.grecaptcha.execute(
				process.env.REACT_APP_RECAPTCHA_SITE_KEY,
				{ action: 'submit_quote' }
			);
			const res = await fetch('/.netlify/functions/submit-quote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...payload, recaptchaToken }),
			});
			if (!res.ok) throw new Error('SUBMIT_FAILED');
			setSubmitted(true);
			onSubmitted?.();
		} catch (err) {
			console.error('Quote submit failed:', err);
			setSubmitError(
				'Something went wrong sending this. Try again, or email us directly.'
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (submitted) {
		// Mirrors ContactForm.jsx lines 84-99 success-state full-form replacement
		return (
			<div className="text-center max-w-xl m-4 p-6 sm:p-10 bg-secondary-light dark:bg-secondary-dark rounded-xl shadow-xl text-left">
				<span className="font-general-medium text-2xl mb-8">👍 </span>
				<p className="font-general-medium text-2xl text-primary-dark dark:text-primary-light mb-8">
					Got it — we'll be in touch.
				</p>
				<p className="text-base text-ternary-dark dark:text-ternary-light">
					We've got your details and your file metadata. We'll reply with a real quote within 1 business day.
				</p>
			</div>
		);
	}

	// Idle / submitting / error
	return (
		<form onSubmit={handleSubmit}>
			{/* name, email, message FormInput rows mirroring ContactForm.jsx:139-217 */}
			<button
				type="submit"
				disabled={submitting}
				className={
					submitting
						? 'font-general-medium px-5 py-2.5 text-white bg-accent/60 cursor-not-allowed rounded-md mt-6'
						: 'font-general-medium w-full sm:w-auto px-5 py-2.5 text-white bg-accent hover:bg-accent-highlight focus:ring-1 focus:ring-accent rounded-md mt-6 duration-500'
				}
			>
				{submitting ? 'Sending…' : 'Send this for a real quote'}
			</button>
			{submitError && (
				<p className="mt-4 text-sm text-red-400" role="alert">
					{submitError}
				</p>
			)}
		</form>
	);
};

export default QuoteSubmitForm;
```

Notes:
- Endpoint is RELATIVE (`/.netlify/functions/submit-quote`) so the same code works under `netlify dev` (port 8888) and prod.
- reCAPTCHA token is minted client-side via `grecaptcha.execute` (or `react-google-recaptcha-v3`'s `useGoogleReCaptcha` hook); verified server-side in the function.
- DO NOT use `encodeFormData` here — payload is JSON, not URL-encoded.
- DO NOT add a hidden honeypot — reCAPTCHA replaces it (the contact-form honeypot is a Netlify-Forms-specific defense).
- Reuse `FormInput.jsx` for name/email/message inputs to match ContactForm visual rhythm.

---

### `public/index.html` (MODIFY) (static HTML) — Plan 03-02+

**Analog:** Self — existing Phase 2 prerender form block (lines 34-45 per ARCHITECTURE.md).

**Modification**: Add reCAPTCHA v3 script tag in `<head>`, gated by env-var-injected site key. Concretely:
```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY" async defer></script>
```

Notes:
- Site key is **public** — safe to hardcode OR inject via `%REACT_APP_RECAPTCHA_SITE_KEY%` (CRA template substitution).
- Secret key NEVER appears in `public/index.html` or anywhere in `src/` (server-only, in Netlify env vars).
- If using `react-google-recaptcha-v3` library instead of raw script, this modification may be unnecessary — the library injects its own `<script>`. Planner picks per RESEARCH.md §Standard Stack table line 158.

---

## Shared Patterns

### Pattern S1: Sanity reads via `useSanityQuery`

**Source:** `src/hooks/useSanityQuery.jsx` (lines 4-35).
**Apply to:** `MaterialPicker.jsx`, any future `pricing-rule` consumer, any `studio-info` extension reader (e.g. response-time promise).

**Excerpt:**
```jsx
const { data, loading, error, refetch } = useSanityQuery(QUERY, params, deps);
const items = data ?? [];
```

GROQ filter idiom for service-scoped docs (from `MaterialsSection.jsx:12`):
```groq
*[_type == "X" && $serviceKey in services] | order(order asc){ ... }
```

Always pass `[serviceKey]` as the third deps argument so query refetches when the service changes (`MaterialsSection.jsx:18`).

---

### Pattern S2: `?service=` + `document.referrer` pre-fill cascade

**Source:** `src/components/contact/ContactForm.jsx` (lines 13-52).
**Apply to:** `QuoteTabs.jsx` (D-05 cites this as the template).

The cascade order is:
1. Query string `?service=` → match against `s.key` OR `s.urlSegment`.
2. `document.referrer` → match against `/${s.urlSegment}` substring.
3. Default — `print` (3D) for QuoteTabs per UI-SPEC.

**DO NOT** invent a second pre-fill idiom. Mirror ContactForm verbatim so future maintainers learn one cascade.

---

### Pattern S3: Active-route / active-tab indicator

**Source:** `src/components/shared/AppHeader.jsx` (lines 47-50).
**Apply to:** `QuoteTabs.jsx` active-tab styling.

```jsx
const navLinkClasses = (matchPath) =>
	`... ${isActive(matchPath) ? 'border-b-2 border-accent' : ''}`;
```

The `border-b-2 border-accent` token is the canonical "this is selected" affordance across the entire site.

---

### Pattern S4: Section rhythm (`py-12 sm:py-24` + `container mx-auto`)

**Source:** `MaterialsSection.jsx:22`, `FAQ.jsx:51`, `WontMake` (per UI-SPEC).
**Apply to:** `Quote.jsx` page section, the geometry-summary container, and any subordinate panel.

```jsx
<section className="py-12 sm:py-24">
	<div className="container mx-auto">
		{/* content */}
	</div>
</section>
```

---

### Pattern S5: Empty/loading state for Sanity-backed content

**Source:** `src/components/services/MaterialsSection.jsx` (lines 27-39) + `src/components/services/FAQ.jsx` (lines 31-48).
**Apply to:** `MaterialPicker.jsx`, any `pricing-rule` consumer, any future Sanity-driven block in `/quote`.

```jsx
if (!loading && items.length === 0) {
	return (
		<p className="text-ternary-dark dark:text-ternary-light">
			[Empty-state copy from UI-SPEC §Copywriting Contract]{' '}
			<a href="/contact" className="hover:text-accent">Contact us</a>
		</p>
	);
}
```

Notes:
- `data ?? []` (nullish coalescing) is the canonical un-loaded sentinel (`MaterialsSection.jsx:19`, `FAQ.jsx:29`).
- The `hover:text-accent` link style is the only on-content accent use (matches UI-SPEC §Color "Accent reserved for" #5).

---

### Pattern S6: Form submission lifecycle

**Source:** `src/components/contact/ContactForm.jsx` (lines 26-79) — useState `formSubmitted` + `submitError`; full-form replacement on success; inline `text-sm text-red-400 role="alert"` on error.
**Apply to:** `QuoteSubmitForm.jsx` (Plan 03-02+).

The shape:
```jsx
const [submitted, setSubmitted] = useState(false);
const [submitError, setSubmitError] = useState(null);

const handleSubmit = async (e) => {
	e.preventDefault();
	setSubmitError(null);
	try { /* ...submit... */ setSubmitted(true); }
	catch (err) {
		console.error('...', err);
		setSubmitError('Something went wrong... Try again, or email us directly.');
	}
};

return submitted ? <SuccessPanel /> : <Form />;
```

**Difference from ContactForm**: The Quote submit POSTs JSON to a Netlify Function (NOT URL-encoded form data to `/`). Do not import `encodeFormData`.

---

### Pattern S7: Error message styling

**Source:** `ContactForm.jsx:235-238` and `Shop.jsx:99-101`.
**Apply to:** Every error surface in Phase 3 (dropzone rejections, parse failures, submit failures).

```jsx
{error && (
	<p className="mt-4 text-sm text-red-400" role="alert">
		{error}
	</p>
)}
```

`role="alert"` is mandatory (assistive-tech announcement). `text-red-400` is the locked destructive token (UI-SPEC §Color "Destructive / error").

---

### Pattern S8: Off-screen hidden input (when used)

**Source:** `src/components/contact/ContactForm.jsx` (lines 121-137) and `src/pages/Shop.jsx` (lines 64-80).
**Apply to:** `FileDropzone.jsx`'s `<input type="file">` (use `sr-only` instead of off-screen positioning since it's a real user-facing affordance, just visually integrated into the label-as-button pattern).

Notes:
- The off-screen-positioning pattern is for HONEYPOTS specifically. The dropzone's hidden-but-clickable `<input type="file">` should use `className="sr-only"` (Tailwind utility) since it's intentionally activated by the visible label, not a deceptive lure.

---

### Pattern S9: SEOHead per route

**Source:** `src/pages/Contact.jsx` (lines 10-15), `src/pages/Shop.jsx` (lines 36-41).
**Apply to:** `Quote.jsx`.

```jsx
<SEOHead
	title="Get a Quote"
	description="Upload your STL, OBJ, or SVG and get an instant ballpark estimate."
	ogUrl="https://shapesmith.studio/quote"
	ogImage={{ url: '/og-default.png', altText: 'Shapesmith Studio quote tool' }}
/>
```

---

## No Analog Found

Files with no close match in the existing codebase. Planner uses RESEARCH.md patterns directly.

| File | Plan | Role | Why no analog | Use instead |
|------|------|------|--------------|------------|
| `src/components/quote/FileDropzone.jsx` | 03-01 | dropzone (drag + picker) | First dropzone in repo | RESEARCH.md Pattern 4 (lines 396-461) — full skeleton with critical `e.preventDefault()` on both `onDragOver` AND `onDrop` |
| `src/utilities/quote/parseStl.js` | 03-01 | STL parser | First file parser in repo | RESEARCH.md §Code Examples "STL parsing + signed-tetrahedra volume" (lines 854-906) |
| `src/utilities/quote/parseObj.js` | 03-01 | OBJ parser | First OBJ in repo | RESEARCH.md §Code Examples "OBJ parsing" (lines 911-931) — mirrors parseStl |
| `src/utilities/quote/parseSvg.js` | 03-01 | SVG parser | First SVG-DOM utility in repo | RESEARCH.md §Code Examples "SVG parsing" (lines 933-1000) — note `position:absolute; left:-99999px` hidden-host trick for `getTotalLength()` |
| `src/components/quote/QuoteTabs.jsx` (tabs) | 03-01 | first WAI-ARIA tabs in repo | First tabs UI in repo | RESEARCH.md Pattern 3 (lines 352-389) — skeleton with `role="tablist"` / `role="tab"` / `role="tabpanel"` + framer-motion crossfade |
| `netlify/functions/submit-quote/submit-quote.js` | 03-02+ | first Netlify Function | No prior serverless code | RESEARCH.md Pattern 5 (lines 477-555) — full function shape including reCAPTCHA verify + Resend |
| `netlify.toml` | 03-02+ | first toml config | No prior config | RESEARCH.md Pattern 5 (lines 467-472) — exact 3-line block |
| `studio/schemas/pricing-rule.js` | 03-02+ | pricing-rule schema | New doc type | RESEARCH.md Pattern 6 (lines 580-645) + Phase 2 `02-SCHEMA-SPEC.md` rollout pattern |

---

## Pattern Map by Plan

| Plan | Files | Primary Patterns Applied |
|------|-------|--------------------------|
| 03-01 (stub) | `Quote.jsx`, `App.js` (route), `QuoteTabs.jsx`, `FileDropzone.jsx`, `GeometrySummary.jsx`, `parseStl.js`, `parseObj.js`, `parseSvg.js`, `AppHeader.jsx` (nav), `Projects.jsx` (CTA), `services.js` (optional ext), `generate-sitemap.cjs` | Page shell from `Contact.jsx`; lazy-route from existing `App.js`; pre-fill cascade from `ContactForm.jsx`; active-tab styling from `AppHeader.jsx`; panel rhythm from `FAQ.jsx`; module shape from `encodeFormData.jsx`; static-list extensions in self |
| 03-02..N (pricing) | `studio/schemas/pricing-rule.js`, `MaterialPicker.jsx`, `QuantityInput.jsx`, `PriceRange.jsx`, `calculatePrice.js` | Schema rollout from Phase 2 `02-SCHEMA-SPEC.md`; Sanity-driven select composite (`ContactForm.jsx:170-186` + `MaterialsSection.jsx:12-18`); `FormInput.jsx` for QuantityInput; FAQ panel rhythm + accent token for PriceRange |
| 03-02..N (submission) | `useLocalStorageState.jsx`, `netlify/functions/submit-quote/*`, `netlify.toml`, `QuoteSubmitForm.jsx`, `public/index.html` (recaptcha script) | `useSanityQuery.jsx` hook shape; RESEARCH.md Pattern 5 + 7; `ContactForm.jsx` lifecycle + `Shop.jsx` JSON-fetch |

---

## Metadata

**Analog search scope:** `src/pages/`, `src/components/{contact,services,reusable,shared,quote(new)}/`, `src/hooks/`, `src/utilities/`, `src/data/`, `scripts/`, `public/`, `studio/schemas/` (planned).
**Files scanned:** 11 source files read in full (Quote-relevant pages + components + hooks + utilities) + 1 build script + Phase 2 SCHEMA-SPEC referenced.
**Pattern extraction date:** 2026-05-07.

---

## PATTERN MAPPING COMPLETE

**Phase:** 03 — Auto-Pricing Quote Tool
**Files classified:** 22 (across Plans 03-01..03-NN)
**Analogs found:** 18 / 22 (with strong-match analogs); 4 / 22 with no in-repo analog (rely on RESEARCH.md skeletons)

### Coverage
- Files with exact analog: 11 (page shell, route registration, sitemap, AppHeader nav, services.js, ServiceHeader CTA, MaterialPicker, QuantityInput, QuoteSubmitForm lifecycle, public/index.html, in-file modifications)
- Files with role-match / partial analog: 7 (QuoteTabs, GeometrySummary, parseStl/Obj/Svg shape, calculatePrice shape, useLocalStorageState shape, PriceRange)
- Files with no in-repo analog (defer to RESEARCH.md): 4 (FileDropzone, Netlify Function, netlify.toml, pricing-rule Sanity schema)

### Key Patterns Identified
- **Pre-fill cascade is the load-bearing reuse** — `ContactForm.jsx:13-52` is mirrored verbatim in `QuoteTabs.jsx`. Both surfaces honor D-24 / D-05 with one cascade idiom (query string → referrer → default), avoiding a second pre-fill mental model.
- **Sanity reads always go through `useSanityQuery`** — `MaterialsSection.jsx` and `FAQ.jsx` are the existing call sites; `MaterialPicker.jsx` and any pricing-rule consumer follow the same pattern. GROQ filter `$serviceKey in services` is canonical for service-scoped docs.
- **Submission via Netlify Function — NOT Netlify Forms** — Phase 2's `data-netlify="true"` + `public/index.html` prerender is the WRONG template for QTE-07 (no server-side reCAPTCHA verification hook). The Function path uses JSON, fetches `/.netlify/functions/submit-quote`, and bundles `resend` only inside `netlify/functions/` — never in the SPA.
- **Form lifecycle (`ContactForm.jsx:26-79`) reused for QuoteSubmitForm** — full-form replacement on success, inline `text-sm text-red-400 role="alert"` on error, `console.error` on catch. Same UX, JSON body instead of URL-encoded.
- **Accent color is heavily reserved** — UI-SPEC locks 6 specific accent uses; `text-accent` on the price-range value is the ONLY non-CTA content use of accent in the codebase. Document this in the relevant plan.
- **Three.js loaders via subpath import** — `import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'` (NEVER `import * as THREE`). Lazy-loaded with the `/quote` route so non-visitors pay zero bundle cost. Bundle delta target: ≤120 KB gzip on the `/quote` chunk; verify post-build.
- **First-of-kind components require RESEARCH.md skeletons** — FileDropzone, parsers, Netlify Function, netlify.toml, pricing-rule schema have no in-repo analog. The RESEARCH.md code examples are exact, copy-ready skeletons (with line-number references in this PATTERNS.md).

### File Created
`/Users/krush/Projects/Shapesmith Studio/shapesmith-studio-web/.planning/phases/03-auto-pricing-quote-tool/03-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can now reference analog files + line ranges + concrete code excerpts when writing 03-NN-PLAN.md action sections. RESEARCH.md skeleton references (Pattern 3, 4, 5, 6, 7 + §Code Examples) are linked for the 4 files with no in-repo analog.
