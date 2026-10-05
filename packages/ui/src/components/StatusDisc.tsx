import type { Icon } from "phosphor-react-native";
import { CheckCircleIcon } from "phosphor-react-native/src/icons/CheckCircle";
import { InfoIcon } from "phosphor-react-native/src/icons/Info";
import { WarningIcon } from "phosphor-react-native/src/icons/Warning";
import { WarningOctagonIcon } from "phosphor-react-native/src/icons/WarningOctagon";
import { View } from "react-native";
import { cn } from "../lib/cn";
import colors from "../theme/colors";

const InfoFill: Icon = (p) => <InfoIcon weight="fill" {...p} />;
const CheckCircleFill: Icon = (p) => <CheckCircleIcon weight="fill" {...p} />;
const WarningFill: Icon = (p) => <WarningIcon weight="fill" {...p} />;
const WarningOctagonFill: Icon = (p) => <WarningOctagonIcon weight="fill" {...p} />;

const tones = {
  accent: { box: "bg-accent-subtle", icon: colors.accent, Default: InfoFill },
  success: { box: "bg-success-subtle", icon: colors.success, Default: CheckCircleFill },
  warning: { box: "bg-warning", icon: colors["on-warning"], Default: WarningFill },
  danger: { box: "bg-danger-subtle", icon: colors.danger, Default: WarningOctagonFill },
  neutral: { box: "bg-surface-muted", icon: colors["text-secondary"], Default: InfoFill },
};

const sizes = {
  40: { box: "h-[40px] w-[40px]", icon: 20 },
  32: { box: "h-[32px] w-[32px]", icon: 18 },
};

export type StatusDiscTone = keyof typeof tones;

export type StatusDiscProps = {
  tone: StatusDiscTone;
  size?: keyof typeof sizes;
  /** Swap for the event (vehicle, seats, clock). Defaults per tone. */
  icon?: Icon;
  className?: string;
};

/** Figma Feedback / Status disc. Decorative, so the text next to it carries the meaning. */
export function StatusDisc({ tone, size = 40, icon, className }: StatusDiscProps) {
  const t = tones[tone];
  const s = sizes[size];
  const I = icon ?? t.Default;
  return (
    <View aria-hidden className={cn("items-center justify-center rounded-pill", s.box, t.box, className)}>
      <I size={s.icon} color={t.icon} />
    </View>
  );
}
