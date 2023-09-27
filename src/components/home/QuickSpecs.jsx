import { useEffect, useState } from 'react';
import sanityClient from '../../utilities/sanityClient';

const QuickInfo = () => {

	const [oversizedPieceImage, setOversizedPieceImage] = useState();
	const [bedSizeImage, setBedSizeImage] = useState();

	useEffect(() => {
		sanityClient.fetch(
			`*[_type == "laser-specs"]{
				_id,
				title,
				image{
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
			setOversizedPieceImage(data.find(img => img.image.altText === 'oversized-piece'))
			setBedSizeImage(data.find(img => img.image.altText === 'bed-size'))
		})
		.catch(console.error);
	}, []);

	

    return (
        <section className="py-5 sm:py-10 mt-5 sm:mt-10">
				<div className="container mx-auto mt-24">
					<div>
						<h1
							className='font-display font-bold text-4xl md:text-center sm:text-left text-ternary-dark dark:text-primary-light mb-6'>
							Size Matters
						</h1>
					</div>
					
					<div className='flex flex-col md:flex-row mb-12'>
						<div className="flex-1 font-general-medium text-lg text-ternary-dark dark:text-ternary-light">
						 	
							<p>
								Our 130W laser has a bed size of 51.2" x 35.4" (130 x 90 cm). 
								This means we have the capacity to handle a wide range of projects, whether you're seeking intricate details on a small-scale masterpiece or tackling larger-than-life creations.
							</p>

							<p className='mt-8'> 
								The beauty of vector files is that they can be scaled up or down without any loss in quality, unlike a photograph which becomes pixelated and blurry.
							</p>
						</div>
						<div className='flex-1 text-center'>
							<div className='md:m-4 sm:my-4 p-6 sm:p-10 bg-[#eeeeee] dark:bg-[#eeeeee] rounded-xl shadow-xl'>
								<img
									src={bedSizeImage && bedSizeImage.image.asset.url}
									alt={bedSizeImage && bedSizeImage.image.altText}
								/>
							</div>
							
						</div>
					</div>
					
						

					<div className='flex flex-col md:flex-row mb-12'>
						<div className='flex-1 mr-4 sm:order-last md:order-first'>
							<img
								className='rounded-xl shadow-xl'
								src={oversizedPieceImage && oversizedPieceImage.image.asset.url}
								alt={oversizedPieceImage && oversizedPieceImage.image.altText}
							/>
						</div>
						<p className="flex-1 font-general-medium text-lg text-ternary-dark dark:text-ternary-light sm:mb-4">
							We have the capability for pieces larger than the bed size via pass-through doors on the front and back of the machine. 
							This means we can cut full 4x8 sheets of plywood! 
							However, this has some restrictions on material thickness. 
						</p>
						
					</div>
					
					
					
					
				</div>
			</section>
    )
}

export default QuickInfo;