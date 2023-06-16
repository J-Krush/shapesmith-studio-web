// import ProjectSingle from './ProjectSingle';
import designImage from '../../images/inkscape-screenshot.png';
import cuttingImage from '../../images/laser-cutting-metatron.png';
import fabricateImage from '../../images/metatron-assembly.png';

const OurProcess = () => {

	return (
		<section className="py-5 sm:py-10 mt-5 sm:mt-10 bg-secondary-section-light dark:bg-secondary-section-dark">
			<div className="container mx-auto">
				<div className="text-center">
					<p className="font-display font-bold text-2xl sm:text-4xl mt-24 mb-6 text-ternary-dark dark:text-ternary-light">
						Our Process
					</p>
					<p className="font-display font-regular text-m mb-12 text-ternary-dark dark:text-ternary-light">
						We love custom work and collaborations! 
					</p>
				</div>

				<div className="grid grid-cols-3 mt-6 sm:gap-10">
					<div>
						<div className="rounded-xl shadow-lg hover:shadow-xl mb-10 sm:mb-0 bg-secondary-light dark:bg-ternary-dark">
							<img
								src={designImage}
								className="rounded-xl border-none"
								alt="Design Process"
							/>
						</div>
						<p className="text-center font-display font-bold text-2xl sm:text-4xl mb-1 text-ternary-dark dark:text-ternary-light">
							Design
						</p>
						<p className="font-display font-regular text-m mb-1 text-ternary-dark dark:text-ternary-light">
							Designing for laser cutter. Vector files. Graphic design programs like Adobe Illustrator or Inkscape (open source).
						</p>
					</div>
					<div>
						<div className="rounded-xl shadow-lg hover:shadow-xl mb-10 sm:mb-0 bg-secondary-light dark:bg-ternary-dark">
							<img
								src={cuttingImage}
								className="rounded-xl border-none"
								alt="Cutting Process"
							/>
						</div>
						<p className="text-center font-display font-bold text-2xl sm:text-4xl mb-1 text-ternary-dark dark:text-ternary-light">
							Cut
						</p>
						<p className="font-display font-regular text-m mb-1 text-ternary-dark dark:text-ternary-light">
							Laser cutting. 130W laser.
						</p>
					</div>
					<div>
						<div className="rounded-xl shadow-lg hover:shadow-xl mb-10 sm:mb-0 bg-secondary-light dark:bg-ternary-dark">
							<img
								src={fabricateImage}
								className="rounded-xl border-none"
								alt="Fabricate Process"
							/>
						</div>
						<p className="text-center font-display font-bold text-2xl sm:text-4xl mb-1 text-ternary-dark dark:text-ternary-light">
							Fabricate
						</p>
						<p className="font-display font-regular text-m mb-1 text-ternary-dark dark:text-ternary-light">
							Finishing and assembly of parts. This includes painting, gluing, nailing, sanding, and clear coating.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
};

export default OurProcess;
