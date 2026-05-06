// GROQ projection contract (D-05): only project fields that exist in BOTH
// laser-style AND print-style. Per-service fields go in a per-service GROQ
// extension layered on top, NOT in this shared projection. See RESEARCH §Pitfall 3.
import { createContext, useContext } from 'react';
import useSanityQuery from '../hooks/useSanityQuery';
import { SERVICES } from '../data/services';

const ServicesContext = createContext();

const SERVICES_QUERY = `*[_type == $sanityType] | order(order asc){
  _id, order, title, description, header, slug,
  preferredMaterials, considerations,
  turnaround, wontMakeScope,
  seo{ metaTitle, metaDescription, ogImage{ asset->{ _id, url, altText } } },
  listImage{ altText, asset->{ _id, url, altText } },
  detailImages[]{ altText, asset->{ _id, url, altText } }
}`;

export const ServicesProvider = ({ serviceKey, children }) => {
	const service = SERVICES.find((s) => s.key === serviceKey);
	if (!service) throw new Error(`Unknown serviceKey: ${serviceKey}`);

	const { data, loading, error, refetch } = useSanityQuery(
		SERVICES_QUERY,
		{ sanityType: service.sanityType },
		[service.sanityType]
	);

	return (
		<ServicesContext.Provider
			value={{ serviceKey, service, services: data ?? [], loading, error, refetch }}
		>
			{children}
		</ServicesContext.Provider>
	);
};

export const useServices = () => useContext(ServicesContext);
export default ServicesContext;
