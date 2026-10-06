import { Text, View } from "react-native";
import { PLACEHOLDER } from "./Map.types";

/** Shown instead of the map when the Google Maps key is missing, so screens still work. */
export function MapPlaceholder() {
  return (
    <View className="absolute inset-0 items-center justify-center bg-surface-muted">
      <Text className="font-sans text-body-sm text-text-muted">{PLACEHOLDER}</Text>
    </View>
  );
}
