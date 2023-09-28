import { useState, useEffect, createContext } from 'react';
import sanityClient from '../utilities/sanityClient';
// import { aboutMeData } from '../data/aboutMeData';

const AboutMeContext = createContext();

export const AboutMeProvider = ({ children }) => {
	const [aboutMe, setAboutMe] = useState();

	useEffect(() => {
		sanityClient.fetch(
			`*[_type == "profile"]{
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

			console.log('about me data: ', data);
			setAboutMe(data[0]);
		})
		.catch(console.error);
	}, []);


	return (
		<AboutMeContext.Provider
			value={{
				aboutMe,
				setAboutMe,
			}}
		>
			{children}
		</AboutMeContext.Provider>
	);
};

export default AboutMeContext;
