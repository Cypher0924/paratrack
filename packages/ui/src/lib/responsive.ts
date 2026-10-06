import { useEffect, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";

/** Tailwind `md` (768). Phones stay below it, so only web tablets and desktops are wide. */
export const WIDE = 768;

/**
 * The server render has no window, so on web the first client render must match it (narrow) or React
 * throws a hydration error (#418). The wide layout switches in right after mount.
 */
export const useIsWide = () => {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(Platform.OS !== "web");
  useEffect(() => setMounted(true), []);
  return mounted && width >= WIDE;
};
