import { useState } from 'react';
import { useSingleService } from '../../context/SingleServiceContext';
import { useServices } from '../../context/ServicesContext';
import SanityImage from '../shared/SanityImage';

const ServiceGallery = () => {
	const { singleService } = useSingleService();
	const { serviceKey } = useServices();

	const [openImage, setOpenImage] = useState(null);

	const placeholderCaption =
		serviceKey === 'print'
			? '3D print example coming soon'
			: 'Laser cut example coming soon';

	return (
		<div>
			<div className="container mx-auto px-5 py-2 lg:px-32 lg:pt-12">
				<div className="-m-1 flex flex-wrap md:-m-2">
					{singleService && singleService.detailImages && singleService.detailImages.map((image, idx) => {

						return (
							<div className="flex w-1/3 flex-wrap" key={image.asset?._id ?? idx}>
								<div
									className="w-full p-1 md:p-2 cursor-pointer"
									onClick={() => setOpenImage(image)}
								>
									<SanityImage
										source={image}
										alt={image.altText ?? singleService?.title ?? ''}
										sizes="(max-width: 640px) 50vw, 25vw"
										loading="lazy"
										className="rounded-xl shadow-lg sm:shadow-none aspect-[4/3] object-cover w-full"
										placeholderCaption={placeholderCaption}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{openImage && (
				<div className="fixed top-0 left-0 z-80 w-screen h-screen bg-black/70 flex justify-center items-center">
					<button
						className="fixed z-90 top-6 right-8 text-white text-5xl font-bold hover:cursor-pointer"
						onClick={(event) => {
							event.preventDefault();
							setOpenImage(null);
						}}
					>
						&times;
					</button>

					<SanityImage
						source={openImage}
						alt={openImage.altText ?? singleService?.title ?? ''}
						sizes="100vw"
						loading="eager"
						className="max-h-[90vh] max-w-[90vw] object-contain"
						placeholderCaption=""
					/>
				</div>
			)}
		</div>
	);
};

export default ServiceGallery;
