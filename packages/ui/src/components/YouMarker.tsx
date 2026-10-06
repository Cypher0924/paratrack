import { View } from "react-native";

/** Figma Map/You 2022:140. Live position, so it uses the live color. */
export function YouMarker() {
  return (
    <View accessibilityLabel="Your location" className="h-[48px] w-[48px] items-center justify-center">
      <View className="absolute inset-0 rounded-pill bg-live opacity-20" />
      <View className="h-[24px] w-[24px] rounded-pill border-[3px] border-surface bg-live shadow-raised" />
    </View>
  );
}
