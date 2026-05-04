import { createContext } from 'react';
import useSanityQuery from '../hooks/useSanityQuery';

// Create projects context
export const ProjectsContext = createContext();

// Create the projects context provider
export const ProjectsProvider = (props) => {
	const { data } = useSanityQuery(
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
	);

	const projects = data ?? [];

	return (
		<ProjectsContext.Provider
			value={{
				projects,
				setProjects: () => {}, // legacy no-op; consumers (ProjectsGrid) only read `projects`
			}}
		>
			{props.children}
		</ProjectsContext.Provider>
	);
};
