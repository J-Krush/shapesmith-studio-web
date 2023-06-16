import { useState, createContext } from 'react';
import { capabilitiesData } from '../data/projects';

// Create projects context
export const ProjectsContext = createContext();

// Create the projects context provider
export const ProjectsProvider = (props) => {
	const [projects, setProjects] = useState(capabilitiesData);

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
