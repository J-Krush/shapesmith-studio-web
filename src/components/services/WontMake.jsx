// Renders the per-service "what we won't make" portable-text block.
// Parent (ProjectSingle) passes wontMakeScope from singleService.wontMakeScope.
// If absent, the section silently renders nothing (no empty-state copy — UI-SPEC says
// this section can be missing without UX cost).

const renderBody = (wontMakeScope) => {
	if (!Array.isArray(wontMakeScope)) return null;
	return wontMakeScope.map((block, i) => {
		if (!block || !Array.isArray(block.children)) return null;
		const text = block.children.map((c) => c?.text ?? '').join('');
		return (
			<p
				key={block._key ?? i}
				className="text-ternary-dark dark:text-ternary-light mb-4"
			>
				{text}
			</p>
		);
	});
};

const WontMake = ({ wontMakeScope }) => {
	if (
		!wontMakeScope ||
		(Array.isArray(wontMakeScope) && wontMakeScope.length === 0)
	) {
		return null;
	}
	return (
		<section className="py-12 sm:py-24">
			<div className="container mx-auto">
				<h2 className="font-display font-bold text-2xl sm:text-3xl text-ternary-dark dark:text-ternary-light mb-8">
					What we won't make
				</h2>
				{renderBody(wontMakeScope)}
			</div>
		</section>
	);
};

export default WontMake;
