"use client";
import type { ReactNode } from "react";
import { LayoutAnimationConfig } from "react-native-reanimated";

// Reanimated gives each animated view an `id` from a module counter, which differs between server
// and client and breaks hydration. Skipping entering animations on the first render leaves the id off.
export function Providers({ children }: { children: ReactNode }) {
  return <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>;
}
