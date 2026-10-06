import type { Icon } from "phosphor-react-native";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { Pressable, Text, View } from "react-native";
import { cn } from "../lib/cn";
import colors from "../theme/colors";
import { Switch } from "./Switch";

export type SettingsRowProps = {
  title: string;
  description?: string;
  icon?: Icon;
  /** Right side. `value` shows `value` before the chevron, `switch` uses `checked`. */
  trailing?: "chevron" | "switch" | "value" | "none";
  value?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Row tap, for chevron and value rows. */
  onPress?: () => void;
  className?: string;
};

/** Figma Settings row 2017:124 (Chevron, Switch, Value, None). */
export function SettingsRow({
  title,
  description,
  icon: I,
  trailing = "chevron",
  value,
  checked = false,
  onCheckedChange,
  onPress,
  className,
}: SettingsRowProps) {
  return (
    <Pressable
      role={onPress ? "button" : undefined}
      onPress={onPress}
      disabled={!onPress}
      className={cn("min-h-control-md w-full flex-row items-center gap-3 border-b border-border-subtle py-[14px]", className)}
    >
      {I && <I size={24} color={colors["text-secondary"]} />}
      <View className="flex-1 gap-[2px]">
        <Text className="font-sans text-body-md text-foreground">{title}</Text>
        {description && <Text className="font-sans text-body-sm text-text-muted">{description}</Text>}
      </View>
      {trailing === "value" && <Text className="font-sans text-body-sm text-text-secondary">{value}</Text>}
      {(trailing === "chevron" || trailing === "value") && <CaretRightIcon size={20} color={colors["text-muted"]} />}
      {trailing === "switch" && <Switch value={checked} onValueChange={onCheckedChange} label={title} />}
    </Pressable>
  );
}
