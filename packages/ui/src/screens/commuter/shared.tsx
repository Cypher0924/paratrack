import { etaSeconds, seatStatus } from "@repo/core";
import type { SeatStatus } from "@repo/core";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { ArrowLeftIcon } from "phosphor-react-native/src/icons/ArrowLeft";
import { useAllRouteStops, useLiveVehicles, useRoutes, useStops, useTrips } from "../../data/hooks";
import { useOriginStop } from "../../data/origin";
import type { LiveVehicle, Route, Stop } from "../../data/types";
import { useLocation } from "../../lib/location";
import { useNav } from "../../lib/nav";
import { useIsWide } from "../../lib/responsive";
import { DesktopShell, SHELL } from "../../components/DesktopShell";
import { IconButton } from "../../components/IconButton";
import type { LatLng, MapVehicleItem } from "../../components/Map.types";
import { Sheet } from "../../components/Sheet";
import { vehicleKinds, type VehicleType } from "../../components/VehicleMarker";
import type { BadgeProps } from "../../components/Badge";

export const kindOf = (route: Pick<Route, "vehicle_type"> | undefined): VehicleType => route?.vehicle_type ?? "ejeep";

/** Seat status as a Badge, with the copy the rows use. */
export const seatBadge = (seat: { status: SeatStatus; seatsLeft: number }): Pick<BadgeProps, "tone" | "label"> =>
  seat.status === "full"
    ? { tone: "danger", label: "Full" }
    : { tone: seat.status === "filling" ? "warning" : "success", label: `${seat.seatsLeft} ${seat.seatsLeft === 1 ? "seat" : "seats"} left` };

export const liveSeat = (v: LiveVehicle) =>
  seatStatus({ capacity: v.capacity, seatsTaken: v.live?.seats_taken ?? 0, markedFull: v.live?.marked_full ?? false });

/** A vehicle's position, only when it is sharing. */
export const livePoint = (v: LiveVehicle): LatLng | null =>
  v.live?.online && v.live.lat !== null && v.live.lng !== null ? { lat: v.live.lat, lng: v.live.lng } : null;

/** Re-renders on an interval so "updated N sec ago" and arrival clock times stay fresh. */
export const useNow = (everyMs = 5000) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
};

/** Where the commuter is: the device position, else the stop they picked. */
export const useOrigin = () => {
  const { position, denied } = useLocation();
  const originId = useOriginStop();
  const { data: stops } = useStops();
  const stop = stops?.find((s) => s.id === originId) ?? null;
  const point: LatLng | null = position ?? stop;
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 3000);
    return () => clearTimeout(t);
  }, []);
  // Neither source after a short wait: ask the commuter to pick a stop.
  const needsStop = !point && (denied || waited);
  return { point, position, stop, needsStop };
};

export const useTransitData = () => {
  const { data: routes } = useRoutes();
  const { data: routeStops } = useAllRouteStops();
  const { data: stops } = useStops();
  return { routes: routes ?? [], routeStops: routeStops ?? [], stops: stops ?? [], ready: !!routes && !!routeStops };
};

export const etaToStop = (v: LiveVehicle, route: Route, offsetM: number): number | null =>
  v.live?.online ? etaSeconds({ progressM: v.live.progress_m, speedMps: v.live.speed_mps }, offsetM, route.length_m) : null;

export const marker = (v: LiveVehicle, route: Route | undefined, extra: Partial<MapVehicleItem> = {}): MapVehicleItem | null => {
  const p = livePoint(v);
  if (!p) return null;
  const seat = liveSeat(v);
  const type = kindOf(route);
  return { id: v.id, ...p, type, status: seat.status, seatsLeft: seat.seatsLeft, label: v.label ?? vehicleKinds[type].label, ...extra };
};

export const pointOf = (s: Stop): LatLng => ({ lat: s.lat, lng: s.lng });

/** Expanded height shrinks on short screens so the map stays visible. */
export const useSheetHeights = (collapsed: number, expanded: number): [number, number] => {
  const { height } = useWindowDimensions();
  const max = Math.max(collapsed, height - 160);
  return [Math.min(collapsed, max), Math.min(expanded, max)];
};

// The tab bar or home indicator sits under the sheet, so the map's bottom edge goes a little lower than the sheet top.
export const TAB_BAR = 49;

/** A sheet whose body scrolls. */
export function ScrollSheet({
  heights,
  children,
  expanded,
  onExpandedChange,
}: {
  heights: [number, number];
  children: ReactNode;
  expanded?: boolean;
  onExpandedChange?: (e: boolean) => void;
}) {
  return (
    <Sheet heights={heights} defaultExpanded expanded={expanded} onExpandedChange={onExpandedChange}>
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-4 pt-1" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </Sheet>
  );
}

/** Map insets for the layout: the sheet covers the bottom on phones, the rail and panel cover the left on wide screens. */
export const useMapInsets = (bottom: number) => {
  const wide = useIsWide();
  return wide ? { bottomInset: 0, leftInset: SHELL } : { bottomInset: bottom, leftInset: 0 };
};

/**
 * Everything that sits over a map screen. On phones: `top` floats over the map and `children` go in
 * the bottom sheet, with `footer` (the tab bar) under it. From `md` up it is the desktop panel next to
 * the nav rail, `top` then the scrolling content. The rail replaces `footer`.
 */
export function MapPanel({
  top,
  footer,
  heights,
  expanded,
  onExpandedChange,
  children,
}: {
  top?: ReactNode;
  footer?: ReactNode;
  heights: [number, number];
  expanded?: boolean;
  onExpandedChange?: (e: boolean) => void;
  children: ReactNode;
}) {
  const wide = useIsWide();
  if (wide) {
    return (
      <DesktopShell active="map">
        {top}
        <ScrollView className="flex-1" contentContainerClassName="gap-4 px-6 pb-6 pt-4" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </DesktopShell>
    );
  }
  return (
    <>
      {top ? <TopOverlay>{top}</TopOverlay> : null}
      <View className="absolute inset-x-0 bottom-0">
        <ScrollSheet heights={heights} expanded={expanded} onExpandedChange={onExpandedChange}>
          {children}
        </ScrollSheet>
        {footer}
      </View>
    </>
  );
}

export function BackButton({ label = "Back" }: { label?: string }) {
  const nav = useNav();
  return (
    <View className="ml-4 mt-[12px] self-start md:ml-6 md:mt-6">
      <IconButton variant="surface" icon={ArrowLeftIcon} label={label} onPress={() => nav.back()} />
    </View>
  );
}

/** Space for the status bar on native. Web has none. */
export function TopOverlay({ children }: { children: ReactNode }) {
  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 top-0 pt-safe">
      {children}
    </View>
  );
}

export function SheetTitle({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <View className="flex-1 gap-[2px]">
      <Text className="font-sans-medium text-title-md text-foreground">{children}</Text>
      {caption ? <Text className="font-sans text-body-sm text-text-muted">{caption}</Text> : null}
    </View>
  );
}

export const useStopsById = () => {
  const { stops } = useTransitData();
  return useMemo(() => new Map(stops.map((s) => [s.id, s])), [stops]);
};

/** One route's stops in order, with the route row. */
export const useRouteWithStops = (routeId: string | undefined) => {
  const { routes, routeStops, ready } = useTransitData();
  const route = routes.find((r) => r.id === routeId);
  const stops = useMemo(() => routeStops.filter((rs) => rs.routeId === routeId).sort((a, b) => a.seq - b.seq), [routeStops, routeId]);
  return { route, stops, ready };
};

/** Everything a trip screen draws: the trip, its vehicle with live data, the route and the two stops. */
export const useTripContext = (tripId: string | undefined) => {
  const trips = useTrips();
  const live = useLiveVehicles();
  const trip = trips.trips.find((t) => t.id === tripId) ?? null;
  // The server auto-ends a trip after the alight stop and nothing pushes that, so look again now and then.
  const { refresh } = trips;
  const open = trip !== null && trip.status !== "ended";
  useEffect(() => {
    if (!open || !tripId) return;
    const t = setInterval(() => refresh(tripId).catch(() => {}), 10_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tripId]);
  const vehicle = live.vehicles.find((v) => v.id === trip?.vehicle_id) ?? null;
  const { route, stops, ready } = useRouteWithStops(vehicle?.route_id);
  const boardStop = stops.find((s) => s.stop.id === trip?.board_stop_id) ?? null;
  const alightStop = stops.find((s) => s.stop.id === trip?.alight_stop_id) ?? null;
  return { ...trips, trip, vehicle, route, stops, boardStop, alightStop, ready, status: live.status };
};

