import { seatStatus } from "@repo/core";
import { cssInterop } from "nativewind";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { cn } from "../lib/cn";
import { useMotion } from "../lib/motion";

const AnimatedView = Animated.createAnimatedComponent(View);
cssInterop(AnimatedView, { className: "style" });

const fills = { available: "bg-success", filling: "bg-warning", full: "bg-danger" };

export type CapacityBarProps = {
  capacity: number;
  seatsTaken: number;
  markedFull?: boolean;
  className?: string;
};

/**
 * Figma Feedback / Capacity bar. Color follows `seatStatus` from @repo/core, the rule markers use.
 * The fill width animates. Always show the seat count as text next to it.
 */
export function CapacityBar({ capacity, seatsTaken, markedFull = false, className }: CapacityBarProps) {
  const m = useMotion();
  const { status } = seatStatus({ capacity, seatsTaken, markedFull });
  const share = status === "full" ? 1 : Math.min(1, Math.max(0, seatsTaken / Math.max(1, capacity)));
  return (
    <View
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={capacity}
      aria-valuenow={Math.min(seatsTaken, capacity)}
      aria-valuetext={`${seatsTaken} of ${capacity} seats taken`}
      className={cn("h-[8px] overflow-hidden rounded-pill bg-surface-muted", className)}
    >
      <AnimatedView
        className={cn("h-full rounded-pill", fills[status])}
        style={{
          width: `${share * 100}%`,
          transitionProperty: ["width", "backgroundColor"],
          transitionDuration: m.panel.duration,
          transitionTimingFunction: "ease-out",
        }}
      />
    </View>
  );
}
