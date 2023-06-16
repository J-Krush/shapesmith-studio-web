



const Materials = () => {

	return (
        <section className="py-5 sm:py-10 mt-5 sm:mt-10">
			<div className="text-center">
				<p className="capitalize font-display font-bold text-2xl sm:text-4xl mb-1 text-ternary-dark dark:text-ternary-light">
					Materials
				</p>
			</div>

            <div className="block sm:flex gap-0 sm:gap-10 mt-14">
                <div className="w-full sm:w-1/3 text-left">

                    {/*  Single project right section */}
                    <div className="w-full sm:w-2/3 text-left mt-10 sm:mt-0">
                        <p className="font-general-regular text-primary-dark dark:text-primary-light text-2xl font-bold mb-7">
                            Section Title
                        </p>

                        <p className="font-general-regular mb-5 text-lg text-ternary-dark dark:text-ternary-light">
                            Section details
                        </p>
                    </div>
                </div>
            </div>
			
		</section>
	);
};

export default Materials;
