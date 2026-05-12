import { useState, useMemo } from 'react';
import ShopFilter from './ShopFilter';
import ProductGrid from './ProductGrid';

// Plan 05-04 — /shop catalog composition (CONTEXT D-11, UI-SPEC §"Copywriting Contract").
// Owns the activeFilter local state; filtering is client-side on the products array
// (RESEARCH §Code-Level Recommendations item 14 — no per-filter GROQ refetch).
// Sort is GROQ-side (Wave 2 ShopContext: featured desc, _createdAt desc).
const FILTER_TO_KEY = { All: null, Laser: 'laser', '3D printed': 'print' };

const ShopCatalog = ({ products }) => {
	const [active, setActive] = useState('All');
	const filterKey = FILTER_TO_KEY[active];

	const filtered = useMemo(
		() => (filterKey ? products.filter((p) => p.processes?.includes(filterKey)) : products),
		[products, filterKey],
	);

	return (
		<section className="py-5 sm:py-10 mt-5 sm:mt-10">
			<div className="container mx-auto sm:mx-50">
				<h1 className="font-general-medium text-3xl sm:text-4xl text-primary-light mb-4">
					Shop
				</h1>
				<p className="font-general-regular text-base text-ternary-light mb-8">
					Pre-made laser-cut and 3D-printed pieces, ready to take home.
				</p>
				<ShopFilter active={active} onChange={setActive} />
				<ProductGrid products={filtered} />
			</div>
		</section>
	);
};

export default ShopCatalog;
