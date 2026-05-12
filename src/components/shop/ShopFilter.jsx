// Plan 05-04 — Service-tag filter (CONTEXT D-11, UI-SPEC §7).
// ARIA radiogroup, 3 horizontally-arranged pills above the grid, no library.
// Active pill = bg-accent text-white; inactive = bg-ternary-dark text-ternary-light.
const FILTERS = ['All', 'Laser', '3D printed'];

const ShopFilter = ({ active, onChange }) => (
	<div
		role="radiogroup"
		aria-label="Filter by service"
		className="flex flex-wrap gap-3 mb-8 sm:mb-12"
	>
		{FILTERS.map((label) => (
			<button
				key={label}
				type="button"
				role="radio"
				aria-checked={active === label}
				onClick={() => onChange(label)}
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
);

export default ShopFilter;
