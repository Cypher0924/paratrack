import { useMemo, type ReactNode } from "react";
import { View } from "react-native";
import { TransitMap } from "../../components/Map";
import type { LatLng, MapVehicleItem } from "../../components/Map.types";
import { useLiveVehicles, useRoutes } from "../../data/hooks";
import { useIsWide } from "../../lib/responsive";
import { marker } from "../commuter/shared";

/** Card width and left inset on wide screens. The map keeps its subject clear of both. */
const CARD = 370;
const INSET = 40;

/** Read-only live map of the city behind the card: every route and the vehicles that are sharing. */
function MapBackdrop() {
  const { data: routes } = useRoutes();
  const { vehicles } = useLiveVehicles();
  const lines = useMemo(() => (routes ?? []).map((r) => ({ id: r.id, path: (r.path ?? []).map(([lng, lat]) => ({ lat, lng })) })), [routes]);
  // Two corners are enough for the camera to frame every route.
  const fit = useMemo<LatLng[]>(() => {
    const pts = lines.flatMap((l) => l.path);
    if (pts.length === 0) return [];
    const lat = pts.map((p) => p.lat);
    const lng = pts.map((p) => p.lng);
    return [
      { lat: Math.min(...lat), lng: Math.min(...lng) },
      { lat: Math.max(...lat), lng: Math.max(...lng) },
    ];
  }, [lines]);
  const items = useMemo(
    () =>
      vehicles
        .map((v) => marker(v, routes?.find((r) => r.id === v.route_id)))
        .filter((v): v is MapVehicleItem => !!v),
    [vehicles, routes],
  );
  return (
    <View pointerEvents="none" className="absolute inset-0">
      <TransitMap fit={fit} routes={lines} vehicles={items} leftInset={CARD + INSET} />
    </View>
  );
}

/**
 * Wraps an onboarding screen. On phones it is the plain page. From `md` up the screen sits in a
 * floating card over a live map. Screens that look different on a wide card (Welcome, Location)
 * pass their own content only when `useIsWide()` is true.
 */
export function OnboardingFrame({ children }: { children: ReactNode }) {
  const wide = useIsWide();
  if (!wide) return <View className="h-full w-full flex-1 bg-background">{children}</View>;
  return (
    <View className="h-full w-full flex-1 bg-surface-muted">
      <MapBackdrop />
      <View pointerEvents="box-none" className="absolute inset-y-0 justify-center" style={{ left: INSET, width: CARD }}>
        <View className="overflow-hidden rounded-panel bg-surface shadow-floating">{children}</View>
      </View>
    </View>
  );
}
