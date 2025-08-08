/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nissa: '#75000e',
      },
      boxShadow: {
        soft: '0 1px 6px rgba(0,0,0,.06)',
        card: '0 8px 24px rgba(0,0,0,.15)',
      }
    },
  },
  plugins: [],
}
