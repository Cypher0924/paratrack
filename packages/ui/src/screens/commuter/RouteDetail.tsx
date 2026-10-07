import { clockTime, etaLabel, nearestStop, stopsAway, walkMinutes } from "@repo/core";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { BookmarkSimpleIcon } from "phosphor-react-native/src/icons/BookmarkSimple";
import { PersonSimpleWalkIcon } from "phosphor-react-native/src/icons/PersonSimpleWalk";
import { useLiveVehicles } from "../../data/hooks";
import { useNav, useParams, useQuery } from "../../lib/nav";
import { useSessionGuard } from "../../lib/session";
import { IconButton } from "../../components/IconButton";
import { Toast } from "../../components/Toast";
import { saveRoute, unsaveRoute, useSaved } from "../../data/saved";
import { usePushOnTap } from "../../lib/push-toggle";
import { ArrivalRow } from "../../components/ArrivalRow";
import { Badge } from "../../components/Badge";
import { TransitMap } from "../../components/Map";
import type { MapStopItem, MapVehicleItem } from "../../components/Map.types";
import { vehicleKinds } from "../../components/VehicleMarker";
import colors from "../../theme/colors";
import { BackButton, etaToStop, kindOf, liveSeat, marker, pointOf, MapPanel, seatBadge, SheetTitle, useNow, useOrigin, useRouteWithStops, useMapInsets, useSheetHeights } from "./shared";

/** Figma 08 Route. */
export default function RouteDetail() {
  const { ready } = useSessionGuard("in");
  const { id } = useParams<{ id: string }>();
  const nav = useNav();
  // Set when the commuter came from Search, so Track uses their destination.
  const { to } = useQuery();
  const vehicleUrl = (vehicleId: string) => `/vehicle/${vehicleId}${to ? `?to=${to}` : ""}`;
  const { route, stops } = useRouteWithStops(id);
  const origin = useOrigin();
  const { vehicles, status } = useLiveVehicles();
  const now = useNow();
  const { routeIds } = useSaved();
  const pushOn = usePushOnTap();
  const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  const saved = routeIds.includes(id);
  const toggleSaved = async () => {
    try {
      if (saved) {
        await unsaveRoute(id);
        setToast({ message: "Removed from saved routes." });
      } else {
        pushOn();
        await saveRoute(id);
        setToast({
          message: `Saved. You get alerts for ${route?.name ?? "this route"}.`,
          undo: () => {
            setToast(null);
            void unsaveRoute(id);
          },
        });
      }
    } catch {
      setToast({ message: "Could not update saved routes." });
    }
  };
  const heights = useSheetHeights(160, 364);
  const insets = useMapInsets(heights[1] + 16);

  const yours = useMemo(
    () => (origin.point ? nearestStop(origin.point, stops.map((s) => ({ ...s.stop, offsetM: s.offsetM }))) : null),
    [origin.point, stops],
  );
  const rows = useMemo(() => {
    if (!route) return [];
    return vehicles
      .filter((v) => v.route_id === route.id && v.live?.online)
      .map((v) => ({ v, eta: yours ? etaToStop(v, route, yours.stop.offsetM) : null }))
      .sort((a, b) => (a.eta ?? Infinity) - (b.eta ?? Infinity));
  }, [vehicles, route, yours]);

  const path = useMemo(() => (route?.path ?? []).map(([lng, lat]) => ({ lat, lng })), [route]);
  const mapStops = useMemo<MapStopItem[]>(
    () =>
      stops.map((s) => ({
        id: s.stop.id,
        ...pointOf(s.stop),
        name: s.stop.name ?? "Stop",
        kind: s.stop.id === yours?.stop.id ? "yours" : "stop",
      })),
    [stops, yours],
  );
  const mapVehicles = useMemo(
    () => rows.map((r) => marker(r.v, route, { onPress: () => nav.push(vehicleUrl(r.v.id)) })).filter((v): v is MapVehicleItem => !!v),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, route],
  );
  const kind = route ? vehicleKinds[kindOf(route)].label : "";
  const fares = route?.base_fare != null ? `, fares from ₱${route.base_fare}` : "";
  const offsets = stops.map((s) => s.offsetM);

  if (!ready) return null;
  return (
    <View className="h-full w-full flex-1 bg-surface-muted">
      <TransitMap
        center={origin.point}
        fit={mapStops}
        routes={route ? [{ id: route.id, path }] : []}
        stops={mapStops}
        vehicles={mapVehicles}
        you={origin.position}
        {...insets}
      />
      <MapPanel top={<BackButton label="Back" />} heights={heights}>
          <View className="flex-row items-start gap-3">
            <SheetTitle caption={route ? `${kind}${route.headway_min ? ` every ${route.headway_min} min` : ""}${fares}` : undefined}>
              {route?.name ?? "Route"}
            </SheetTitle>
            <IconButton icon={BookmarkSimpleIcon} label={saved ? "Remove from saved routes" : "Save route"} variant={saved ? "tonal" : "plain"} onPress={toggleSaved} />
            <Badge tone={status === "live" ? "live" : "neutral"} label={status === "live" ? "Live" : status === "offline" ? "Offline" : "Updating"} />
          </View>
          {yours && (
            <View className="flex-row items-center gap-2">
              <PersonSimpleWalkIcon size={20} color={colors["text-secondary"]} />
              <Text className="font-sans text-body-sm text-text-secondary">
                Your stop is {yours.stop.name}, {walkMinutes(yours.distanceM)} min walk
              </Text>
            </View>
          )}
          {rows.length === 0 ? (
            <Text className="py-4 font-sans text-body-sm text-text-muted">No {kind.toLowerCase() || "vehicle"}s on this route right now.</Text>
          ) : (
            <View>
              {rows.map(({ v, eta }) => {
                const seat = liveSeat(v);
                const away = yours && v.live ? stopsAway(v.live.progress_m, yours.stop.offsetM, offsets, route!.length_m) : null;
                return (
                  <ArrivalRow
                    key={v.id}
                    vehicleType={kindOf(route)}
                    route={v.label ?? kind}
                    meta={`${v.plate ?? ""}${away !== null ? ` · ${away} ${away === 1 ? "stop" : "stops"} away` : ""}`}
                    badge={seatBadge(seat)}
                    eta={eta === null ? "" : etaLabel(eta)}
                    time={eta === null ? "" : clockTime(new Date(now.getTime() + eta * 1000))}
                    onPress={() => nav.push(vehicleUrl(v.id))}
                  />
                );
              })}
            </View>
          )}
      </MapPanel>
      {toast && <Toast message={toast.message} action={toast.undo ? { label: "Undo", onPress: toast.undo } : undefined} />}
    </View>
  );
}
