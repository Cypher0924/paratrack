import type { ReactNode } from "react";
import { View } from "react-native";
import { cn } from "../lib/cn";

/**
 * Page for list and form screens. Phones get the full width. From `md` up the content, app bar and
 * tab bar share one centered 560 px column with room at the top. `overlay` covers the whole page,
 * not just the column, for dialogs.
 */
export function Page({ children, overlay, className }: { children: ReactNode; overlay?: ReactNode; className?: string }) {
  return (
    <View className={cn("h-full w-full flex-1 bg-background", className)}>
      <View className="w-full flex-1 md:mx-auto md:max-w-[560px] md:pt-8">{children}</View>
      {overlay}
    </View>
  );
}
