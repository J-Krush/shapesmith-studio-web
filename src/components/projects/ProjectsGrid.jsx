import { useContext } from 'react';
import ProjectSingle from './ProjectSingle';
import { ProjectsContext } from '../../context/ProjectsContext';

import { capabilitiesTitle } from '../../data/projects';

const ProjectsGrid = () => {
	const { projects } = useContext(ProjectsContext);

	return (
		<section className="py-5 sm:py-10 mt-5 sm:mt-10">
			<div className="container mx-auto">
				<div className="text-center">
					<p className="capitalize font-display font-bold text-2xl sm:text-4xl mb-1 text-ternary-dark dark:text-ternary-light">
						Our {capabilitiesTitle}
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-6 sm:gap-10">
					{projects.map((project) => (
						<ProjectSingle
							title={project.title}
							category={project.category}
							image={project.img}
							key={project.id}
							linkTo={project.slug}
						/>
					))}
				</div>
			</div>
		</section>
	);
};

export default ProjectsGrid;
