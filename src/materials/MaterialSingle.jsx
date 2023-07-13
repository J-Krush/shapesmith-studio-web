import { motion } from 'framer-motion';
import { FiTag, FiAlertTriangle, FiInfo, FiPower, FiScissors, FiTool,FiZap, FiArrowUp } from 'react-icons/fi';

const MaterialSingle = ({ title, image, description, altImages, materialThickness, processes, disclaimer }) => {

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

		<div className="block sm:flex sm:gap-10 mt-10 sm:mt-20">
			<div className="w-full sm:w-1/4 mb-7 sm:mb-0">
				<img
					src={image}
					className="rounded-xl border-none"
					alt={title}
				/>
			</div>

			<div className="w-full sm:w-3/4 text-left">
				<p className="font-display font-medium text-2xl text-ternary-dark dark:text-ternary-light mb-4">
					{title}
				</p>
				<div className="flex items-center mb-4">
					<FiZap className="text-lg text-ternary-dark dark:text-ternary-light" />
					<span className="font-general-regular ml-2 leading-none text-primary-dark dark:text-primary-light">
						{processes}
					</span>
				</div>
				<div className="flex items-center mb-4">
					<FiScissors className="text-lg text-ternary-dark dark:text-ternary-light" />
					<span className="font-display font-regular italic text-m ml-2 text-ternary-dark dark:text-ternary-light">
						{materialThickness}
					</span>
				</div>
				<p className="font-display font-regular text-m text-ternary-dark dark:text-ternary-light mb-2">
					{description}
				</p>

				<p className="font-display font-regular text-m text-ternary-dark dark:text-ternary-light mb-2">
					{disclaimer}
				</p>
			</div>
		</div>


			{/* <div className="flex flex-row">
				<div className="w-full rounded-xl shadow-lg hover:shadow-xl mb-10 sm:mb-0 bg-secondary-light dark:bg-ternary-dark">
					<div>
						<img
							src={image}
							className="rounded-xl border-none"
							alt={title}
						/>
					</div>
					
				</div>
				<div className="px-4 py-6">
						<p className="font-display font-medium text-xl md:text-xl text-ternary-dark dark:text-ternary-light mb-2">
							{title}
						</p>
						<p className="font-display font-normal italic text-base md:text-xl text-ternary-dark dark:text-ternary-light mb-2">
							{materialThickness}
						</p>
						<p className="font-display font-normal text-base md:text-xl text-ternary-dark dark:text-ternary-light mb-2">
							{description}
						</p>

						<p className="font-display font-normal text-base md:text-xl text-ternary-dark dark:text-ternary-light mb-2">
							{disclaimer}
						</p>
				</div> */}
			{/* </div> */}
		</motion.div>
	);
};

export default MaterialSingle;
