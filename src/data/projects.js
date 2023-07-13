// Import images
// import LayeredWallArt from '../images/cat-layers-top.jpg';
// import FoxLayers from '../images/fox-layers-top.jpg';
// import TigerEyes from '../images/tiger-eyes-layers-top.jpg';
// import Waves from '../images/waves-layers-top-2.jpg';
// import Sunrise from '../images/sunrise.jpg';
// import MetatronTop from '../images/metatron-finished-1.jpg';
// import MetatronSide from '../images/metatron-finished-2.jpg';
// import BloomSide1 from '../images/bloom-layers-side-1.jpg';
// import BloomSide2 from '../images/bloom-layers-side-2.jpg';
// import Jewelry from '../images/earrings-geometric-close-up.jpg';
// import EarringsBatch from '../images/earrings-batch-3.jpg';
// import Furniture from '../images/headboard-installed.jpg';
// import SlicedArt from '../images/skull-sliced-1.jpg';
// import SignageArt from '../images/inward-arts-signs.jpg';
// import Venmo from '../images/venmo-1.jpg';

import { 
	CatTop, 
	DavilleCampSign,
	DavilleDJ,
	FoxTop, 
	TigerEyesTop, 
	WavesTop, 
	SunriseTop, 
	MetatronFinished1, 
	MetatronFinished2, 
	EarringsGeometric, 
	EarringsBatch3, 
	HeadboardInstalled, 
	SkullSliced, 
	InwardArtsSigns, 
	LadiesSign, 
	WelcomeToTheShire, 
	VenmoSign,

 } from './images';

import BloomSide1 from '../images/bloom-layers-side-1.jpg';
import BloomSide2 from '../images/bloom-layers-side-2.jpg';

export const capabilitiesTitle = 'styles';

export const capabilitiesData = [
	{
		id: 'layered-wall-art',
		title: 'Layered Wall Art',
		img: CatTop,
		slug: `/${capabilitiesTitle}/layered-wall-art`,
		ProjectHeader: {
			title: 'Multi-layered Wall Art',
			tags: 'Unknown',
		},
		ProjectImages: [
			{
				id: 1,
				title: 'Sunrise',
				img: SunriseTop,
				isOriginalDesign: false,
				linkToDesign: '',
			},
			{
				id: 2,
				title: 'Fox Layered',
				img: FoxTop,
				isOriginalDesign: false,
				linkToDesign: '',
			},
			{
				id: 3,
				title: 'Tiger Eyes Layered',
				img: TigerEyesTop,
				isOriginalDesign: false,
				linkToDesign: '',
			},
			{
				id: 4,
				title: 'Waves Layered',
				img: WavesTop,
				isOriginalDesign: false,
				linkToDesign: '',
			},
			{
				id: 5,
				title: 'Metatron Top',
				img: MetatronFinished1,
				isOriginalDesign: false,
				linkToDesign: '',
			},
			{
				id: 6,
				title: 'Metatron Side',
				img: MetatronFinished2,
				isOriginalDesign: false,
				linkToDesign: '',
			},
			// {
			// 	id: 7,
			// 	title: 'Bloom Side 1',
			// 	img: BloomSide1,
			// 	isOriginalDesign: false,
			// 	linkToDesign: '',
			// },
		],
		ProjectInfo: {
			ConsiderationsTitle: 'Considerations',
			ConsiderationsDetails: '',

			MaterialsTitle: 'Preferred Materials',
			MaterialsDetails: 'Plywood, Acrylic',

			ProjectDetailsTitle: 'About this style',
			ProjectDetails: `Immerse yourself in the captivating world of our layered wall art. 
				These stunning creations showcase depth, dimension, and a harmonious blend of materials. 
				From mesmerizing landscapes to intricate geometric patterns, our layered wall art adds a touch of elegance and visual intrigue to any space. 
				Each piece is meticulously designed and cut, resulting in a unique masterpiece that will leave you in awe.`,
		}
	},
	{
		id: '3d-slices',
		title: 'Sliced 3D Models',
		img: SkullSliced,
		slug: `/${capabilitiesTitle}/3d-slices`,
		ProjectHeader: {
			title: 'Sliced 3D Models',
			tags: 'Unknown',
		},
		ProjectImages: [
			// {
			// 	id: 1,
			// 	title: 'Sunrise',
			// 	img: SunriseTop,
			// 	isOriginalDesign: false,
			// 	linkToDesign: '',
			// },
		],
		ProjectInfo: {
			ConsiderationsTitle: 'Considerations',
			ConsiderationsDetails: '',

			MaterialsTitle: 'Preferred Materials',
			MaterialsDetails: 'Plywood, Acrylic',

			ProjectDetailsTitle: 'About this style',
			ProjectDetails: `Unleash the possibilities of three-dimensional art with our 3D model slicing expertise. 
				Using advanced techniques, we transform high-resolution 3D models into contour layers that are individually cut out and assembled. 
				The result is a stunning display of depth and complexity that will captivate the eye. 
				From architectural landmarks to intricate sculptures, our 3D model slicing elevates your design to a whole new level, turning it into a tangible marvel that defies expectations.`,
		}
	},
	{
		id: 'signage',
		title: 'Signage',
		img: InwardArtsSigns,
		slug: `/${capabilitiesTitle}/signage`,
		ProjectHeader: {
			title: 'Signage and Branding',
			tags: 'Unknown',
		},
		ProjectImages: [
			{
				id: 1,
				title: 'Ladies Sign',
				img: LadiesSign,
				isOriginalDesign: true,
				linkToDesign: '',
			},
			{ 
				id: 2,
				title: 'Welcome to the Shire',
				img: WelcomeToTheShire,
				isOriginalDesign: true,
				linkToDesign: '',
			},
			{
				id: 3,
				title: 'Daville Camp Sign',
				img: DavilleCampSign,
				isOriginalDesign: true,
				linkToDesign: '',
			}
		],
		ProjectInfo: {
			ConsiderationsTitle: 'Considerations',
			ConsiderationsDetails: '',

			MaterialsTitle: 'Preferred Materials',
			MaterialsDetails: 'Plywood, Acrylic',

			ProjectDetailsTitle: 'About this style',
			ProjectDetails: `Make a bold statement with custom signage solutions. 
				Whether it's for your business, event, or personal space, signage adds a touch of personality and professionalism. 
				We offer a range of materials, from wood to acrylic, and can create signage in various sizes and styles. 
				Let your brand shine with eye-catching logos, vibrant lettering, and intricate designs that leave a lasting impression.`,
		}
	},
	{
		id: 'jewelry',
		title: 'Jewelry',
		img: EarringsGeometric,
		slug: `/${capabilitiesTitle}/jewelry`,
		ProjectHeader: {
			title: 'Jewelry',
			tags: 'Unknown',
		},
		ProjectImages: [
			{
				id: 1,
				title: 'Earrings Batch',
				img: EarringsBatch3,
				isOriginalDesign: false,
				linkToDesign: '',
			},
		],
		ProjectInfo: {
			ConsiderationsTitle: 'Considerations',
			ConsiderationsDetails: '',

			MaterialsTitle: 'Preferred Materials',
			MaterialsDetails: 'Plywood, Acrylic',

			ProjectDetailsTitle: 'About this style',
			ProjectDetails: `Experience the artistry of precision laser cutting and adorn yourself with jewelry that tells a story of natural beauty and exceptional craftsmanship. 
				From necklaces and earrings to bracelets and rings, jewelry pieces can incorporate unique shapes, patterns, and materials. `,
		}
	},
	{
		id: 'furniture',
		title: 'Furniture & Large Pieces',
		img: HeadboardInstalled,
		slug: `/${capabilitiesTitle}/furniture`,
		ProjectHeader: {
			title: 'Furniture & Large Pieces',
			tags: 'Unknown',
		},
		ProjectImages: [
			{
				id: 1,
				title: 'Headboard Installed',
				img: HeadboardInstalled,
				isOriginalDesign: true,
				linkToDesign: '',
			},
			{
				id: 2,
				title: 'Daville DJ Booth',
				img: DavilleDJ,
				isOriginalDesign: true,
				linkToDesign: '',
			}
		],
		ProjectInfo: {
			ConsiderationsTitle: 'Considerations',
			ConsiderationsDetails: '',

			MaterialsTitle: 'Preferred Materials',
			MaterialsDetails: 'Plywood, hardwood',

			ProjectDetailsTitle: 'About this style',
			ProjectDetails: 'This is some text',
		}
	},
	{
		id: 'merchandise',
		title: 'Merchandise & Party Favors',
		img: VenmoSign,
		slug: `/${capabilitiesTitle}/merchandise`,
		ProjectHeader: {
			title: 'Merchandise, Party Favors & Wedding Gifts',
			tags: 'Unknown',
		},
		ProjectImages: [
		],
		ProjectInfo: {
			ConsiderationsTitle: 'Considerations',
			ConsiderationsDetails: '',

			MaterialsTitle: 'Preferred Materials',
			MaterialsDetails: 'Plywood, hardwood',

			ProjectDetailsTitle: 'About this style',
			ProjectDetails: `Make your event truly memorable with our personalized merchandise. 
				Whether it's a corporate conference, music festival, wedding or charity gala, we can create merchandise that captures the spirit of your occasion. 
				From custom-designed event badges to commemorative items, our attention to detail and commitment to quality will help you create an unforgettable experience for your attendees.`,
		}
	},
];
