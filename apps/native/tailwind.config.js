/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [require("../../packages/ui/src/theme/preset")],
  theme: {
    extend: {
      // Android picks the font file by family name, so each weight is its own family
      fontFamily: {
        sans: ["Inter_400Regular"],
        "sans-medium": ["Inter_500Medium"],
        display: ["Geist_500Medium"],
        "mono-medium": ["GeistMono_500Medium"],
      },
    },
  },
};
