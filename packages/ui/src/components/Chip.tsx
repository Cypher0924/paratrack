import type { Icon } from "phosphor-react-native";
import { Text, View } from "react-native";
import { cn } from "../lib/cn";
import { PressableScale, type PressableScaleProps } from "../lib/press";
import colors from "../theme/colors";

export type ChipProps = Omit<PressableScaleProps, "children"> & {
  label: string;
  selected?: boolean;
  /** 18 px icon before the label. */
  icon?: Icon;
};

/** Figma Controls / Chip. 36 px tall, padded to a 44 px target. */
export function Chip({ label, selected = false, icon: I, className, ...rest }: ChipProps) {
  return (
    <PressableScale role="checkbox" aria-checked={selected} aria-label={label} className={cn("py-1", className)} {...rest}>
      {() => (
        <View
          className={cn(
            "h-[36px] flex-row items-center justify-center gap-[6px] rounded-pill border px-3",
            selected ? "border-accent bg-accent-subtle" : "border-border bg-surface",
          )}
        >
          {I && <I size={18} color={selected ? colors.accent : colors["text-secondary"]} />}
          <Text className={cn("font-sans-medium text-body-sm", selected ? "text-accent" : "text-foreground")}>
            {label}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}
