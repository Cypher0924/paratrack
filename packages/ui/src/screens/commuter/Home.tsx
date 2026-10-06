import { clockTime, etaLabel } from "@repo/core";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { BusIcon } from "phosphor-react-native/src/icons/Bus";
import { WarningIcon } from "phosphor-react-native/src/icons/Warning";
import { WifiSlashIcon } from "phosphor-react-native/src/icons/WifiSlash";
import { useNearby, useNotifications } from "../../data/hooks";
import type { NearbyRow } from "../../data/compute";
import { useNav } from "../../lib/nav";
import { useSessionGuard } from "../../lib/session";
import { ArrivalRow } from "../../components/ArrivalRow";
import { Badge } from "../../components/Badge";
import { Banner } from "../../components/Banner";
import { Button } from "../../components/Button";
import { TransitMap } from "../../components/Map";
import type { MapStopItem, MapVehicleItem } from "../../components/Map.types";
import { SearchBar } from "../../components/SearchBar";
import { SegmentedControl } from "../../components/SegmentedControl";
import { TabBar, type Tab } from "../../components/TabBar";
import { vehicleKinds, type VehicleType } from "../../components/VehicleMarker";
import colors from "../../theme/colors";
import { kindOf, marker, pointOf, ScrollSheet, seatBadge, SheetTitle, TAB_BAR, TopOverlay, useNow, useOrigin, useSheetHeights } from "./shared";

type Filter = "all" | VehicleType;
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "shuttle", label: "Shuttle" },
  { value: "ejeep", label: "E-jeep" },
  { value: "bus", label: "Bus" },
  { value: "jeep", label: "Jeep" },
];

function Skeleton() {
  const bar = (w: number | `${number}%`, h = 12) => <View className="rounded-pill bg-surface-muted" style={{ width: w, height: h }} />;
  return (
    <View aria-label="Loading nearby vehicles" accessibilityRole="progressbar" className="gap-0">
      {[0, 1].map((i) => (
        <View key={i} className="flex-row items-start gap-3 border-b border-border-subtle py-4">
          <View className="h-[24px] w-[24px] rounded-xs bg-surface-muted" />
          <View className="flex-1 gap-[8px]">
            {bar("55%", 14)}
            {bar("85%")}
            {bar("30%", 20)}
          </View>
          <View className="items-end gap-[6px]">
            {bar(48, 16)}
            <View className="h-[10px] w-[40px] rounded-pill bg-surface-muted" />
          </View>
        </View>
      ))}
    </View>
  );
}

function Empty({ filter, rows, onAll }: { filter: Filter; rows: NearbyRow[]; onAll: () => void }) {
  const kind = filter === "all" ? "vehicles" : `${vehicleKinds[filter].label.toLowerCase()}s`;
  const next = rows.find((r) => r.seat.status !== "full");
  return (
    <View className="items-center gap-3 px-2 py-6">
      <BusIcon size={32} color={colors["text-muted"]} />
      <Text className="font-sans-medium text-body-md text-foreground">No {kind} nearby right now</Text>
      <Text className="text-center font-sans text-body-sm text-text-muted">
        {next
          ? `The next ${next.route.name} ${vehicleKinds[kindOf(next.route)].label.toLowerCase()} with seats reaches ${next.stop.name} in ${etaLabel(next.etaSec)}. Try another vehicle type or search a destination.`
          : "No vehicles are sharing their location yet. Try again soon or search a destination."}
      </Text>
      {filter !== "all" && <Button label="Show all vehicles" variant="secondary" size="md" onPress={onAll} />}
    </View>
  );
}

/** Figma 06 Home with 20 no vehicles, 21 loading and 22 offline. */
export default function Home() {
  const { ready } = useSessionGuard("in");
  const nav = useNav();
  const origin = useOrigin();
  const { rows, status, loading, lastUpdate } = useNearby(origin.point);
  const { unreadCount } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState(true);
  const now = useNow();
  const heights = useSheetHeights(150, 336);

  const shown = useMemo(() => (filter === "all" ? rows : rows.filter((r) => kindOf(r.route) === filter)), [rows, filter]);
  const vehicles = useMemo(
    () =>
      shown
        .map((r) => marker(r.vehicle, r.route, { onPress: () => nav.push(`/vehicle/${r.vehicle.id}`) }))
        .filter((v): v is MapVehicleItem => !!v),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shown],
  );
  const stops = useMemo<MapStopItem[]>(() => {
    const seen = new Map<string, MapStopItem>();
    for (const r of shown) if (!seen.has(r.stop.id)) seen.set(r.stop.id, { id: r.stop.id, ...pointOf(r.stop), name: r.stop.name ?? "Stop" });
    return Array.from(seen.values());
  }, [shown]);

  const offline = status === "offline";
  const waiting = !origin.needsStop && (!origin.point || loading || (status === "connecting" && rows.length === 0));
  const onTab = (t: Tab) => t !== "map" && nav.replace(t === "alerts" ? "/alerts" : "/account");

  if (!ready) return null;
  return (
    <View className="h-full w-full flex-1 bg-surface-muted">
      <TransitMap
        center={origin.point}
        fit={undefined}
        stops={stops}
        vehicles={vehicles}
        you={origin.position}
        bottomInset={heights[expanded ? 1 : 0] + TAB_BAR + 16}
      />
      <TopOverlay>
        <View className="px-4 pt-[12px]">
          <SearchBar onPress={() => nav.push("/search")} />
        </View>
      </TopOverlay>
      <View className="absolute inset-x-0 bottom-0">
        <ScrollSheet heights={heights} expanded={expanded} onExpandedChange={setExpanded}>
          <View className="flex-row items-start gap-3">
            <SheetTitle>Nearby now</SheetTitle>
            {offline ? (
              <Badge tone="neutral" label="Offline" icon={WifiSlashIcon} />
            ) : status === "live" ? (
              <Badge tone="live" label="Live" />
            ) : (
              <Badge tone="neutral" label="Updating" />
            )}
          </View>
          {offline && (
            <Banner
              tone="warning"
              icon={WarningIcon}
              title="You are offline"
              body={`Showing positions from ${lastUpdate ? clockTime(lastUpdate) : "earlier"}. Arrival times may be off.`}
            />
          )}
          {origin.needsStop ? (
            <View className="items-center gap-3 px-2 py-6">
              <Text className="font-sans-medium text-body-md text-foreground">Where are you?</Text>
              <Text className="text-center font-sans text-body-sm text-text-muted">
                Share your location or pick a stop to see vehicles near you.
              </Text>
              <Button label="Choose my stop" onPress={() => nav.push("/stops")} />
            </View>
          ) : (
            <>
              <SegmentedControl options={filters} value={filter} onChange={setFilter} />
              {waiting ? (
                <Skeleton />
              ) : shown.length === 0 ? (
                <Empty filter={filter} rows={rows} onAll={() => setFilter("all")} />
              ) : (
                <View>
                  {shown.map((r) => (
                    <ArrivalRow
                      key={r.vehicle.id}
                      vehicleType={kindOf(r.route)}
                      route={r.route.name ?? "Route"}
                      meta={`${r.vehicle.label} from ${r.stop.name} · ${r.walkMin} min walk`}
                      badge={seatBadge(r.seat)}
                      eta={etaLabel(r.etaSec)}
                      time={offline && lastUpdate ? `as of ${clockTime(lastUpdate)}` : clockTime(new Date(now.getTime() + r.etaSec * 1000))}
                      onPress={() => nav.push(`/vehicle/${r.vehicle.id}`)}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollSheet>
        <TabBar active="map" unread={unreadCount} onSelect={onTab} />
      </View>
    </View>
  );
}
