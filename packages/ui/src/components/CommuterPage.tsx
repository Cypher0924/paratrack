import type { ReactNode } from "react";
import { View } from "react-native";
import { useIsWide } from "../lib/responsive";
import { useNav } from "../lib/nav";
import { tabPath } from "../screens/commuter/tabs";
import { DesktopShell, SHELL } from "./DesktopShell";
import { MapBackdrop } from "./MapBackdrop";
import { Page } from "./Page";
import { TabBar, type Tab } from "./TabBar";
import { useAppMode } from "../data/mode";

/**
 * Page for commuter list and form screens. Phones get the page with the tab bar under it (when
 * `tab` is set). From `md` up the content sits in the desktop panel next to the nav rail, over a
 * live map. `active` is the rail item, `tab` the phone tab bar (Search, Fare and Stops have none).
 */
export function CommuterPage({
  tab,
  active = tab ?? "map",
  unread,
  routeIds,
  className,
  children,
}: {
  tab?: Tab;
  active?: Tab;
  unread?: number;
  routeIds?: string[];
  className?: string;
  children: ReactNode;
}) {
  const wide = useIsWide();
  const nav = useNav();
  const mode = useAppMode();
  if (wide) {
    return (
      <View className="h-full w-full flex-1 bg-surface-muted">
        <MapBackdrop leftInset={SHELL} routeIds={routeIds} interactive />
        <DesktopShell active={active}>{children}</DesktopShell>
      </View>
    );
  }
  return (
    <Page className={className}>
      {children}
      {tab && <TabBar variant={mode} active={tab} unread={unread} onSelect={(t) => t !== tab && nav.replace(tabPath[t])} />}
    </Page>
  );
}
