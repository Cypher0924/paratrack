import { Easing, useReducedMotion } from "react-native-reanimated";

export const press = { scale: 0.97, duration: 120 } as const;
export const panel = { duration: 280, easing: Easing.out(Easing.cubic) } as const;
export const enter = { duration: 220, translateY: 8 } as const;

/** Presets with zero durations when the user asked for reduced motion. */
export function useMotion() {
  const reduced = useReducedMotion();
  return {
    reduced,
    press: reduced ? { ...press, duration: 0 } : press,
    panel: reduced ? { ...panel, duration: 0 } : panel,
    enter: reduced ? { ...enter, duration: 0 } : enter,
  };
}
