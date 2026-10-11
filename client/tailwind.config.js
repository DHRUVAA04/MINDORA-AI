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
        // Core "Aurora Study Nebula" Design Tokens
        brand: {
          midnight: '#1E1B4B', // Midnight Indigo (primary dark)
          royal: '#3730A3',    // Royal Indigo (primary)
          violet: '#7C3AED',   // Electric Violet (action/accent)
          orchid: '#D946EF',   // Neon Orchid (highlight)
          cyan: '#22D3EE',     // Aurora Cyan (info/focus)
          mint: '#34D399',     // Aurora Mint (success/mastery)
          amber: '#FBBF24',    // Solar Amber (warning/streak)
          coral: '#FB7185',    // Coral Pulse (error/weak topic)
          mist: '#F5F3FF',     // Lavender Mist (soft background)
          pearl: '#FFFFFF',    // Pearl White (cards)
          slate: '#1E293B',    // Slate Ink (body text)
        },
        // Semantic Tokens (Dynamic with Light & Deep Space Dark themes)
        semantic: {
          bg: 'var(--color-bg)',
          card: 'var(--color-card)',
          cardBorder: 'var(--color-card-border)',
          cardHover: 'var(--color-card-hover)',
          text: 'var(--color-text)',
          textMuted: 'var(--color-text-muted)',
          textSubtle: 'var(--color-text-subtle)',
          topbar: 'var(--color-topbar-bg)',
          sidebar: 'var(--color-sidebar-bg)',
          sidebarBorder: 'var(--color-sidebar-border)',
          // Status tokens
          mastered: '#34D399',
          inProgress: '#FBBF24',
          weak: '#FB7185',
          unassessed: '#22D3EE',
        }
      },
      backgroundImage: {
        // Signature Gradients
        'hero-gradient': 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 45%, #7C3AED 100%)',
        'aurora-accent': 'linear-gradient(120deg, #7C3AED 0%, #D946EF 50%, #22D3EE 100%)',
        'mastery-glow': 'linear-gradient(135deg, #34D399 0%, #22D3EE 100%)',
        'nebula-glass': 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(34, 211, 238, 0.08) 100%)',
        'nebula-glass-dark': 'linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(76, 29, 149, 0.4) 100%)',
      },
      boxShadow: {
        'violet-glow': '0 0 24px -4px rgba(124, 58, 237, 0.28)',
        'cyan-glow': '0 0 24px -4px rgba(34, 211, 238, 0.28)',
        'aurora-ring': '0 0 0 3px rgba(34, 211, 238, 0.5), 0 0 20px 2px rgba(124, 58, 237, 0.25)',
        'card-lift': '0 12px 30px -8px rgba(30, 27, 75, 0.12), 0 0 16px -2px rgba(124, 58, 237, 0.14)',
        'card-lift-dark': '0 14px 32px -8px rgba(0, 0, 0, 0.45), 0 0 20px -2px rgba(124, 58, 237, 0.22)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'aurora-shift': 'auroraShift 8s ease infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.97)' },
        },
        auroraShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        }
      }
    },
  },
  plugins: [],
}

