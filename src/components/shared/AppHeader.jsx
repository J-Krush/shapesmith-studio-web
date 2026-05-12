import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

import { SERVICES } from '../../data/services';
import logoDark from '../../assets/logo-flower-of-life-dark.png';

// Plan 02-03 / SVC-03: peer-equal services nav driven by SERVICES.map.
// Both service entries are top-level peers — no "Services" group label, no
// dropdown. Active route gets border-b-2 border-accent + aria-current="page".
// /materials top-level entry was dropped in Plan 02-02 (route now redirects
// to /styles#materials). /shop is added here; the route is wired in App.js
// and renders the legacy stub until Plan 02-05 ships the Coming Soon page.
const NAV_ITEMS = [
	{ to: '/', label: 'Home', match: '/' },
	...SERVICES.filter((s) => !s.hidden).map((s) => ({
		to: `/${s.urlSegment}`,
		// Pretty-print the laser nav label per UI-SPEC §"Nav refresh"
		// ("styles" → "Laser Cutting"); print already uses display casing.
		label: s.navLabel === 'styles' ? 'Laser Cutting' : s.navLabel,
		match: `/${s.urlSegment}`,
	})),
	{ to: '/about', label: 'About', match: '/about' },
	// Temporarily hidden while /shop (Snipcart) and /quote (auto-pricing tool)
	// are still in test. Routes stay registered in App.js so direct URLs work.
	// Restore when ready to launch.
	// { to: '/shop', label: 'Shop', match: '/shop' },
	// { to: '/quote', label: 'Get a Quote', match: '/quote' },
];

const AppHeader = () => {
	const [showMenu, setShowMenu] = useState(false);
	const location = useLocation();

	function toggleMenu() {
		if (!showMenu) {
			setShowMenu(true);
		} else {
			setShowMenu(false);
		}
	}

	// Active-state detection: pathname starts with the match path so /styles/foo
	// also matches /styles. Root '/' uses strict equality so it doesn't match all routes.
	const isActive = (matchPath) =>
		matchPath === '/'
			? location.pathname === '/'
			: location.pathname.startsWith(matchPath);

	const navLinkClasses = (matchPath) =>
		`capitalize block text-left text-lg text-primary-dark dark:text-ternary-light hover:text-secondary-dark dark:hover:text-secondary-light sm:mx-4 mb-2 sm:py-2 ${
			isActive(matchPath) ? 'border-b-2 border-accent' : ''
		}`;

	return (
		<motion.nav
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			id="nav"
			className="sm:container sm:mx-auto"
		>
			<div className="z-10 max-w-screen-lg xl:max-w-screen-xl block sm:flex sm:justify-between sm:items-center py-6">
				{/* Header menu links and small screen hamburger menu */}
				<div className="flex justify-between items-center px-4 sm:px-0">
					<div>
						<Link to="/">
							<img
								src={logoDark}
								className="w-12"
								alt="Logo Flower"
							/>
						</Link>
					</div>

					{/* Small screen hamburger menu */}
					<div className="sm:hidden">
						<button
							onClick={toggleMenu}
							type="button"
							className="focus:outline-none text-secondary-dark dark:text-ternary-light"
							aria-label="Hamburger Menu"
						>
							{showMenu ? (
								<FiX className="text-3xl" />
							) : (
								<FiMenu className="text-3xl" />
							)}
						</button>
					</div>
				</div>

				{/* Header links small screen */}
				<div
					className={
						showMenu
							? 'font-semibold block m-0 sm:ml-4 mt-5 sm:mt-3 sm:flex p-5 sm:p-0 justify-center items-center shadow-lg sm:shadow-none'
							: 'hidden'
					}
				>
					{NAV_ITEMS.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							className={navLinkClasses(item.match)}
							aria-label={item.label}
							aria-current={isActive(item.match) ? 'page' : undefined}
							onClick={() => setShowMenu(false)}
						>
							{item.label}
						</Link>
					))}
					<span className="block text-center text-md font-semibold bg-accent hover:bg-accent-highlight text-white shadow-sm rounded-md px-5 py-2.5 duration-300 cursor-pointer">
						<Link
							to="/contact"
							aria-label="contact-us"
							onClick={() => setShowMenu(false)}
						>
							Contact
						</Link>
					</span>
				</div>

				{/* Header links large screen */}
				<div className="font-semibold hidden m-0 sm:ml-4 mt-5 sm:mt-3 sm:flex p-5 sm:p-0 justify-center items-center shadow-lg sm:shadow-none">
					{NAV_ITEMS.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							className={navLinkClasses(item.match)}
							aria-label={item.label}
							aria-current={isActive(item.match) ? 'page' : undefined}
						>
							{item.label}
						</Link>
					))}
				</div>

				{/* Header right section buttons */}
				<div className="hidden sm:visible sm:flex justify-between items-center flex-col md:flex-row">
					<div className="md:flex">
						<span className="block text-center text-md font-semibold bg-accent hover:bg-accent-highlight text-white shadow-sm rounded-md px-5 py-2.5 duration-300 cursor-pointer">
							<Link to="/contact" aria-label="contact-us">
								Contact
							</Link>
						</span>
					</div>
				</div>
			</div>
		</motion.nav>
	);
};

export default AppHeader;
