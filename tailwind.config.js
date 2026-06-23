/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nz: {
          bg: '#0f0a06',
          surface: '#1e1610',
          elevated: '#2e2116',
          border: '#4e3a26',
          text: '#f5ecd9',
          // Improved contrast: #c4a880 provides 4.5:1 ratio against bg for WCAG AA
          muted: '#c4a880',
          subtle: '#8a7660',
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
