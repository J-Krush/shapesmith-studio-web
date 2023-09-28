import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import sanityClient from '../../utilities/sanityClient';

const Collaborations = () => {

	const [collaborationData, setCollaborationData] = useState();

	useEffect(() => {
		sanityClient.fetch(
			`*[_type == "collaboration"]{
				_id,
				title,
				description,
				images[]{
					altText,
					asset->{
						_id,
						url,
					},
				}
			  }
			  `
		)
		.then((data) => {
			setCollaborationData(data[0]);
		})
		.catch(console.error);
	}, []);

	return (
		<section className="py-5 sm:py-10 mt-5 sm:mt-10 bg-secondary-section-light dark:bg-secondary-section-dark">
			<div className="container mx-auto">
				
				<div className="flex flex-col md:flex-row mt-24 mb-24">
					<div className="text-left">
						<p className="font-display font-bold text-2xl sm:text-4xl mb-6 text-ternary-dark dark:text-ternary-light">
							We love collaborations!
						</p>
						<p className="font-general-medium text-lg text-ternary-dark dark:text-ternary-light">
							At Shapesmith Studio, we thrive on the sheer magic that happens when creative minds come together. 
							Whether you're an artist, a designer, or someone with a kaleidoscope of ideas, 
							we can't wait to co-create your visions.
						</p>
						{/* <p className="font-display font-regular text-m text-ternary-dark dark:text-ternary-light">
							Below are some of the artists that we've worked with. 
						</p> */}

						<span
							className="block text-center text-md font-semibold md:mb-8 mt-8 bg-accent hover:bg-accent-highlight text-white shadow-sm rounded-md px-5 py-2.5 duration-300 cursor-pointer"
						>
							<Link
								to="/contact"
								aria-label="contact-us"
							>
								Let's Work Together!
							</Link>
						</span>
					</div>

					<div className="flex items-center sm:p-0 sm:mt-0">
						<img
							className="rounded-lg md:ml-6"
							src={collaborationData && collaborationData.images[0].asset.url}
							alt="Effigy build"
						/>
					</div>

				</div>

				
			</div>
		</section>
	);
};

export default Collaborations;
