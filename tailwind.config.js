/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        uinr: {
          DEFAULT: '#1a3a5c',
          dark: '#142d47',
          light: '#2a527d',
          accent: '#d4a017'
        }
      }
    }
  },
  plugins: []
};
