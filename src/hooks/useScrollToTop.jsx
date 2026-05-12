// NOTE: This scroll to top is the actual working scroll-to-top when user
// clicks the circle arrow that appears once they scroll down.
// The other `ScrollToTop` component in the components folder handles the
// default react scroll-to-top behavior on route visits.
//
// Plan 02-05 (D-29 / VIS-05): listener-leak fix per CONCERNS.md.
// (a) The previous useEffect ran on every render (no `[]` deps) — fixed.
// (b) A duplicate `window.addEventListener('scroll', scrollToTop)` was
//     registered at module-load time outside any function — removed.

import { useState, useEffect, useCallback } from 'react';
import { FiChevronUp } from 'react-icons/fi';

const useScrollToTop = () => {
	const [showScroll, setShowScroll] = useState(false);

	const scrollToTop = useCallback(() => {
		if (!showScroll && window.pageYOffset > 400) {
			setShowScroll(true);
		} else if (showScroll && window.pageYOffset <= 400) {
			setShowScroll(false);
		}
	}, [showScroll]);

	useEffect(() => {
		window.addEventListener('scroll', scrollToTop);
		return () => window.removeEventListener('scroll', scrollToTop);
	}, [scrollToTop]);

	const backToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	};

	return (
		<>
			<FiChevronUp
				className="scrollToTop"
				onClick={backToTop}
				style={{
					height: 45,
					width: 45,
					borderRadius: 50,
					right: 50,
					bottom: 50,
					display: showScroll ? 'flex' : 'none',
					padding: 5,
				}}
			/>
		</>
	);
};

export default useScrollToTop;
