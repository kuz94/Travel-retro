/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        retro: ['"VT323"', 'monospace'],
        body: ['"Courier New"', 'Courier', 'monospace'],
      },
      colors: {
        retro: {
          bg: '#c0c0c0',
          dark: '#808080',
          light: '#ffffff',
          blue: '#000080',
          teal: '#008080',
          pink: '#ff69b4',
          yellow: '#ffff00',
          green: '#008000',
          purple: '#800080',
          accent: '#00008b',
          card: '#d4d0c8',
          border: '#808080',
        },
      },
    },
  },
  plugins: [],
}
