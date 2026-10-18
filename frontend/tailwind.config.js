/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // CarePulse brand palette — green / black / white only, per spec.
        pulse: {
          black: "#05070a",
          charcoal: "#0b0f14",
          slate: "#121821",
          line: "#1e2a2f",
          green: {
            50: "#e9fcf1",
            100: "#c8f7db",
            200: "#93eeb8",
            300: "#5fe091",
            400: "#2fce70",
            500: "#12b358",
            600: "#0c9448",
            700: "#0a763c",
            800: "#0b5c32",
            900: "#0a4a2a",
            glow: "#39ff9e",
          },
          white: "#f4faf7",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Inter", "ui-sans-serif", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(57, 255, 158, 0.35)",
        "glow-lg": "0 0 80px -12px rgba(57, 255, 158, 0.45)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.55)",
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 20% 20%, rgba(57,255,158,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(18,179,88,0.10), transparent 35%)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};
