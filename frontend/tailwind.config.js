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
          50: 'hsl(var(--brand-50) / <alpha-value>)', 100: 'hsl(var(--brand-100) / <alpha-value>)', 200: 'hsl(var(--brand-200) / <alpha-value>)', 300: 'hsl(var(--brand-300) / <alpha-value>)', 400: 'hsl(var(--brand-400) / <alpha-value>)',
          500: 'hsl(var(--brand-500) / <alpha-value>)', 600: 'hsl(var(--brand-600) / <alpha-value>)', 700: 'hsl(var(--brand-700) / <alpha-value>)', 800: 'hsl(var(--brand-800) / <alpha-value>)', 900: 'hsl(var(--brand-900) / <alpha-value>)',
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
