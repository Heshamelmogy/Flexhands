import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10212b",
        trust: "#123c55",
        lagoon: "#14746f",
        mint: "#e9f6f1",
        amber: "#f2b66d",
        clay: "#c96b4c",
        paper: "#f7f8f6"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(16, 33, 43, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
