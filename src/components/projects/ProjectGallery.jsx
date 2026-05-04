import { useContext, useState } from 'react';
import SingleProjectContext from '../../context/SingleProjectContext';

const ProjectGallery = () => {
	const { singleProjectData } = useContext(SingleProjectContext);

	const [openImage, setOpenImage] = useState(null);

	return (
		<div>
			<div className="container mx-auto px-5 py-2 lg:px-32 lg:pt-12">
				<div className="-m-1 flex flex-wrap md:-m-2">
					{singleProjectData && singleProjectData.detailImages.map((image) => {

						return (
							<div className="flex w-1/3 flex-wrap" key={image.asset._id}>
								<div className="w-full p-1 md:p-2">
									<img
										src={image.asset.url}
										className="rounded-xl cursor-pointer shadow-lg sm:shadow-none"
										alt={image.altText}
										onClick={() => setOpenImage(image.asset.url)}
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

					<img
						className="max-w-[800px] max-h-[600px] object-cover"
						src={openImage}
						alt="Modal Zoom"
					/>
				</div>
			)}
		</div>
	);
};

export default ProjectGallery;
