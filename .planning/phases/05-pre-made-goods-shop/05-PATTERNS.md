# Phase 5: Pre-Made Goods Shop — Pattern Map

**Mapped:** 2026-05-08
**Files analyzed:** 22 new + 4 modified = 26 total
**Analogs found:** 23 / 26 (3 have no direct analog — flagged below)

> Codebase ground truth at mapping time: Vite 7 + React 18 + JSX, `index.html` at repo root, Netlify Functions at `netlify/functions/<name>/<name>.js`, `import.meta.env.VITE_*` for client env vars. CRA artifacts have been removed by Phase 4. The "ternary" not "tertiary" Tailwind token typo is preserved throughout.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/context/ShopContext.jsx` | context provider | request-response (Sanity GROQ) | `src/context/ServicesContext.jsx` | exact |
| `src/context/SingleProductContext.jsx` | context provider | derived selector | `src/context/SingleServiceContext.jsx` | exact |
| `src/pages/Shop.jsx` (REPLACE) | page composition | request-response + branch | `src/pages/Projects.jsx` (composition); current `src/pages/Shop.jsx` (preserved Coming Soon body) | role-match |
| `src/pages/ShopSingle.jsx` | page composition | request-response | `src/pages/ProjectSingle.jsx` | exact |
| `src/components/shop/ShopComingSoon.jsx` | leaf component | form-submit (Netlify) | current `src/pages/Shop.jsx` body (extracted byte-for-byte) | exact |
| `src/components/shop/ShopCatalog.jsx` | container component | filter + map | `src/components/services/ServicesGrid.jsx` (composition shell) | role-match |
| `src/components/shop/ShopFilter.jsx` | controlled input | local state radiogroup | (no direct analog — see No Analog Found) | new pattern |
| `src/components/shop/ProductGrid.jsx` | grid container | map over data | `src/components/services/ServicesGrid.jsx` (grid markup) | exact |
| `src/components/shop/ProductCard.jsx` | leaf component | render prop | `src/components/services/ServiceCard.jsx` | exact |
| `src/components/shop/ProductHeader.jsx` | leaf component | context consume | `src/components/services/ServiceHeader.jsx` | exact |
| `src/components/shop/ProductInfo.jsx` | leaf component | context consume | `src/components/services/ServiceInfo.jsx` | role-match |
| `src/components/shop/ProductSpecTable.jsx` | leaf component | render prop | `src/components/services/TrustCopyBlock.jsx` (key/value rows w/ omit-empty) | partial-match |
| `src/components/shop/AddToCartButton.jsx` | leaf component | DOM attribute emit (Snipcart intercepts click) | (no direct analog — Snipcart-specific contract) | new pattern |
| `src/components/shop/StickyMobileAddToCart.jsx` | leaf component | IntersectionObserver + render | (no direct analog) | new pattern |
| `src/components/shop/SoldOutBadge.jsx` | leaf component | pure render | (atomic — UI-SPEC §Color is the source) | n/a |
| `src/components/shop/LowStockTag.jsx` | leaf component | pure render | (atomic — UI-SPEC §Color is the source) | n/a |
| `src/components/shared/ImageGallery.jsx` | leaf component (refactor target) | local state lightbox | `src/components/services/ServiceGallery.jsx` (refactor source — extract props-driven primitive) | exact |
| `src/css/snipcart.css` | stylesheet | CSS-variable theming | (no direct analog — Snipcart class hooks are external) | new pattern |
| `netlify/functions/snipcart-validate-product/snipcart-validate-product.js` | netlify function | request-response (JSON) | `netlify/functions/submit-quote/submit-quote.js` (Function shell, env, error shape) | role-match |
| `netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js` | netlify function | webhook validate + Resend send | `netlify/functions/submit-quote/submit-quote.js` (validate → Resend pattern) | exact |
| `netlify/functions/snipcart-order-webhook/formatOrderEmail.js` | helper module | pure transform | `netlify/functions/submit-quote/formatQuoteText.js` | exact |
| `netlify/functions/snipcart-order-webhook/package.json` | function manifest | n/a | `netlify/functions/submit-quote/package.json` | exact |
| `src/App.js` (MODIFY) | router config | route addition | `src/App.js` lines 51–62 (existing per-service route pair) | exact |
| `src/components/shared/AppHeader.jsx` (MODIFY) | nav config | constant edit | `src/components/shared/AppHeader.jsx:25` (existing `/shop` entry — verify no change needed) | exact |
| `index.html` (MODIFY) | static HTML | script tag injection | (no direct analog — Snipcart-specific) | new pattern |
| `src/index.js` (MODIFY) | bootstrap | css import | `src/index.js:3` (existing `import './index.css'` line) | exact |

---

## Pattern Assignments

### `src/context/ShopContext.jsx` (context provider, request-response)

**Analog:** `src/context/ServicesContext.jsx` (entire file, 39 lines)

**Imports + provider shell** (lines 4–8, 19–35):
```jsx
import { createContext, useContext } from 'react';
import useSanityQuery from '../hooks/useSanityQuery';
import { SERVICES } from '../data/services';

const ServicesContext = createContext();

export const ServicesProvider = ({ serviceKey, children }) => {
	const service = SERVICES.find((s) => s.key === serviceKey);
	if (!service) throw new Error(`Unknown serviceKey: ${serviceKey}`);

	const { data, loading, error, refetch } = useSanityQuery(
		SERVICES_QUERY,
		{ sanityType: service.sanityType },
		[service.sanityType]
	);

	return (
		<ServicesContext.Provider
			value={{ serviceKey, service, services: data ?? [], loading, error, refetch }}
		>
			{children}
		</ServicesContext.Provider>
	);
};

export const useServices = () => useContext(ServicesContext);
export default ServicesContext;
```

**GROQ projection pattern** (lines 10–17):
```jsx
const SERVICES_QUERY = `*[_type == $sanityType] | order(order asc){
  _id, order, title, description, header, slug,
  preferredMaterials, considerations,
  turnaround, wontMakeScope,
  seo{ metaTitle, metaDescription, ogImage{ asset->{ _id, url, altText } } },
  listImage{ altText, asset->{ _id, url, altText } },
  detailImages[]{ altText, asset->{ _id, url, altText } }
}`;
```

**What changes for the shop variant:**
- No `serviceKey` prop, no `SERVICES` lookup — shop is its own thing (Phase 2 D-04 hard rule).
- Provider shape: `<ShopProvider>` with no required prop; `value = { products: data ?? [], loading, error, refetch }`.
- Query: `*[_type == "product" && !(_id in path("drafts.**"))] | order(featured desc, _createdAt desc){ ... }` — projects fields per CONTEXT D-08 + D-09 + RESEARCH Pattern 2.
- Filter: `!(_id in path("drafts.**"))` excludes Sanity drafts (RESEARCH explicitly recommends this for owner-Studio flow).
- Hook export name: `useShop` (NOT `useShopContext`) — matches `useServices` naming convention.

---

### `src/context/SingleProductContext.jsx` (context provider, derived selector)

**Analog:** `src/context/SingleServiceContext.jsx` (entire file, 28 lines)

**Selector pattern** (lines 1–25):
```jsx
import { createContext, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ServicesContext from './ServicesContext';

const SingleServiceContext = createContext();

export const SingleServiceProvider = ({ children }) => {
	const params = useParams();
	const slug = params.slug ?? params.capability;
	const { services, loading, error } = useContext(ServicesContext);

	const singleService = useMemo(
		() => services.find((s) => s.slug?.current === slug || s.slug?.includes?.(slug)),
		[services, slug]
	);

	return (
		<SingleServiceContext.Provider value={{ singleService, loading, error }}>
			{children}
		</SingleServiceContext.Provider>
	);
};

export const useSingleService = () => useContext(SingleServiceContext);
export default SingleServiceContext;
```

**What changes for the shop variant:**
- Reads from `ShopContext` (not `ServicesContext`).
- Slug shape: GROQ projects `"slug": slug.current` as a string (RESEARCH Pattern 2, Note on slug shape) — so `products.find((p) => p.slug === slug)` is correct; do NOT replicate the defensive `s.slug?.current === slug || s.slug?.includes?.(slug)` fallback that `SingleServiceContext` carries.
- Param name: `useParams().slug` only — `:capability` legacy fallback is service-specific, drop it.
- Exports: `useSingleProduct`, default export `SingleProductContext`.

---

### `src/pages/Shop.jsx` (REPLACE) (page composition, request-response + branch)

**Analog:** `src/pages/Projects.jsx` (composition shell at lines 67–71) + the current `src/pages/Shop.jsx` body (preserved by extraction into `<ShopComingSoon />`).

**Composition shell** (Projects.jsx:67–71):
```jsx
const Projects = ({ serviceKey }) => (
	<ServicesProvider serviceKey={serviceKey}>
		<ProjectsInner serviceKey={serviceKey} />
	</ServicesProvider>
);
```

**Empty-state branch (NEW pattern — UI-SPEC §9):**
```jsx
const ShopInner = () => {
	const { products, loading } = useShop();
	if (loading) return null;                    // site convention — no spinner
	if (products.length === 0) return <ShopComingSoon />;
	return <ShopCatalog products={products} />;
};

const Shop = () => (
	<ShopProvider>
		<ShopInner />
	</ShopProvider>
);
```

**SEOHead placement:** the empty-state branch already mounts its own `<SEOHead>` inside `<ShopComingSoon />` (preserved from current `Shop.jsx:36-41`). The catalog branch must mount its own `<SEOHead>` with the catalog-state copy from UI-SPEC §Copywriting Contract.

**What changes:** the page no longer renders the form directly — it renders one of two child components based on `products.length`. The current 110-line body of `Shop.jsx` is moved verbatim into `src/components/shop/ShopComingSoon.jsx` (no logic changes — Phase 2 form contract preserved byte-for-byte).

---

### `src/pages/ShopSingle.jsx` (page composition, request-response)

**Analog:** `src/pages/ProjectSingle.jsx` (entire file, 95 lines)

**Provider stacking pattern** (ProjectSingle.jsx:79–92):
```jsx
const ProjectSingle = ({ serviceKey }) => (
	<motion.div
		initial={{ opacity: 0 }}
		animate={{ opacity: 1, delay: 1 }}
		transition={{ ease: 'easeInOut', duration: 0.6, delay: 0.15 }}
		className="container mx-auto mt-5 sm:mt-10"
	>
		<ServicesProvider serviceKey={serviceKey}>
			<SingleServiceProvider>
				<ServiceDetailComposition serviceKey={serviceKey} />
			</SingleServiceProvider>
		</ServicesProvider>
	</motion.div>
);
```

**SEO conditional-mount pattern** (ProjectSingle.jsx:42–51):
```jsx
{singleService && (
	<SEOHead
		title={seoTitle}
		description={seoDescription}
		ogImage={seoOgImage}
		ogUrl={seoOgUrl}
	/>
)}
```

**SEO data extraction with fallbacks** (ProjectSingle.jsx:27–38):
```jsx
const seoTitle = singleService?.seo?.metaTitle ?? singleService?.title;
const seoDescription = singleService?.seo?.metaDescription ?? singleService?.description;
const seoOgImage = singleService?.seo?.ogImage?.asset
	? {
			url: singleService.seo.ogImage.asset.url,
			altText: singleService.seo.ogImage.altText ?? singleService.title,
	  }
	: { url: '/og-default.png', altText: singleService?.title ?? 'Shapesmith Studio' };
```

**What changes for the shop variant:**
- Inner component: `ProductDetailComposition` consumes `useSingleProduct()` (not `useSingleService()`).
- Provider stack: `<ShopProvider>` → `<SingleProductProvider>` → `<ProductDetailComposition />`.
- `framer-motion` wrapper: keep the same `motion.div` envelope (matches site rhythm).
- SEO `ogImage` source: per UI-SPEC §Copywriting Contract, falls back chain is `product.seo.ogImage` → first `product.images[0]` (built via `urlAt(images[0], 1200)`) → `/og-default.png`. The first-image fallback is ADDITIONAL to the ProjectSingle pattern; planner should add a middle fallback step.
- Composition body renders the new shop primitives in this order: `<ProductHeader />`, `<ImageGallery images={product.images} />` (the new shared primitive), `<ProductInfo />` (price + AddToCart + body + spec table), `<StickyMobileAddToCart />`.

---

### `src/components/shop/ShopComingSoon.jsx` (leaf, form-submit)

**Analog:** `src/pages/Shop.jsx` (current file, 110 lines)

**Treatment:** EXTRACT THE EXISTING `Shop.jsx` BODY VERBATIM. No logic changes.

**Imports + state (Shop.jsx:1–13):**
```jsx
import { useState } from 'react';
import SEOHead from '../components/shared/SEOHead';
import encodeFormData from '../utilities/encodeFormData';

const Shop = () => {
	const [email, setEmail] = useState('');
	const [bot, setBot] = useState('');
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState(null);
```

**Submit handler (Shop.jsx:15–32):**
```jsx
const handleSubmit = (e) => {
	e.preventDefault();
	setError(null);
	fetch('/', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: encodeFormData({
			'form-name': 'shop-notify',
			email,
			'bot-field': bot,
		}),
	})
		.then(() => setSubmitted(true))
		.catch((err) => {
			console.error('Shop notify submit failed:', err);
			setError('Something went wrong. Please try again or contact us directly.');
		});
};
```

**What changes:** import paths shift by one directory (`'../components/shared/SEOHead'` → `'../shared/SEOHead'`; `'../utilities/encodeFormData'` → `'../../utilities/encodeFormData'`). The component is renamed `ShopComingSoon`. NO copy / form-name / honeypot changes — Phase 2 D-23/D-26/D-28 contract is byte-stable.

**Hard rule:** the `<form name="shop-notify">` declaration in `index.html:55-64` MUST stay (Phase 2 D-28 prerender pattern). If it's accidentally removed during the Phase 5 `index.html` Snipcart script-tag edit, silent submission drop will result.

---

### `src/components/shop/ShopCatalog.jsx` (container, filter + map)

**Analog:** `src/components/services/ServicesGrid.jsx` (composition shell, lines 1–53)

**Section + container pattern** (ServicesGrid.jsx:7–9, 35–47):
```jsx
return (
	<section className="py-5 sm:py-10 mt-5 sm:mt-10">
		<div className="container mx-auto sm:mx-50">
			...
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-6 mx-12 sm:mx-0 sm:gap-10">
				{services
					.slice()
					.sort((a, b) => (a.order < b.order ? -1 : 1))
					.map((entry) => (
						<ServiceCard ... />
					))}
			</div>
```

**What changes for the shop variant:**
- Owns the filter local state (`const [activeFilter, setActiveFilter] = useState('All')`).
- Renders `<ShopFilter active={activeFilter} onChange={setActiveFilter} />` above the grid.
- Filter logic: `products.filter(p => activeFilter === 'All' || p.processes.includes(processKeyForFilter[activeFilter]))`. Per CONTEXT D-09, `processes[]->key` returns lowercase keys (`laser` / `print`); the filter labels are `All` / `Laser` / `3D printed` (UI-SPEC §7) — map labels → keys explicitly.
- Sort: `featured desc, _createdAt desc` is already applied by GROQ (see `ShopContext` query). DO NOT re-sort client-side.
- Grid breakpoints exactly match `ServicesGrid` per UI-SPEC §1: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. UI-SPEC specifies `gap-y-10` + `sm:gap-x-10` — adopt those (slight deviation from `ServicesGrid`'s `sm:gap-10` which is symmetric — UI-SPEC overrides).

---

### `src/components/shop/ShopFilter.jsx` (controlled input, local state radiogroup)

**Analog:** none directly — UI-SPEC §7 is the source-of-truth. Closest sibling: nav-link active-state pattern in `AppHeader.jsx:50-53`.

**What to copy:** UI-SPEC §7 specifies the JSX exactly. The accent color reference (`bg-accent text-white` for active, `bg-ternary-dark` for inactive) matches the existing site convention from `AppHeader.jsx:52` (`border-b-2 border-accent` for active route) and `Quote.jsx`-style segmented controls (if any).

**Required code excerpt** (UI-SPEC §7):
```jsx
<div role="radiogroup" aria-label="Filter by service"
     className="flex flex-wrap gap-3 mb-8 sm:mb-12">
  {['All', 'Laser', '3D printed'].map((label) => (
    <button
      key={label}
      role="radio"
      aria-checked={active === label}
      onClick={() => setActive(label)}
      className={
        active === label
          ? 'bg-accent text-white px-5 py-2 rounded-full font-general-medium duration-300'
          : 'bg-ternary-dark text-ternary-light hover:bg-secondary-section-dark px-5 py-2 rounded-full font-general-medium duration-300'
      }
    >
      {label}
    </button>
  ))}
</div>
```

**Deviation flag for planner:** this is a NEW interaction primitive. No existing site code uses `role="radiogroup"`. Follow UI-SPEC §7 verbatim and do NOT introduce any UI library to provide it.

---

### `src/components/shop/ProductGrid.jsx` (grid container, map over data)

**Analog:** `src/components/services/ServicesGrid.jsx` (grid markup, lines 35–47)

**Grid pattern** (ServicesGrid.jsx:35–47):
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-6 mx-12 sm:mx-0 sm:gap-10">
	{services
		.slice()
		.sort((a, b) => (a.order < b.order ? -1 : 1))
		.map((entry) => (
			<ServiceCard
				title={entry.title}
				listImage={entry.listImage}
				key={entry.title}
				linkTo={`/${service.urlSegment}/${entry.slug?.current ?? entry.slug}`}
			/>
		))}
</div>
```

**What changes:**
- Receives `products` prop (already filtered by `ShopCatalog`); does NOT re-sort.
- Maps to `<ProductCard product={p} key={p._id} />`.
- Row gap uses `gap-y-10` per UI-SPEC §1 (NOT `sm:gap-10` symmetric).
- Empty-after-filter state: render the UI-SPEC §Copywriting Contract message (`No items in this category yet. Try a different filter, or [browse everything]`).

---

### `src/components/shop/ProductCard.jsx` (leaf, render prop)

**Analog:** `src/components/services/ServiceCard.jsx` (entire file, 50 lines)

**Card markup pattern** (ServiceCard.jsx:10–46):
```jsx
<motion.div
	initial={{ opacity: 0 }}
	animate={{ opacity: 1, delay: 1 }}
	transition={{ ease: 'easeInOut', duration: 0.7, delay: 0.15 }}
>
	<Link to={linkTo} aria-label={title}>
		<div>
			<div className="rounded-xl shadow-lg hover:shadow-xl cursor-pointer mb-10 sm:mb-0 bg-secondary-light dark:bg-ternary-dark">
				<div>
					<SanityImage
						source={listImage}
						alt={listImage?.altText ?? title}
						sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
						loading="lazy"
						className="aspect-square object-cover rounded-xl"
						placeholderCaption={...}
					/>
				</div>
			</div>
			<div className="text-center px-4 py-6">
				<p className="font-general-medium text-lg md:text-xl text-ternary-dark dark:text-ternary-light mb-2">
					{title}
				</p>
			</div>
		</div>
	</Link>
</motion.div>
```

**What changes for the shop variant:**
- Wrap the `<SanityImage>` in a `<div className="relative">` so the sold-out badge + overlay can be absolute-positioned (per UI-SPEC §Color → Sold-out treatment).
- Add a price line below the name: `<p className="font-general-regular text-lg text-primary-light">${price.toFixed(2)}{lowStock && <LowStockTag n={stockQuantity} />}</p>` (UI-SPEC §1 markup).
- Conditionally render `<SoldOutBadge />` (the badge + image overlay) when `stockQuantity === 0`.
- `placeholderCaption`: `"Product photo coming soon"` (matches Phase 2 D-11 graceful-degrade pattern; no service-specific switching since shop is process-mixed).
- `linkTo`: `/shop/${product.slug}` (slug is a string per ShopContext GROQ projection — no `.current` fallback).
- Card surface uses `bg-ternary-dark` ONLY (no light pair) per UI-SPEC §Color and Phase 1 dark-only commitment. The `bg-secondary-light dark:bg-ternary-dark` legacy in ServiceCard is superseded.

---

### `src/components/shop/ProductHeader.jsx` (leaf, context consume)

**Analog:** `src/components/services/ServiceHeader.jsx` (entire file, 16 lines)

**Pattern (ServiceHeader.jsx:1–14):**
```jsx
import { useSingleService } from '../../context/SingleServiceContext';

const ServiceHeader = () => {
	const { singleService } = useSingleService();
	return (
		<div>
			<p className="font-general-medium text-left text-3xl sm:text-4xl font-bold text-primary-dark dark:text-primary-light mt-14 sm:mt-20 mb-7">
				{singleService && singleService.header}
			</p>
		</div>
	);
};
```

**What changes:**
- Consumes `useSingleProduct()`.
- Renders `<h1>` (NOT `<p>` — UI-SPEC §Typography "Display" row mandates the H1 element for product name).
- Classes per UI-SPEC §Typography: `font-display font-black text-4xl sm:text-5xl text-primary-light leading-tight mt-14 sm:mt-20 mb-7`.
- Uses `font-display` (Proxima Nova) at black weight — matches `Shop.jsx:44` Coming Soon H1 cadence.

---

### `src/components/shop/ProductInfo.jsx` (leaf, context consume)

**Analog:** `src/components/services/ServiceInfo.jsx` (lines 1–46) — for the column-split layout pattern.

**Two-column split pattern** (ServiceInfo.jsx:6–43):
```jsx
return (
	<div className="block sm:flex gap-0 sm:gap-10 mt-14">
		<div className="w-full sm:w-1/3 text-left">
			...
		</div>
		<div className="w-full sm:w-2/3 text-left mt-10 sm:mt-0">
			...
		</div>
	</div>
);
```

**What changes for the shop variant:**
- Layout flips to UI-SPEC §2 contract: image gallery LEFT (`lg:w-7/12`) and info column RIGHT (`lg:w-5/12`) on `lg:`+, stacked on `<lg:`. So the `<ProductInfo>` is the RIGHT/below column, not the parent split.
- Renders in this order (UI-SPEC §Copywriting Contract row "/shop/:slug detail page"):
  1. Price line (`text-3xl sm:text-4xl font-general-regular text-primary-light`)
  2. Sold-out / low-stock badge (`<SoldOutBadge />` or `<LowStockTag />`)
  3. Short description (`product.description`, ~200 chars)
  4. `<AddToCartButton product={product} variant="detail" />`
  5. Portable text body (`product.body` — render via the `renderAnswer` helper from `FAQ.jsx:11-25` for Phase 2 parity)
  6. `<ProductSpecTable />`

**Portable text rendering** — reuse `FAQ.jsx:11-25` plain-text walker:
```jsx
// FAQ.jsx:11-25 — renders portable text as paragraphs (no rich styling).
// Owner ships plain prose; rich text is a v2 enhancement.
const renderAnswer = (answer) => {
	if (!Array.isArray(answer)) return null;
	return answer.map((block, i) => {
		if (!block || !Array.isArray(block.children)) return null;
		const text = block.children.map((c) => c?.text ?? '').join('');
		return (
			<p key={block._key ?? i}
			   className="text-ternary-dark dark:text-ternary-light">
				{text}
			</p>
		);
	});
};
```
Same shape applies to `product.body`. CONTEXT does not authorize `@portabletext/react` — stay on the FAQ idiom.

---

### `src/components/shop/ProductSpecTable.jsx` (leaf, render prop)

**Analog:** `src/components/services/TrustCopyBlock.jsx` (entire file, 64 lines) — for the omit-empty key/value rendering pattern.

**Omit-empty pattern** (TrustCopyBlock.jsx:14–19, 25–32):
```jsx
const hasContent =
	turnaround ||
	info.serviceArea ||
	info.pickupAvailability ||
	info.responseTimePromise;
if (!hasContent) return null;
...
{turnaround && (
	<div className="mb-4 sm:mb-0">
		<p className="text-sm font-general-medium text-ternary-section-dark uppercase mb-1">
			Turnaround
		</p>
		<p className="font-general-regular">{turnaround}</p>
	</div>
)}
```

**What changes:**
- Use `<dl>` semantic markup with `grid grid-cols-[max-content_1fr]` per UI-SPEC §11 (NOT the flex layout TrustCopyBlock uses).
- Three rows: Dimensions / Materials / Ships in.
- "Ships in" row falls back through chain: `product.leadTime` → `studio-info.shippingLeadTime` (fetched via `useSanityQuery` like TrustCopyBlock does) → "Contact us for a lead-time estimate." copy.
- Materials row: each material is a `<Link to={materialAnchor(m)} className="underline hover:text-accent duration-500">{m.name}</Link>`. Joiner is " · " (middle dot).
- `materialAnchor(m)` resolves the per-material destination:
  ```js
  // material.services is `string[]` — `['laser']`, `['print']`, or `['laser', 'print']`.
  const materialAnchor = (m) =>
  	m.services?.includes('laser') ? '/styles#materials' : '/3d-printing#materials';
  ```
- Omit-row pattern: if `product.dimensions` is empty, skip the entire dt+dd pair. Same for materials. Same for the leadTime + studio-info chain.

**Studio-info fetch** (mirror TrustCopyBlock.jsx:1–12):
```jsx
import useSanityQuery from '../../hooks/useSanityQuery';

const STUDIO_INFO_QUERY = `*[_type == "studio-info"][0]{
  shippingLeadTime
}`;

const ProductSpecTable = ({ product }) => {
	const { data } = useSanityQuery(STUDIO_INFO_QUERY);
	const studioInfo = data ?? {};
	const leadTime = product.leadTime ?? studioInfo.shippingLeadTime;
	...
};
```

---

### `src/components/shop/AddToCartButton.jsx` (leaf, DOM attribute emit)

**Analog:** none directly — Snipcart's data-attribute contract is the source-of-truth. The closest stylistic precedent is the existing `bg-accent hover:bg-accent-highlight` button pattern from `ContactForm.jsx` / `Shop.jsx:92-96` / `AppHeader.jsx:112` / `Projects.jsx:54-56`.

**Existing accent-button pattern** (Shop.jsx:92–96, the empty-state submit button):
```jsx
<button
	type="submit"
	className="font-general-medium px-5 py-2.5 text-white bg-accent hover:bg-accent-highlight focus:ring-1 focus:ring-accent rounded-md duration-500"
>
	Notify me when it launches
</button>
```

**Source-of-truth code** (RESEARCH Pattern 3, full file):
```jsx
// src/components/shop/AddToCartButton.jsx — NEW
import { urlAt } from '../../utilities/sanityImage';

const AddToCartButton = ({ product, variant = 'detail' }) => {
	const { slug, name, price, description, stockQuantity, processes, images } = product;
	const isSoldOut = stockQuantity === 0;

	if (isSoldOut) {
		// D-16 — replace button with static span so the slot doesn't reflow.
		return (
			<span
				className={
					variant === 'sticky'
						? 'bg-secondary-section-dark text-ternary-light px-5 py-2.5 rounded-md cursor-not-allowed font-general-medium flex-shrink-0'
						: 'inline-block bg-secondary-section-dark text-ternary-light px-6 py-3 rounded-md cursor-not-allowed font-general-medium text-base sm:text-lg'
				}
				aria-disabled="true"
			>
				Sold out
			</span>
		);
	}

	const heroImage = images?.[0];
	const imageUrl = heroImage?.asset
		? urlAt(heroImage, 800)
		: 'https://shapesmith.studio/og-default.png';

	// CRITICAL: data-item-url MUST be the JSON crawler endpoint (NOT the SPA route).
	// Snipcart's order-validation crawler hits this URL and expects JSON when
	// Content-Type is application/json. A SPA route returns index.html and
	// validation fails. See RESEARCH Pitfall 1.
	const validateUrl = `${window.location.origin}/.netlify/functions/snipcart-validate-product?slug=${slug}`;

	const baseClasses =
		variant === 'sticky'
			? 'snipcart-add-item bg-accent hover:bg-accent-highlight text-white font-general-medium px-5 py-2.5 rounded-md flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed'
			: 'snipcart-add-item bg-accent hover:bg-accent-highlight text-white font-general-medium px-6 py-3 rounded-md text-base sm:text-lg duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto';

	return (
		<button
			className={baseClasses}
			data-item-id={slug}
			data-item-name={name}
			data-item-price={Number(price).toFixed(2)}
			data-item-url={validateUrl}
			data-item-image={imageUrl}
			data-item-description={description ?? ''}
			data-item-categories={processes?.join('|') ?? ''}
			data-item-max-quantity={stockQuantity}
			data-item-stackable={stockQuantity > 1 ? 'auto' : 'never'}
		>
			Add to Cart
		</button>
	);
};
```

**Deviation flags for planner:**
1. RESEARCH Pattern 3 uses `processes.join('|')` (pipe). UI-SPEC §8 uses `processes.join(',')` (comma). Per RESEARCH `[VERIFIED: docs.snipcart.com/v3/setup/products]`, **pipe is correct**. Override UI-SPEC §8 with the pipe separator.
2. `data-item-url` MUST point to the Netlify Function, NOT the SPA route. Snipcart's HTML crawler can't parse `index.html`; the JSON crawler requires `Content-Type: application/json` from the URL.
3. `import { urlAt } from '../../utilities/sanityImage'` — already exists at `src/utilities/sanityImage.jsx:11-12`.

---

### `src/components/shop/StickyMobileAddToCart.jsx` (leaf, IntersectionObserver + render)

**Analog:** none directly. UI-SPEC §3 is the source-of-truth. No existing site code uses `IntersectionObserver`.

**Source-of-truth markup** (UI-SPEC §3):
```jsx
<div className="fixed bottom-0 left-0 right-0 md:hidden z-30
                bg-ternary-dark/95 backdrop-blur-sm border-t border-secondary-section-dark
                px-4 py-3 flex items-center justify-between">
  <div className="flex flex-col min-w-0 mr-3">
    <span className="text-sm font-general-medium text-ternary-light truncate">{name}</span>
    <span className="text-base font-general-regular text-primary-light">${price}</span>
  </div>
  <AddToCartButton product={product} variant="sticky" />
</div>
```

**Visibility logic (UI-SPEC §3):** `IntersectionObserver` watches the in-content Add-to-Cart button — when it scrolls out of view (above viewport), show the bar; when back in view, hide.

**Implementation pattern** (NEW — no codebase analog):
```jsx
import { useEffect, useRef, useState } from 'react';

const StickyMobileAddToCart = ({ product, anchorRef }) => {
	const [showSticky, setShowSticky] = useState(false);

	useEffect(() => {
		if (!anchorRef.current) return;
		const observer = new IntersectionObserver(
			([entry]) => setShowSticky(!entry.isIntersecting),
			{ rootMargin: '0px', threshold: 0 }
		);
		observer.observe(anchorRef.current);
		return () => observer.disconnect();
	}, [anchorRef]);

	if (!showSticky) return null;
	return ( /* UI-SPEC §3 markup */ );
};
```

The `anchorRef` is a `useRef` attached to the in-content Add-to-Cart `<button>` inside `<ProductInfo>`. The parent `<ShopSingle>` page must pass the ref down OR the sticky component creates its own forwardRef plumbing. **Planner judges** the ref-plumbing shape.

**Deviation flag:** `IntersectionObserver` is browser-native and React 18 / Vite supports it without polyfills. Add `pb-16 md:pb-0` to the parent page bottom-padding to prevent the sticky bar from covering content (UI-SPEC §3 explicit requirement).

---

### `src/components/shop/SoldOutBadge.jsx` and `src/components/shop/LowStockTag.jsx` (atomic leaves)

**Analog:** none directly. UI-SPEC §Color → Sold-out + low-stock visual treatment table is the source-of-truth.

**SoldOutBadge** (UI-SPEC §Color):
```jsx
const SoldOutBadge = () => (
	<>
		<span className="absolute top-3 left-3 bg-secondary-section-dark text-ternary-light text-sm font-general-medium px-3 py-1 rounded-md">
			Sold out
		</span>
		<div className="absolute inset-0 bg-secondary-section-dark/70 rounded-xl" aria-hidden="true" />
	</>
);
```

The component renders TWO siblings (badge + overlay), so the parent must wrap them in `<div className="relative">`. Either render this component as a fragment or split into `<SoldOutBadge />` + `<SoldOutOverlay />`. Planner judges.

**LowStockTag** (UI-SPEC §Color):
```jsx
const LowStockTag = ({ n }) => (
	<span className="ml-3 text-sm font-general-medium text-ternary-section-dark">
		Only {n} left
	</span>
);
```

**Hard rule from D-16:** NO animations on either. No `animate-pulse`, no `transition-opacity`. Confirmed by UI-SPEC §Color note "No animations on either state".

---

### `src/components/shared/ImageGallery.jsx` (refactor target)

**Analog:** `src/components/services/ServiceGallery.jsx` (entire file, 70 lines)

**Treatment:** EXTRACT a props-driven primitive from `ServiceGallery`. Refactor `ServiceGallery` to consume the new primitive (zero visual change to existing service detail pages).

**Source pattern** (ServiceGallery.jsx:6–67):
```jsx
const ServiceGallery = () => {
	const { singleService } = useSingleService();
	const { serviceKey } = useServices();

	const [openImage, setOpenImage] = useState(null);

	const placeholderCaption =
		serviceKey === 'print'
			? '3D print example coming soon'
			: 'Laser cut example coming soon';

	return (
		<div>
			<div className="container mx-auto px-5 py-2 lg:px-32 lg:pt-12">
				<div className="-m-1 flex flex-wrap md:-m-2">
					{singleService && singleService.detailImages && singleService.detailImages.map((image, idx) => {
						return (
							<div className="flex w-1/3 flex-wrap" key={image.asset?._id ?? idx}>
								<div
									className="w-full p-1 md:p-2 cursor-pointer"
									onClick={() => setOpenImage(image)}
								>
									<SanityImage source={image} alt={...} sizes="(max-width: 640px) 50vw, 25vw"
										loading="lazy"
										className="rounded-xl shadow-lg sm:shadow-none aspect-[4/3] object-cover w-full"
										placeholderCaption={placeholderCaption} />
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{openImage && (
				<div className="fixed top-0 left-0 z-80 w-screen h-screen bg-black/70 flex justify-center items-center">
					<button className="fixed z-90 top-6 right-8 text-white text-5xl font-bold hover:cursor-pointer"
						onClick={(event) => { event.preventDefault(); setOpenImage(null); }}>
						&times;
					</button>
					<SanityImage source={openImage} alt={...} sizes="100vw" loading="eager"
						className="max-h-[90vh] max-w-[90vw] object-contain"
						placeholderCaption="" />
				</div>
			)}
		</div>
	);
};
```

**What the new primitive looks like:**
```jsx
// src/components/shared/ImageGallery.jsx — NEW
const ImageGallery = ({ images, alt, placeholderCaption }) => {
	const [openImage, setOpenImage] = useState(null);
	const items = images ?? [];
	return ( /* same JSX as ServiceGallery body, with `images.map(...)` replacing
	            `singleService.detailImages.map(...)` and `alt` / `placeholderCaption`
	            taken from props instead of context */ );
};
```

**Refactor ServiceGallery to consume the primitive:**
```jsx
const ServiceGallery = () => {
	const { singleService } = useSingleService();
	const { serviceKey } = useServices();
	const placeholderCaption = serviceKey === 'print' ? '3D print example coming soon' : 'Laser cut example coming soon';
	return <ImageGallery
		images={singleService?.detailImages}
		alt={singleService?.title}
		placeholderCaption={placeholderCaption} />;
};
```

**Shop usage:**
```jsx
<ImageGallery
	images={product.images}
	alt={product.name}
	placeholderCaption="Product photo coming soon" />
```

**Planner judgment:** ship the refactor as a SEPARATE plan (parallel to detail-page work) so the diff stays auditable, OR fold it into the detail-page plan — the latter is faster but mixes concerns. RESEARCH suggests separation; UI-SPEC §2 leaves it to planner discretion.

**Deviation flag:** UI-SPEC §2 mentions `lg:w-7/12` placement for the gallery on the detail page — that's the LAYOUT placement of the gallery within `ShopSingle`, NOT the gallery's internal CSS. The internal grid is `w-1/3` thumbnails per `ServiceGallery.jsx:24` — preserve as-is.

---

### `src/css/snipcart.css` (stylesheet, CSS-variable theming)

**Analog:** none directly. Closest-by-spirit: `src/css/App.css` (font-face declarations) is the only existing CSS file in the project.

**Source-of-truth:** UI-SPEC §6 specifies the class hooks, but RESEARCH Pattern 6 (not yet quoted in this doc — see RESEARCH §"Pattern 6: Snipcart Cart Drawer Theming") confirms that **Snipcart's actual CSS variable names differ from UI-SPEC §6's preliminary list**. Use the official names: `--color-buttonPrimary`, `--bgColor-buttonPrimary`, `--color-default`, `--bgColor-default`, `--bgColor-modal`, etc.

**Deviation flag for planner:** patch UI-SPEC §6's variable map to match Snipcart's official `:root` variable names per `docs.snipcart.com/v3/themes/default/reference`. The high-level approach (one stylesheet, `:root` overrides, drawer-only scope) is correct.

**Loading pattern** — add to `src/index.js` after `./index.css`:
```jsx
// src/index.js current shape (line 3):
import './index.css';
// Phase 5 addition:
import './css/snipcart.css';
```

**File location decision (UI-SPEC §6):** dedicated `src/css/snipcart.css`, NOT a `@layer components` block in `src/css/tailwind.css`. Snipcart's stylesheet loads at runtime; layering inside Tailwind would create cascade chaos. The dedicated file ships separately, gives a clean override surface, and is easy to diff.

---

### `netlify/functions/snipcart-validate-product/snipcart-validate-product.js` (function, request-response JSON)

**Analog:** `netlify/functions/submit-quote/submit-quote.js` (Function shell, env, error shape — lines 40–60, 119–124)

**Function shell pattern** (submit-quote.js:40–60, 119–124):
```js
exports.handler = async (event) => {
	if (event.httpMethod !== 'POST') {
		return { statusCode: 405, body: 'Method not allowed' };
	}

	if (event.body && event.body.length > MAX_BODY_BYTES) {
		return { statusCode: 400, body: 'Payload too large' };
	}

	let payload;
	try {
		payload = JSON.parse(event.body);
	} catch {
		return { statusCode: 400, body: 'Invalid JSON' };
	}
	...
	return {
		statusCode: 200,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ok: true }),
	};
};
```

**What changes for the validate-product variant:**
- Method: GET (not POST). `event.httpMethod !== 'GET' → 405`.
- Read slug: `const slug = event.queryStringParameters?.slug` (NOT JSON body parsing).
- Body: NO `resend`. NO reCAPTCHA. NO Resend.
- Logic:
  1. Validate slug shape (string, kebab-case, ≤200 chars).
  2. Fetch `*[_type == "product" && slug.current == $slug][0]{ ... }` from Sanity (using `@sanity/client` — install in this Function's `package.json`, NOT the project root).
  3. If not found → 404.
  4. Build the JSON-crawler-shaped response per Snipcart docs (`docs.snipcart.com/v2/configuration/json-crawler`) — RESEARCH-listed shape: `{ id, name, price, url, description, image, stackable, maxQuantity, customFields, ... }`.
  5. Return `{ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productJson) }`.

**Critical:** the response `Content-Type` MUST be `application/json` — that's what triggers Snipcart to use the JSON crawler instead of the HTML one (RESEARCH §Architectural Responsibility Map; RESEARCH Pattern 3 inline note).

**Function package.json** (mirror `netlify/functions/submit-quote/package.json` shape):
```json
{
  "name": "snipcart-validate-product",
  "private": true,
  "dependencies": {
    "@sanity/client": "^6.29.1"
  }
}
```

---

### `netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js` (function, webhook validate + Resend)

**Analog:** `netlify/functions/submit-quote/submit-quote.js` (entire file, 124 lines) — closest match in the codebase.

**Verification + send pattern** (submit-quote.js:75–117):
```js
// reCAPTCHA v3 server verify.
let verifyJson;
try {
	const verifyRes = await fetchWithTimeout(
		'https://www.google.com/recaptcha/api/siteverify',
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				secret: process.env.RECAPTCHA_SECRET_KEY,
				response: payload.recaptchaToken,
			}),
		},
	);
	verifyJson = await verifyRes.json();
} catch (e) {
	console.error('reCAPTCHA verify failed:', e);
	return { statusCode: 502, body: 'Spam check unavailable' };
}
if (!verifyJson.success || (verifyJson.score ?? 0) < RECAPTCHA_THRESHOLD) {
	return { statusCode: 403, body: 'Spam check failed' };
}

// Send via Resend (with timeout).
try {
	await Promise.race([
		resend.emails.send({
			from: 'Shapesmith Studio <quotes@shapesmith.studio>',
			to: ['jkrush@shapesmith.studio'],
			reply_to: payload.email,
			subject: `[Quote] ${payload.service} — ${safeName}`,
			text: formatQuoteText({ ...payload, name: safeName }),
		}),
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error('Resend timeout')), FETCH_TIMEOUT_MS),
		),
	]);
} catch (e) {
	console.error('Resend send failed:', e);
	return { statusCode: 502, body: 'Email send failed' };
}
```

**What changes for the snipcart-order-webhook variant:**

1. **Method:** POST (Snipcart sends `order.completed` event POST).
2. **Token validation** (replaces reCAPTCHA verify) — Snipcart sends `X-Snipcart-RequestToken` header. The Function GETs `https://app.snipcart.com/api/requestvalidation/{token}` and checks `response.ok`. Token valid for 1 hour. NO API key required for the validation endpoint. RESEARCH headline finding 4 confirms this pattern.

```js
// Snipcart token-callback validation.
const token = event.headers['x-snipcart-requesttoken'] ?? event.headers['X-Snipcart-RequestToken'];
if (!token) return { statusCode: 401, body: 'Missing webhook token' };
try {
	const verifyRes = await fetchWithTimeout(
		`https://app.snipcart.com/api/requestvalidation/${token}`,
		{ method: 'GET' }
	);
	if (!verifyRes.ok) return { statusCode: 401, body: 'Invalid webhook token' };
} catch (e) {
	console.error('Snipcart validation failed:', e);
	return { statusCode: 502, body: 'Webhook validation unavailable' };
}
```

3. **Idempotency:** Snipcart retries on non-200. Treat the webhook as idempotent — multiple deliveries of the same `order.completed` should send at most one email per order, OR be safe to repeat. CONTEXT D-15 says "idempotent against retries". Planner judges the dedupe strategy (e.g., short-circuit if the same `eventName + content.token` was seen recently — but persistence is heavy for this catalog scale; recommend simply tolerating duplicate emails as an acceptable tradeoff and documenting that in code).

4. **Resend send** — copy the `Promise.race` timeout pattern verbatim. Subject: `[Order ${invoiceNumber}] ${customerName}`. From: `'Shapesmith Studio <orders@shapesmith.studio>'` (or the existing verified sender — owner-prep checkpoint). To: `'jkrush@shapesmith.studio'`. Reply-to: customer email from the Snipcart payload.

5. **No reCAPTCHA, no `RECAPTCHA_SECRET_KEY`** — Snipcart's token validation IS the spam check.

6. **Env vars:** `RESEND_API_KEY` (already exists from Phase 3). NO `SNIPCART_API_SECRET` is needed for the validation endpoint per RESEARCH headline finding 4 — but if the planner discovers Snipcart needs an API secret for some other call, add it server-side (no `VITE_` prefix).

7. **Always return 200** for valid webhook events (even if Resend fails) — failing the webhook causes Snipcart to retry, which would multiply Resend errors. Pattern: log the Resend failure but acknowledge to Snipcart with 200.

   **Deviation from `submit-quote`:** submit-quote returns 502 on Resend failure because the visitor is the caller and needs to know. The webhook caller is Snipcart, which retries on non-200 — that retry behavior is harmful here.

---

### `netlify/functions/snipcart-order-webhook/formatOrderEmail.js` (helper, pure transform)

**Analog:** `netlify/functions/submit-quote/formatQuoteText.js` (entire file, 46 lines)

**Pattern (formatQuoteText.js:14–46):**
```js
const formatUsd = (n) => {
	if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
	return `$${Math.round(n)}`;
};

const formatQuoteText = (p) => {
	const m = p.metadata || {};
	const range = `${formatUsd(m.priceLow)} – ${formatUsd(m.priceHigh)}`;

	const lines = [
		`Service: ${p.service}`,
		`From: ${p.name} <${p.email}>`,
		'',
		`File: ${m.filename} (${m.fileSizeMB} MB)`,
	];
	if (m.volumeCm3 != null) lines.push(`Volume: ${m.volumeCm3} cm³`);
	...
	return lines.join('\n');
};

module.exports = formatQuoteText;
module.exports.formatUsd = formatUsd;
```

**What changes:** input shape is the Snipcart `order.completed` payload (`{ items: [...], invoiceNumber, total, billingAddress, shippingAddress, customer: {...}, metadata }` per Snipcart docs). Output: line-item summary + customer info + shipping address + total + link to Snipcart dashboard. Same plain-text email format as `formatQuoteText`. Same en-dash convention if number ranges appear (none expected). Same CommonJS module shape so it's unit-testable from `pnpm test`.

**Unit-testability:** the helper is its own module so the Phase 3 test pattern can apply (no test file for `formatQuoteText.js` exists in repo today — Phase 5 may inherit that gap or add one; planner judges).

---

### `netlify/functions/snipcart-order-webhook/package.json` (function manifest)

**Analog:** `netlify/functions/submit-quote/package.json` (entire file, 7 lines)

**Pattern:**
```json
{
  "name": "submit-quote",
  "private": true,
  "dependencies": {
    "resend": "^6.12.3"
  }
}
```

**What changes:** rename to `snipcart-order-webhook`. Same `resend` dependency (matches Phase 3 pin). Use `pnpm install` inside the function dir per Phase 3 precedent (creates a function-local `pnpm-lock.yaml`).

---

### `src/App.js` (MODIFY — route addition)

**Analog:** `src/App.js` lines 51–62 (existing per-service route pair)

**Existing pattern** (App.js:50–62):
```jsx
<Route path="/" element={<Home />} />
{SERVICES.map((s) => (
	<Route key={s.key}>
		<Route
			path={`/${s.urlSegment}`}
			element={<Projects serviceKey={s.key} />}
		/>
		<Route
			path={`/${s.urlSegment}/:slug`}
			element={<ProjectSingle serviceKey={s.key} />}
		/>
	</Route>
))}
...
<Route path="/shop" element={<Shop />} />
```

**What changes:**
- Add lazy import: `const ShopSingle = lazy(() => import('./pages/ShopSingle.jsx'));` (line ~21–22).
- Add route AFTER the existing `/shop` route: `<Route path="/shop/:slug" element={<ShopSingle />} />`.
- The existing `/shop` route stays — `Shop.jsx` now branches internally on product count.
- Order matters: keep `/shop/:slug` BEFORE the `<Route path="*" element={<NotFound />} />` catch-all (App.js:83).

---

### `src/components/shared/AppHeader.jsx` (MODIFY — verify only)

**Analog:** AppHeader.jsx:25 (existing `/shop` nav entry)

**Existing pattern** (AppHeader.jsx:15–29):
```jsx
const NAV_ITEMS = [
	{ to: '/', label: 'Home', match: '/' },
	...SERVICES.map((s) => ({ ... })),
	{ to: '/about', label: 'About', match: '/about' },
	{ to: '/shop', label: 'Shop', match: '/shop' },
	{ to: '/quote', label: 'Get a Quote', match: '/quote' },
];
```

**What changes:** NOTHING. The `/shop` entry already exists (Phase 2). The `match: '/shop'` prefix-matching pattern (AppHeader.jsx:46-48) means `/shop/:slug` will also light up the active state — desired behavior. **Plan must NOT modify AppHeader unless adding the optional cart-count badge** (RESEARCH §Architecture Diagram + Phase 5 §Component Inventory marks this as OPTIONAL).

---

### `index.html` (MODIFY — Snipcart script tags)

**Analog:** none directly. The closest precedent is the existing Netlify Forms prerender block at `index.html:35-64`.

**What to add** (RESEARCH Pattern 1, with version-pin caveat):
```html
<!-- Snipcart cart drawer mount + API key (D-14). Public key is intentionally
     browser-exposed; test-mode key checked in for local dev / preview deploys.
     Live-key swap on launch is a single-edit change here. -->
<div hidden id="snipcart" data-api-key="<TEST_OR_LIVE_PUBLIC_KEY>"></div>
<link rel="preconnect" href="https://app.snipcart.com" />
<link rel="preconnect" href="https://cdn.snipcart.com" />
<link rel="stylesheet" href="https://cdn.snipcart.com/themes/v3.7.1/default/snipcart.css" />
<script async src="https://cdn.snipcart.com/themes/v3.7.1/default/snipcart.js"></script>
```

**Placement:** AFTER the existing two `<form name="...">` Netlify prerender blocks (index.html:35-64), BEFORE the `<script type="module" src="/src/index.js">` line at index.html:65. Keeping the Snipcart `<script>` async-loaded means it does NOT block React mount.

**Version-pin caveat (RESEARCH §Standard Stack Note):** verify the highest stable Snipcart v3 version at planning time via `https://docs.snipcart.com/v3/release-notes`. The `3.7.1` cited in this doc is from one Snipcart docs page; treat the version number as a planner-set parameter.

**Vite env-var injection caveat (RESEARCH Pattern 1):** Vite does NOT do `%VITE_FOO%` substitution in `index.html` like CRA did. Three options exist; **RESEARCH recommends Approach 1 — hardcode the public key in `index.html`**. The Snipcart public key IS public (intentionally browser-exposed) so checking it into the repo is not a secret leak. Live-key swap requires a code commit. Approach 2 (`transformIndexHtml` plugin) is a Phase 5.1 polish.

**Hard rule:** the existing `<form name="contact-form">` and `<form name="shop-notify">` Netlify prerenders MUST remain untouched. Phase 2 D-28 and D-23 contracts still apply.

---

### `src/index.js` (MODIFY — css import)

**Analog:** `src/index.js:3` (existing `import './index.css'`)

**What changes:** add ONE line after the existing index.css import:
```jsx
import './index.css';
import './css/snipcart.css';   // Phase 5 — Snipcart cart drawer dark-theme overrides
```

That's the entire diff. No other changes to the bootstrap.

---

## Shared Patterns

### Sanity GROQ + `useSanityQuery` (cross-cutting — applies to all data-driven shop files)

**Source:** `src/hooks/useSanityQuery.jsx` (entire file, 37 lines) + every existing context provider.

**Apply to:** `ShopContext.jsx`, `SingleProductContext.jsx` (indirectly via ShopContext), `ProductSpecTable.jsx` (for the studio-info fallback).

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
```

**Hard rule (CONTEXT canonical_refs, RESEARCH §Standard Stack):** ALL Sanity reads in Phase 5 MUST go through this hook. NO inline `useEffect + sanityClient.fetch` in any new shop component. The current legacy AboutMeContext is already on the hook; ServicesContext + SingleServiceContext are too.

### Sanity client (singleton)

**Source:** `src/utilities/sanityClient.jsx` (entire file, 9 lines)
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

**Apply to:** all browser-side fetches go through this exact singleton via `useSanityQuery`. The `snipcart-validate-product` Function fetches Sanity directly (server-side) and either reuses the same `projectId` + `dataset` or creates its own client instance with the same config (function-local install of `@sanity/client`, mirror Phase 3's pattern of installing per-function deps).

### Sanity image rendering

**Source:** `src/components/shared/SanityImage.jsx` (entire file, 41 lines)

**Apply to:** every product image surface (cards, gallery, sticky bar omitted — text-only).

```jsx
import { urlFor } from '../../utilities/sanityImage';
import Placeholder from './Placeholder';

const DEFAULT_WIDTHS = [400, 800, 1200, 1600];

const SanityImage = ({ source, alt, sizes = '...', loading = 'lazy', className = '', placeholderCaption }) => {
	const altText = alt ?? source?.altText ?? source?.asset?.altText ?? '';
	if (!source?.asset) {
		return <Placeholder caption={placeholderCaption} className={className} />;
	}
	const srcSet = DEFAULT_WIDTHS
		.map((w) => `${urlFor(source).width(w).auto('format').quality(80).url()} ${w}w`)
		.join(', ');
	const fallbackSrc = urlFor(source).width(800).auto('format').quality(80).url();
	return <img src={fallbackSrc} srcSet={srcSet} sizes={sizes} alt={altText} loading={loading} className={className} />;
};
```

**Apply to:** ProductCard, ImageGallery, og:image meta extraction. Auto-falls-back to `<Placeholder>` when source.asset is empty (Phase 2 D-11 graceful-degrade contract).

### Direct CDN URL for Snipcart `data-item-image`

**Source:** `src/utilities/sanityImage.jsx:11-12`
```jsx
export const urlAt = (source, width) =>
	urlFor(source).width(width).auto('format').quality(80).url();
```

**Apply to:** `AddToCartButton` — Snipcart needs an absolute URL string for `data-item-image`, not a React component.

### SEO meta wrapper

**Source:** `src/components/shared/SEOHead.jsx` (entire file, 31 lines)

**Apply to:** `Shop.jsx` (catalog branch), `ShopComingSoon.jsx` (preserved from current Shop.jsx), `ShopSingle.jsx`. The `<HelmetProvider>` already wraps the entire app at `App.js:38` — no provider plumbing needed.

```jsx
<SEOHead
	title="Shop"
	description="Pre-made laser-cut and 3D-printed pieces from Shapesmith Studio, ready to take home."
	ogUrl="https://shapesmith.studio/shop"
	ogImage={{ url: '/og-default.png', altText: 'Shapesmith Studio' }}
/>
```

For `ShopSingle`, follow the conditional-mount pattern from `ProjectSingle.jsx:42-51` (only render `<SEOHead>` after product loads to avoid emitting `<undefined> — Shapesmith Studio` titles).

### Netlify Function shell (env, error shape, CORS)

**Source:** `netlify/functions/submit-quote/submit-quote.js` (entire file)

**Apply to:** both new Functions (`snipcart-validate-product`, `snipcart-order-webhook`).

**Shared elements:**
- CommonJS (`exports.handler = async (event) => { ... }`) — `netlify.toml` uses esbuild bundler but the existing function source is CommonJS; match the precedent.
- `event.httpMethod` guard returning 405 for wrong method.
- `JSON.parse(event.body)` wrapped in try/catch returning 400 on parse failure.
- Body-size guard (`MAX_BODY_BYTES = 100 * 1024`) returning 400 on oversize.
- `fetchWithTimeout` helper using `AbortController` + 5s timeout — Node 18+ `fetch` has no per-call timeout option, so this helper is required.
- `console.error('...failed:', e)` for failures (Netlify Functions log to dashboard).
- Final return: `{ statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(...) }`.
- Function-local `package.json` with deps installed via `pnpm install` inside the function directory.

**No CORS headers needed** — Snipcart's webhook hits the Function directly (no browser preflight); browser-side calls hit `/.netlify/functions/...` on the same origin (no cross-origin). Match the submit-quote precedent which also has none.

### Tailwind palette + token typo

**Source:** `tailwind.config.js` + every existing component.

**Apply to:** every new shop component. Use these tokens ONLY:
- Backgrounds: `bg-primary-dark`, `bg-secondary-dark`, `bg-ternary-dark` (note: "ternary" not "tertiary"), `bg-secondary-section-dark`, `bg-ternary-section-dark`
- Text: `text-primary-light`, `text-ternary-light`, `text-ternary-section-dark`, `text-red-400` (errors only)
- Accent: `bg-accent` / `text-accent` / `border-accent`, `bg-accent-highlight` (hover only)

**Hard rule:** NO new color tokens added in Phase 5. NO `dark:` prefix needed for new shop files since Phase 1 stripped light tokens — but if mirroring `bg-secondary-light dark:bg-ternary-dark` legacy in ServiceCard, simplify to `bg-ternary-dark` only (UI-SPEC §Color is explicit on this).

### Accent button hover pattern

**Source:** every existing CTA in the codebase.

**Apply to:** `AddToCartButton`, `ShopFilter` (active pill), `ShopComingSoon` (preserved from current).

```jsx
className="bg-accent hover:bg-accent-highlight text-white font-general-medium px-5 py-2.5 rounded-md duration-300"
```

Variants: `px-6 py-3` for the in-content detail-page button, `px-5 py-2.5` for the sticky-bar button (UI-SPEC §3 + §8).

### `framer-motion` envelope (optional)

**Source:** `src/pages/ProjectSingle.jsx:80-85`, `src/components/services/ServiceCard.jsx:10-18`.

**Apply to:** OPTIONAL. UI-SPEC permits a tasteful card-mount fade-in but doesn't require it. If used, copy the existing `motion.div` wrapper exactly:
```jsx
<motion.div
	initial={{ opacity: 0 }}
	animate={{ opacity: 1, delay: 1 }}
	transition={{ ease: 'easeInOut', duration: 0.7, delay: 0.15 }}
>
```

D-16 forbids urgency animations on sold-out / low-stock states — the framer-motion mount fade is unrelated.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/shop/ShopFilter.jsx` | controlled radiogroup | local state | No existing site code uses `role="radiogroup"` segmented controls. Pattern is grounded in UI-SPEC §7. |
| `src/components/shop/AddToCartButton.jsx` | Snipcart-attribute emit | DOM-attribute contract | No existing site code emits `data-item-*` attributes for an external SDK to intercept. Pattern is grounded in Snipcart docs (RESEARCH Pattern 3). |
| `src/components/shop/StickyMobileAddToCart.jsx` | sticky observer-driven UI | IntersectionObserver | No existing site code uses `IntersectionObserver`. Pattern is grounded in UI-SPEC §3. |
| `src/css/snipcart.css` | external-SDK CSS theming | CSS-variable overrides | No existing CSS-only file in `src/css/` other than fonts. Pattern is grounded in Snipcart's `:root` variable contract (RESEARCH headline finding 3 + Pattern 6). |
| `index.html` Snipcart additions | external script-tag injection | static HTML | No existing third-party script tag in `index.html`. Pattern is grounded in Snipcart docs (RESEARCH Pattern 1). |
| `netlify/functions/snipcart-validate-product/snipcart-validate-product.js` GET-with-Sanity-fetch | function | request-response JSON | The submit-quote function is POST-with-validate-then-Resend; this one is GET-with-Sanity-read-then-respond. The shell pattern (env, error shape, CORS) reuses submit-quote, but the data-flow is genuinely new in this codebase. |

For all six, the planner should reference RESEARCH.md and UI-SPEC.md sections (cited inline above) directly in PLAN.md actions. There is no closer codebase match.

---

## Cross-Cutting Deviations Flagged for Planner

1. **`data-item-categories` separator** — RESEARCH Pattern 3 says pipe (`|`); UI-SPEC §8 says comma (`,`). RESEARCH `[VERIFIED: docs.snipcart.com/v3/setup/products]` wins — use pipe. UI-SPEC §8 should be patched.
2. **Snipcart CSS variable names** — UI-SPEC §6 lists preliminary variable names (`--snipcart-color-primary`, etc.); RESEARCH headline finding 3 + Pattern 6 say the official names are different (`--color-buttonPrimary`, `--bgColor-buttonPrimary`, etc.). Use the official names per `docs.snipcart.com/v3/themes/default/reference`. UI-SPEC §6 should be patched.
3. **Slug shape in `SingleProductContext`** — `SingleServiceContext.jsx:16` carries a defensive fallback `slug?.current || slug?.includes?.()`. Phase 5's GROQ projects `"slug": slug.current` as a string (mirrors `generate-sitemap.cjs:30`), so `SingleProductContext` does NOT need that fallback. Cleaner code.
4. **`Shop.jsx` extraction** — the current 110-line `Shop.jsx` body must be moved BYTE-FOR-BYTE into `ShopComingSoon.jsx` (form-name `shop-notify`, honeypot `bot-field`, all copy strings, all classes). Phase 2 D-23/D-26/D-28 contracts hold; any drift = silent submission drop.
5. **`ShopProvider` shape** — DO NOT take a `serviceKey`-style required prop. The shop is its own concept (Phase 2 D-04 hard rule). Provider takes only `{ children }`.
6. **`ImageGallery` refactor** — UI-SPEC §2 says inline reuse of `<ServiceGallery />` is NOT viable (it's coupled to `useSingleService()`). The refactor extracts a props-driven primitive at `src/components/shared/ImageGallery.jsx` and rewires `ServiceGallery` to consume it. Planner judges whether to ship this as a separate plan or as part of the detail-page plan.
7. **Sticky-bar ref plumbing** — `StickyMobileAddToCart` needs to observe the in-content Add-to-Cart button. Either pass a ref down from `ShopSingle` → `ProductInfo` → button, or use a stable DOM `id` selector (`document.getElementById('product-add-to-cart')`). Planner judges; the ref approach is cleaner React.
8. **Webhook idempotency strategy** — CONTEXT D-15 says "idempotent against retries". Persistence is heavy at this scale; recommend tolerating duplicate emails and documenting in code comments. Planner judges.
9. **Webhook 200 vs 502 on Resend failure** — submit-quote returns 502 on Resend failure (visitor sees the error). Webhook MUST return 200 even if Resend fails (Snipcart retries on non-200, multiplying errors). Document the deviation in code comments.
10. **`snipcart-validate-product` `@sanity/client` install** — function-local `package.json` adds `@sanity/client` (NOT the project root pin). Mirrors how `submit-quote` declares `resend` as a function-local dep.

---

## Metadata

**Analog search scope:**
- `src/context/` (3 files)
- `src/hooks/useSanityQuery.jsx`
- `src/pages/` (8 files)
- `src/components/services/` (9 files)
- `src/components/shared/` (8 files)
- `src/utilities/` (4 files)
- `src/components/shop/` (does not exist yet — 0 files)
- `netlify/functions/` (1 existing function: `submit-quote`)
- `index.html`, `vite.config.js`, `netlify.toml`, `src/index.js`

**Files scanned with cat -n Read:** 22 source files, 5 phase docs (CONTEXT, partial RESEARCH, UI-SPEC, plus directory listings).

**Pattern extraction date:** 2026-05-08
