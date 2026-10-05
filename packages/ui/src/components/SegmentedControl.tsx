import { cssInterop } from "nativewind";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { cn } from "../lib/cn";
import { useMotion } from "../lib/motion";
import { PressableScale } from "../lib/press";

const AnimatedView = Animated.createAnimatedComponent(View);
cssInterop(AnimatedView, { className: "style" });

export type SegmentedControlProps<T extends string> = {
  /** 2 to 5 views of the same data. */
  options: readonly { value: T; label: string }[];
  value: T;
  onChange?: (value: T) => void;
  className?: string;
};

/** Figma Controls / Segmented control and Segment. The selected pill slides between segments. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const m = useMotion();
  const n = options.length;
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <View role="tablist" className={cn("h-control-md flex-row rounded-control bg-surface-muted px-1", className)}>
      {/* Concentric radius: 18 outside, 14 inside. */}
      <View className="absolute inset-1">
        <AnimatedView
          className="absolute bottom-0 top-0 rounded-md bg-surface shadow-raised"
          style={{
            left: `${(index * 100) / n}%`,
            width: `${100 / n}%`,
            transitionProperty: "left",
            transitionDuration: m.panel.duration,
            transitionTimingFunction: "ease-out",
          }}
        />
      </View>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <PressableScale
            key={o.value}
            role="tab"
            aria-selected={selected}
            onPress={() => onChange?.(o.value)}
            className="flex-1 items-center justify-center px-1"
          >
            {() => (
              <Text
                numberOfLines={1}
                className={cn(
                  "font-sans-medium text-body-sm",
                  selected ? "text-foreground" : "text-text-secondary",
                )}
              >
                {o.label}
              </Text>
            )}
          </PressableScale>
        );
      })}
    </View>
  );
}
