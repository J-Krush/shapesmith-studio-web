import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { SERVICES } from '../../data/services';
// import logoLight from '../../assets/logo-flower-of-life-light.png';
import logoDark from '../../assets/logo-flower-of-life-dark.png';

const AppHeader = () => {
	const [showMenu, setShowMenu] = useState(false);
	const laser = SERVICES.find((s) => s.key === 'laser');

	function toggleMenu() {
		if (!showMenu) {
			setShowMenu(true);
		} else {
			setShowMenu(false);
		}
	}

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
							className="focus:outline-none"
							aria-label="Hamburger Menu"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								className="h-7 w-7 fill-current text-secondary-dark dark:text-ternary-light"
							>
								{showMenu ? (
									<FiX className="text-3xl" />
								) : (
									<FiMenu className="text-3xl" />
								)}
							</svg>
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
					<Link
						to={'/'}
						className="capitalize block text-left text-lg text-primary-dark dark:text-ternary-light hover:text-secondary-dark dark:hover:text-secondary-light  sm:mx-4 mb-2 sm:py-2"
						aria-label='home'
						onClick={() => setShowMenu(false)}
					>
						Home
					</Link>
					<Link
						to={`/${laser.urlSegment}`}
						className="capitalize block text-left text-lg text-primary-dark dark:text-ternary-light hover:text-secondary-dark dark:hover:text-secondary-light  sm:mx-4 mb-2 sm:py-2 border-t-2 pt-3 sm:border-t-0 border-primary-light dark:border-secondary-dark"
						aria-label={laser.navLabel}
						onClick={() => setShowMenu(false)}
					>
						{laser.navLabel}
					</Link>
					<Link
						to="/materials"
						className="block text-left text-lg text-primary-dark dark:text-ternary-light hover:text-secondary-dark dark:hover:text-secondary-light  sm:mx-4 mb-2 sm:py-2 border-t-2 pt-3 sm:pt-2 sm:border-t-0 border-primary-light dark:border-secondary-dark"
						aria-label="Materials"
						onClick={() => setShowMenu(false)}
					>
						Materials
					</Link>
					<Link
						to="/about"
						className="block text-left text-lg text-primary-dark dark:text-ternary-light hover:text-secondary-dark dark:hover:text-secondary-light  sm:mx-4 mb-4 sm:py-2 border-t-2 pt-3 sm:pt-2 sm:border-t-0 border-primary-light dark:border-secondary-dark"
						aria-label="About"
						onClick={() => setShowMenu(false)}
					>
						About
					</Link>
					<span
						className="block text-center text-md font-semibold bg-accent hover:bg-accent-highlight text-white shadow-sm rounded-md px-5 py-2.5 duration-300 cursor-pointer"
					>
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
					<Link
						to={'/'}
						className="capitalize block text-left text-lg text-primary-dark dark:text-ternary-light hover:text-secondary-dark dark:hover:text-secondary-light  sm:mx-4 mb-2 sm:py-2"
						aria-label='home'
					>
						Home
					</Link>
					{/* <Link
						to={`/shop`}
						className="capitalize block text-left text-lg text-primary-dark dark:text-ternary-light hover:text-secondary-dark dark:hover:text-secondary-light  sm:mx-4 mb-2 sm:py-2"
						aria-label='shop'
					>
						Shop (Coming Soon)
					</Link> */}
					<Link
						to={`/${laser.urlSegment}`}
						className="capitalize block text-left text-lg text-primary-dark dark:text-ternary-light hover:text-secondary-dark dark:hover:text-secondary-light  sm:mx-4 mb-2 sm:py-2"
						aria-label={laser.navLabel}
					>
						{laser.navLabel}
					</Link>
					<Link
						to="/materials"
						className="block text-left text-lg text-primary-dark dark:text-ternary-light hover:text-secondary-dark dark:hover:text-secondary-light  sm:mx-4 mb-2 sm:py-2 border-t-2 pt-3 sm:pt-2 sm:border-t-0 border-primary-light dark:border-secondary-dark"
						aria-label="Materials"
					>
						Materials
					</Link>
					<Link
						to="/about"
						className="block text-left text-lg text-primary-dark dark:text-ternary-light hover:text-secondary-dark dark:hover:text-secondary-light  sm:mx-4 mb-2 sm:py-2"
						aria-label="About"
					>
						About
					</Link>
				</div>

				{/* Header right section buttons */}
				<div className="hidden sm:visible sm:flex justify-between items-center flex-col md:flex-row">
					<div className="md:flex">
						<span
							className="block text-center text-md font-semibold bg-accent hover:bg-accent-highlight text-white shadow-sm rounded-md px-5 py-2.5 duration-300 cursor-pointer"
						>
							<Link
								to="/contact"
								aria-label="contact-us"
							>
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
