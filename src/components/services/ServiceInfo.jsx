import { useSingleService } from '../../context/SingleServiceContext';

const ServiceInfo = () => {
	const { singleService } = useSingleService();

	return (
		<div className="block sm:flex gap-0 sm:gap-10 mt-14">
			<div className="w-full sm:w-1/3 text-left">

				{/* Single service technologies */}
				<div className="mb-7">
					<p className="font-general-regular text-2xl font-semibold text-ternary-dark dark:text-ternary-light mb-2">
						Preferred Materials
					</p>
					<p className="font-general-regular text-primary-dark dark:text-ternary-light">
						{singleService && singleService.preferredMaterials}
					</p>
				</div>

				{/* Service considerations */}
				<div className="mb-7">
					<p className="font-general-regular text-2xl font-semibold text-ternary-dark dark:text-ternary-light mb-2">
						Considerations
					</p>
					<p className="font-general-regular text-primary-dark dark:text-ternary-light">
						{singleService && singleService.considerations}
					</p>
				</div>

			</div>

			{/*  Single service right section */}
			<div className="w-full sm:w-2/3 text-left mt-10 sm:mt-0">
				<p className="font-general-regular text-primary-dark dark:text-primary-light text-2xl font-bold mb-7">
					About This Style
				</p>

				<p className="font-general-regular mb-5 text-lg text-ternary-dark dark:text-ternary-light">
					{singleService && singleService.description}
				</p>
			</div>
		</div>
	);
};

export default ServiceInfo;
