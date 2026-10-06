import type { Icon } from "phosphor-react-native";
import { View } from "react-native";
import { cn } from "../lib/cn";
import { PressableScale, type PressableScaleProps } from "../lib/press";
import colors from "../theme/colors";

const styles = {
  plain: { box: "", icon: colors.foreground },
  // Floats over the map.
  surface: { box: "rounded-pill border border-border-subtle bg-surface shadow-raised", icon: colors.foreground },
  tonal: { box: "rounded-pill bg-accent-subtle", icon: colors.accent },
};

export type IconButtonProps = Omit<PressableScaleProps, "children"> & {
  icon: Icon;
  /** Specific accessible name, for example "Back to routes". */
  label: string;
  variant?: keyof typeof styles;
};

/** Figma Controls / Icon button. 44 px tap target. */
export function IconButton({
  icon: I,
  label,
  variant = "plain",
  disabled,
  className,
  ...rest
}: IconButtonProps) {
  const s = styles[variant];
  return (
    <PressableScale role="button" aria-label={label} disabled={disabled} className={className} {...rest}>
      {() => (
        <View className={cn("h-control-md w-control-md items-center justify-center", s.box)}>
          <I size={24} color={disabled ? colors["text-disabled"] : s.icon} />
        </View>
      )}
    </PressableScale>
  );
}
