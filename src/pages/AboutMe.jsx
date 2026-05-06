import AboutMeBio from '../components/about/AboutMeBio';
import { AboutMeProvider } from '../context/AboutMeContext';
import { motion } from 'framer-motion';
import SEOHead from '../components/shared/SEOHead';

const About = () => {
	return (
		<AboutMeProvider>
			<SEOHead
				title="About"
				description="Shapesmith Studio is a one-person creative studio offering laser cutting and 3D printing."
				ogUrl="https://shapesmith.studio/about"
				ogImage={{ url: '/og-default.png', altText: 'Shapesmith Studio' }}
			/>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1, delay: 1 }}
				exit={{ opacity: 0 }}
				className="container mx-auto"
			>
				<AboutMeBio />
			</motion.div>
		</AboutMeProvider>
	);
};

export default About;
