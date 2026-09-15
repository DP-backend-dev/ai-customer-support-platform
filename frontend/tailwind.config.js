/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#090b10',
        panel: '#11151d',
        line: '#242b38',
        accent: '#8b5cf6',
      },
      boxShadow: { glow: '0 20px 70px rgba(124, 58, 237, 0.14)' },
    },
  },
  plugins: [],
}
