// Plan 05-03 (Wave 2) — Shop catalog data layer.
// Mirrors ServicesContext.jsx shape but takes no required prop (PATTERNS deviation 5):
// the shop is its own concept, not a per-service drill-in. Per CONTEXT D-01 / D-11.
//
// GROQ projection is the single source of truth referenced by 05-PRODUCT-SCHEMA-SPEC.md §4
// — schema field edits propagate to the spec FIRST, then to this projection in lockstep.
import { createContext, useContext } from 'react';
import useSanityQuery from '../hooks/useSanityQuery';

const ShopContext = createContext();

const PRODUCTS_QUERY = `*[_type == "product" && !(_id in path("drafts.**"))]
  | order(featured desc, _createdAt desc){
    _id,
    name,
    "slug": slug.current,
    description,
    body,
    price,
    stockQuantity,
    featured,
    dimensions,
    leadTime,
    "processes": processes[]->key,
    "materials": materials[]->{ _id, name, "slug": slug.current, services },
    images[]{
      altText,
      caption,
      "asset": asset.asset->{ _id, url, altText }
    },
    seo{ metaTitle, metaDescription, ogImage{ asset->{ _id, url, altText } } }
  }`;

export const ShopProvider = ({ children }) => {
	const { data, loading, error, refetch } = useSanityQuery(PRODUCTS_QUERY);
	return (
		<ShopContext.Provider value={{ products: data ?? [], loading, error, refetch }}>
			{children}
		</ShopContext.Provider>
	);
};

export const useShop = () => useContext(ShopContext);
export default ShopContext;
