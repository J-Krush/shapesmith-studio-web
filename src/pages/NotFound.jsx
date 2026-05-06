import { Link } from 'react-router-dom';
import SEOHead from '../components/shared/SEOHead';

// Plan 02-03 / UI-SPEC §"Empty / pending states" /404 row.
// Plan 02-04 swaps the prior inline <Helmet> for the dedicated <SEOHead noindex />
// component now that SEOHead is mounted across every route.
const NotFound = () => (
	<>
		<SEOHead title="Page not found" noindex={true} />
		<section className="py-12 sm:py-24 mt-12 sm:mt-24">
			<div className="container mx-auto text-center max-w-xl">
				<h1 className="font-display font-black text-3xl sm:text-4xl text-primary-light mb-6">
					We couldn't find that page.
				</h1>
				<p className="text-lg text-ternary-light mb-8">
					It might have moved, or the link might be wrong.{' '}
					<Link to="/" className="text-accent hover:underline">
						Back to home
					</Link>
					, or{' '}
					<Link to="/contact" className="text-accent hover:underline">
						contact us
					</Link>{' '}
					if you were looking for something specific.
				</p>
				<Link
					to="/"
					aria-label="Back to home"
					className="inline-block bg-accent hover:bg-accent-highlight text-white font-general-medium px-5 py-2.5 rounded-md duration-300"
				>
					Back to home
				</Link>
			</div>
		</section>
	</>
);

export default NotFound;
