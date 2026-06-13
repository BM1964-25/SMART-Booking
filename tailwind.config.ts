import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF3FF",
          100: "#DFE8FF",
          500: "#527DF6",
          600: "#3864DF",
          700: "#254CB7",
          900: "#142551"
        }
      },
      boxShadow: {
        subtle: "0 16px 40px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
