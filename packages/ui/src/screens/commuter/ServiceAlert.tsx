import { alternativeRoutes, clockTime, etaLabel, nearestStop, postedLabel, walkMinutes } from "@repo/core";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { AppBar } from "../../components/AppBar";
import { ArrivalRow } from "../../components/ArrivalRow";
import { Button } from "../../components/Button";
import { CommuterPage } from "../../components/CommuterPage";
import { StatusDisc } from "../../components/StatusDisc";
import { vehicleKinds } from "../../components/VehicleMarker";
import { useAllRouteStops, useLiveVehicles, useRoutes } from "../../data/hooks";
import { fetchAnnouncement, type Announcement } from "../../data/notifications";
import { useNav, useParams } from "../../lib/nav";
import { supabase } from "../../lib/supabase";
import { useSessionGuard } from "../../lib/session";
import { etaToStop, kindOf, liveSeat, seatBadge, useNow, useOrigin } from "./shared";

/** Figma 36 Service alert detail. Other routes are the ones that share a stop with the affected route. */
export default function ServiceAlert() {
  const { ready } = useSessionGuard("in");
  const { id } = useParams<{ id: string }>();
  const nav = useNav();
  const now = useNow(15000);
  const [item, setItem] = useState<Announcement | null | undefined>(undefined);
  const { data: routes } = useRoutes();
  const { data: routeStops } = useAllRouteStops();
  const { vehicles } = useLiveVehicles();
  const origin = useOrigin();

  useEffect(() => {
    if (!/^\d+$/.test(id ?? "")) return setItem(null);
    fetchAnnouncement(supabase, Number(id)).then(setItem, () => setItem(null));
  }, [id]);

  const route = routes?.find((r) => r.id === item?.route_id);
  const others = useMemo(() => {
    if (!item?.route_id || !routes || !routeStops) return [];
    return alternativeRoutes(
      routeStops.map((r) => ({ routeId: r.routeId, seq: r.seq, stopId: r.stop.id })),
      item.route_id,
    ).flatMap((alt) => {
      const r = routes.find((x) => x.id === alt.routeId);
      if (!r) return [];
      const stops = routeStops.filter((s) => s.routeId === r.id);
      const near = origin.point ? nearestStop(origin.point, stops.map((s) => ({ ...s.stop, offsetM: s.offsetM }))) : null;
      const board = near ? { stop: near.stop, offsetM: near.stop.offsetM, walk: walkMinutes(near.distanceM) } : (() => {
        const s = stops.find((x) => x.stop.id === alt.sharedStopIds[0]);
        return s ? { stop: s.stop, offsetM: s.offsetM, walk: null } : null;
      })();
      if (!board) return [];
      const best = vehicles
        .filter((v) => v.route_id === r.id && v.live?.online && liveSeat(v).status !== "full")
        .map((v) => ({ v, eta: etaToStop(v, r, board.offsetM) }))
        .filter((x): x is { v: typeof x.v; eta: number } => x.eta !== null)
        .sort((a, b) => a.eta - b.eta)[0];
      return [{ route: r, board, best }];
    }).sort((a, b) => (a.best?.eta ?? Infinity) - (b.best?.eta ?? Infinity));
  }, [item, routes, routeStops, vehicles, origin.point]);

  if (!ready) return null;
  return (
    <CommuterPage active="alerts">
      <AppBar title="Service update" onBack={() => nav.back()} className="pt-safe" />
      <ScrollView contentContainerClassName="gap-4 px-4 pb-6 pt-4 md:px-6">
        {item === undefined ? null : item === null ? (
          <View className="items-center gap-3 py-12">
            <StatusDisc tone="neutral" />
            <Text className="font-sans-medium text-body-md text-foreground">We could not find this update</Text>
            <Text className="text-center font-sans text-body-sm text-text-muted">It may have been removed.</Text>
            <Button variant="secondary" size="md" label="Back to alerts" onPress={() => nav.replace("/alerts")} />
          </View>
        ) : (
          <>
            <StatusDisc tone="danger" />
            <Text role="heading" className="font-display text-title-lg text-foreground">
              {item.title}
            </Text>
            <Text className="font-sans text-body-sm text-text-muted">
              Posted {postedLabel(new Date(item.created_at), now)}
              {route ? ` by ${route.name}` : ""}
            </Text>
            {item.body ? <Text className="font-sans text-body-md text-text-secondary">{item.body}</Text> : null}
            {item.route_id && routes && routeStops && (
              <View>
                <Text role="heading" className="font-sans-medium text-body-sm text-text-muted">
                  Other routes nearby
                </Text>
                {others.length === 0 ? (
                  <Text className="py-4 font-sans text-body-sm text-text-muted">No other routes share a stop with {route?.name ?? "this route"}.</Text>
                ) : (
                  others.map(({ route: r, board, best }) => {
                    const kind = vehicleKinds[kindOf(r)].label;
                    const meta = `${kind} from ${board.stop.name}${board.walk !== null ? ` · ${board.walk} min walk` : ""}`;
                    return (
                      <ArrivalRow
                        key={r.id}
                        vehicleType={kindOf(r)}
                        route={r.name ?? "Route"}
                        meta={best ? meta : `${meta} · None running now`}
                        badge={best ? seatBadge(liveSeat(best.v)) : undefined}
                        eta={best ? etaLabel(best.eta) : ""}
                        time={best ? clockTime(new Date(now.getTime() + best.eta * 1000)) : ""}
                        onPress={() => nav.push(`/route/${r.id}`)}
                      />
                    );
                  })
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </CommuterPage>
  );
}
