import ServicesGrid from '../components/services/ServicesGrid';
import MaterialsSection from '../components/services/MaterialsSection';
import FAQ from '../components/services/FAQ';
import TrustCopyBlock from '../components/services/TrustCopyBlock';
import { ServicesProvider } from '../context/ServicesContext';

// CNT-01 anchor link: a "See materials ↓" link near the top of every service page
// (grid + detail) scrolls to the in-page Materials section (id="materials").
// The "what we won't make" section is intentionally NOT mounted on the grid page
// (per-style concern, lives only on the detail route).
// TrustCopyBlock receives no `turnaround` prop here — the per-service turnaround
// lives on the per-style doc; the component returns null gracefully when no
// studio-info facts have loaded either.
const Projects = ({ serviceKey }) => (
	<ServicesProvider serviceKey={serviceKey}>
		<div className="container mx-auto">
			<a
				href="#materials"
				className="text-accent hover:text-accent-highlight font-general-medium underline-offset-4 hover:underline inline-block mb-6"
			>
				See materials ↓
			</a>
			<ServicesGrid />
			<TrustCopyBlock />
			<MaterialsSection serviceKey={serviceKey} />
			<FAQ serviceKey={serviceKey} />
		</div>
	</ServicesProvider>
);

export default Projects;
