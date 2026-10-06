import type { Icon } from "phosphor-react-native";
import { Text, View } from "react-native";
import { cn } from "../lib/cn";
import colors from "../theme/colors";
import { PressableScale, type PressableScaleProps } from "../lib/press";

export type RadioCardProps = Omit<PressableScaleProps, "children"> & {
  selected: boolean;
  title: string;
  description: string;
  icon: Icon;
};

/** Figma Radio card 2017:149. The whole card is the radio. */
export function RadioCard({ selected, title, description, icon: I, className, ...rest }: RadioCardProps) {
  return (
    <PressableScale
      role="radio"
      aria-checked={selected}
      aria-label={`${title}. ${description}`}
      className={cn(
        "w-full flex-row items-center gap-4 rounded-panel p-4",
        selected ? "border-[1.5px] border-accent bg-accent-subtle" : "border border-border bg-surface",
        className,
      )}
      {...rest}
    >
      {() => (
        <>
          <I size={28} color={selected ? colors.accent : colors.foreground} />
          <View className="flex-1 gap-[2px]">
            <Text className="font-sans-medium text-title-sm text-foreground">{title}</Text>
            <Text className="font-sans text-body-sm text-text-secondary">{description}</Text>
          </View>
          {/* Same look as Radio. Not a Radio, because the card is already the radio. */}
          <View
            aria-hidden
            className={cn(
              "h-[22px] w-[22px] items-center justify-center rounded-pill bg-surface",
              selected ? "border-2 border-accent" : "border-[1.5px] border-border-strong",
            )}
          >
            {selected && <View className="h-[10px] w-[10px] rounded-pill bg-accent" />}
          </View>
        </>
      )}
    </PressableScale>
  );
}
