/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        plasma: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        forest: {
          50: '#f7fef7',
          100: '#edfced',
          200: '#d3f8d3',
          300: '#aaf0aa',
          400: '#75e075',
          500: '#4ade80',
          600: '#22c55e',
          700: '#16a34a',
          800: '#15803d',
          900: '#0f3f1f',
          950: '#052e16',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
        '5000': '5000ms',
      },
    },
  },
  plugins: [],
};
