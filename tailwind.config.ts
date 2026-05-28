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
        ink: "oklch(19% 0.018 260 / <alpha-value>)",
        paper: "oklch(97% 0.006 260 / <alpha-value>)",
        moss: "oklch(56% 0.145 252 / <alpha-value>)",
        coral: "oklch(61% 0.135 38 / <alpha-value>)",
        saffron: "oklch(74% 0.13 82 / <alpha-value>)",
        peacock: "oklch(48% 0.09 220 / <alpha-value>)"
      },
      boxShadow: {
        panel: "0 0 0 rgba(0, 0, 0, 0)"
      }
    }
  },
  plugins: []
};

export default config;
