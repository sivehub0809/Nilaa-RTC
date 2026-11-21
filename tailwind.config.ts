import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0D12",
        card: {
          DEFAULT: "#141821",
          foreground: "#F2F4F8",
        },
        surface: {
          DEFAULT: "#1B2130",
          hover: "#22293C",
          border: "#232938",
        },
        border: "#232938",
        input: "#1B2130",
        ring: "#10FFE7",
        foreground: "#F2F4F8",
        muted: {
          DEFAULT: "#1B2130",
          foreground: "#9BA3B5",
        },
        accent: {
          DEFAULT: "#10FFE7",
          foreground: "#0B0D12",
          hover: "#00E5CD",
          glow: "rgba(16, 255, 231, 0.35)",
        },
        destructive: {
          DEFAULT: "#E5484D",
          foreground: "#F2F4F8",
          hover: "#D13A40",
        },
      },
      borderRadius: {
        btn: "12px",
        tile: "16px",
        card: "20px",
        preview: "24px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        heading: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        "speaker-glow": "0 0 0 2px #10FFE7, 0 0 24px rgba(16, 255, 231, 0.4)",
        "cyan-glow": "0 0 20px rgba(16, 255, 231, 0.25)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
