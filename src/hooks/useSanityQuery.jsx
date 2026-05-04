import { useState, useEffect, useCallback } from 'react';
import sanityClient from '../utilities/sanityClient';

const useSanityQuery = (query, params = {}, deps = []) => {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [refetchIndex, setRefetchIndex] = useState(0);

	const refetch = useCallback(() => setRefetchIndex((i) => i + 1), []);

	useEffect(() => {
		const controller = new AbortController();
		setLoading(true);
		setError(null);

		sanityClient
			.fetch(query, params, { signal: controller.signal })
			.then((result) => {
				setData(result);
				setLoading(false);
			})
			.catch((err) => {
				if (err.name === 'AbortError') return;
				console.error(err);
				setError(err);
				setLoading(false);
			});

		return () => controller.abort();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query, refetchIndex, ...deps]);

	return { data, loading, error, refetch };
};

export default useSanityQuery;
