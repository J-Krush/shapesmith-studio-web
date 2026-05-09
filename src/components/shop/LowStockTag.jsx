// Plan 05-04 — "Only N left" inline tag (D-16, UI-SPEC §5).
// Muted gray (text-ternary-section-dark), NO accent, NO red, NO animations.
const LowStockTag = ({ n }) => (
	<span className="ml-3 text-sm font-general-medium text-ternary-section-dark">
		Only {n} left
	</span>
);

export default LowStockTag;
