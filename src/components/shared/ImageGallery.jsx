import { useState } from 'react';
import SanityImage from './SanityImage';

// Plan 05-02: Props-driven gallery primitive extracted from ServiceGallery so
// ShopSingle (Plan 05-05) can consume it without depending on useSingleService.
//
// Contract:
//   images:             array of Sanity image objects ({ altText, asset->{...} }), may be undefined/empty.
//   alt:                fallback alt text used when an individual image has no altText.
//   placeholderCaption: caption forwarded to <SanityImage> when an asset is missing.
//
// Hard rules (per PLAN.md must_haves):
//   - ZERO context coupling: do NOT call useSingleService / useServices here.
//   - Tailwind classes byte-stable with the original ServiceGallery so /styles/:slug
//     and /3d-printing/:slug see no visible change after the wrapper rewires.
const ImageGallery = ({ images, alt, placeholderCaption }) => {
	const [openImage, setOpenImage] = useState(null);

	return (
		<div>
			<div className="container mx-auto px-5 py-2 lg:px-32 lg:pt-12">
				<div className="-m-1 flex flex-wrap md:-m-2">
					{(images ?? []).map((image, idx) => (
						<div className="flex w-1/3 flex-wrap" key={image.asset?._id ?? idx}>
							<div
								className="w-full p-1 md:p-2 cursor-pointer"
								onClick={() => setOpenImage(image)}
							>
								<SanityImage
									source={image}
									alt={image?.altText ?? alt ?? ''}
									sizes="(max-width: 640px) 50vw, 25vw"
									loading="lazy"
									className="rounded-xl shadow-lg sm:shadow-none aspect-[4/3] object-cover w-full"
									placeholderCaption={placeholderCaption}
								/>
							</div>
						</div>
					))}
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
						alt={openImage?.altText ?? alt ?? ''}
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

export default ImageGallery;
