import ProductCard from './ProductCard';

// Plan 05-04 — Responsive 1/2/3-column grid (CONTEXT D-10, UI-SPEC §1).
// Empty-after-filter copy from UI-SPEC §"Copywriting Contract".
// Does NOT re-sort — ShopContext GROQ orders by `featured desc, _createdAt desc` (D-11).
const ProductGrid = ({ products }) => {
	if (products.length === 0) {
		return (
			<p className="text-ternary-light font-general-regular py-12 text-center">
				No items in this category yet. Try a different filter.
			</p>
		);
	}
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-6 mx-12 sm:mx-0 gap-y-10 sm:gap-x-10">
			{products.map((product) => (
				<ProductCard product={product} key={product._id} />
			))}
		</div>
	);
};

export default ProductGrid;
