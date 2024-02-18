/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./**/*.{html,js,liquid,json}"],
    theme: {
      fontFamily: {
        'sans': ['Archivo'],
        'serif': ['STIXTwoText'],
        'body': ['"Archivo"'],
      },
      extend: {},
      container: {
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '2rem',
          xl: '2rem',
          '2xl': '2rem',
        },
      },
    },
    plugins: [],
  }