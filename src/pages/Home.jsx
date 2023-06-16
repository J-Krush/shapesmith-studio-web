import AppBanner from '../components/shared/AppBanner';
import ProjectsGrid from '../components/projects/ProjectsGrid';
import OurProcess from '../components/home/OurProcess';
import { ProjectsProvider } from '../context/ProjectsContext';

const Home = () => {
	return (
		// <div className="container mx-auto">
		<div>
			<AppBanner></AppBanner>

			<OurProcess />

			<ProjectsProvider>
				<ProjectsGrid></ProjectsGrid>
			</ProjectsProvider>

		</div>
	);
};

export default Home;
