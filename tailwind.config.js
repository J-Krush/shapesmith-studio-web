/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'landing-hero-bg': "url('/src/assets/header.png')",
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'] 
      },
      
    }
  },
  plugins: [],
}
