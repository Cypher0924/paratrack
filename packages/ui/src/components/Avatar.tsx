import { Text, View } from "react-native";
import { cn } from "../lib/cn";

const sizes = {
  48: { box: "h-[48px] w-[48px]", text: "text-title-sm" },
  40: { box: "h-[40px] w-[40px]", text: "text-body-sm" },
};

export type AvatarProps = { name: string; size?: keyof typeof sizes; className?: string };

/** Figma Feedback / Avatar. Shows up to two initials of `name`. */
export function Avatar({ name, size = 48, className }: AvatarProps) {
  const s = sizes[size];
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <View
      aria-label={name}
      className={cn("items-center justify-center rounded-pill bg-surface-muted", s.box, className)}
    >
      <Text className={cn("font-sans-medium text-foreground", s.text)}>{initials}</Text>
    </View>
  );
}
