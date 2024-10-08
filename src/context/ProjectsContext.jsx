import { useState, useEffect, createContext } from 'react';
import sanityClient from '../utilities/sanityClient';

// Create projects context
export const ProjectsContext = createContext();

// Create the projects context provider
export const ProjectsProvider = (props) => {
	const [projects, setProjects] = useState([]);

	useEffect(() => {
		sanityClient.fetch(
			`*[_type == "laser-style"]{
				order,
				title,
				description,
				header,
				slug,
				preferredMaterials,
				considerations,
				listImage{
					altText,
					asset->{
						_id,
						url
					},
				},
				detailImages[]{
					altText,
					asset->{
						_id,
						url
					},
				}
			  }
			  `
		)
		.then((data) => {
			setProjects(data);
		})
		.catch(console.error);
	}, []);

	return (
		<ProjectsContext.Provider
			value={{
				projects,
				setProjects,
			}}
		>
			{props.children}
		</ProjectsContext.Provider>
	);
};
