// Plan 05-03 (Wave 2) — single-product context for /shop/:slug.
// Mirrors SingleServiceContext.jsx but drops the legacy `:capability` param
// fallback (Plan 05's route is `/shop/:slug` only) and uses direct string
// equality on slug since the GROQ projection already projects slug.current as
// a string (PATTERNS deviation 3).
import { createContext, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ShopContext from './ShopContext';

const SingleProductContext = createContext();

export const SingleProductProvider = ({ children }) => {
	const { slug } = useParams();
	const { products, loading, error } = useContext(ShopContext);
	const product = useMemo(
		() => products.find((p) => p.slug === slug),
		[products, slug],
	);
	return (
		<SingleProductContext.Provider value={{ product, loading, error }}>
			{children}
		</SingleProductContext.Provider>
	);
};

export const useSingleProduct = () => useContext(SingleProductContext);
export default SingleProductContext;
