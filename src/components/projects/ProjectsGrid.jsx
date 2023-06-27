import { useContext } from 'react';
import ProjectSingle from './ProjectSingle';
import { ProjectsContext } from '../../context/ProjectsContext';

import { capabilitiesTitle } from '../../data/projects';

const ProjectsGrid = () => {
	const { projects } = useContext(ProjectsContext);

	return (
		<section className="py-5 sm:py-10 mt-5 sm:mt-10">
			<div className="container mx-auto sm:mx-50">
				<div>
					<p className="capitalize font-display font-bold text-4xl text-center mb-6 text-ternary-dark dark:text-ternary-light">
						Laser Cutting {capabilitiesTitle}
					</p>
					<p className="font-general-medium text-xl font-regular text-m mb-12 text-ternary-dark dark:text-ternary-light">
						
						Explore our most common artistic styles below. 
						
						These are meant to give you an idea of what's possible, to get those creative juices flowing.

						These styles can be augmented and combined to create something truly unique. 

					</p>
					<p className="text-center font-general-medium text-lg mb-12 text-ternary-dark dark:text-ternary-light">
						Have an idea that you don’t see? 
						
						<a
						href="/contact"
						className="underline hover:text-indigo-600 dark:hover:text-indigo-300 ml-1 duration-500"
						>
							Contact Us!
						</a>
					</p>

					

				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-6 mx-12 sm:mx-0 sm:gap-10">
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
