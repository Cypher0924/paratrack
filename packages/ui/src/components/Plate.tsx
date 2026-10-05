import { Text, View } from "react-native";
import { cn } from "../lib/cn";

export type PlateProps = { plate: string; className?: string };

/** Figma Feedback / Plate. Geist Mono so commuters can match it to the vehicle. */
export function Plate({ plate, className }: PlateProps) {
  return (
    <View
      aria-label={`Plate ${plate}`}
      className={cn(
        "h-[24px] items-center justify-center self-start rounded-xs border border-border-strong bg-surface px-2",
        className,
      )}
    >
      <Text className="font-mono-medium text-mono-md text-foreground">{plate}</Text>
    </View>
  );
}
