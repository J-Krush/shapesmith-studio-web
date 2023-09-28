import { useContext } from 'react';
import AboutMeContext from '../../context/AboutMeContext';
import SocialLinks from '../reusable/SocialLinks';

const AboutMeBio = () => {
	const { aboutMe } = useContext(AboutMeContext);

	return (
		<div>
			<div className="block sm:flex sm:gap-10 mt-10 sm:mt-20">
				<div className="w-full sm:w-1/4 mb-7 sm:mb-0">
					<img src={aboutMe && aboutMe.images[0].asset.url} className="rounded-lg w-96" alt="" />
				</div>

				<div className="font-general-regular w-full sm:w-3/4 text-left">
					<h2 className="font-general-medium text-2xl text-primary-dark dark:text-primary-light mb-4">
						{aboutMe && aboutMe.title}
					</h2>
					<p
						className="mb-4 text-ternary-dark dark:text-ternary-light text-lg"
					>
						{aboutMe && aboutMe.description}
					</p>
				</div>

				
			</div>
			
			<SocialLinks />
		</div>
	);
};

export default AboutMeBio;
