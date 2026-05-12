import { motion } from 'framer-motion';
import SEOHead from '../components/shared/SEOHead';
import QuoteTabs from '../components/quote/QuoteTabs';

// /quote page shell (Plan 03-01 stub) — H1 + subhead + tab strip with active
// panel. No submission, no pricing, no Sanity reads. Per CONTEXT.md D-01.
// Lazy-loaded from src/App.js so the Three.js parsers (loaded dynamically
// inside QuoteTabs) stay out of the main bundle until a visitor opens /quote.
const Quote = () => (
	<>
		<SEOHead
			title="Get a Quote"
			description="Upload your STL, OBJ, or SVG and get an instant ballpark estimate. We give you a quick range — final price comes after we look at your file."
			ogUrl="https://shapesmith.studio/quote"
			ogImage={{ url: '/og-default.png', altText: 'Shapesmith Studio quote tool' }}
		/>
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ ease: 'easeInOut', duration: 0.5, delay: 0.1 }}
			className="container mx-auto"
		>
			<section className="py-12 sm:py-24">
				<div className="text-center max-w-2xl mx-auto px-4 mb-12">
					<h1 className="font-display font-black text-3xl sm:text-4xl text-primary-dark dark:text-primary-light mb-6">
						Get an instant ballpark.
					</h1>
					<p className="text-base text-ternary-dark dark:text-ternary-light">
						We give you a quick range so you can decide if it&rsquo;s worth a real quote. Final price comes after we look at your file.
					</p>
				</div>
				<QuoteTabs />
			</section>
		</motion.div>
	</>
);

export default Quote;
