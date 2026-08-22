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
          DEFAULT: '#FF007A',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#0D0D18',
          foreground: '#8E9BB4',
        },
        accent: {
          DEFAULT: '#00F0FF',
          foreground: '#000000',
        },
        popover: {
          DEFAULT: '#07070E',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: 'rgba(255, 255, 255, 0.03)',
          foreground: '#FFFFFF',
        },
        cyan: '#00F0FF',
        gold: '#FFD700',
        pink: '#FF007A',
        neonPurple: '#9D00FF',
        neonGreen: '#00FF66',
        silver: '#8E9BB4',
        'space-dark': '#06060B',
        'dark-navy': '#0A0A14',
        'dark-bg': '#030307',
        'card-bg': 'rgba(255, 255, 255, 0.03)',
        'border-subtle': 'rgba(255, 255, 255, 0.07)',
      },
      borderRadius: {
        '3xl': '24px',
        '2xl': '18px',
        xl: '14px',
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
        'cyan-glow': '0 0 25px rgba(0, 240, 255, 0.35)',
        'cyan-glow-lg': '0 0 45px rgba(0, 240, 255, 0.2)',
        'gold-glow': '0 0 25px rgba(255, 215, 0, 0.35)',
        'pink-glow': '0 0 25px rgba(255, 0, 122, 0.35)',
        'purple-glow': '0 0 30px rgba(157, 0, 255, 0.35)',
        'neon-glow': '0 0 30px rgba(0, 255, 102, 0.35)',
        'glass-card': '0 12px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-card-hover': '0 20px 50px rgba(0, 240, 255, 0.12), inset 0 1px 0 rgba(0, 240, 255, 0.3)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.97)' },
        },
        'float-star': {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-18px)' },
          '100%': { transform: 'translateY(0px)' },
        },
        'grid-drift': {
          '0%': { transform: 'perspective(500px) rotateX(60deg) translateY(0)' },
          '100%': { transform: 'perspective(500px) rotateX(60deg) translateY(40px)' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        'laser-sweep': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'hologram-flicker': {
          '0%, 100%': { opacity: '0.98' },
          '92%': { opacity: '0.92' },
          '96%': { opacity: '1' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float-star': 'float-star 6s ease-in-out infinite',
        'grid-drift': 'grid-drift 3s linear infinite',
        'scanline': 'scanline 8s linear infinite',
        'laser-sweep': 'laser-sweep 4s ease infinite',
        'hologram-flicker': 'hologram-flicker 5s ease infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('tailwind-scrollbar-hide')],
};
export default config;
