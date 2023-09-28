import { useEffect, useState } from 'react';
import sanityClient from '../utilities/sanityClient';
import MaterialSingle from "../materials/MaterialSingle";

const Materials = () => {

    const [materials, setMaterials] = useState([]);

	useEffect(() => {
		sanityClient.fetch(
			`*[_type == "material"]{
				_id,
                order,
				title,
                processes,
                cuttingSpecs,
                description,
                disclaimer,
				listImage{
					altText,
					asset->{
						_id,
						url,
					},
				}                
			  }
			  `
		)
		.then((data) => {
			setMaterials(data);
		})
		.catch(console.error);
	}, []);


	return (
        <section className="py-5 sm:py-10 mt-5 sm:mt-10">
            <div className="container mx-auto">
                <div className="text-center">
                    <p className="capitalize font-display font-bold text-2xl sm:text-4xl mb-1 text-ternary-dark dark:text-ternary-light">
                        Laser Cutting Materials
                    </p>
                </div>

                <div className="block sm:flex gap-0 sm:gap-10 mt-14">
                    <div className="w-full sm:w-1/3 text-left">

                        {/*  Single project right section */}
                        {/* <div className="w-full sm:w-2/3 text-left mt-10 sm:mt-0">
                            <p className="font-general-regular text-primary-dark dark:text-primary-light text-2xl font-bold mb-7">
                                Section Title
                            </p>

                            <p className="font-general-regular mb-5 text-lg text-ternary-dark dark:text-ternary-light">
                                Below are the material 
                            </p>
                        </div> */}
                    </div>
                </div>

                {materials
                .sort((a,b) => a.order < b.order ? -1 : 1)
                .map((material) => (
						<MaterialSingle
							title={material.title}
							image={material.listImage.asset.url}
							key={material.title}
                            description={material.description}
                            materialThickness={material.cuttingSpecs}
                            processes={material.processes}
                            disclaimer={material.disclaimer}
						/>
					))}

            </div>
			
		</section>
	);
};

export default Materials;
