import ServicesGrid from '../components/services/ServicesGrid';
import { ServicesProvider } from '../context/ServicesContext';

const Projects = ({ serviceKey }) => (
	<ServicesProvider serviceKey={serviceKey}>
		<div className="container mx-auto">
			<ServicesGrid />
		</div>
	</ServicesProvider>
);

export default Projects;
