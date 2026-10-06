import { useWindowDimensions } from "react-native";

/** Tailwind `md` (768). Phones stay below it, so only web tablets and desktops are wide. */
export const WIDE = 768;

export const useIsWide = () => useWindowDimensions().width >= WIDE;
