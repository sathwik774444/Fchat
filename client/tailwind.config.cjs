/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#E6F7F4",
          100: "#CDEFEA",
          200: "#9BE0D6",
          300: "#6AD0C1",
          400: "#38C1AD",
          500: "#00A884",
          600: "#008F71",
          700: "#00765E",
          800: "#005D4A",
          900: "#004437",
        },
      },
    },
  },
  plugins: [],
};
