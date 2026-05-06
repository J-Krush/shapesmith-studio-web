import AppBanner from '../components/shared/AppBanner';
import ServicesGrid from '../components/services/ServicesGrid';
import OurProcess from '../components/home/OurProcess';
import { ServicesProvider } from '../context/ServicesContext';
import Collaborations from '../components/home/Collaborations';
import QuickInfo from '../components/home/QuickInfo';
import QuickSpecs from '../components/home/QuickSpecs';

const Home = () => {
	return (
		<div>
			<AppBanner></AppBanner>

			<QuickInfo />

			<div className="mt-24">
				<ServicesProvider serviceKey="laser">
					<ServicesGrid></ServicesGrid>
				</ServicesProvider>
			</div>

			<OurProcess />

			<QuickSpecs />

			<Collaborations />

		</div>
	);
};

export default Home;
