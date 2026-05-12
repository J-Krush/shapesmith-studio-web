function AppFooterCopyright() {
	return (
		<div className="font-general-regular flex justify-center items-center text-center">
			<div className="text-lg text-ternary-dark dark:text-ternary-light">
				{/* <a
					href="https://github.com/realstoman/react-tailwindcss-portfolio"
					target="_blank"
					rel="noopener noreferrer"
					className="hover:underline hover:text-accent ml-1 duration-500"
				>
					React & Tailwind CSS Portfolio
				</a>
				. */}
				{/* <a
					href="https://stoman.me"
					target="_blank"
					rel="noopener noreferrer"
					className="text-secondary-dark dark:text-secondary-light font-medium uppercase hover:underline hover:text-accent ml-1 duration-500"
				>
					Stoman
				</a> */}
				<p>
				 &copy; {new Date().getFullYear()} Shapesmith Studio
				</p>
			</div>
		</div>
	);
}

export default AppFooterCopyright;
