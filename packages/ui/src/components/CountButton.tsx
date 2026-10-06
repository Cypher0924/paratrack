import { MinusIcon } from "phosphor-react-native/src/icons/Minus";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { View } from "react-native";
import { cn } from "../lib/cn";
import { PressableScale, type PressableScaleProps } from "../lib/press";
import colors from "../theme/colors";

const kinds = {
  minus: {
    I: MinusIcon,
    label: "Remove passenger",
    idle: "border border-border-strong bg-surface",
    pressed: "border border-border-strong bg-surface-muted",
    icon: colors.foreground,
  },
  plus: {
    I: PlusIcon,
    label: "Add passenger",
    idle: "bg-accent",
    pressed: "bg-accent-strong",
    icon: colors["accent-foreground"],
  },
};

export type CountButtonProps = Omit<PressableScaleProps, "children"> & {
  kind: keyof typeof kinds;
  /** Defaults to "Add passenger" / "Remove passenger". */
  label?: string;
};

/** Figma Feedback / Count button. 72 px so drivers can hit it at a stop without looking long. */
export function CountButton({ kind, label, disabled = false, className, ...rest }: CountButtonProps) {
  const k = kinds[kind];
  return (
    <PressableScale
      role="button"
      aria-label={label ?? k.label}
      disabled={disabled}
      className={className}
      {...rest}
    >
      {(pressed) => (
        <View
          className={cn(
            "h-[72px] w-[72px] items-center justify-center rounded-control",
            disabled ? "bg-border-subtle" : pressed ? k.pressed : k.idle,
          )}
        >
          <k.I size={32} color={disabled ? colors["text-disabled"] : k.icon} />
        </View>
      )}
    </PressableScale>
  );
}
