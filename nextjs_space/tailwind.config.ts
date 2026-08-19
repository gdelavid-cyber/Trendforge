import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#00F0FF',
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: '#FFD700',
          foreground: '#000000',
        },
        destructive: {
          DEFAULT: '#FF6B9D',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#11111E',
          foreground: '#8892B0',
        },
        accent: {
          DEFAULT: '#00F0FF',
          foreground: '#000000',
        },
        popover: {
          DEFAULT: '#0E0E18',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: 'rgba(255, 255, 255, 0.03)',
          foreground: '#FFFFFF',
        },
        cyan: '#00F0FF',
        gold: '#FFD700',
        pink: '#FF6B9D',
        silver: '#8892B0',
        'space-dark': '#0B0B12',
        'dark-navy': '#11111E',
        'dark-bg': '#000000',
        'card-bg': 'rgba(255, 255, 255, 0.03)',
        'border-subtle': 'rgba(255, 255, 255, 0.06)',
      },
      borderRadius: {
        '2xl': '16px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        display: ['var(--font-orbitron)', 'Orbitron', 'sans-serif'],
        mono: ['var(--font-space-grotesk)', 'Space Grotesk', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 20px rgba(0, 240, 255, 0.3)',
        'cyan-glow-lg': '0 0 30px rgba(0, 240, 255, 0.15)',
        'gold-glow': '0 0 20px rgba(255, 215, 0, 0.3)',
        'pink-glow': '0 0 20px rgba(255, 107, 157, 0.3)',
        'glass-card': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 60px rgba(0, 240, 255, 0.02)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.96)' },
        },
        'float-star': {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
          '100%': { transform: 'translateY(0px)' },
        },
        'grid-drift': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 40px' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 1.5s ease-in-out infinite',
        'float-star': 'float-star 8s ease-in-out infinite',
        'grid-drift': 'grid-drift 20s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('tailwind-scrollbar-hide')],
};
export default config;
