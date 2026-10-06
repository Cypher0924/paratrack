import { Pressable, View } from "react-native";
import { FlagCheckeredIcon } from "phosphor-react-native/src/icons/FlagCheckered";
import colors from "../theme/colors";

export type StopMarkerProps = {
  kind?: "stop" | "yours" | "destination";
  /** Stop name, read by screen readers. */
  name: string;
  onPress?: () => void;
};

const spoken = { stop: "Stop", yours: "Your stop", destination: "Destination" } as const;

/** Figma Map/Stop 2022:139. 44 pt hit area around the visible dot. */
export function StopMarker({ kind = "stop", name, onPress }: StopMarkerProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${spoken[kind]}, ${name}`}
      onPress={onPress}
      className="h-control-md w-control-md items-center justify-center"
    >
      {kind === "stop" && <View className="h-[14px] w-[14px] rounded-pill border-[3px] border-foreground bg-surface" />}
      {kind === "yours" && (
        <View className="h-[24px] w-[24px] rounded-pill border-[6px] border-accent bg-surface shadow-raised" />
      )}
      {kind === "destination" && (
        <View className="h-[28px] w-[28px] items-center justify-center rounded-pill border-2 border-surface bg-foreground shadow-raised">
          <FlagCheckeredIcon size={14} weight="fill" color={colors.surface} />
        </View>
      )}
    </Pressable>
  );
}
