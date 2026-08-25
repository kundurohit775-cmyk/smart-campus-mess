/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#FF6B35',
          hover: '#E85A2A',
          gradientStart: '#FF6B35',
          gradientEnd: '#F7931E',
        },
        ink: '#0F172A',
        body: '#475569',
        muted: '#94A3B8',
        base: '#FAFAFB',
        elevated: '#FFFFFF',
        status: {
          success: '#16A34A',
          'success-bg': '#F0FDF4',
          warning: '#D97706',
          'warning-bg': '#FFFBEB',
          danger: '#DC2626',
          'danger-bg': '#FEF2F2',
          info: '#6366F1',
          'info-bg': '#EEF2FF',
        },
        border: 'rgba(15,23,42,0.08)',
        divider: 'rgba(15,23,42,0.05)',
      },
      boxShadow: {
        'level-1': '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
        'level-2': '0 4px 12px rgba(15,23,42,0.08)',
        'level-3': '0 20px 40px rgba(15,23,42,0.12), 0 0 0 1px rgba(15,23,42,0.04)',
        'level-4': '0 8px 24px rgba(255,107,53,0.25)',
        'level-4-hover': '0 8px 24px rgba(255,107,53,0.35)',
        'focus-ring': '0 0 0 4px rgba(255,107,53,0.1)',
        'focus-ring-indigo': '0 0 0 4px rgba(99,102,241,0.1)',
        'focus-ring-amber': '0 0 0 4px rgba(217,119,6,0.1)',
      },
      borderRadius: {
        'input': '10px',
        'btn': '12px',
        'card': '16px',
        'modal': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'scale-bounce': 'scaleBounce 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleBounce: {
          '0%': { transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
