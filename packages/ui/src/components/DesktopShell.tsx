import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { BellIcon } from "phosphor-react-native/src/icons/Bell";
import { MapTrifoldIcon } from "phosphor-react-native/src/icons/MapTrifold";
import { SteeringWheelIcon } from "phosphor-react-native/src/icons/SteeringWheel";
import { useAppMode } from "../data/mode";
import { UserCircleIcon } from "phosphor-react-native/src/icons/UserCircle";
import { useNotifications, useProfile } from "../data/hooks";
import { cn } from "../lib/cn";
import { useNav } from "../lib/nav";
import { tabPath } from "../screens/commuter/tabs";
import colors from "../theme/colors";
import { Avatar } from "./Avatar";
import { AppIcon } from "./Brand";
import type { Tab } from "./TabBar";

/** Figma Desktop/Nav rail (72) and the panel next to it (400). */
export const SHELL = 72 + 400;

const first = {
  commuter: { key: "map", label: "Map", Icon: MapTrifoldIcon },
  driver: { key: "drive", label: "Drive", Icon: SteeringWheelIcon },
} as const;
const rest = [
  { key: "alerts", label: "Alerts", Icon: BellIcon },
  { key: "account", label: "Account", Icon: UserCircleIcon },
] as const;

/** Figma Desktop/Nav rail 2181:2038. Replaces the tab bar from `md` up. */
function NavRail({ active }: { active: Tab }) {
  const nav = useNav();
  const { unreadCount } = useNotifications();
  const { profile } = useProfile();
  const items = [first[useAppMode()], ...rest];
  return (
    <View accessibilityRole="tablist" className="h-full w-[72px] items-center gap-2 border-r border-border-subtle bg-surface pb-5 pt-4">
      <View className="h-[40px] items-center justify-center pb-3">
        <AppIcon size={40} />
      </View>
      {items.map(({ key, label, Icon }) => {
        const on = key === active;
        const count = key === "alerts" && unreadCount > 0 ? (unreadCount > 99 ? "99+" : String(unreadCount)) : null;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            aria-selected={on}
            accessibilityLabel={count ? `${label}, ${unreadCount} unread` : label}
            onPress={() => !on && nav.replace(tabPath[key])}
            className={cn("w-[60px] items-center gap-1 rounded-md py-2", on && "bg-accent-subtle")}
          >
            <Icon size={24} weight={on ? "fill" : "regular"} color={on ? colors.accent : colors["text-secondary"]} />
            <Text className={cn("font-sans-medium text-caption", on ? "text-accent" : "text-text-secondary")}>{label}</Text>
            {count && (
              <View className="absolute left-[34px] top-[2px] h-[16px] items-center justify-center rounded-pill bg-danger px-[5px]">
                <Text className="font-sans-medium text-caption text-accent-foreground">{count}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
      <View className="flex-1" />
      <Avatar name={profile?.display_name || "You"} size={40} />
    </View>
  );
}

/**
 * Wide layout for the commuter app: the nav rail and a flush 400 px panel down the left edge, the
 * map to their right. It covers the left side of its parent, so the parent holds the map.
 */
export function DesktopShell({ active, children }: { active: Tab; children: ReactNode }) {
  return (
    <View pointerEvents="box-none" className="absolute inset-y-0 left-0 flex-row">
      <NavRail active={active} />
      <View className="h-full w-[400px] border-r border-border-subtle bg-surface">{children}</View>
    </View>
  );
}
