import type { ReactNode } from "react";
import { useWindowDimensions, View } from "react-native";
import { Logo } from "../../components/Brand";
import { MapBackdrop } from "../../components/MapBackdrop";
import { useIsWide } from "../../lib/responsive";

/**
 * Wraps an onboarding screen. On phones it is the plain page. From `md` up it is Figma D01: a white
 * panel on the left (600 px at 1440, half the width on smaller screens) with the logo above the
 * screen, and a live map filling the rest.
 */
export function OnboardingFrame({ children }: { children: ReactNode }) {
  const wide = useIsWide();
  const { width } = useWindowDimensions();
  if (!wide) return <View className="h-full w-full flex-1 bg-background">{children}</View>;
  const panel = Math.min(600, Math.round(width / 2));
  return (
    <View className="h-full w-full flex-1 flex-row bg-surface-muted">
      <MapBackdrop leftInset={panel} />
      <View className="h-full justify-center gap-6 bg-surface" style={{ width: panel, paddingHorizontal: panel >= 560 ? 96 : 40 }}>
        <Logo height={44} />
        <View className="w-full">{children}</View>
      </View>
    </View>
  );
}
