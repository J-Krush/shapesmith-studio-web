// Import images
import LayeredWallArt from '../images/cat-layers-top.jpg';
import FoxLayers from '../images/fox-layers-top.jpg';

import TigerEyes from '../images/tiger-eyes-layers-top.jpg';
import Waves from '../images/waves-layers-top.jpg';


import Furniture from '../images/headboard-installed.jpg';

import UIImage1 from '../images/ui-project-1.jpg';
import UIImage2 from '../images/ui-project-2.jpg';
import Image3 from '../images/mobile-project-2.jpg';

export const capabilitiesTitle = 'capabilities';

export const capabilitiesData = [
	{
		id: 'layered-wall-art',
		title: 'Layered Wall Art',
		img: LayeredWallArt,
		slug: `/${capabilitiesTitle}/layered-wall-art`,
		ProjectHeader: {
			title: 'Multi-layered Wall Art',
			tags: 'Unknown',
		},
		ProjectImages: [
			{
				id: 1,
				title: 'Fox Layered',
				img: FoxLayers,
				isOriginalDesign: false,
				linkToDesign: '',
			},
			{
				id: 2,
				title: 'Tiger Eyes Layered',
				img: TigerEyes,
				isOriginalDesign: false,
				linkToDesign: '',
			},
			{
				id: 3,
				title: 'Waves Layered',
				img: Waves,
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
			ProjectDetails: 'This is some text',
		}
	},
	{
		id: 'furniture',
		title: 'Furniture & Detailing',
		img: Furniture,
		slug: `/${capabilitiesTitle}/furniture`,

		ProjectHeader: {
			title: 'Furniture & Detailing',
			tags: 'Unknown',
		},
		ProjectImages: [
			{
				id: 1,
				title: 'Headboard Installed',
				img: Furniture,
				isOriginalDesign: true,
				linkToDesign: '',
			},
			{
				id: 2,
				title: 'Tiger Eyes Layered',
				img: TigerEyes,
				isOriginalDesign: false,
				linkToDesign: '',
			},
			{
				id: 3,
				title: 'Waves Layered',
				img: Waves,
				isOriginalDesign: false,
				linkToDesign: '',
			},
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
		id: '3d-slices',
		title: '3D Model Slicing',
		img: UIImage1,
		slug: `/${capabilitiesTitle}/3d-slices`,
	},
	{
		id: 'signage',
		title: 'Signage',
		img: UIImage2,
		slug: `/${capabilitiesTitle}/signage`,
	},
	{
		id: 'jewelry',
		title: 'Jewelry',
		img: Image3,
		slug: `/${capabilitiesTitle}/jewelry`,
	},
	{
		id: 'merchandise',
		title: 'Merchandise & Party Favors',
		img: Image3,
		slug: `/${capabilitiesTitle}/merchandise`,
	},
	// {
	// 	id: 7,
	// 	title: 'Custom Work',
	// 	img: Image3,
	// 	slug: `/${projectsTitle}/custom`,
	// },
];
