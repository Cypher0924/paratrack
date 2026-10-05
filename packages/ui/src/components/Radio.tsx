import { View } from "react-native";
import { cn } from "../lib/cn";
import { PressableScale, type PressableScaleProps } from "../lib/press";

export type RadioProps = Omit<PressableScaleProps, "children"> & {
  selected: boolean;
  label: string;
};

/** Figma Controls / Radio. 22 px circle inside a 44 px target. */
export function Radio({ selected, label, className, ...rest }: RadioProps) {
  return (
    <PressableScale
      role="radio"
      aria-checked={selected}
      aria-label={label}
      className={cn("h-control-md w-control-md items-center justify-center", className)}
      {...rest}
    >
      {() => (
        <View
          className={cn(
            "h-[22px] w-[22px] items-center justify-center rounded-pill bg-surface",
            selected ? "border-2 border-accent" : "border-[1.5px] border-border-strong",
          )}
        >
          {selected && <View className="h-[10px] w-[10px] rounded-pill bg-accent" />}
        </View>
      )}
    </PressableScale>
  );
}
