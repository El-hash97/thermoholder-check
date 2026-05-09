/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        status: {
          normal: '#22c55e',
          oos: '#ef4444',
          error: '#f97316',
          none: '#6b7280',
        },
      },
    },
  },
  plugins: [],
}
