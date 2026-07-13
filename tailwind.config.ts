import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17201A",
        paper: "#F7F5EF",
        mint: "#4AAE8A",
        navy: "#263B63",
        amber: "#D99A2B"
      }
    }
  },
  plugins: []
};

export default config;
