// Plan 02-03 / UI-SPEC §"Per-Route Spruce Checklist" `/` row:
// QuickInfo on the homepage is service-agnostic — laser-only "We cut and engrave"
// copy and the /materials link were removed (the route is dropped via redirect in
// Plan 02-02). Hardcoded copy is acceptable for relaunch; Sanity-driven hero copy
// would require a new studio-info field, deferred per CONTEXT.md scope.
const QuickInfo = () => {
	return (
		<section className="py-5 sm:py-10 mt-5 sm:mt-10 bg-secondary-section-light dark:bg-secondary-section-dark">
			<div className="container mx-auto my-24">
				<div className="text-center">
					<h2 className="font-display font-black text-3xl md:text-center sm:text-left text-ternary-dark dark:text-primary-light">
						What we make
					</h2>

					<p className="font-general-medium text-lg md:text-center sm:text-left mt-8 text-ternary-dark dark:text-primary-light">
						Custom laser-cut signs, ornaments, and decor in wood,
						acrylic, and leather; 3D-printed parts and prototypes in
						PLA, PETG, and TPU. Bring us your idea — we'll figure
						out the rest.
					</p>
				</div>
			</div>
		</section>
	);
};

export default QuickInfo;
