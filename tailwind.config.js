/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./**/*.{html,js,liquid,json}"],
    theme: {
      fontFamily: {
        'sans': ['Archivo'],
        'serif': ['STIXTwoText'],
        'body': ['"Archivo"'],
      },
      extend: {
        aspectRatio: {
          '4x3': '4 / 3',
          '3x4': '3 / 4',
        },
      },
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