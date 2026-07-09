/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1A4F8A', mid: '#1D6FD8', light: '#EBF3FF', text: '#1558C0' },
        ai: { DEFAULT: '#7C3AED', light: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9' },
      },
      fontFamily: {
        clinical: ["'Source Serif 4'", 'Georgia', 'serif'],
        ui: ["'Inter'", 'system-ui', 'sans-serif'],
        code: ["'JetBrains Mono'", 'monospace'],
      },
    },
  },
  plugins: [],
};
