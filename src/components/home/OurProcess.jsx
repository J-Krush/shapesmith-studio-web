import { useEffect, useState } from 'react';
import sanityClient from '../../utilities/sanityClient';

const OurProcess = () => {

	const [processSteps, setProcessSteps] = useState([]);

	useEffect(() => {
		sanityClient.fetch(
			`*[_type == "maker-process"]{
				_id,
				order,
				title,
				image{
					altText,
					asset->{
						_id,
						url
					},
				},
				description
			  }
			  `
		)
		.then((data) => {
			setProcessSteps(data);
		})
		.catch(console.error);
	}, []);

	return (
		<section className="py-5 sm:py-10 mt-5 sm:mt-10 bg-secondary-section-light dark:bg-secondary-section-dark">
			<div className="container mx-auto">
				<div>
					<p className="font-display font-bold text-4xl sm:text-4xl sm:text-left md:text-center mt-24 mb-6 text-ternary-dark dark:text-ternary-light">
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
					{processSteps
						.sort((a,b) => a.order < b.order ? -1 : 1)
						.map((process) => (
							<div key={process.image.altText} className='rounded-xl shadow-lg hover:shadow-xl mb-10 sm:mb-0 bg-secondary-light dark:bg-ternary-section-dark'>
								<img
									src={process.image.asset.url}
									className='rounded-t-xl'
									alt={process.image.altText}
								/>
								<p className="text-center font-display font-medium text-2xl sm:text-4xl mt-6 mb-6 text-ternary-dark dark:text-ternary-light">
									{process.title}
								</p>
								<p className="font-general-medium text-lg mb-8 mx-8 text-ternary-dark dark:text-ternary-light">
									{process.description}
								</p>
							</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default OurProcess;
