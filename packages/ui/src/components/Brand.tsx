import { Image, Text, View } from "react-native";
import { brandMark } from "../lib/brand-mark";

/** The ParaTrack mark (pin, PUV and road) from the brand logo. */
export function AppIcon({ size = 64 }: { size?: number }) {
  return (
    <Image
      source={brandMark}
      accessibilityLabel="ParaTrack"
      style={{ width: size, height: (size * 421) / 475 }}
      resizeMode="contain"
    />
  );
}

/** Mark plus the two-color wordmark, sized by height. */
export function Logo({ height = 36 }: { height?: number }) {
  return (
    <View className="flex-row items-center" style={{ gap: height * 0.25 }} accessibilityLabel="ParaTrack" role="img">
      <AppIcon size={height * 1.15} />
      <Text className="font-display" style={{ fontSize: height * 0.78, lineHeight: height }}>
        <Text className="text-brand-navy">Para</Text>
        <Text className="text-brand-green">Track</Text>
      </Text>
    </View>
  );
}
