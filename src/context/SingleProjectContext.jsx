import { useState, createContext, useEffect } from 'react';
import { useParams } from "react-router-dom"
import { capabilitiesData } from '../data/projects';

const SingleProjectContext = createContext();


export const SingleProjectProvider = ({ children }) => {

	const { capability } = useParams();
	const [singleProjectData, setSingleProjectData] = useState(capabilitiesData.find((cap) => cap.id === capability));

	useEffect(() => {
		setSingleProjectData(capabilitiesData.find((cap) => cap.id === capability));
	  }, [capability]);

	return (
		<SingleProjectContext.Provider
			value={{ singleProjectData, setSingleProjectData }}
		>
			{children}
		</SingleProjectContext.Provider>
	);
};

export default SingleProjectContext;
