// Plan 05-05 — Footer-pinned sticky Add-to-Cart bar for mobile (<md:).
//
// Source-of-truth: UI-SPEC §3 (markup + visibility logic) + CONTEXT D-12.
//
// Visibility logic: an IntersectionObserver watches the in-content
// AddToCartButton wrapper (anchorRef, attached inside ProductInfo). When the
// in-content button scrolls out of viewport (entry.isIntersecting === false)
// the bar shows; when it scrolls back in, the bar hides.
//
// Hard rules:
//   - md:hidden — never appears on tablet+ (the in-content button is always
//     visible at >=768px because the right column is short enough).
//   - No scroll listeners — IntersectionObserver only.
//   - No animations on appearance (D-16 hard rule).
//   - The bottom-padding required to keep the sticky bar from covering the
//     last bit of content (`pb-16 md:pb-0`) lives on the page section in
//     ShopSingle.jsx, not here.
//   - The parent owns the ref via useRef in ShopSingle and threads it to BOTH
//     <ProductInfo> (which attaches it) AND <StickyMobileAddToCart> (which
//     observes it). DO NOT useRef inside this component.
import { useEffect, useState } from 'react';
import AddToCartButton from './AddToCartButton';

const StickyMobileAddToCart = ({ product, anchorRef }) => {
	const [showSticky, setShowSticky] = useState(false);

	useEffect(() => {
		// Defensive: anchorRef may not be wired yet on first render or in tests.
		if (!anchorRef?.current) return undefined;
		// IntersectionObserver is supported in every browser the site targets
		// (browserslist `>0.2%, not dead, not op_mini all`). No polyfill needed.
		if (typeof IntersectionObserver === 'undefined') return undefined;

		const node = anchorRef.current;
		const observer = new IntersectionObserver(
			([entry]) => setShowSticky(!entry.isIntersecting),
			{ rootMargin: '0px', threshold: 0 },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [anchorRef]);

	if (!product || !showSticky) return null;

	return (
		<div className="fixed bottom-0 left-0 right-0 md:hidden z-30 bg-ternary-dark/95 backdrop-blur-sm border-t border-secondary-section-dark px-4 py-3 flex items-center justify-between">
			<div className="flex flex-col min-w-0 mr-3">
				<span className="text-sm font-general-medium text-ternary-light truncate">
					{product.name}
				</span>
				<span className="text-base font-general-regular text-primary-light">
					${Number(product.price).toFixed(2)}
				</span>
			</div>
			<AddToCartButton product={product} variant="sticky" />
		</div>
	);
};

export default StickyMobileAddToCart;
