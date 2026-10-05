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
      colors: {
        background: "#ffffff",
        surface: "#ffffff",
        "surface-muted": "#f1f4f8",
        foreground: "#0e1a2b",
        "text-secondary": "#46556a",
        "text-muted": "#5f6e83",
        "text-disabled": "#8494a6",
        border: "#dce3eb",
        "border-subtle": "#e8edf3",
        "border-strong": "#8494a6",
        accent: "#1565c0",
        "accent-strong": "#0d47a1",
        "accent-subtle": "#e3f2fd",
        "accent-foreground": "#ffffff",
        success: "#43a047",
        "success-text": "#2e7d32",
        "success-subtle": "#e8f5e9",
        warning: "#ffc107",
        "warning-text": "#8a5300",
        "warning-subtle": "#fff8e1",
        "on-warning": "#0e1a2b",
        danger: "#e53935",
        "danger-text": "#c62828",
        "danger-subtle": "#ffebee",
        live: "#42a5f5",
        "control-on": "#1565c0",
        "control-track": "#8494a6",
        "control-thumb": "#ffffff",
        "map-land": "#edf0f4",
        "map-road": "#ffffff",
        "map-road-casing": "#d5dce5",
        "map-park": "#d9ecda",
        "map-building": "#e0e5ec",
        "map-water": "#cae6fc",
        "map-label": "#5f6e83",
      },
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
        "title-md": font(22, 28, -0.33),
        "title-sm": font(18, 24, -0.18),
        "body-md": font(16, 22, -0.16),
        "body-sm": font(14, 20, -0.14),
        caption: font(12, 16, 0),
        "map-label": font(11, 14, 0),
      },
      // Only 400 and 500 exist. `font-sans-medium` is 500 (see the app tailwind configs for the family).
      fontFamily: {
        sans: ["Inter"],
        "sans-medium": ["Inter"],
      },
      boxShadow: {
        raised: "0 6px 18px 0 rgba(14,26,43,0.08), 0 1px 3px 0 rgba(14,26,43,0.05)",
        sheet: "0 -8px 32px 0 rgba(14,26,43,0.10), 0 -1px 4px 0 rgba(14,26,43,0.04)",
        floating: "0 20px 48px 0 rgba(14,26,43,0.10), 0 3px 10px 0 rgba(14,26,43,0.05)",
      },
    },
  },
};
