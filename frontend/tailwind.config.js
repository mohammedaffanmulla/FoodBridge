/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Named per the design brief: "banyan" (deep community green),
        // "mango" (accent, ripe & warm), "husk" (background, unhulled rice),
        // "clay" (used sparingly for urgency/alerts), "ink" (near-black text).
        banyan: { DEFAULT: "#234D35", dark: "#152E20", light: "#3C6B4D" },
        mango: { DEFAULT: "#E3A72E", dark: "#C68A1B", light: "#F2C368" },
        husk: { DEFAULT: "#F6F3EA", dark: "#141A16" },
        clay: { DEFAULT: "#B5432B", light: "#D97A5F" },
        ink: { DEFAULT: "#1B2A22", light: "#4B5D53" },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Work Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
