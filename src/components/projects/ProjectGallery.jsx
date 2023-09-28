import { useContext, useState } from 'react';
import SingleProjectContext from '../../context/SingleProjectContext';
import { getImageUrl } from '../../utilities/helpers';

const ProjectGallery = () => {
	const { singleProjectData } = useContext(SingleProjectContext);

	var [imgToShow, setImgToShow] = useState();

	const showModal = (img) => {
		setImgToShow(img);

		var modal = document.getElementById("modal");
		modal.classList.remove('hidden');
	}

	const closeModal = () => {
		var modal = document.getElementById("modal");
		modal.classList.add('hidden');
	}

	return (
		<div>
			<div className="container mx-auto px-5 py-2 lg:px-32 lg:pt-12">
				<div className="-m-1 flex flex-wrap md:-m-2">
					{singleProjectData && singleProjectData.detailImages.map((image) => {

						return (
							<div className="flex w-1/3 flex-wrap" key={image.asset.id}>
								<div className="w-full p-1 md:p-2">
									<img
										src={image.asset.url}
										className="rounded-xl cursor-pointer shadow-lg sm:shadow-none"
										alt={image.altText}
										key={image.asset.id}
										onClick={() => showModal(image.asset.url)}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</div>
			
			<div id="modal"
				className="hidden fixed top-0 left-0 z-80 w-screen h-screen bg-black/70 flex justify-center items-center">

				<button className="fixed z-90 top-6 right-8 text-white text-5xl font-bold hover:cursor-pointer"
					onClick={(event) => {
						event.preventDefault();
						closeModal()
					}}>&times;</button>

				<img id="modal-img" className="max-w-[800px] max-h-[600px] object-cover" src={imgToShow} key={imgToShow} alt="Modal Zoom"/>
			</div>
		</div>
		
	);
};

export default ProjectGallery;
