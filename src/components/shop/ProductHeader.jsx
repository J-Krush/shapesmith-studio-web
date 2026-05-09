// Plan 05-05 — Product H1 for the /shop/:slug detail page.
// Mirrors src/components/services/ServiceHeader.jsx but renders an <h1>
// (not <p>) at font-display font-black, per UI-SPEC §Typography "Display" row.
import { useSingleProduct } from '../../context/SingleProductContext';

const ProductHeader = () => {
	const { product } = useSingleProduct();
	if (!product) return null;
	return (
		<h1 className="font-display font-black text-4xl sm:text-5xl text-primary-light leading-tight mt-14 sm:mt-20 mb-7">
			{product.name}
		</h1>
	);
};

export default ProductHeader;
