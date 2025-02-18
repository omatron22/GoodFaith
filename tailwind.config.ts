import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // Enable dark mode using the `dark` class
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#ffffff", // Light mode background
          dark: "#0a0a0a",    // Dark mode background
        },
        foreground: {
          DEFAULT: "#171717", // Light mode text color
          dark: "#ededed",    // Dark mode text color
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
