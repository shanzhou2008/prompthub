/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        lg: "2rem",
      },
    },
    extend: {
      colors: {
        // 暗色基底
        ink: {
          950: "#06060A",
          900: "#0A0A0F",
          850: "#0F0F16",
          800: "#13131A",
          750: "#17171F",
          700: "#1C1C26",
          600: "#262633",
          500: "#34344A",
        },
        // 文字
        mist: {
          50: "#F5F5FB",
          100: "#E8E8F0",
          300: "#B4B4C8",
          400: "#8B8BA0",
          500: "#6A6A82",
          600: "#4A4A5C",
        },
        // 霓虹强调
        neon: {
          purple: "#7C5CFF",
          violet: "#9D7BFF",
          cyan: "#00E5FF",
          blue: "#3B82F6",
          rose: "#FF3D71",
          amber: "#FFB547",
          lime: "#7DFFA8",
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Noto Sans SC"', "sans-serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px -2px rgba(124, 92, 255, 0.45)",
        "glow-cyan": "0 0 24px -2px rgba(0, 229, 255, 0.4)",
        "glow-rose": "0 0 24px -2px rgba(255, 61, 113, 0.4)",
        card: "0 8px 32px -8px rgba(0, 0, 0, 0.6)",
        "card-hover": "0 16px 48px -12px rgba(124, 92, 255, 0.35)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(124,92,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(124,92,255,0.06) 1px, transparent 1px)",
        "neon-gradient":
          "linear-gradient(135deg, #7C5CFF 0%, #00E5FF 100%)",
        "neon-gradient-soft":
          "linear-gradient(135deg, rgba(124,92,255,0.15) 0%, rgba(0,229,255,0.10) 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        scan: "scan 8s linear infinite",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};
