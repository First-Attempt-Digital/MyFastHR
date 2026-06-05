/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./frontend/index.html",
    "./frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#fdf2f8',
          DEFAULT: '#db2777',
          dark: '#9d174d',
        },
        secondary: {
          light: '#eff6ff',
          DEFAULT: '#3b82f6',
          dark: '#1e40af',
        }
      }
    },
  },
  plugins: [],
}
