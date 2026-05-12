import AppBanner from '../components/shared/AppBanner';
import ServicesGrid from '../components/services/ServicesGrid';
import OurProcess from '../components/home/OurProcess';
import { ServicesProvider } from '../context/ServicesContext';
import Collaborations from '../components/home/Collaborations';
import QuickInfo from '../components/home/QuickInfo';
import QuickSpecs from '../components/home/QuickSpecs';
import SEOHead from '../components/shared/SEOHead';
import JsonLdLocalBusiness from '../components/shared/JsonLdLocalBusiness';

const Home = () => {
	return (
		<div>
			{/* D-19: homepage uses bare brand title (title=null → "Shapesmith Studio" with no em-dash). */}
			<SEOHead
				title={null}
				description="Custom laser cutting and 3D printing for local hobbyists and small businesses."
				ogUrl="https://shapesmith.studio/"
				ogImage={{ url: '/og-default.png', altText: 'Shapesmith Studio' }}
			/>
			{/* D-21: LocalBusiness JSON-LD on the homepage ONLY. */}
			<JsonLdLocalBusiness />

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
