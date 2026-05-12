// Plan 05-05 — Right-column composition for /shop/:slug.
//
// Source-of-truth: PATTERNS.md §"src/components/shop/ProductInfo.jsx" +
// UI-SPEC §Copywriting Contract (/shop/:slug detail page row).
//
// Render order (UI-SPEC):
//   1. Price line (with inline LowStockTag when 1 ≤ stockQuantity ≤ 3)
//   2. Inline "Sold out" line above the button slot when stockQuantity === 0
//   3. Short description
//   4. <div ref={buttonRef}> wrapping the in-content AddToCartButton — gives
//      the parent's IntersectionObserver (StickyMobileAddToCart) a stable
//      DOM node to observe.
//   5. Portable-text body via the FAQ.jsx plain-text walker (no
//      @portabletext/react dep — CONTEXT does not authorize it).
//   6. ProductSpecTable
//
// LOW_STOCK_THRESHOLD mirrors ProductCard.jsx (Plan 05-04). If a third
// consumer materializes, hoist this constant into a shared module.
import { useSingleProduct } from '../../context/SingleProductContext';
import AddToCartButton from './AddToCartButton';
import ProductSpecTable from './ProductSpecTable';
import LowStockTag from './LowStockTag';

const LOW_STOCK_THRESHOLD = 3; // CONTEXT D-06 / mirrors ProductCard.jsx

// Plain-text portable-text walker (FAQ.jsx:11-25 idiom).
// Owner ships plain prose via Sanity; rich-text styling is a v2 enhancement
// that would require pulling in @portabletext/react (not authorized in
// CONTEXT). Block-level marks/decorators are intentionally dropped.
const renderBody = (body) => {
	if (!Array.isArray(body)) return null;
	return body.map((block, i) => {
		if (!block || !Array.isArray(block.children)) return null;
		const text = block.children.map((c) => c?.text ?? '').join('');
		if (!text) return null;
		return (
			<p
				key={block._key ?? i}
				className="text-ternary-light font-general-regular leading-relaxed mb-4"
			>
				{text}
			</p>
		);
	});
};

const ProductInfo = ({ buttonRef }) => {
	const { product } = useSingleProduct();
	if (!product) return null;

	const { price, description, body, stockQuantity } = product;
	const isSoldOut = stockQuantity === 0;
	const isLowStock = stockQuantity > 0 && stockQuantity <= LOW_STOCK_THRESHOLD;

	return (
		<div>
			<p className="text-3xl sm:text-4xl font-general-regular text-primary-light mb-2">
				${Number(price).toFixed(2)}
				{isLowStock && <LowStockTag n={stockQuantity} />}
			</p>
			{isSoldOut && (
				<p className="text-sm font-general-medium text-ternary-section-dark mb-4">
					Sold out
				</p>
			)}
			{description && (
				<p className="text-base text-ternary-light font-general-regular mb-6">
					{description}
				</p>
			)}
			<div ref={buttonRef} className="mb-8">
				<AddToCartButton product={product} variant="detail" />
			</div>
			{renderBody(body)}
			<ProductSpecTable product={product} />
		</div>
	);
};

export default ProductInfo;
