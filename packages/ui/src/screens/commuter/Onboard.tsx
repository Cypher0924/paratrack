import { clockTime, etaLabel, paraCopy, stopsAway, tripTimeline } from "@repo/core";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { BellIcon } from "phosphor-react-native/src/icons/Bell";
import { InfoIcon } from "phosphor-react-native/src/icons/Info";
import { WarningIcon } from "phosphor-react-native/src/icons/Warning";
import { useNav, useParams } from "../../lib/nav";
import { useSessionGuard } from "../../lib/session";
import { Banner } from "../../components/Banner";
import { Button } from "../../components/Button";
import { TransitMap } from "../../components/Map";
import { SettingsRow } from "../../components/SettingsRow";
import { TimelineRow } from "../../components/TimelineRow";
import { kindOf, marker, pointOf, MapPanel, SheetTitle, useNow, useOrigin, useMapInsets, useSheetHeights, useTripContext } from "./shared";

/** Figma 12 On board. */
export default function Onboard() {
  const { ready } = useSessionGuard("in");
  const { id } = useParams<{ id: string }>();
  const nav = useNav();
  const { trip, loaded, vehicle, route, stops, boardStop, alightStop, endTrip, setTripAlerts } = useTripContext(id);
  const origin = useOrigin();
  const now = useNow(2000);
  const [busy, setBusy] = useState(false);
  const heights = useSheetHeights(150, 452);
  const insets = useMapInsets(heights[1] + 16);

  useEffect(() => {
    if (!loaded) return;
    if (!trip) nav.replace("/home");
    else if (trip.status === "tracking") nav.replace(`/trip/${trip.id}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, trip?.id, trip?.status]);

  const live = vehicle?.live ?? null;
  const online = !!live?.online;
  const timeline = useMemo(
    () =>
      route && boardStop && alightStop && live
        ? tripTimeline(
            stops.map((s) => ({ id: s.stop.id, offsetM: s.offsetM })),
            boardStop.offsetM,
            alightStop.offsetM,
            live.progress_m,
            live.speed_mps,
            route.length_m,
          )
        : [],
    [route, boardStop, alightStop, live, stops],
  );
  const names = new Map(stops.map((s) => [s.stop.id, s.stop.name ?? "Stop"]));
  const destination = timeline[timeline.length - 1];
  const nextIsYours =
    !!route && !!alightStop && !!live && stopsAway(live.progress_m, alightStop.offsetM, stops.map((s) => s.offsetM), route.length_m) === 1;
  const para = alightStop ? paraCopy({ stopName: alightStop.stop.name ?? "your stop" }) : null;
  const path = useMemo(() => (route?.path ?? []).map(([lng, lat]) => ({ lat, lng })), [route]);
  const mapVehicle = vehicle ? marker(vehicle, route, { selected: true }) : null;

  const end = async () => {
    if (!trip) return;
    setBusy(true);
    try {
      await endTrip(trip.id);
      nav.replace("/home");
    } catch {
      setBusy(false);
    }
  };

  if (!ready) return null;
  return (
    <View className="h-full w-full flex-1 bg-surface-muted">
      <TransitMap
        center={origin.point}
        fit={[...(mapVehicle ? [mapVehicle] : []), ...(alightStop ? [pointOf(alightStop.stop)] : [])]}
        routes={route ? [{ id: route.id, path }] : []}
        stops={alightStop ? [{ id: alightStop.stop.id, ...pointOf(alightStop.stop), name: alightStop.stop.name ?? "Stop", kind: "destination" }] : []}
        vehicles={mapVehicle ? [mapVehicle] : []}
        {...insets}
      />
      <MapPanel
        top={
          <View className="px-4 pt-[12px] md:px-6 md:pt-6">
          {vehicle && !online ? (
            <Banner tone="warning" icon={WarningIcon} title={`${vehicle.label} stopped sharing`} body="We cannot track it right now. Keep an eye out for your stop." />
          ) : nextIsYours && trip?.para_alert && para ? (
            <Banner tone="info" icon={InfoIcon} title={para.title} body={para.body} />
          ) : null}
          </View>
        }
        heights={heights}
      >
          <SheetTitle
            caption={
              destination?.etaSec != null && online
                ? `About ${etaLabel(destination.etaSec)}, arriving ${clockTime(new Date(now.getTime() + destination.etaSec * 1000))}`
                : undefined
            }
          >
            {alightStop ? `Get off at ${alightStop.stop.name}` : "Get off"}
          </SheetTitle>
          <View>
            {timeline.map((t, i) => (
              <TimelineRow
                key={t.id}
                state={t.state}
                stop={names.get(t.id) ?? "Stop"}
                meta={
                  t.state === "vehicle"
                    ? "You are here"
                    : t.etaSec === null
                      ? "Passed"
                      : clockTime(new Date(now.getTime() + t.etaSec * 1000))
                }
                vehicleType={kindOf(route)}
                lineAbove={i > 0}
                lineBelow={i < timeline.length - 1}
              />
            ))}
          </View>
          <SettingsRow
            icon={BellIcon}
            title="Para alert"
            description={alightStop ? `Buzz me one stop before ${alightStop.stop.name}` : undefined}
            trailing="switch"
            checked={trip?.para_alert ?? true}
            onCheckedChange={(c) => trip && setTripAlerts(trip.id, { paraAlert: c })}
            className="border-b-0"
          />
          <Button label="End trip" variant="secondary" loading={busy} disabled={!trip} onPress={end} />
      </MapPanel>
    </View>
  );
}
