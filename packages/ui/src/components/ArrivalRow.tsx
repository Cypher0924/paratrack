import { Pressable, Text, View } from "react-native";
import { cn } from "../lib/cn";
import colors from "../theme/colors";
import { Badge, type BadgeProps } from "./Badge";
import { vehicleKinds, type VehicleType } from "./VehicleMarker";

export type ArrivalRowProps = {
  vehicleType: VehicleType;
  route: string;
  meta: string;
  /** Seats status badge. Omit to hide. */
  badge?: Pick<BadgeProps, "tone" | "label">;
  eta: string;
  time: string;
  onPress?: () => void;
  className?: string;
};

/** Figma Arrival row 2017:79: one vehicle or route. ETA leads on the right. */
export function ArrivalRow({ vehicleType, route, meta, badge, eta, time, onPress, className }: ArrivalRowProps) {
  const { Icon, label } = vehicleKinds[vehicleType];
  return (
    <Pressable
      role={onPress ? "button" : undefined}
      onPress={onPress}
      disabled={!onPress}
      className={cn("w-full flex-row items-start gap-3 border-b border-border-subtle py-4", className)}
    >
      <Icon size={24} color={colors.foreground} aria-label={label} />
      <View className="flex-1 gap-[2px]">
        <Text className="font-sans-medium text-body-md text-foreground">{route}</Text>
        <Text className="font-sans text-body-sm text-text-muted">{meta}</Text>
        {badge && (
          <View className="pt-[6px]">
            <Badge {...badge} />
          </View>
        )}
      </View>
      <View className="items-end">
        <Text className="font-sans-medium text-title-sm text-foreground">{eta}</Text>
        <Text className="font-sans text-caption text-text-muted">{time}</Text>
      </View>
    </Pressable>
  );
}
