import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--rgb-ink) / <alpha-value>)",
        paper: "rgb(var(--rgb-paper) / <alpha-value>)",
        moss: "rgb(var(--rgb-success) / <alpha-value>)",
        coral: "rgb(var(--rgb-error) / <alpha-value>)",
        saffron: "rgb(var(--rgb-warning) / <alpha-value>)",
        peacock: "rgb(var(--rgb-info) / <alpha-value>)",
        violet: "rgb(var(--rgb-violet) / <alpha-value>)"
      },
      boxShadow: {
        panel: "var(--shadow-md)"
      }
    }
  },
  plugins: []
};

export default config;
