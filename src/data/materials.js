import Plywood1 from '../images/bloom-layers-side-2.jpg';
import Acrylic1 from '../images/materials/acrylic-1.jpeg';
import Hardwood1 from '../images/materials/hardwood-1.jpeg';
import MDF1 from '../images/materials/mdf-1.png';
import Leather1 from '../images/materials/leather-1.jpeg';
import Metal1 from '../images/materials/metal-1.jpeg';

export const materialsData = [
    {
        id: 'plywood',
		title: 'Plywood',
		img: Plywood1,
        altImages: [
            {
                img: '',
                alt: '',
            }
        ],
        description: `Plywood, known for its strength and durability, is a versatile material that lends itself beautifully to a wide range of applications. 
            Composed of multiple layers of wood veneers bonded together, plywood offers stability and resilience while retaining the natural beauty and character of wood. 
            Whether it's the rich warmth of oak, the refined elegance of walnut, or the contemporary appeal of birch, our carefully selected plywood materials provide a canvas for extraordinary designs.`,
        materialThickness: `Up to 3/4" (18mm)`,
        processes: `Cut, engrave, etch`,
        disclaimer: `There can be a lot of variation in the types of wood and glue used. 
            Some glues smolder, not allowing a full cut through the wood, and cause the edges to char and fall apart. 
            For this reason, we like to test on a piece of plywood before cutting the final piece. 
            `,
    },
    {
        id: 'acrylic',
		title: 'Acrylic',
		img: Acrylic1,
        altImages: [
            {
                img: '',
                alt: '',
            }
        ],
        description: `Acrylic, known for its crystal-clear transparency and glass-like appearance, is a remarkable material that allows light to pass through, enhancing the vibrancy of colors and adding a touch of sophistication to any design. 
        Whether you seek a sleek and modern aesthetic or a bold and vibrant statement, acrylic provides a pristine canvas that beautifully showcases your vision.
        There are many different colors available!
        `,
        materialThickness: `Up to 13/16" (20mm)`,
        processes: `Cut, engrave, etch`,
        disclaimer: ``,
    },
    {
        id: 'hardwood',
		title: 'Hardwood',
		img: Hardwood1,
        altImages: [
            {
                img: '',
                alt: '',
            }
        ],
        description: `Hardwood, with its inherent strength, unique grain patterns, and rich colors, is a material that exudes natural beauty and character. 
        Each piece of hardwood tells a story, showcasing the majesty of nature captured in its textures and hues.`,
        materialThickness: `Dependent on type of wood, typically up to 5/8" (15mm)`,
        processes: `Cut, engrave, etch`,
        disclaimer: ``,
    },
    {
        id: 'mdf',
		title: 'MDF',
		img: MDF1,
        altImages: [
            {
                img: '',
                alt: '',
            }
        ],
        description: `MDF is a robust and reliable material, composed of wood fibers bonded together with resins and formed into panels. 
        Its dense and uniform composition makes it an excellent choice for a wide range of applications. 
        MDF provides a smooth and consistent surface, allowing for intricate detailing and precise cutting. 
        Whether you're envisioning intricate wall art, customized signage, or intricately designed furniture, MDF serves as a sturdy foundation for your creative projects.`,
        materialThickness: `Up to 3/8" (10mm)`,
        processes: `Cut, engrave`,
        disclaimer: ``,
    },
    // {
    //     id: 'bamboo',
	// 	title: 'Bamboo',
	// 	img: Plywood1,
    //     altImages: [
    //         {
    //             img: '',
    //             alt: '',
    //         }
    //     ],
    //     description: ``,
    //     materialThickness: ``,
    //     disclaimer: ``,
    // },
    {
        id: 'leather',
		title: 'Leather',
		img: Leather1,
        altImages: [
            {
                img: '',
                alt: '',
            }
        ],
        description: ``,
        materialThickness: `Up to 1/8" (3mm)`,
        processes: `Cut, engrave, etch`,
        disclaimer: ``,
    },
    // {
    //     id: 'fabric',
	// 	title: 'Fabric',
	// 	img: Plywood1,
    //     altImages: [
    //         {
    //             img: '',
    //             alt: '',
    //         }
    //     ],
    //     description: ``,
    //     materialThickness: ``,
    //     disclaimer: ``,
    // },
    {
        id: 'metal',
		title: 'Metal',
		img: Metal1,
        altImages: [
            {
                img: '',
                alt: '',
            }
        ],
        description: ``,
        materialThickness: ``,
        processes: `Etch/Mark`,
        disclaimer: ``,
    }

]