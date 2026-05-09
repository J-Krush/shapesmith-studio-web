// Plan 05-05 — Snipcart Add-to-Cart button (the buy surface for /shop/:slug).
//
// Source-of-truth: RESEARCH.md §"Pattern 3: Add-to-Cart Button" + PATTERNS.md
// §"src/components/shop/AddToCartButton.jsx".
//
// Hard rules (PATTERNS deviation flags + threat model T-05-05-02 / T-05-05-03):
//   - data-item-categories uses the PIPE separator '|' per
//     docs.snipcart.com/v3/setup/products. UI-SPEC §8 was patched in Plan
//     05-04 (Patches Log row 2). Comma here would silently miscategorize.
//   - data-item-url MUST point at the Netlify Function JSON crawler endpoint,
//     NOT the SPA route. Snipcart's HTML crawler can't parse index.html, so a
//     SPA URL silently fails order validation (RESEARCH Pitfall 1).
//   - When stockQuantity === 0 the component returns a non-button <span>
//     (CONTEXT D-16 — semantic correctness; no Snipcart selector match means
//     no purchase action available).
//   - data-item-image is an absolute CDN URL string (use urlAt), NOT a
//     <SanityImage> component — Snipcart drawer renders this directly.
import { urlAt } from '../../utilities/sanityImage';

const AddToCartButton = ({ product, variant = 'detail' }) => {
	const { slug, name, price, description, stockQuantity, processes, images } = product;
	const isSoldOut = stockQuantity === 0;

	if (isSoldOut) {
		// CONTEXT D-16 — replace button with a static span so the slot doesn't
		// reflow and Snipcart's `.snipcart-add-item` selector cannot match.
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

	// CRITICAL: data-item-url MUST be the JSON crawler endpoint (Plan 05-06),
	// NOT the SPA route. Snipcart's order-validation crawler hits this URL and
	// expects JSON when Content-Type is application/json. A SPA route returns
	// index.html and validation fails. See RESEARCH §Pitfall 1 + Pitfall 2 —
	// the JSON crawler endpoint is also the price-truth boundary that
	// mitigates browser-side data-item-price tampering.
	//
	// `window` is browser-only; the component is rendered inside ShopSingle
	// which is a lazy route — never evaluated at SSR / build time.
	const validateUrl = `${window.location.origin}/.netlify/functions/snipcart-validate-product?slug=${slug}`;

	const baseClasses =
		variant === 'sticky'
			? 'snipcart-add-item bg-accent hover:bg-accent-highlight text-white font-general-medium px-5 py-2.5 rounded-md flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed'
			: 'snipcart-add-item bg-accent hover:bg-accent-highlight text-white font-general-medium px-6 py-3 rounded-md text-base sm:text-lg duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto';

	return (
		<button
			type="button"
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

export default AddToCartButton;
