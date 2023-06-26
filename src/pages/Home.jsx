import AppBanner from '../components/shared/AppBanner';
import ProjectsGrid from '../components/projects/ProjectsGrid';
import OurProcess from '../components/home/OurProcess';
import { ProjectsProvider } from '../context/ProjectsContext';
import Collaborations from '../components/home/Collaborations';
import QuickInfo from '../components/home/QuickInfo';
import QuickSpecs from '../components/home/QuickSpecs';
import HowLasersWork from '../components/home/HowLasersWork';

const Home = () => {
	return (
		<div>
			<AppBanner></AppBanner>

			<QuickInfo />

			<div className="mt-24">
				<ProjectsProvider>
					<ProjectsGrid></ProjectsGrid>
				</ProjectsProvider>
			</div>

			<OurProcess />

			<QuickSpecs />

			{/* <HowLasersWork /> */}

			<Collaborations />

		</div>
	);
};

export default Home;
