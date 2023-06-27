import useThemeSwitcher from '../../hooks/useThemeSwitcher';
// import heroLight from '../../images/placeholder-hero.png';
// import heroDark from '../../images/placeholder-hero.png';
import heroLight from '../../images/bloom-layers-top.jpg';
import { motion } from 'framer-motion';
import logoLight from '../../images/horizontal-brand-bold.png';
import logoDark from '../../images/horizontal-brand-bold-accent.png';

const AppBanner = () => {
	const [activeTheme] = useThemeSwitcher();

	console.log('activeTheme: ', activeTheme);

	return (
		<div className="container mx-auto h-full">
			<motion.section
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ ease: 'easeInOut', duration: 0.9, delay: 0.2 }}
				className="flex flex-col sm:justify-between items-center sm:flex-row mt-12 md:mt-2 mb-24"
			>
				<div className="w-2/3 text-left">
					<motion.div>
						<img
							src={activeTheme === 'dark' ? logoLight : logoDark}
							className="mb-12"
							alt="Logo Brand"
						/>
					</motion.div>
					<motion.h1
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{
							ease: 'easeInOut',
							duration: 0.9,
							delay: 0.1,
						}}
						className="font-display font-black text-3xl mb-8 sm:text-left text-ternary-dark dark:text-primary-light"
					>
						Maker Studio &
						Custom Laser Cutting
					</motion.h1>
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{
							ease: 'easeInOut',
							duration: 0.9,
							delay: 0.2,
						}}
						className="font-general-medium mt-4 text-xl sm:text-left leading-normal text-gray-500 dark:text-gray-200"
					>
						
						No idea too big or too small. We just love making stuff! 
					</motion.p>
				</div>
				<motion.div
					initial={{ opacity: 0, y: -180 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ ease: 'easeInOut', duration: 0.9, delay: 0.2 }}
					className="w-2/3 md:mt-8 sm:mt-0 sm:pl-0 md:pl-16 sm:mt-0"
				>
					<img
						className='rounded-lg my-24'
						// src={
						// 	activeTheme === 'dark' ? heroLight : heroDark
						// }
						src={heroLight}
						alt="Developer"
					/>
				</motion.div>
			</motion.section>
		</div>
	);
};

export default AppBanner;
