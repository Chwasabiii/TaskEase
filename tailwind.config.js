/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:    "#5B8CFF",
        secondary:  "#7C5CFF",
        accent:     "#22D3EE",
        background: "#0F172A",
        card:       "#111827",
        success:    "#10B981",
        danger:     "#EF4444",
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body:    ["Inter", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        xl:  "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        card:  "0 4px 24px 0 rgba(0,0,0,0.4)",
        glow:  "0 0 20px rgba(91,140,255,0.3)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};