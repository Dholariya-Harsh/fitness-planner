/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
