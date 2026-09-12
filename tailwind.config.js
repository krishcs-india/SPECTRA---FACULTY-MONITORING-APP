/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kalyani: {
          crimson: {
            50: 'rgb(var(--tw-crimson-50) / <alpha-value>)',
            100: 'rgb(var(--tw-crimson-100) / <alpha-value>)',
            200: 'rgb(var(--tw-crimson-200) / <alpha-value>)',
            300: 'rgb(var(--tw-crimson-300) / <alpha-value>)',
            400: 'rgb(var(--tw-crimson-400) / <alpha-value>)',
            500: 'rgb(var(--tw-crimson-500) / <alpha-value>)',
            600: 'rgb(var(--tw-crimson-600) / <alpha-value>)',
            700: 'rgb(var(--tw-crimson-700) / <alpha-value>)',
            800: 'rgb(var(--tw-crimson-800) / <alpha-value>)',
            850: 'rgb(var(--tw-crimson-850) / <alpha-value>)',
            900: 'rgb(var(--tw-crimson-900) / <alpha-value>)',
            950: 'rgb(var(--tw-crimson-950) / <alpha-value>)',
          },
          gold: {
            50: 'rgb(var(--tw-gold-50) / <alpha-value>)',
            100: 'rgb(var(--tw-gold-100) / <alpha-value>)',
            200: 'rgb(var(--tw-gold-200) / <alpha-value>)',
            300: 'rgb(var(--tw-gold-300) / <alpha-value>)',
            400: 'rgb(var(--tw-gold-400) / <alpha-value>)',
            500: 'rgb(var(--tw-gold-500) / <alpha-value>)',
            600: 'rgb(var(--tw-gold-600) / <alpha-value>)',
            700: 'rgb(var(--tw-gold-700) / <alpha-value>)',
            800: 'rgb(var(--tw-gold-800) / <alpha-value>)',
            900: 'rgb(var(--tw-gold-900) / <alpha-value>)',
            950: 'rgb(var(--tw-gold-950) / <alpha-value>)',
          },
          amber: {
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
          },
          ruby: {
            400: '#FB7185',
            500: '#F43F5E',
            600: '#E11D48',
            700: '#BE123C',
          },
          emerald: {
            50: '#ECFDF5',
            100: '#D1FAE5',
            200: '#A7F3D0',
            300: '#6EE7B7',
            400: '#34D399',
            500: '#10B981',
            600: '#059669',
          },
          teal: {
            400: '#2DD4BF',
            500: '#14B8A6',
            600: '#0D9488',
          }
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Marcellus', 'Georgia', 'serif'],
        marcellus: ['Marcellus', 'Georgia', 'serif'],
        display: ['Marcellus', 'Georgia', 'serif'],
        title: ['Marcellus', 'Georgia', 'serif'],
        cursive: ['Marcellus', 'Georgia', 'serif'],
        calligraphy: ['Marcellus', 'Georgia', 'serif'],
      },
      boxShadow: {
        'gold-sm': '0 1px 3px 0 rgba(244, 63, 94, 0.1), 0 1px 2px -1px rgba(244, 63, 94, 0.1)',
        'gold-md': '0 4px 6px -1px rgba(244, 63, 94, 0.12), 0 2px 4px -2px rgba(244, 63, 94, 0.1)',
        'gold-lg': '0 10px 15px -3px rgba(244, 63, 94, 0.15), 0 4px 6px -4px rgba(244, 63, 94, 0.1)',
        'ruby-sm': '0 1px 3px 0 rgba(225, 29, 72, 0.2)',
        'crimson-inner': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)',
        'apple-card': '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 25s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '24px',
        '3xl': '40px',
      },
    },
  },
  plugins: [],
}
