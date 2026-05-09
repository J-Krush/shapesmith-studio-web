// Plan 05-04 — Sold-out badge + image overlay (D-16, UI-SPEC §4).
// Renders two siblings inside a fragment intended to be absolute-positioned
// inside a `relative` parent (ProductCard wraps its <SanityImage> in one).
// No animations (D-16 hard rule).
const SoldOutBadge = () => (
	<>
		<span className="absolute top-3 left-3 bg-secondary-section-dark text-ternary-light text-sm font-general-medium px-3 py-1 rounded-md">
			Sold out
		</span>
		<div
			className="absolute inset-0 bg-secondary-section-dark/70 rounded-xl"
			aria-hidden="true"
		/>
	</>
);

export default SoldOutBadge;
