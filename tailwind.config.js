/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // Detecta si el dispositivo tiene CUALQUIER tipo de ratón/trackpad disponible
        'can-hover': { 'raw': '(any-hover: hover)' },
        // Detecta si el dispositivo es ESTRICTAMENTE táctil (sin ratón)
        'no-hover': { 'raw': '(any-hover: none)' },
      }
    },
  },
  plugins: [],
}