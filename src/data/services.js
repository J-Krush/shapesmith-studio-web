export const SERVICES = [
	{
		key: 'laser',
		urlSegment: 'styles',
		navLabel: 'styles',
		sanityType: 'laser-style',
		contactSubject: 'Laser cutting',
	},
	{
		key: 'print',
		urlSegment: '3d-printing',
		navLabel: '3D Printing',
		sanityType: 'print-style',
		contactSubject: '3D printing',
		// Temporarily hidden from nav + home banner while the 3D printing section
		// is still in progress. Routes /3d-printing and /3d-printing/:slug stay
		// registered in App.js so direct URLs continue to work. Remove this flag
		// when the section is ready to launch.
		hidden: true,
	},
];
