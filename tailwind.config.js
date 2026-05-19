/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nz: {
          bg: '#16110c',
          surface: '#1f1810',
          elevated: '#2a2014',
          border: '#3a2c1b',
          text: '#f5ecd9',
          muted: '#a08a72',
          subtle: '#6e5d4a',
          accent: '#ff7a3d',
          'accent-soft': 'rgba(255,122,61,0.16)',
          'accent-text': '#ffb88a',
          apricot: '#f4c477',
          food: '#d9a85c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
