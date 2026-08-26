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
            50: '#FDF2F4',
            100: '#FBE6EA',
            200: '#F7CCD6',
            300: '#F0A3B5',
            400: '#E46E89',
            500: '#D24063',
            600: '#BA2549',
            700: '#9B1A39',
            800: '#520B1B',
            850: '#3D0713',
            900: '#2A040C',
            950: '#140105',
          },
          gold: {
            50: '#FDFBF5',
            100: '#FBF5E5',
            200: '#F5E6BD',
            300: '#ECD28D',
            400: '#E1BA5B',
            500: '#D4AF37', // Antique Metallic Gold
            600: '#BA9225',
            700: '#946E1B',
            800: '#7B5A1C',
            900: '#694B1B',
            950: '#3D2A0B',
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
        sans: ['Marcellus', 'serif'],
        serif: ['Marcellus', 'serif'],
        marcellus: ['Marcellus', 'serif'],
        display: ['Marcellus', 'serif'],
        title: ['Marcellus', 'serif'],
        cursive: ['Alex Brush', 'Great Vibes', 'MonteCarlo', 'cursive'],
        calligraphy: ['Great Vibes', 'Alex Brush', 'cursive'],
      },
      boxShadow: {
        'gold-sm': '0 0 10px rgba(212, 175, 55, 0.2)',
        'gold-md': '0 0 20px rgba(212, 175, 55, 0.35), 0 4px 15px rgba(0, 0, 0, 0.6)',
        'gold-lg': '0 0 35px rgba(212, 175, 55, 0.45), 0 8px 30px rgba(0, 0, 0, 0.8)',
        'ruby-sm': '0 0 12px rgba(225, 29, 72, 0.25)',
        'crimson-inner': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.5)',
        'apple-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
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
