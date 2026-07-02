/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--bg-base)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          hover: 'var(--bg-hover)',
        },
        brand: {
          primary: 'var(--brand-primary)',
          glow: 'var(--brand-glow)',
          subtle: 'var(--brand-subtle)',
        },
        status: {
          overdue: 'var(--status-overdue)',
          'due-soon': 'var(--status-due-soon)',
          upcoming: 'var(--status-upcoming)',
          completed: 'var(--status-completed)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: {
          default: 'var(--border-default)',
          subtle: 'var(--border-subtle)',
        },
        sidebar: {
          bg: 'var(--sidebar-bg)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      width: {
        sidebar: 'var(--sidebar-width)',
      }
    },
  },
  plugins: [],
}
