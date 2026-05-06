import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SERVICES } from '../../data/services';
import brandMultiFont from '../../assets/brand-horizontal-multi-font.png';

// Plan 02-03 / D-10: dual-service hero — both services equal weight, single shared
// accent CTA. Hero copy is hardcoded by the planner per UI-SPEC §"Hero composition";
// owner can revise by editing this file (no Sanity field for hero copy in Phase 2).
const HERO_COPY = {
	h1: 'Maker Studio — Custom Laser Cutting & 3D Printing',
	subhead:
		'No idea too big or too small. We cut, engrave, and now print the things you have in mind.',
};

// Per-card material lists keyed by service.key — UI-SPEC verbatim. Iteration order
// is driven by SERVICES (laser first, print second) so changing the order in
// src/data/services.js reorders the cards everywhere.
const SERVICE_CARDS = {
	laser: {
		title: 'LASER CUTTING',
		materials: 'hardwood, plywood, acrylic, leather, and more',
	},
	print: {
		title: '3D PRINTING',
		materials: 'PLA, PETG, TPU, and more',
	},
};

const AppBanner = () => {
	return (
		<div className="container mx-auto h-full">
			<motion.section
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ ease: 'easeInOut', duration: 0.9, delay: 0.2 }}
				className="flex flex-col items-center mt-12 sm:mt-24 mb-24"
			>
				<img
					src={brandMultiFont}
					alt="Shapesmith Studio"
					loading="eager"
					className="w-full max-w-md sm:max-w-lg mb-8"
				/>

				<h1 className="font-display font-black text-3xl sm:text-4xl text-primary-light leading-tight text-center mb-4">
					{HERO_COPY.h1}
				</h1>

				<p className="text-xl font-general-medium text-ternary-light leading-snug text-center max-w-2xl mb-12">
					{HERO_COPY.subhead}
				</p>

				<div className="flex flex-col sm:flex-row gap-6 w-full max-w-4xl mb-10">
					{SERVICES.map((s) => {
						const card = SERVICE_CARDS[s.key];
						return (
							<Link
								key={s.key}
								to={`/${s.urlSegment}`}
								className="w-full sm:w-1/2 dark:bg-ternary-dark rounded-xl p-6 hover:opacity-90 duration-300"
								aria-label={`${card.title} — see examples`}
							>
								<h2 className="font-display font-black text-2xl sm:text-3xl uppercase text-primary-light mb-4">
									{card.title}
								</h2>
								<p className="text-base font-general-regular text-ternary-light leading-normal mb-4">
									{card.materials}
								</p>
								<span className="text-accent hover:underline font-general-medium">
									See examples →
								</span>
							</Link>
						);
					})}
				</div>

				<Link
					to="/contact"
					aria-label="contact-us"
					className="bg-accent hover:bg-accent-highlight text-white font-general-medium px-5 py-2.5 rounded-md duration-300"
				>
					Contact us
				</Link>
			</motion.section>
		</div>
	);
};

export default AppBanner;
