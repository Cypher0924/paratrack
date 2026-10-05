// Tailwind preset built from the Figma variables (file 46EIhMGyMDUB4712Nqp1au).
// Figma letter spacing is a percent of font size, converted here to px for React Native.
const font = (size, line, spacing) => [
  `${size}px`,
  { lineHeight: `${line}px`, letterSpacing: `${spacing}px` },
];

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  theme: {
    fontWeight: { normal: "400", medium: "500" },
    extend: {
      colors: require("./colors"),
      // Fixed px so web and native agree (NativeWind native rem is 14px, not 16px).
      // Keys 1-5 equal Figma space-1..5. `space-N` is the Figma name.
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        "space-1": "4px",
        "space-2": "8px",
        "space-3": "12px",
        "space-4": "16px",
        "space-5": "20px",
        "control-md": "44px",
        "control-lg": "50px",
      },
      height: { "control-md": "44px", "control-lg": "50px" },
      minHeight: { "control-md": "44px", "control-lg": "50px" },
      borderRadius: {
        xs: "6px",
        sm: "10px",
        md: "14px",
        control: "18px",
        panel: "26px",
        surface: "34px",
        pill: "999px",
      },
      fontSize: {
        "display-lg": font(36, 40, -1.08),
        "title-lg": font(28, 32, -0.7),
        "title-md": font(22, 28, -0.33),
        "title-sm": font(18, 24, -0.18),
        "body-md": font(16, 22, -0.16),
        "body-sm": font(14, 20, -0.14),
        caption: font(12, 16, 0),
        "map-label": font(11, 14, 0),
        "mono-md": font(14, 20, 0),
      },
      // Only 400 and 500 exist. `font-sans-medium` is 500 (see the app tailwind configs for the family).
      // `display` is Geist Medium: screen headings and the welcome headline only.
      fontFamily: {
        sans: ["Inter"],
        "sans-medium": ["Inter"],
        display: ["Geist"],
        "mono-medium": ["Geist Mono"],
      },
      boxShadow: {
        raised: "0 6px 18px 0 rgba(14,26,43,0.08), 0 1px 3px 0 rgba(14,26,43,0.05)",
        sheet: "0 -8px 32px 0 rgba(14,26,43,0.10), 0 -1px 4px 0 rgba(14,26,43,0.04)",
        floating: "0 20px 48px 0 rgba(14,26,43,0.10), 0 3px 10px 0 rgba(14,26,43,0.05)",
      },
    },
  },
};
