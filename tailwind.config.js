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
          light: '#6b8fd0',
          DEFAULT: '#4472c4',
          dark: '#2c4d7d',
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
