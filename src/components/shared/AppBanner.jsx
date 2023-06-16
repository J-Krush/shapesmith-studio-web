import useThemeSwitcher from '../../hooks/useThemeSwitcher';
import heroLight from '../../images/placeholder-hero.png';
import heroDark from '../../images/placeholder-hero.png';
import { motion } from 'framer-motion';

const AppBanner = () => {
	const [activeTheme] = useThemeSwitcher();

	return (
		<div className="container mx-auto h-full">
			<motion.section
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ ease: 'easeInOut', duration: 0.9, delay: 0.2 }}
				className="flex flex-col sm:justify-between items-center sm:flex-row mt-12 md:mt-2"
			>
				<div className="w-full md:w-1/3 text-left">
					<motion.h1
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{
							ease: 'easeInOut',
							duration: 0.9,
							delay: 0.1,
						}}
						className="font-display font-black text-4xl lg:text-3xl xl:text-4xl text-center sm:text-left text-ternary-dark dark:text-primary-light uppercase"
					>
						Maker Studio &
						Laser Cutting Services
					</motion.h1>
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{
							ease: 'easeInOut',
							duration: 0.9,
							delay: 0.2,
						}}
						className="font-general-medium mt-4 text-lg md:text-xl lg:text-2xl xl:text-3xl text-center sm:text-left leading-normal text-gray-500 dark:text-gray-200"
					>
						Where Laser Magic Meets Maker Mojo!
					</motion.p>
				</div>
				<motion.div
					initial={{ opacity: 0, y: -180 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ ease: 'easeInOut', duration: 0.9, delay: 0.2 }}
					className="w-full sm:w-2/3 text-right float-right mt-8 mb-24 sm:mt-0"
				>
					<img
						src={
							activeTheme === 'dark' ? heroLight : heroDark
						}
						alt="Developer"
					/>
				</motion.div>
			</motion.section>
		</div>
	);
};

export default AppBanner;
