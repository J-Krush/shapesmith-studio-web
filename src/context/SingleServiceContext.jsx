import { createContext, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ServicesContext from './ServicesContext';

const SingleServiceContext = createContext();

export const SingleServiceProvider = ({ children }) => {
	const params = useParams();
	// Defensive: route segment was normalized to :slug in App.js per RESEARCH §Pattern 3 Note 2.
	// Sanity slug shape may be { current: "..." } object OR string (RESEARCH A2);
	// try both — TODO Wave 1 spike: confirm and remove the fallback.
	const slug = params.slug ?? params.capability;
	const { services, loading, error } = useContext(ServicesContext);

	const singleService = useMemo(
		() => services.find((s) => s.slug?.current === slug || s.slug?.includes?.(slug)),
		[services, slug]
	);

	return (
		<SingleServiceContext.Provider value={{ singleService, loading, error }}>
			{children}
		</SingleServiceContext.Provider>
	);
};

export const useSingleService = () => useContext(SingleServiceContext);
export default SingleServiceContext;
