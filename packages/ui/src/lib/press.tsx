import { cssInterop } from "nativewind";
import { useState, type ReactNode } from "react";
import { Pressable, type PressableProps } from "react-native";
import Animated from "react-native-reanimated";
import { useMotion } from "./motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
cssInterop(AnimatedPressable, { className: "style" });

export type PressableScaleProps = Omit<PressableProps, "children" | "style"> & {
  className?: string;
  /** Forces the pressed look, for the gallery and screenshots. */
  pressed?: boolean;
  children: (pressed: boolean) => ReactNode;
};

/** Pressable that scales with the `press` preset and tells its children when it is pressed. */
export function PressableScale({
  pressed,
  disabled,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const [down, setDown] = useState(false);
  const m = useMotion();
  return (
    <AnimatedPressable
      disabled={disabled}
      aria-disabled={disabled ?? undefined}
      onPressIn={(e) => {
        setDown(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setDown(false);
        onPressOut?.(e);
      }}
      style={{
        transform: [{ scale: down && !m.reduced ? m.press.scale : 1 }],
        transitionProperty: "transform",
        transitionDuration: m.press.duration,
      }}
      {...rest}
    >
      {children(!disabled && (pressed || down))}
    </AnimatedPressable>
  );
}
