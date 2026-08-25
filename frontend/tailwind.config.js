/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f8fafc',
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Vibrant Orange Action
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        slate: {
          850: '#131c2e',
          950: '#090d16',
        },
        brand: {
          indigo: '#4f46e5',
          violet: '#7c3aed',
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e',
          sky: '#0284c7',
          card: '#ffffff'
        }
      },
      boxShadow: {
        'stripe-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
        'stripe': '0 0 0 1px rgba(0, 0, 0, 0.04), 0 2px 5px 0 rgba(0, 0, 0, 0.04), 0 1px 1px 0 rgba(0, 0, 0, 0.02)',
        'stripe-md': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 12px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'stripe-lg': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 12px 30px -4px rgba(0, 0, 0, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        'stripe-hover': '0 0 0 1px rgba(0, 0, 0, 0.06), 0 16px 36px -6px rgba(0, 0, 0, 0.1), 0 6px 14px -3px rgba(0, 0, 0, 0.05)',
        'glow-orange': '0 0 24px -2px rgba(249, 115, 22, 0.35)',
        'glow-emerald': '0 0 24px -2px rgba(16, 185, 129, 0.35)',
        'glow-indigo': '0 0 24px -2px rgba(79, 70, 229, 0.35)',
      },
      borderRadius: {
        '2.5xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      animation: {
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
