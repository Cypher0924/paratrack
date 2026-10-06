import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom names from theme/preset.js. Without them tailwind-merge reads `text-title-md` as a color and drops it.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["title-md", "title-sm", "body-md", "body-sm", "caption", "map-label", "mono-md", "display-xl"],
      radius: ["xs", "sm", "md", "control", "panel", "surface", "pill"],
      shadow: ["raised", "sheet", "floating"],
      spacing: ["space-1", "space-2", "space-3", "space-4", "space-5", "control-md", "control-lg"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
