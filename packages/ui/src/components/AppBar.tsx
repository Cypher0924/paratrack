import type { Icon } from "phosphor-react-native";
import { ArrowLeftIcon } from "phosphor-react-native/src/icons/ArrowLeft";
import { Text, View } from "react-native";
import { cn } from "../lib/cn";
import { IconButton } from "./IconButton";

export type AppBarProps = {
  title: string;
  onBack?: () => void;
  /** Spoken name of the back button, for example "Back to routes". */
  backLabel?: string;
  /** Optional right action. Without it a spacer keeps the title centered. */
  action?: { icon: Icon; label: string; onPress?: () => void };
  className?: string;
};

/** Figma App bar 2014:199 (Back, Back with action). */
export function AppBar({ title, onBack, backLabel = "Back", action, className }: AppBarProps) {
  return (
    <View className={cn("h-[56px] w-full flex-row items-center bg-surface px-1", className)}>
      <IconButton icon={ArrowLeftIcon} label={backLabel} onPress={onBack} />
      <Text numberOfLines={1} role="heading" className="flex-1 text-center font-sans-medium text-body-md text-foreground">
        {title}
      </Text>
      {action ? (
        <IconButton icon={action.icon} label={action.label} onPress={action.onPress} />
      ) : (
        <View className="h-control-md w-control-md" />
      )}
    </View>
  );
}
