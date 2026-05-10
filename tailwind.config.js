/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          900: 'var(--app-bg)',
          800: 'var(--app-surface)',
          700: 'var(--app-surface-hover)',
          600: 'var(--app-border)',
          500: 'var(--app-text-muted)',
        },
        text: {
          main: 'var(--app-text)',
          muted: 'var(--app-text-muted)',
        },
        border: {
          main: 'var(--app-border)',
        },
        accent: {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
      },
    },
  },
  plugins: [],
}
