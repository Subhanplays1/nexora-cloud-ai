/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        surface: {
          950: '#05070a',
          900: '#0a0d14',
          850: '#0f141f',
          800: '#151b28',
          750: '#1c2436',
          700: '#253046',
        },
      },
    },
  },
  plugins: [],
};
