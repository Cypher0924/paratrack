import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { View } from "react-native";
import { cn } from "../lib/cn";
import { PressableScale, type PressableScaleProps } from "../lib/press";
import colors from "../theme/colors";

export type CheckboxProps = Omit<PressableScaleProps, "children" | "onPress"> & {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label: string;
};

/** Figma Controls / Checkbox. 24 px box inside a 44 px target. */
export function Checkbox({ checked, onChange, label, className, ...rest }: CheckboxProps) {
  return (
    <PressableScale
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onPress={() => onChange?.(!checked)}
      className={cn("h-control-md w-control-md items-center justify-center", className)}
      {...rest}
    >
      {() => (
        <View
          className={cn(
            "h-[24px] w-[24px] items-center justify-center rounded-xs",
            checked ? "bg-accent" : "border-[1.5px] border-border-strong bg-surface",
          )}
        >
          {checked && <CheckIcon size={16} color={colors["accent-foreground"]} />}
        </View>
      )}
    </PressableScale>
  );
}
