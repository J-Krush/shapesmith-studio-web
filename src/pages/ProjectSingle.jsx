import { motion } from 'framer-motion';
import ServiceHeader from '../components/services/ServiceHeader';
import ServiceGallery from '../components/services/ServiceGallery';
import ServiceInfo from '../components/services/ServiceInfo';
import MaterialsSection from '../components/services/MaterialsSection';
import FAQ from '../components/services/FAQ';
import WontMake from '../components/services/WontMake';
import TrustCopyBlock from '../components/services/TrustCopyBlock';
import { ServicesProvider, useServices } from '../context/ServicesContext';
import { SingleServiceProvider, useSingleService } from '../context/SingleServiceContext';
import SEOHead from '../components/shared/SEOHead';

// Inner component so it can call useSingleService() inside the provider boundary.
// Reads per-service overrides (turnaround, wontMakeScope) off the singleService doc
// and threads them into TrustCopyBlock + WontMake.
//
// Plan 02-04: also reads singleService.seo (Sanity-driven D-19) — falls back to
// title/description and to /og-default.png when no per-doc image is set.
const ServiceDetailComposition = ({ serviceKey }) => {
	const { service } = useServices();
	const { singleService } = useSingleService();
	const turnaround = singleService?.turnaround;
	const wontMakeScope = singleService?.wontMakeScope;

	// SEO meta sourced from Sanity seo block; fallback to title/description; og:image fallback to /og-default.png.
	const seoTitle = singleService?.seo?.metaTitle ?? singleService?.title;
	const seoDescription = singleService?.seo?.metaDescription ?? singleService?.description;
	const seoOgImage = singleService?.seo?.ogImage?.asset
		? {
				url: singleService.seo.ogImage.asset.url,
				altText: singleService.seo.ogImage.altText ?? singleService.title,
		  }
		: { url: '/og-default.png', altText: singleService?.title ?? 'Shapesmith Studio' };
	const slugStr = singleService?.slug?.current ?? singleService?.slug;
	const seoOgUrl = slugStr
		? `https://shapesmith.studio/${service.urlSegment}/${slugStr}`
		: undefined;

	return (
		<>
			{/* Conditionally mount SEOHead only after singleService loads — avoids emitting
			    a transient "<undefined> — Shapesmith Studio" title while data loads. */}
			{singleService && (
				<SEOHead
					title={seoTitle}
					description={seoDescription}
					ogImage={seoOgImage}
					ogUrl={seoOgUrl}
				/>
			)}
			<a
				href="#materials"
				className="text-accent hover:text-accent-highlight font-general-medium underline-offset-4 hover:underline inline-block mb-6"
			>
				See materials ↓
			</a>
			<ServiceHeader />
			<ServiceGallery />
			<ServiceInfo />
			<TrustCopyBlock turnaround={turnaround} />
			<MaterialsSection serviceKey={serviceKey} />
			<FAQ serviceKey={serviceKey} />
			<WontMake wontMakeScope={wontMakeScope} />
		</>
	);
};

const ProjectSingle = ({ serviceKey }) => (
	<motion.div
		initial={{ opacity: 0 }}
		animate={{ opacity: 1, delay: 1 }}
		transition={{ ease: 'easeInOut', duration: 0.6, delay: 0.15 }}
		className="container mx-auto mt-5 sm:mt-10"
	>
		<ServicesProvider serviceKey={serviceKey}>
			<SingleServiceProvider>
				<ServiceDetailComposition serviceKey={serviceKey} />
			</SingleServiceProvider>
		</ServicesProvider>
	</motion.div>
);

export default ProjectSingle;
