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
        background: "#FFFFFF",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        surface: {
          DEFAULT: "#F8FAFC",
          hover: "#F1F5F9",
          border: "#E2E8F0",
        },
        border: "#E2E8F0",
        input: "#F8FAFC",
        ring: "#3B82F6",
        foreground: "#0F172A",
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        accent: {
          DEFAULT: "#3B82F6",
          foreground: "#FFFFFF",
          hover: "#2563EB",
          glow: "rgba(59, 130, 246, 0.35)",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
          hover: "#DC2626",
        },
      },
      borderRadius: {
        btn: "14px",
        tile: "20px",
        card: "24px",
        preview: "24px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        heading: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        "speaker-glow": "0 0 0 2px #3B82F6, 0 0 24px rgba(59, 130, 246, 0.35)",
        "cyan-glow": "0 0 20px rgba(59, 130, 246, 0.25)",
        "soft-card": "0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
