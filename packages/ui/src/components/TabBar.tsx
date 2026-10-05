import { Pressable, Text, View } from "react-native";
import { BellIcon } from "phosphor-react-native/src/icons/Bell";
import { MapTrifoldIcon } from "phosphor-react-native/src/icons/MapTrifold";
import { SteeringWheelIcon } from "phosphor-react-native/src/icons/SteeringWheel";
import { UserCircleIcon } from "phosphor-react-native/src/icons/UserCircle";
import { cn } from "../lib/cn";
import colors from "../theme/colors";

export type Tab = "map" | "drive" | "alerts" | "account";

const tabs = {
  commuter: [
    { key: "map", label: "Map", Icon: MapTrifoldIcon },
    { key: "alerts", label: "Alerts", Icon: BellIcon },
    { key: "account", label: "Account", Icon: UserCircleIcon },
  ],
  driver: [
    { key: "drive", label: "Drive", Icon: SteeringWheelIcon },
    { key: "alerts", label: "Alerts", Icon: BellIcon },
    { key: "account", label: "Account", Icon: UserCircleIcon },
  ],
} as const;

export type TabBarProps = {
  /** Figma Tab bar/Commuter (Map) or Tab bar/Driver (Drive). */
  variant?: "commuter" | "driver";
  active: Tab;
  /** Unread alerts. The count shows on Alerts unless Alerts is active. */
  unread?: number;
  onSelect?: (tab: Tab) => void;
};

/** Figma 2014:119 / 2014:183. The bottom padding is the device safe-area inset. */
export function TabBar({ variant = "commuter", active, unread = 0, onSelect }: TabBarProps) {
  return (
    <View accessibilityRole="tablist" className="w-full border-t border-border-subtle bg-surface pb-safe">
      <View className="h-[49px] flex-row">
        {tabs[variant].map(({ key, label, Icon }) => {
          const on = key === active;
          const count = key === "alerts" && !on && unread > 0 ? (unread > 99 ? "99+" : String(unread)) : null;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              aria-selected={on}
              accessibilityLabel={count ? `${label}, ${unread} unread` : label}
              onPress={() => onSelect?.(key)}
              className="flex-1 items-center gap-[2px] pt-[6px]"
            >
              <View className="h-[24px] w-[24px]">
                <Icon size={24} weight={on ? "fill" : "regular"} color={on ? colors.accent : colors["text-muted"]} />
                {count && (
                  <View className="absolute left-[14px] top-[-5px] h-[18px] items-center justify-center rounded-pill bg-accent px-[5px]">
                    <Text className="font-sans-medium text-caption text-accent-foreground">{count}</Text>
                  </View>
                )}
              </View>
              <Text className={cn("font-sans-medium text-caption", on ? "text-accent" : "text-text-muted")}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
