import { Link } from 'react-router-dom';
import ServicesGrid from '../components/services/ServicesGrid';
import MaterialsSection from '../components/services/MaterialsSection';
import FAQ from '../components/services/FAQ';
import TrustCopyBlock from '../components/services/TrustCopyBlock';
import { ServicesProvider, useServices } from '../context/ServicesContext';
import SEOHead from '../components/shared/SEOHead';

// Per-service SEO copy (D-19): hardcoded for the grid pages.
// Detail pages (ProjectSingle.jsx) read from singleService.seo (Sanity-driven).
const SEO_TITLES = {
	laser: 'Laser cutting',
	print: '3D printing',
};

const SEO_DESCRIPTIONS = {
	laser: 'Custom laser cutting in wood, acrylic, leather, and more.',
	print: 'Custom 3D printing in PLA, PETG, TPU, and more.',
};

// CNT-01 anchor link: a "See materials ↓" link near the top of every service page
// (grid + detail) scrolls to the in-page Materials section (id="materials").
// The "what we won't make" section is intentionally NOT mounted on the grid page
// (per-style concern, lives only on the detail route).
// TrustCopyBlock receives no `turnaround` prop here — the per-service turnaround
// lives on the per-style doc; the component returns null gracefully when no
// studio-info facts have loaded either.
//
// Inner component so it can call useServices() inside the provider boundary —
// gives us service.urlSegment for the canonical og:url.
const ProjectsInner = ({ serviceKey }) => {
	const { service } = useServices();
	return (
		<>
			<SEOHead
				title={SEO_TITLES[serviceKey]}
				description={SEO_DESCRIPTIONS[serviceKey]}
				ogUrl={`https://shapesmith.studio/${service.urlSegment}`}
				ogImage={{ url: '/og-default.png', altText: SEO_TITLES[serviceKey] }}
			/>
			<div className="container mx-auto">
				<a
					href="#materials"
					className="text-accent hover:text-accent-highlight font-general-medium underline-offset-4 hover:underline inline-block mb-6"
				>
					See materials ↓
				</a>
				<ServicesGrid />
				<TrustCopyBlock />
				{/* Plan 03-01 / D-06: hero CTA into the auto-pricing quote tool.
				    ?service=urlSegment opens the matching tab via the pre-fill cascade. */}
				<div className="container mx-auto py-6 sm:py-8 text-center">
					<Link
						to={`/quote?service=${service.urlSegment}`}
						className="inline-block bg-accent hover:bg-accent-highlight text-white font-general-medium px-5 py-2.5 rounded-md duration-300"
					>
						Estimate this in our quote tool
					</Link>
				</div>
				<MaterialsSection serviceKey={serviceKey} />
				<FAQ serviceKey={serviceKey} />
			</div>
		</>
	);
};

const Projects = ({ serviceKey }) => (
	<ServicesProvider serviceKey={serviceKey}>
		<ProjectsInner serviceKey={serviceKey} />
	</ServicesProvider>
);

export default Projects;
