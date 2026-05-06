import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

// Plan 02-03 / UI-SPEC §"Empty / pending states" /404 row.
// Plan 02-04 swaps the inline <Helmet> for <SEOHead title="Page not found" noindex />.
// Inline-Helmet path is used here so crawler-safety is in place immediately —
// belt-and-suspenders until SEOHead wiring lands.
const NotFound = () => (
	<>
		<Helmet>
			<title>Page not found — Shapesmith Studio</title>
			<meta name="robots" content="noindex" />
		</Helmet>
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
