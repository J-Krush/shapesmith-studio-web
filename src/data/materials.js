import { 
    PlywoodMaterial, 
    AcrylicMaterial, 
    HardwoodMaterial, 
    MDFMaterial, 
    LeatherMaterial, 
    MetalMaterial 
} from './images';

export const materialsData = [
    {
        id: 'plywood',
		title: 'Plywood',
		img: PlywoodMaterial,
        altImages: [
            {
                img: '',
                alt: '',
            }
        ],
        description: `Plywood, known for its strength and durability, is a versatile material that lends itself beautifully to a wide range of applications. 
            Composed of multiple layers of wood veneers bonded together, plywood offers stability and resilience while retaining the natural beauty and character of wood. 
            Whether it's the rich warmth of oak, the refined elegance of walnut, or the contemporary appeal of birch, our carefully selected plywood materials provide a canvas for extraordinary designs.`,
        materialThickness: `Cut up to 3/4" (18mm)`,
        processes: `Cut, engrave, etch`,
        disclaimer: `There can be a lot of variation in the types of wood and glue used. 
            Some glues smolder, not allowing a full cut through the wood, and cause the edges to char and fall apart. 
            For this reason, we like to test on a piece of plywood before cutting the final piece. 
            `,
    },
    {
        id: 'acrylic',
		title: 'Acrylic',
		img: AcrylicMaterial,
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
        materialThickness: `Cut up to 13/16" (20mm)`,
        processes: `Cut, engrave, etch`,
        disclaimer: ``,
    },
    {
        id: 'hardwood',
		title: 'Hardwood',
		img: HardwoodMaterial,
        altImages: [
            {
                img: '',
                alt: '',
            }
        ],
        description: `Hardwood, with its inherent strength, unique grain patterns, and rich colors, is a material that exudes natural beauty and character. 
        Each piece of hardwood tells a story, showcasing the majesty of nature captured in its textures and hues.`,
        materialThickness: `Cut up to 5/8" (15mm)`,
        processes: `Cut, engrave, etch`,
        disclaimer: ``,
    },
    {
        id: 'mdf',
		title: 'MDF',
		img: MDFMaterial,
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
        materialThickness: `Cut up to 3/8" (10mm)`,
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
		img: LeatherMaterial,
        altImages: [
            {
                img: '',
                alt: '',
            }
        ],
        description: `Leather offers exceptional versatility, lending itself to a myriad of applications and designs. From fashion accessories and footwear to upholstery, leather adds a touch of elegance and elevates the aesthetics of any creation. 
        Its durability ensures longevity, as leather products develop a beautiful patina over time, becoming even more exquisite with age.
        Moreover, leather possesses a unique quality that allows for intricate laser cutting. Leather can be precisely etched, engraved, or cut with exceptional detail. 
        This capability enhances the artistic possibilities, allowing for the creation of intricate patterns, personalized designs, or finely rendered embellishments that truly elevate the beauty of leather.`,
        materialThickness: `Cut up to 1/8" (3mm)`,
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
		img: MetalMaterial,
        altImages: [
            {
                img: '',
                alt: '',
            }
        ],
        description: `We often get questions about working with metal. Our laser cutter is not capable of cutting metal, but we can mark the surface, which is similar to engraving.
        QR codes and product IDs are great examples of things that can be marked on metal. 

        If you require metal cutting (plasma cutting), we work with Xometry to provide those services. 
        `,
        materialThickness: `Cutting not available`,
        processes: `Etch/Mark`,
        disclaimer: `Hello?`,
    }

]