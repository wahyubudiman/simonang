/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        plnBlue: '#005b9f',
        plnYellow: '#ffda00',
        darkBg: '#090d16',
        cardBg: 'rgba(17, 25, 40, 0.75)',
        borderBg: 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [],
}
