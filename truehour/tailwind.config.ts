import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1d4ed8",
        accent: "#0ea5e9",
        muted: "#f3f4f6",
      },
    },
  },
  plugins: [],
};

export default config;
