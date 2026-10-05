import { Text, View } from "react-native";

export type MapCalloutProps = {
  /** Vehicle name, for example "E-jeep 18". */
  name: string;
  /** ETA text, for example "7 min". */
  eta: string;
};

/** Figma Map/Callout 2022:143, shown above the selected vehicle marker. */
export function MapCallout({ name, eta }: MapCalloutProps) {
  return (
    <View className="flex-row items-center gap-[6px] rounded-pill bg-surface px-[10px] py-[6px] shadow-raised">
      <Text className="font-sans-medium text-caption text-foreground">{name}</Text>
      <Text className="font-sans-medium text-caption text-accent">{eta}</Text>
    </View>
  );
}
