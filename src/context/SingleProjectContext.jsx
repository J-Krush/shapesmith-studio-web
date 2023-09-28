import { useState, useContext, createContext, useEffect } from 'react';
import { useParams } from "react-router-dom"
import { ProjectsContext } from '../context/ProjectsContext';

const SingleProjectContext = createContext();

export const SingleProjectProvider = ({ children }) => {

	const { capability } = useParams();
	const { projects } = useContext(ProjectsContext);

	const [singleProjectData, setSingleProjectData] = useState(projects.find((cap) => cap.slug.includes(capability)));

	useEffect(() => {
		setSingleProjectData(projects.find((cap) => cap.slug.includes(capability)));
	  }, [capability, projects]);

	return (
		<SingleProjectContext.Provider
			value={{ singleProjectData, setSingleProjectData }}
		>
			{children}
		</SingleProjectContext.Provider>
	);
};

export default SingleProjectContext;
