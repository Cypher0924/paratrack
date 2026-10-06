import { useMemo } from "react";
import { View } from "react-native";
import { useLiveVehicles, useRoutes } from "../data/hooks";
import { marker } from "../screens/commuter/shared";
import { TransitMap } from "./Map";
import type { LatLng, MapVehicleItem } from "./Map.types";

/**
 * Live map of the city for wide screens: the routes and the vehicles that are sharing. It starts at
 * `leftInset`, to the right of whatever panel sits over the left side. `routeIds` limits the routes
 * drawn. `interactive` lets the commuter pan and zoom, otherwise it is only scenery.
 */
export function MapBackdrop({ leftInset, routeIds, interactive }: { leftInset: number; routeIds?: string[]; interactive?: boolean }) {
  const { data: routes } = useRoutes();
  const { vehicles } = useLiveVehicles();
  const key = routeIds?.join("|");
  const lines = useMemo(
    () =>
      (routes ?? [])
        .filter((r) => !routeIds || routeIds.includes(r.id))
        .map((r) => ({ id: r.id, path: (r.path ?? []).map(([lng, lat]) => ({ lat, lng })) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routes, key],
  );
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
        .filter((v) => !routeIds || (v.route_id && routeIds.includes(v.route_id)))
        .map((v) => marker(v, routes?.find((r) => r.id === v.route_id)))
        .filter((v): v is MapVehicleItem => !!v),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vehicles, routes, key],
  );
  return (
    <View pointerEvents={interactive ? "auto" : "none"} className="absolute inset-0">
      <TransitMap fit={fit} routes={lines} vehicles={items} leftInset={leftInset} noZoom={!interactive} />
    </View>
  );
}
