import { Pressable, Text, View } from "react-native";
import { cn } from "../lib/cn";
import { StatusDisc, type StatusDiscProps } from "./StatusDisc";

export type AlertItemProps = {
  tone?: StatusDiscProps["tone"];
  icon?: StatusDiscProps["icon"];
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  onPress?: () => void;
  className?: string;
};

/** Figma Alert item 2017:125. The disc tone carries status, the dot marks unread. */
export function AlertItem({ tone = "accent", icon, title, body, time, unread, onPress, className }: AlertItemProps) {
  return (
    <Pressable
      role={onPress ? "button" : undefined}
      onPress={onPress}
      disabled={!onPress}
      className={cn("w-full flex-row items-start gap-3 border-b border-border-subtle py-4", className)}
    >
      <StatusDisc tone={tone} icon={icon} />
      <View className="flex-1 gap-[2px]">
        <Text className="font-sans-medium text-body-md text-foreground">{title}</Text>
        <Text className="font-sans text-body-sm text-text-secondary">{body}</Text>
        <Text className="font-sans text-caption text-text-muted">{time}</Text>
      </View>
      {unread && <View aria-label="Unread" className="h-[8px] w-[8px] rounded-pill bg-accent" />}
    </Pressable>
  );
}
