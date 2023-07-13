import { LaserBedSize, OversizedPiece } from '../../data/images';
import { getImageUrl } from '../../utilities/helpers';

const QuickInfo = () => {

    return (
        <section className="py-5 sm:py-10 mt-5 sm:mt-10">
				<div className="container mx-auto mt-24">
					<div className='text-center'>
						<h1
							className='font-display font-bold text-4xl md:text-center sm:text-left text-ternary-dark dark:text-primary-light mb-6'>
							Size Matters
						</h1>
					</div>
					
					<div className='flex md:flex-row sm:flex-col md:items-center mb-12'>
						<div className="flex-1 font-general-medium text-lg text-ternary-dark dark:text-ternary-light">
						 	
							<p>
								Our 130W laser has a bed size of 51.2" x 35.4" (130 x 90 cm). 
								This means we have the capacity to handle a wide range of projects, whether you're seeking intricate details on a small-scale masterpiece or tackling larger-than-life creations.
							</p>

							<p className='mt-8'> 
								The beauty of vector files is that they can be scaled up or down without any loss in quality, unlike a photograph which becomes pixelated and blurry.
							</p>
						</div>
						<div className='flex-1 m-4 p-6 sm:p-10 bg-[#eeeeee] dark:bg-[#eeeeee] rounded-xl shadow-xl text-center'>
							<img
								src={getImageUrl(LaserBedSize)}
								alt="Bed Size"
							/>
						</div>
					</div>
					
						

					<div className='flex md:flex-row sm:flex-col md:items-center mb-12'>
					<div className='flex-1 m-4'>
							<img
								className='rounded-xl shadow-xl'
								src={getImageUrl(OversizedPiece)}
								alt="Oversized Piece"
							/>
						</div>
					<p className="flex-1 font-general-medium text-lg text-ternary-dark dark:text-ternary-light">
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