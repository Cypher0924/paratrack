import { View } from "react-native";
import { Logo } from "../../components/Brand";
import { useIsWide } from "../../lib/responsive";

/** Figma 00 Splash (phone) and D00 Splash (desktop): the logo centered on white, covering its parent. */
export default function Splash() {
  const wide = useIsWide();
  return (
    <View accessibilityRole="progressbar" aria-label="Loading ParaTrack" className="absolute inset-0 items-center justify-center bg-surface" style={{ zIndex: 50 }}>
      <Logo height={wide ? 62 : 46} />
    </View>
  );
}
