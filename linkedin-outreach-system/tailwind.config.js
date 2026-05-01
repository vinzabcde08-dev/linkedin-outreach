/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0D1B2A',
          800: '#1B2D42',
          700: '#243447',
        },
        brand: {
          blue: '#0A66C2',
          'blue-light': '#E8F4FD',
          'blue-hover': '#004182',
          gold: '#F0A500',
          'gold-light': '#FEF3C7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
