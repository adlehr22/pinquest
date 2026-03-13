import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          400: '#38BDF8',
        },
      },
      keyframes: {
        pinDrop: {
          '0%':   { transform: 'scale(0) translateY(-8px)', opacity: '0' },
          '65%':  { transform: 'scale(1.25) translateY(0)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0)',    opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        // Section 3: rating label entrance — opacity + scale only (GPU-friendly)
        ratingFade: {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '60%':  { opacity: '1', transform: 'scale(1.04)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        streakIn: {
          '0%':   { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
      },
      animation: {
        pinDrop:     'pinDrop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        slideUp:     'slideUp 0.35s ease-out',
        ratingFade:  'ratingFade 0.2s ease-out forwards',
        streakIn:    'streakIn 0.4s ease-out',
        pulse:       'pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
