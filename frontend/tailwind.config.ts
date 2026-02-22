import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#05090f",
          900: "#091220",
          850: "#0d1624",
          800: "#121d2e",
          700: "#1d2a42"
        },
        accent: {
          500: "#22ff95",
          400: "#39ff9f",
          300: "#6dffbc"
        }
      },
      boxShadow: {
        glass: "0 12px 40px rgba(0,0,0,0.35)",
        neon: "0 0 0 1px rgba(34,255,149,0.25), 0 0 24px rgba(34,255,149,0.18)"
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Sora'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)"
      },
      keyframes: {
        pulseLive: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.85)" }
        }
      },
      animation: {
        pulseLive: "pulseLive 1.1s ease-in-out infinite"
      }
    }
  },
  plugins: []
} satisfies Config;
