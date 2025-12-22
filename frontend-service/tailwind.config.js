/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1C2321',
          primary: '#7D98A1',
          secondary: '#5E6572',
          light: '#A9B4C2',
          background: '#EEF1EF',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
