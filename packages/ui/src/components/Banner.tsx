import { cssInterop } from "nativewind";
import type { Icon } from "phosphor-react-native";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { cn } from "../lib/cn";
import { useMotion } from "../lib/motion";
import { StatusDisc, type StatusDiscTone } from "./StatusDisc";

const AnimatedView = Animated.createAnimatedComponent(View);
cssInterop(AnimatedView, { className: "style" });

const tones = {
  info: { box: "bg-accent-subtle", disc: "accent" },
  success: { box: "bg-success-subtle", disc: "success" },
  warning: { box: "bg-warning-subtle", disc: "warning" },
  danger: { box: "bg-danger-subtle", disc: "danger" },
} satisfies Record<string, { box: string; disc: StatusDiscTone }>;

export type BannerProps = {
  tone: keyof typeof tones;
  title: string;
  /** One sentence that says what happened and what to do. */
  body?: string;
  icon?: Icon;
  className?: string;
};

/** Figma Feedback / Banner. Slides in with the `enter` preset. */
export function Banner({ tone, title, body, icon, className }: BannerProps) {
  const t = tones[tone];
  const m = useMotion();
  return (
    <AnimatedView
      role={tone === "warning" || tone === "danger" ? "alert" : "status"}
      className={cn("flex-row items-start gap-3 rounded-control px-4 py-3", t.box, className)}
      style={{
        animationName: {
          from: { opacity: 0, transform: [{ translateY: m.enter.translateY }] },
          to: { opacity: 1, transform: [{ translateY: 0 }] },
        },
        animationDuration: m.enter.duration,
        animationTimingFunction: "ease-out",
      }}
    >
      <StatusDisc tone={t.disc} size={32} icon={icon} />
      <View className="flex-1 gap-[2px]">
        <Text className="font-sans-medium text-body-md text-foreground">{title}</Text>
        {body && <Text className="font-sans text-body-sm text-text-secondary">{body}</Text>}
      </View>
    </AnimatedView>
  );
}
