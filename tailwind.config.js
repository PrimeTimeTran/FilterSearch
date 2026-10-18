/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./privacy.html", "./vision.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        raised: "rgb(var(--raised) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
        mint: "rgb(var(--mint) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
      },

      boxShadow: {
        glow: "var(--shadow-glow)",
        card: "var(--shadow-card)",
      },

      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      maxWidth: {
        page: "var(--page-width)",
        content: "var(--content-width)",
      },

      borderRadius: {
        card: "var(--radius-card)",
        control: "var(--radius-control)",
      },
    },
  },

  plugins: [],
};
