import { Pressable, Text, View } from "react-native";
import { BusIcon } from "phosphor-react-native/src/icons/Bus";
import { JeepIcon } from "phosphor-react-native/src/icons/Jeep";
import { TruckIcon } from "phosphor-react-native/src/icons/Truck";
import { VanIcon } from "phosphor-react-native/src/icons/Van";
import type { Database, SeatStatus } from "@repo/core";
import { cn } from "../lib/cn";
import colors from "../theme/colors";

export type VehicleType = Database["public"]["Enums"]["vehicle_type"];

/** Glyph and label per vehicle type. Figma has no Jeep, so it uses Phosphor truck. */
export const vehicleKinds = {
  shuttle: { label: "Shuttle", Icon: VanIcon },
  ejeep: { label: "E-jeep", Icon: JeepIcon },
  bus: { label: "Bus", Icon: BusIcon },
  jeep: { label: "Jeep", Icon: TruckIcon },
} as const;

const ring = { available: "border-success", filling: "border-warning", full: "border-danger" } as const;
const tag = {
  available: ["bg-success-subtle", "text-success-text"],
  filling: ["bg-warning", "text-on-warning"],
  full: ["bg-danger-subtle", "text-danger-text"],
} as const;

export type VehicleMarkerProps = {
  type: VehicleType;
  status: SeatStatus;
  seatsLeft: number;
  selected?: boolean;
  /** Spoken name, for example "E-jeep 18". */
  label?: string;
  onPress?: () => void;
};

/** Figma Map/Vehicle marker 2022:133. 44 pt hit area, 36 visible. Selected hides the seats tag. */
export function VehicleMarker({ type, status, seatsLeft, selected, label, onPress }: VehicleMarkerProps) {
  const { label: kind, Icon } = vehicleKinds[type];
  const seats = status === "full" ? "Full" : String(seatsLeft);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label ?? kind}, ${status === "full" ? "full" : `${seatsLeft} seats left`}${selected ? ", selected" : ""}`}
      onPress={onPress}
      className="h-control-md w-control-md items-center justify-center"
    >
      {selected ? (
        <View className="h-control-md w-control-md items-center justify-center rounded-pill border-[3px] border-surface bg-accent shadow-floating">
          <Icon size={22} weight="fill" color={colors.surface} />
        </View>
      ) : (
        <>
          {status === "filling" && <View className="absolute h-[40px] w-[40px] rounded-pill bg-warning-text" />}
          <View className={cn("h-[36px] w-[36px] items-center justify-center rounded-pill border-[3px] bg-surface shadow-raised", ring[status])}>
            <Icon size={18} weight="fill" color={colors.foreground} />
          </View>
          <View
            className={cn(
              "absolute left-[26px] top-[-4px] h-[16px] items-center justify-center overflow-hidden rounded-pill border-[1.5px] border-surface px-[4px]",
              tag[status][0],
            )}
          >
            <Text className={cn("font-sans-medium text-caption", tag[status][1])}>{seats}</Text>
          </View>
        </>
      )}
    </Pressable>
  );
}
