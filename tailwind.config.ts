import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // Permukaan terang hangat dengan satu aksen hitam.
        base: "#f5f5f3",
        surface: "#ffffff",
        elevated: "#fafaf8",
        line: "#e3e3df",
        fg: "#111111",
        muted: "#5d5d58",
        faint: "#8b8b85",
        accent: {
          DEFAULT: "#111111",
          fg: "#111111",
          400: "#3a3a38",
          500: "#111111",
          600: "#000000",
        },
        brand: { 50: "#f5f5f3", 500: "#111111", 600: "#111111", 700: "#000000" },
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,17,17,0.04), 0 12px 32px -20px rgba(17,17,17,0.18)",
        glow: "0 10px 28px -14px rgba(17,17,17,0.55)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 400ms cubic-bezier(0,0,0.2,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
