import { motion } from 'framer-motion';
import ServiceHeader from '../components/services/ServiceHeader';
import ServiceGallery from '../components/services/ServiceGallery';
import ServiceInfo from '../components/services/ServiceInfo';
import { ServicesProvider } from '../context/ServicesContext';
import { SingleServiceProvider } from '../context/SingleServiceContext';

const ProjectSingle = ({ serviceKey }) => (
	<motion.div
		initial={{ opacity: 0 }}
		animate={{ opacity: 1, delay: 1 }}
		transition={{ ease: 'easeInOut', duration: 0.6, delay: 0.15 }}
		className="container mx-auto mt-5 sm:mt-10"
	>
		<ServicesProvider serviceKey={serviceKey}>
			<SingleServiceProvider>
				<ServiceHeader />
				<ServiceGallery />
				<ServiceInfo />
			</SingleServiceProvider>
		</ServicesProvider>
	</motion.div>
);

export default ProjectSingle;
