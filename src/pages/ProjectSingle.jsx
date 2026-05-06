import { motion } from 'framer-motion';
import ServiceHeader from '../components/services/ServiceHeader';
import ServiceGallery from '../components/services/ServiceGallery';
import ServiceInfo from '../components/services/ServiceInfo';
import MaterialsSection from '../components/services/MaterialsSection';
import FAQ from '../components/services/FAQ';
import WontMake from '../components/services/WontMake';
import TrustCopyBlock from '../components/services/TrustCopyBlock';
import { ServicesProvider } from '../context/ServicesContext';
import { SingleServiceProvider, useSingleService } from '../context/SingleServiceContext';

// Inner component so it can call useSingleService() inside the provider boundary.
// Reads per-service overrides (turnaround, wontMakeScope) off the singleService doc
// and threads them into TrustCopyBlock + WontMake.
const ServiceDetailComposition = ({ serviceKey }) => {
	const { singleService } = useSingleService();
	const turnaround = singleService?.turnaround;
	const wontMakeScope = singleService?.wontMakeScope;
	return (
		<>
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
