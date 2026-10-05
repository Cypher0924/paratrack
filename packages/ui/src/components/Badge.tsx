import type { Icon } from "phosphor-react-native";
import { BroadcastIcon } from "phosphor-react-native/src/icons/Broadcast";
import { ClockIcon } from "phosphor-react-native/src/icons/Clock";
import { InfoIcon } from "phosphor-react-native/src/icons/Info";
import { SeatIcon } from "phosphor-react-native/src/icons/Seat";
import { Text, View } from "react-native";
import { cn } from "../lib/cn";
import colors from "../theme/colors";

const SeatFill: Icon = (p) => <SeatIcon weight="fill" {...p} />;
const InfoFill: Icon = (p) => <InfoIcon weight="fill" {...p} />;

// Success = seats or verified, Warning = filling or delayed, Danger = full or cancelled, Info = emphasis.
const tones = {
  success: { box: "bg-success-subtle", text: "text-success-text", icon: colors.success, Default: SeatFill },
  warning: { box: "bg-warning", text: "text-on-warning", icon: colors["on-warning"], Default: SeatFill },
  danger: { box: "bg-danger-subtle", text: "text-danger-text", icon: colors.danger, Default: SeatFill },
  info: { box: "bg-accent-subtle", text: "text-accent", icon: colors.accent, Default: InfoFill },
  neutral: { box: "bg-surface-muted", text: "text-text-secondary", icon: colors["text-secondary"], Default: ClockIcon },
  live: { box: "bg-accent-subtle", text: "text-accent", icon: colors.live, Default: BroadcastIcon },
};

export type BadgeTone = keyof typeof tones;

export type BadgeProps = {
  tone: BadgeTone;
  /** Always pair the color with a label. */
  label: string;
  /** 14 px icon. Defaults per tone, `null` hides it. */
  icon?: Icon | null;
  className?: string;
};

/** Figma Feedback / Badge. */
export function Badge({ tone, label, icon, className }: BadgeProps) {
  const t = tones[tone];
  const I = icon === undefined ? t.Default : icon;
  return (
    <View className={cn("h-[24px] flex-row items-center justify-center gap-1 self-start rounded-pill px-2", t.box, className)}>
      {I && <I size={14} color={t.icon} />}
      <Text className={cn("font-sans-medium text-caption", t.text)}>{label}</Text>
    </View>
  );
}
