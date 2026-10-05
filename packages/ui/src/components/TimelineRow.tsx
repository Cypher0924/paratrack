import { Text, View } from "react-native";
import { FlagCheckeredIcon } from "phosphor-react-native/src/icons/FlagCheckered";
import { cn } from "../lib/cn";
import colors from "../theme/colors";
import { vehicleKinds, type VehicleType } from "./VehicleMarker";

export type TimelineState = "passed" | "vehicle" | "upcoming" | "yours" | "destination";

export type TimelineRowProps = {
  state: TimelineState;
  stop: string;
  /** Time or note under the stop name, for example "9:43 AM". */
  meta: string;
  /** Glyph for the vehicle node. */
  vehicleType?: VehicleType;
  /** Hide on the first row. */
  lineAbove?: boolean;
  /** Hide on the last row. */
  lineBelow?: boolean;
};

/** Figma Timeline row 2017:194. Grey rail is behind the vehicle, accent is ahead. */
export function TimelineRow({ state, stop, meta, vehicleType = "ejeep", lineAbove = true, lineBelow = true }: TimelineRowProps) {
  const behind = state === "passed" || state === "vehicle";
  const Glyph = vehicleKinds[vehicleType].Icon;
  // A hidden line keeps its space so the node stays centred on the text.
  const line = (show: boolean, grey: boolean) => (
    <View className={cn("w-[2px] flex-1", !show ? "bg-transparent" : grey ? "bg-border" : "bg-accent")} />
  );
  return (
    <View className="w-full flex-row items-stretch gap-3">
      <View className="w-[24px] items-center">
        {line(lineAbove, behind)}
        {state === "passed" && <View className="h-[10px] w-[10px] rounded-pill bg-border-strong" />}
        {state === "upcoming" && <View className="h-[10px] w-[10px] rounded-pill border-2 border-accent bg-surface" />}
        {state === "yours" && <View className="h-[16px] w-[16px] rounded-pill border-4 border-accent bg-surface" />}
        {state === "vehicle" && (
          <View className="h-[24px] w-[24px] items-center justify-center rounded-pill bg-accent">
            <Glyph size={14} weight="fill" color={colors.surface} />
          </View>
        )}
        {state === "destination" && (
          <View className="h-[20px] w-[20px] items-center justify-center rounded-pill bg-foreground">
            <FlagCheckeredIcon size={12} weight="fill" color={colors.surface} />
          </View>
        )}
        {line(lineBelow, state === "passed")}
      </View>
      <View className="flex-1 py-[10px]">
        <Text
          className={cn(
            "text-body-md",
            state === "passed" ? "font-sans text-text-muted" : state === "upcoming" ? "font-sans text-foreground" : "font-sans-medium text-foreground",
          )}
        >
          {stop}
        </Text>
        <Text className="font-sans text-caption text-text-muted">{meta}</Text>
      </View>
    </View>
  );
}
