import type { MetadataRoute } from "next";

// Figma tokens: accent #1565c0, background #ffffff (packages/ui/src/theme/colors.js).
// scope "/" must contain the service worker scope, or Chrome labels notifications as Chrome's.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ParaTrack",
    short_name: "ParaTrack",
    description: "Live PUV tracking for Tarlac City",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#1565c0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
