import type { Config } from 'tailwindcss'

const config: Config = {
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
          '0%': { transform: 'scale(0)' },
          '70%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        ratingBounce: {
          '0%': { transform: 'scale(0) rotate(-5deg)', opacity: '0' },
          '60%': { transform: 'scale(1.2) rotate(2deg)', opacity: '1' },
          '80%': { transform: 'scale(0.95) rotate(-1deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        streakIn: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        pinDrop: 'pinDrop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        slideUp: 'slideUp 0.35s ease-out',
        ratingBounce: 'ratingBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        streakIn: 'streakIn 0.4s ease-out',
        pulse: 'pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
