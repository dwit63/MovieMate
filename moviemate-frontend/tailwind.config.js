/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0D0D0D',
          card: '#1A1A1A',
          secondary: '#141414',
          border: '#252525',
          hover: '#2A2A2A',
        },
        accent: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
        },
        star: '#F59E0B',
      },
    },
  },
  plugins: [],
}

