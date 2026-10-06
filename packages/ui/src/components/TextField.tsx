import type { Icon } from "phosphor-react-native";
import { WarningCircleIcon } from "phosphor-react-native/src/icons/WarningCircle";
import { useState, type ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { cn } from "../lib/cn";
import colors from "../theme/colors";

export type TextFieldProps = Omit<TextInputProps, "editable"> & {
  /** Always shown above the input. Never use the placeholder as the label. */
  label: string;
  helper?: string;
  /** Shows the error state. Say how to fix it. Replaces the helper. */
  error?: string;
  disabled?: boolean;
  /** Fixed text before the value, for example "+63". */
  prefix?: string;
  leadingIcon?: Icon;
  trailing?: ReactNode;
  /** Forces the focused look, for the gallery and screenshots. */
  focused?: boolean;
  className?: string;
};

/** Figma Controls / Text field. */
export function TextField({
  label,
  helper,
  error,
  disabled = false,
  prefix,
  leadingIcon: Lead,
  trailing,
  focused,
  className,
  onFocus,
  onBlur,
  ...input
}: TextFieldProps) {
  const [hasFocus, setFocus] = useState(false);
  const isFocused = !disabled && (focused || hasFocus);
  const text = disabled ? "text-text-disabled" : "text-foreground";
  return (
    <View className={cn("gap-2", className)}>
      <Text className={cn("font-sans-medium text-body-sm", text)}>{label}</Text>
      <View
        className={cn(
          "h-control-lg flex-row items-center gap-[10px] overflow-hidden rounded-control px-4",
          disabled
            ? "border border-border-subtle bg-surface-muted"
            : error
              ? "border-[1.5px] border-danger bg-surface"
              : isFocused
                ? "border-[1.5px] border-foreground bg-surface"
                : "border border-border-strong bg-surface",
        )}
      >
        {Lead && <Lead size={20} color={disabled ? colors["text-disabled"] : colors["text-muted"]} />}
        {prefix && <Text className={cn("font-sans text-body-md", text)}>{prefix}</Text>}
        <TextInput
          aria-label={label}
          editable={!disabled}
          placeholderTextColor={disabled ? colors["text-disabled"] : colors["text-muted"]}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          onFocus={(e) => {
            setFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            onBlur?.(e);
          }}
          className={cn("flex-1 self-stretch font-sans text-body-md", text)}
          // The border already shows focus, so the browser outline is off.
          style={{ outlineWidth: 0 }}
          {...input}
        />
        {trailing}
      </View>
      {error && !disabled ? (
        <View className="flex-row items-center gap-[6px]" aria-live="polite">
          <WarningCircleIcon size={16} color={colors.danger} />
          <Text className="flex-1 font-sans text-body-sm text-danger-text">{error}</Text>
        </View>
      ) : (
        helper && <Text className="font-sans text-body-sm text-text-muted">{helper}</Text>
      )}
    </View>
  );
}
