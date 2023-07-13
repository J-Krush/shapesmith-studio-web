import { InkscapeScreenshot, MetatronCutting, MetatronAssembly } from '../../data/images';
import { getImageUrl } from '../../utilities/helpers';

const OurProcess = () => {

	return (
		<section className="py-5 sm:py-10 mt-5 sm:mt-10 bg-secondary-section-light dark:bg-secondary-section-dark">
			<div className="container mx-auto">
				<div>
					<p className="font-display font-bold text-4xl sm:text-4xl text-center mt-24 mb-6 text-ternary-dark dark:text-ternary-light">
						Creation Process
					</p>

					<p className="font-general-medium text-xl mb-12 text-ternary-dark dark:text-ternary-light">

						The first step in our journey together is curiously evaluating the project and gathering information. 
						
						Things like: What materials will be used? How large is the piece? What are the crucial elements? How will it be finished? How will it be installed?

						Then on to the making!

						{/* Our process is designed to deliver exceptional results with efficiency and artistry. 
						We're passionate about transforming your ideas into tangible works of art that surpass your expectations.  */}
						{/* Get in touch with us today, and let's create something extraordinary together! */}
					</p>
				</div>



				<div className="grid grid-cols-1 md:grid-cols-3 mt-6 gap-10 mb-24">
					<div className='rounded-xl shadow-lg hover:shadow-xl mb-10 sm:mb-0 bg-secondary-light dark:bg-ternary-section-dark'>
						<img
							src={getImageUrl(InkscapeScreenshot)}
							className='rounded-t-xl'
							alt="Design Process"
						/>
						<p className="text-center font-display font-medium text-2xl sm:text-4xl mt-6 mb-6 text-ternary-dark dark:text-ternary-light">
							Design
						</p>
						<p className="font-general-medium text-lg mb-8 mx-8 text-ternary-dark dark:text-ternary-light">


							We take your vision and bring it to life using the power of digital design. Sketches or pictures of similar work are helpful here.
							We meticulously craft clean, detailed vector files, ensuring that every element is perfectly captured. 
							<b>Vector files</b> are created by programs like Adobe Illustrator or 
							
							<a
							href="https://inkscape.org/"
							className="underline hover:text-indigo-600 dark:hover:text-indigo-300 ml-1 duration-500"
							>
								Inkscape (open source).
							</a>
						</p>
					</div>
					<div className='rounded-xl shadow-lg hover:shadow-xl mb-10 sm:mb-0 bg-secondary-light dark:bg-ternary-section-dark'>
						<img
							src={getImageUrl(MetatronCutting)}
							className="rounded-t-xl border-none"
							alt="Cutting Process"
						/>
						<p className="text-center font-display font-medium text-2xl sm:text-4xl mt-6 mb-6 text-ternary-dark dark:text-ternary-light">
							Cut
						</p>
						<p className="font-general-medium text-lg mb-8 mx-8 text-ternary-dark dark:text-ternary-light">
							Our laser cutter takes center stage, unleashing its magic to cut, etch, and engrave your design with incredible precision. 
							From wood to acrylic, leather to fabric, our laser works its wonders on a range of materials, turning them into the building blocks of your masterpiece. 

						</p>
					</div>
					<div className='rounded-xl shadow-lg hover:shadow-xl mb-10 sm:mb-0 bg-secondary-light dark:bg-ternary-section-dark'>
							<img
								src={getImageUrl(MetatronAssembly)}
								className="rounded-t-xl border-none"
								alt="Fabricate Process"
							/>
						<p className="text-center font-display font-medium text-2xl sm:text-4xl mt-6 mb-6 text-ternary-dark dark:text-ternary-light">
							Make
						</p>
						<p className="font-general-medium text-lg mb-8 mx-8 text-ternary-dark dark:text-ternary-light">
							Now comes the build! This final step is where it all comes together. 
							This includes sanding, painting, staining, gluing, nailing, clear coating, and any other finishing touches. 
							The result is a meticulously handcrafted work of art that radiates quality and captivates the senses.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
};

export default OurProcess;
