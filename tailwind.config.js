/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // E-Cat Design Colors
        'hull-white': '#F8FAFC',
        'ocean-deep': '#0C4A6E',
        'ocean-mid': '#0E7490',
        'cyan-accent': '#06B6D4',
        'sunset-orange': '#F97316',
        'sunset-gold': '#FBBF24',
        'turbine-purple': '#8B5CF6',
        'speaker-gold': '#D4A574',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
