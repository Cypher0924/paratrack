import { cssInterop } from "nativewind";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { cn } from "../lib/cn";
import { useMotion } from "../lib/motion";
import { PressableScale, type PressableScaleProps } from "../lib/press";

const AnimatedView = Animated.createAnimatedComponent(View);
cssInterop(AnimatedView, { className: "style" });

export type SwitchProps = Omit<PressableScaleProps, "children" | "onPress"> & {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  label: string;
};

/** Figma Controls / Switch. 52 x 32 track inside a 44 px tall target. The thumb slides. */
export function Switch({ value, onValueChange, label, className, ...rest }: SwitchProps) {
  const m = useMotion();
  const transition = {
    transitionDuration: m.panel.duration,
    transitionTimingFunction: "ease-out",
  } as const;
  return (
    <PressableScale
      role="switch"
      aria-checked={value}
      aria-label={label}
      onPress={() => onValueChange?.(!value)}
      className={cn("h-control-md justify-center", className)}
      {...rest}
    >
      {() => (
        <AnimatedView
          className={cn("h-[32px] w-[52px] rounded-pill", value ? "bg-control-on" : "bg-control-track")}
          style={{ transitionProperty: "backgroundColor", ...transition }}
        >
          <AnimatedView
            className="absolute top-[2px] h-[28px] w-[28px] rounded-pill bg-control-thumb shadow-raised"
            style={{ left: value ? 22 : 2, transitionProperty: "left", ...transition }}
          />
        </AnimatedView>
      )}
    </PressableScale>
  );
}
