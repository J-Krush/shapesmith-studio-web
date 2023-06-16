// /** @type {import('tailwindcss').Config} */

// module.exports = {
//   content: [
//     "./src/**/*.{js,jsx,ts,tsx}",
//   ],
//   theme: {
//     extend: {
//       backgroundImage: {
//         'landing-hero-bg': "url('/src/assets/header.png')",
//       },
//       fontFamily: {
//         'poppins': ['Poppins', 'sans-serif'] 
//       },
      
//     }
//   },
//   plugins: [],
// }


const colors = require('tailwindcss/colors');

module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	darkMode: 'class',
	theme: {
		

		extend: {
			colors: {
				'primary-light': '#F7F8FC',
				'secondary-light': '#FFFFFF',
				'ternary-light': '#f6f7f8',
				'secondary-section-light': '#d1d1d1ff',

				'primary-dark': '#291c30',
				'secondary-dark': '#102D44',
				'ternary-dark': '#1E3851',
				'secondary-section-dark': '#594a60',

				'accent': '#FFD63E',
				'accent-highlight': '#b72c3e',
			},
			container: {
				padding: {
					DEFAULT: '1rem',
					sm: '2rem',
					lg: '5rem',
					xl: '6rem',
					'2xl': '8rem',
				},
			},
		},
	},
	variants: {
		extend: { opacity: ['disabled'] },
	},
	plugins: ['@tailwindcss/forms'],
};