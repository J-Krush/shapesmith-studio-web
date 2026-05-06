import { createContext } from 'react';
import useSanityQuery from '../hooks/useSanityQuery';

const AboutMeContext = createContext();

export const AboutMeProvider = ({ children }) => {
	const { data } = useSanityQuery(
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
	);

	const aboutMe = data?.[0];

	return (
		<AboutMeContext.Provider
			value={{
				aboutMe,
				setAboutMe: () => {}, // legacy no-op
			}}
		>
			{children}
		</AboutMeContext.Provider>
	);
};

export default AboutMeContext;
