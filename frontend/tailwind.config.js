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
        // Space-Tech Color System
        base: '#0B0E1A',
        elevated: '#131728',
        'elevated-glass': 'rgba(19, 23, 40, 0.6)',
        'surface-card': '#131728',
        'surface-subtle': '#1A1F3A',

        // Accents
        primary: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          active: '#6D28D9',
          glow: 'rgba(139, 92, 246, 0.4)'
        },
        secondary: {
          DEFAULT: '#06B6D4',
          hover: '#0891B2',
          glow: 'rgba(6, 182, 212, 0.4)'
        },
        accent: {
          violet: '#8B5CF6',
          cyan: '#06B6D4'
        },

        // Text
        ink: '#F1F5F9',
        body: '#94A3B8',
        muted: '#64748B',

        // Borders & Dividers
        border: 'rgba(139, 92, 246, 0.15)',
        'border-hover': 'rgba(139, 92, 246, 0.4)',
        divider: 'rgba(139, 92, 246, 0.1)',

        // Status
        status: {
          success: '#34D399',
          warning: '#FBBF24',
          danger: '#F87171',
          info: '#06B6D4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Space Grotesk', 'Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif']
      },
      boxShadow: {
        'level-1': '0 2px 8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.15)',
        'level-2': '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(139, 92, 246, 0.35)',
        'level-3': '0 24px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(139, 92, 246, 0.4)',
        'level-4': '0 0 24px rgba(139, 92, 246, 0.4)',
        'glow-primary': '0 0 24px rgba(139, 92, 246, 0.4)',
        'glow-secondary': '0 0 24px rgba(6, 182, 212, 0.4)',
        'glow-emerald': '0 0 24px rgba(52, 211, 153, 0.3)',
        'glow-amber': '0 0 24px rgba(251, 191, 36, 0.3)',
        'glow-rose': '0 0 24px rgba(248, 113, 113, 0.3)'
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
        'input': '10px',
        'modal': '24px'
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out forwards',
        'slide-up': 'slideUp 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'drift-slow': 'driftSlow 20s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'mesh-drift': 'meshDrift 18s ease-in-out infinite alternate'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        driftSlow: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px) translateX(8px)' },
          '100%': { transform: 'translateY(0px)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', filter: 'blur(30px)' },
          '50%': { opacity: '0.7', filter: 'blur(45px)' }
        },
        meshDrift: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(4%, 3%) scale(1.06)' },
          '100%': { transform: 'translate(-3%, -2%) scale(1)' }
        }
      }
    },
  },
  plugins: [],
}
