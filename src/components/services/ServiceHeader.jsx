import { useSingleService } from '../../context/SingleServiceContext';

const ServiceHeader = () => {
	const { singleService } = useSingleService();

	return (
		<div>
			<p className="font-general-medium text-left text-3xl sm:text-4xl font-bold text-primary-dark dark:text-primary-light mt-14 sm:mt-20 mb-7">
				{singleService && singleService.header}
			</p>
		</div>
	);
};

export default ServiceHeader;
