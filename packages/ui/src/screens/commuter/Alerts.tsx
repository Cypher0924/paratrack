import { BusIcon } from "phosphor-react-native/src/icons/Bus";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { CommuterPage } from "../../components/CommuterPage";
import { groupByDay, timeAgo } from "@repo/core";
import { AlertItem } from "../../components/AlertItem";
import { Button } from "../../components/Button";
import { SegmentedControl } from "../../components/SegmentedControl";
import { StatusDisc } from "../../components/StatusDisc";
import { useNotifications } from "../../data/hooks";
import { announcementIdOf } from "../../data/notifications";
import { useNav } from "../../lib/nav";
import type { AppNotification } from "../../data/types";
import { useSessionGuard } from "../../lib/session";

const filters = [
  { value: "all", label: "All" },
  { value: "arrival", label: "Arrivals" },
  { value: "service", label: "Service" },
] as const;

function Group({ title, items, now, onOpen }: { title: string; items: AppNotification[]; now: Date; onOpen: (n: AppNotification) => void }) {
  if (items.length === 0) return null;
  return (
    <View>
      <Text className="font-sans-medium text-body-sm text-text-muted">{title}</Text>
      {items.map((n) => (
        <AlertItem
          key={n.id}
          tone={n.kind === "service" ? "warning" : "accent"}
          icon={n.kind === "service" ? undefined : BusIcon}
          title={n.title ?? ""}
          body={n.body ?? ""}
          time={timeAgo(new Date(n.created_at), now)}
          unread={n.read_at === null}
          onPress={announcementIdOf(n) === null ? undefined : () => onOpen(n)}
        />
      ))}
    </View>
  );
}

/** Figma 13 Alerts. */
export default function Alerts() {
  const { ready } = useSessionGuard("in");
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const nav = useNav();
  const open = (n: AppNotification) => {
    void markRead(n.id).catch(() => undefined);
    nav.push(`/alerts/${announcementIdOf(n)}`);
  };
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all");
  const now = new Date();
  const { today, earlier } = useMemo(
    () => groupByDay(notifications.filter((n) => filter === "all" || n.kind === filter), new Date()),
    [notifications, filter],
  );
  if (!ready) return null;
  return (
    <CommuterPage tab="alerts" unread={unreadCount} className="pt-safe">
      <ScrollView contentContainerClassName="gap-4 px-4 pb-6 pt-4 md:px-6 md:pt-6">
        <View className="flex-row items-center gap-3">
          <Text role="heading" className="flex-1 font-display text-title-lg text-foreground">
            Alerts
          </Text>
          {unreadCount > 0 && <Button variant="ghost" size="md" label="Mark all as read" onPress={() => markAllRead()} />}
        </View>
        <SegmentedControl options={filters} value={filter} onChange={setFilter} />
        {today.length + earlier.length === 0 ? (
          <View className="items-center gap-3 py-12">
            <StatusDisc tone="neutral" />
            <Text className="font-sans-medium text-body-md text-foreground">No alerts yet</Text>
            <Text className="text-center font-sans text-body-sm text-text-muted">
              Arrival alerts and service updates show up here.
            </Text>
          </View>
        ) : (
          <>
            <Group title="Today" items={today} now={now} onOpen={open} />
            <Group title="Earlier" items={earlier} now={now} onOpen={open} />
          </>
        )}
      </ScrollView>
    </CommuterPage>
  );
}
