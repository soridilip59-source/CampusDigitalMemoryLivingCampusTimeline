/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Figtree', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#14122b',
        night: '#0c0b1a',
        paper: '#f5f3fb',
        brand: {
          50: '#f3f0ff', 100: '#e9e3ff', 200: '#d4c9ff', 300: '#b6a4ff', 400: '#9a80ff',
          500: '#7c5cff', 600: '#6a45f5', 700: '#5a35dc', 800: '#4a2db3', 900: '#3b2590',
        },
        coral: { 400: '#ff8a6e', 500: '#ff6b4a', 600: '#f0522f' },
      },
      keyframes: {
        slideIn: { from: { opacity: 0, transform: 'translateX(24px)' }, to: { opacity: 1, transform: 'none' } },
        pop: { from: { opacity: 0, transform: 'scale(.96) translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        fade: { from: { opacity: 0 }, to: { opacity: 1 } },
        drift: { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(24px,-18px)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'slide-in': 'slideIn .3s ease-out',
        pop: 'pop .22s ease-out',
        fade: 'fade .2s ease-out',
        drift: 'drift 14s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
