module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  theme: {
    extend: {
      colors: {
        buttonBlue: {
          light: '#4d6cbb',
          DEFAULT: '#3352a1',
          dark: '#2d488e',
        }
      },
      fontFamily: {
        'courier': ['Courier New', 'monospace'],
        'red-hat': ['Red Hat Display', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
