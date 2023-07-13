
const QuickInfo = () => {

    return (
        <section className="py-5 sm:py-10 mt-5 sm:mt-10 bg-secondary-section-light dark:bg-secondary-section-dark">
				<div className="container mx-auto my-24">
					<div className='text-center'>
						<h1
							className='font-display font-black text-3xl md:text-center sm:text-left text-ternary-dark dark:text-primary-light'>
							We cut and engrave 
						
							<a
							href="/materials"
							className="underline hover:text-indigo-600 dark:hover:text-indigo-300 ml-1 duration-500"
							>
							hardwood, plywood, acrylic, leather, cloth, MDF, foam and more.
							</a>
							
						</h1>

						<p className='font-display text-lg italic md:text-center sm:text-left mt-8 text-ternary-dark dark:text-primary-light'> 
							*Metal cutting available via ** another studio **.
						</p>
					</div>
				</div>
			</section>
    )
}

export default QuickInfo;