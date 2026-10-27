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
        // Clean White & Orange Theme Foundations
        base: '#FFFFFF',
        subtle: '#FFF7F0',
        'surface-card': '#FFFFFF',
        'surface-subtle': '#FFF7F0',

        // Primary Orange System
        primary: {
          DEFAULT: '#FF6B35',
          hover: '#E85A2A',
          light: '#FFEFE6',
          gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
        },
        orange: {
          DEFAULT: '#FF6B35',
          50: '#FFF7F0',
          100: '#FFEFE6',
          200: '#FFD9C7',
          300: '#FFBFA3',
          400: '#FF946E',
          500: '#FF6B35',
          600: '#E85A2A',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12'
        },

        // Role Accent Variations (on White/Subtle background)
        role: {
          student: '#FF6B35',
          chef: '#EA580C',
          admin: '#C2410C'
        },

        // Typography System
        ink: '#1E1B16',
        body: '#6B6560',
        muted: '#9B9590',

        // Borders & Dividers
        border: 'rgba(30, 27, 22, 0.08)',
        'border-subtle': 'rgba(30, 27, 22, 0.05)',
        'border-hover': 'rgba(255, 107, 53, 0.3)',
        divider: 'rgba(30, 27, 22, 0.08)',

        // Status Colors (Used Sparingly & Distinctly)
        status: {
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
          info: '#2563EB'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Space Grotesk', 'Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif']
      },
      boxShadow: {
        'card': '0 1px 3px rgba(30,27,22,0.06), 0 4px 12px rgba(30,27,22,0.04)',
        'card-hover': '0 4px 16px rgba(30,27,22,0.08), 0 1px 3px rgba(30,27,22,0.04)',
        'card-active': '0 6px 20px rgba(255,107,53,0.12), 0 1px 4px rgba(30,27,22,0.06)',
        'btn-orange': '0 2px 8px rgba(255, 107, 53, 0.22)',
        'btn-orange-hover': '0 4px 14px rgba(255, 107, 53, 0.32)',
        'soft-sm': '0 1px 2px rgba(30,27,22,0.05)',
        'soft-md': '0 4px 12px rgba(30,27,22,0.06)',
        'soft-lg': '0 10px 25px rgba(30,27,22,0.08)',
        'modal': '0 20px 40px rgba(30,27,22,0.12), 0 1px 3px rgba(30,27,22,0.08)'
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
        'input': '10px',
        'modal': '20px'
      },
      animation: {
        'fade-in': 'fadeIn 180ms ease-out forwards',
        'slide-up': 'slideUp 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
}
