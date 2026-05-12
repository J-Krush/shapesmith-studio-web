import ServiceCard from './ServiceCard';
import { useServices } from '../../context/ServicesContext';

const ServicesGrid = () => {
	const { services, service } = useServices();

	return (
		<section className="py-5 sm:py-10 mt-5 sm:mt-10">
			<div className="container mx-auto sm:mx-50">
				<div>
					<p className="capitalize font-display font-bold text-4xl md:text-center sm:text-left mb-6 text-ternary-dark dark:text-ternary-light">
						{service.navLabel}
					</p>
					<p className="font-general-medium text-xl font-regular text-m mb-12 text-ternary-dark dark:text-ternary-light">

						Explore our most common artistic styles below.

						These are meant to give you an idea of what's possible, to get those creative juices flowing.

						These styles can be augmented and combined to create something truly unique.

					</p>
					<p className="text-center font-general-medium text-lg mb-12 text-ternary-dark dark:text-ternary-light">
						Have an idea that you don’t see?

						<a
						href="/contact"
						className="underline hover:text-accent ml-1 duration-500"
						>
							Contact Us!
						</a>
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-6 mx-12 sm:mx-0 sm:gap-10">
					{services
						.slice()
						.sort((a, b) => (a.order < b.order ? -1 : 1))
						.map((entry) => (
							<ServiceCard
								title={entry.title}
								listImage={entry.listImage}
								key={entry.title}
								linkTo={`/${service.urlSegment}/${entry.slug?.current ?? entry.slug}`}
							/>
						))}
				</div>
			</div>
		</section>
	);
};

export default ServicesGrid;
