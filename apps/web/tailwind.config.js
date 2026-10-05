const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  presets: [require("../../packages/ui/src/theme/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        "sans-medium": ["var(--font-inter)", "system-ui", "sans-serif"],
        "mono-medium": ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [
    // one font file per weight on native, so `font-sans-medium` carries the weight on web
    plugin(({ addUtilities }) =>
      addUtilities({
        ".font-sans-medium": { fontWeight: "500" },
        ".font-mono-medium": { fontWeight: "500" },
      }),
    ),
  ],
};
