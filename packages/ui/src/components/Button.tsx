import type { Icon } from "phosphor-react-native";
import { ActivityIndicator, Text, View } from "react-native";
import { cn } from "../lib/cn";
import { PressableScale, type PressableScaleProps } from "../lib/press";
import colors from "../theme/colors";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<
  ButtonVariant,
  { idle: string; pressed: string; disabled: string; text: string; icon: string }
> = {
  primary: {
    idle: "bg-accent",
    pressed: "bg-accent-strong",
    disabled: "bg-border-subtle",
    text: "text-accent-foreground",
    icon: colors["accent-foreground"],
  },
  secondary: {
    idle: "border border-border bg-surface",
    pressed: "border border-border bg-surface-muted",
    disabled: "border border-border-subtle bg-surface",
    text: "text-foreground",
    icon: colors.foreground,
  },
  ghost: {
    idle: "",
    pressed: "bg-accent-subtle",
    disabled: "",
    text: "text-accent",
    icon: colors.accent,
  },
  // Transparent border at rest so the pressed border does not shift the label.
  danger: {
    idle: "border border-transparent bg-danger-subtle",
    pressed: "border border-danger bg-danger-subtle",
    disabled: "border border-border-subtle bg-surface",
    text: "text-danger-text",
    icon: colors["danger-text"],
  },
};

const sizes = {
  lg: { box: "h-control-lg px-5", text: "text-body-md" },
  md: { box: "h-control-md px-4", text: "text-body-sm" },
};

export type ButtonProps = Omit<PressableScaleProps, "children"> & {
  label: string;
  variant?: ButtonVariant;
  /** Large (50) for screen actions, Medium (44) inside rows and sheets. */
  size?: keyof typeof sizes;
  /** Leading icon, 20 px. */
  icon?: Icon;
  /** Shows a spinner in the icon slot and blocks presses. */
  loading?: boolean;
};

/** Figma Controls / Button. */
export function Button({
  label,
  variant = "primary",
  size = "lg",
  icon: I,
  loading = false,
  disabled = false,
  className,
  ...rest
}: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];
  const off = disabled || loading;
  const iconColor = disabled ? colors["text-disabled"] : v.icon;
  return (
    <PressableScale
      role="button"
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={off}
      className={className}
      {...rest}
    >
      {(pressed) => (
        <View
          className={cn(
            "flex-row items-center justify-center gap-2 rounded-control",
            s.box,
            disabled ? v.disabled : pressed ? v.pressed : v.idle,
          )}
        >
          {loading ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            I && <I size={20} color={iconColor} />
          )}
          <Text
            numberOfLines={1}
            className={cn("font-sans-medium", s.text, disabled ? "text-text-disabled" : v.text)}
          >
            {label}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}
