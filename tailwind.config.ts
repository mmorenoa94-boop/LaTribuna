import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'lt-black':  '#0A0C0F',
        'lt-dark':   '#111318',
        'lt-card':   '#161A22',
        'lt-card2':  '#1C2130',
        'lt-green':  '#00E676',
        'lt-gd':     '#00C853',
        'lt-amber':  '#FFB300',
        'lt-orange': '#FF6D00',
        'lt-red':    '#FF4444',
        'lt-blue':   '#4488FF',
        'lt-purple': '#9B59B6',
        'lt-white':  '#F0F2F5',
        'lt-muted':  '#3A4455',
        'lt-muted2': '#6B7280',
      },
      fontFamily: {
        bebas:     ['var(--font-bebas)', 'sans-serif'],
        barlow:    ['var(--font-barlow)', 'sans-serif'],
        condensed: ['var(--font-barlow-condensed)', 'sans-serif'],
      },
      backgroundImage: {
        'glow-green': 'radial-gradient(ellipse 300px 200px at 50% -10%, rgba(0,230,118,0.12) 0%, transparent 60%)',
        'glow-amber': 'radial-gradient(ellipse 300px 200px at 50% -10%, rgba(255,179,0,0.12) 0%, transparent 60%)',
        'pitch-grid': 'repeating-linear-gradient(90deg, transparent 0px, transparent 29px, rgba(255,255,255,0.015) 29px, rgba(255,255,255,0.015) 30px)',
      },
      animation: {
        'pulse-dot': 'pulseDot 1.3s ease infinite',
        'slide-up':  'slideUp 0.3s ease-out',
        'fade-in':   'fadeIn 0.2s ease-out',
        'ticker':    'ticker 30s linear infinite',
        'xp-fill':   'xpFill 1s ease-out forwards',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.4', transform: 'scale(0.7)' },
        },
        slideUp: {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        xpFill: {
          from: { width: '0%' },
        },
      },
      borderRadius: {
        card: '14px',
        btn:  '10px',
      },
      boxShadow: {
        'card':   '0 4px 24px rgba(0,0,0,0.4)',
        'glow-g': '0 0 20px rgba(0,230,118,0.15)',
        'glow-a': '0 0 20px rgba(255,179,0,0.15)',
      },
    },
  },
  plugins: [],
} satisfies Config
