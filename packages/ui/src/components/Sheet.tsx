import { useEffect, useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { cssInterop } from "nativewind";
import { cn } from "../lib/cn";
import { useMotion } from "../lib/motion";

const AnimatedView = cssInterop(Animated.createAnimatedComponent(View), { className: "style" });

/** Figma Sheet/Handle 2014:204. */
export function SheetHandle() {
  return (
    <View className="h-[20px] w-full items-center justify-center pt-[8px]">
      <View className="h-[5px] w-[40px] rounded-pill bg-border" />
    </View>
  );
}

export type SheetProps = {
  /** Collapsed and expanded heights in px. */
  heights: [number, number];
  /** Controlled state. Leave unset to let the handle toggle it. */
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
  children?: ReactNode;
};

/** Bottom sheet with two snap heights. Tapping the handle toggles between them. */
export function Sheet({ heights, expanded, defaultExpanded = false, onExpandedChange, className, children }: SheetProps) {
  const [own, setOwn] = useState(defaultExpanded);
  const open = expanded ?? own;
  const motion = useMotion();
  const height = useSharedValue(heights[open ? 1 : 0]);

  useEffect(() => {
    height.value = withTiming(heights[open ? 1 : 0], motion.panel);
  }, [open, heights[0], heights[1], motion.reduced]);

  // Web has no Reanimated Babel plugin, so the dependency array is required.
  const style = useAnimatedStyle(() => ({ height: height.value }), [height]);

  const toggle = () => {
    setOwn(!open);
    onExpandedChange?.(!open);
  };

  return (
    <AnimatedView
      style={style}
      className={cn("w-full overflow-hidden rounded-t-surface bg-surface shadow-sheet", className)}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={open ? "Collapse sheet" : "Expand sheet"}
        aria-expanded={open}
        // 44 px target on web and native. The extra 24 px overlaps the content, so the bar and content stay put.
        className="z-10 h-control-md w-full -mb-[24px]"
        onPress={toggle}
      >
        <SheetHandle />
      </Pressable>
      {children}
    </AnimatedView>
  );
}
