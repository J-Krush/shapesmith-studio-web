import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SanityImage from '../shared/SanityImage';
import { useServices } from '../../context/ServicesContext';

const ServiceCard = ({ title, listImage, linkTo }) => {
	const { serviceKey } = useServices();

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1, delay: 1 }}
			transition={{
				ease: 'easeInOut',
				duration: 0.7,
				delay: 0.15,
			}}
		>
			<Link to={linkTo} aria-label={title}>
				<div>
					<div className="rounded-xl shadow-lg hover:shadow-xl cursor-pointer mb-10 sm:mb-0 bg-secondary-light dark:bg-ternary-dark">
						<div>
							<SanityImage
								source={listImage}
								alt={listImage?.altText ?? title}
								sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
								loading="lazy"
								className="aspect-square object-cover rounded-xl"
								placeholderCaption={
									serviceKey === 'print'
										? '3D print example coming soon'
										: 'Laser cut example coming soon'
								}
							/>
						</div>

					</div>
					<div className="text-center px-4 py-6">
							<p className="font-general-medium text-lg md:text-xl text-ternary-dark dark:text-ternary-light mb-2">
								{title}
							</p>
					</div>
				</div>
			</Link>
		</motion.div>
	);
};

export default ServiceCard;
