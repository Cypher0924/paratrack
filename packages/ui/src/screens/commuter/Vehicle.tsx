import { ahead, clockTime, etaLabel, formatPeso, nearestStop } from "@repo/core";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { BellIcon } from "phosphor-react-native/src/icons/Bell";
import { ReceiptIcon } from "phosphor-react-native/src/icons/Receipt";
import { useFare, useLiveVehicles, useProfile, useTrips } from "../../data/hooks";
import { useNav, useParams, useQuery } from "../../lib/nav";
import { useSessionGuard } from "../../lib/session";
import { usePushOnTap } from "../../lib/push-toggle";
import { Badge } from "../../components/Badge";
import { Banner } from "../../components/Banner";
import { Button } from "../../components/Button";
import { CapacityBar } from "../../components/CapacityBar";
import { TransitMap } from "../../components/Map";
import { Plate } from "../../components/Plate";
import { SettingsRow } from "../../components/SettingsRow";
import { vehicleKinds } from "../../components/VehicleMarker";
import { BackButton, etaToStop, kindOf, liveSeat, marker, pointOf, MapPanel, useNow, useOrigin, useRouteWithStops, useMapInsets, useSheetHeights } from "./shared";

const fareLabel = { regular: "Regular", student: "Student, 20% off", senior: "Senior, 20% off", pwd: "PWD, 20% off" } as const;

/** Figma 09 Vehicle. `to` in the query is the stop the commuter gets off at. */
export default function Vehicle() {
  const { ready } = useSessionGuard("in");
  const pushOn = usePushOnTap();
  const { id } = useParams<{ id: string }>();
  const { to } = useQuery();
  const nav = useNav();
  const { vehicles } = useLiveVehicles();
  const vehicle = vehicles.find((v) => v.id === id) ?? null;
  const { route, stops } = useRouteWithStops(vehicle?.route_id);
  const origin = useOrigin();
  const { profile } = useProfile();
  const { startTrip, setTripAlerts } = useTrips();
  const [alertOn, setAlertOn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = useNow();
  const heights = useSheetHeights(160, 540);
  const insets = useMapInsets(heights[1] + 16);

  const yours = useMemo(
    () => (origin.point ? nearestStop(origin.point, stops.map((s) => ({ ...s.stop, offsetM: s.offsetM }))) : null),
    [origin.point, stops],
  );
  // ponytail: without a chosen destination the trip ends at the route's last stop. Search passes `to`.
  const alight = stops.find((s) => s.stop.id === to) ?? stops[stops.length - 1] ?? null;
  const fareType = profile?.fare_type ?? "regular";
  const fare = useFare(route?.id ?? "", yours?.stop.id ?? "", to ?? "", fareType);

  const live = vehicle?.live ?? null;
  const online = !!live?.online;
  const seat = vehicle ? liveSeat(vehicle) : null;
  const eta = vehicle && route && yours ? etaToStop(vehicle, route, yours.stop.offsetM) : null;
  const kind = vehicleKinds[kindOf(route)].label;
  const next = live
    ? stops
        .map((s) => ({ s, d: ahead(live.progress_m, s.offsetM, route?.length_m ?? 1) }))
        .filter((x) => x.d > 0)
        .sort((a, b) => a.d - b.d)[0]?.s
    : undefined;
  const path = useMemo(() => (route?.path ?? []).map(([lng, lat]) => ({ lat, lng })), [route]);
  const mapVehicle = vehicle ? marker(vehicle, route, { selected: true, eta: eta === null ? undefined : etaLabel(eta) }) : null;

  const track = async () => {
    if (!vehicle || !yours || !alight) return;
    if (alertOn) pushOn();
    setBusy(true);
    setError(null);
    try {
      const t = await startTrip({ vehicleId: vehicle.id, boardStopId: yours.stop.id, alightStopId: alight.stop.id });
      if (!alertOn) await setTripAlerts(t.id, { arrivalAlert: false });
      nav.replace(`/trip/${t.id}`);
    } catch {
      setError("We could not start tracking. Check your connection and try again.");
      setBusy(false);
    }
  };

  if (!ready) return null;
  return (
    <View className="h-full w-full flex-1 bg-surface-muted">
      <TransitMap
        center={origin.point}
        fit={mapVehicle ? [mapVehicle, ...(yours ? [pointOf(yours.stop)] : [])] : undefined}
        routes={route ? [{ id: route.id, path }] : []}
        stops={yours ? [{ id: yours.stop.id, ...pointOf(yours.stop), name: yours.stop.name ?? "Stop", kind: "yours" }] : []}
        vehicles={mapVehicle ? [mapVehicle] : []}
        you={origin.position}
        {...insets}
      />
      <MapPanel top={<BackButton label="Back" />} heights={heights}>
          {vehicle && seat ? (
            <>
              <View className="gap-[2px]">
                <View className="flex-row items-center gap-[10px]">
                  <Text className="font-sans-medium text-body-md text-foreground">{vehicle.label}</Text>
                  {vehicle.plate && <Plate plate={vehicle.plate} />}
                  <View className="flex-1" />
                  {!online ? (
                    <Badge tone="neutral" label="Offline" />
                  ) : seat.status === "filling" ? (
                    <Badge tone="warning" label="Filling up" />
                  ) : seat.status === "full" ? (
                    <Badge tone="danger" label="Full" />
                  ) : (
                    <Badge tone="success" label="Seats available" />
                  )}
                </View>
                <Text className="font-sans text-body-sm text-text-muted">
                  {route?.name}
                  {next ? `, heading to ${next.stop.name}` : ""}
                </Text>
              </View>
              <View>
                <Text className="font-display text-display-xl text-foreground">{online && eta !== null ? etaLabel(eta) : "Not sharing"}</Text>
                {yours && online && eta !== null && (
                  <Text className="font-sans text-body-md text-text-secondary">
                    To {yours.stop.name}, arrives {clockTime(new Date(now.getTime() + eta * 1000))}
                  </Text>
                )}
              </View>
              <View className="gap-2">
                <Text className="font-sans-medium text-body-md text-foreground">
                  {vehicle.capacity - seat.seatsLeft} of {vehicle.capacity} seats taken
                </Text>
                <CapacityBar capacity={vehicle.capacity} seatsTaken={live?.seats_taken ?? 0} markedFull={live?.marked_full ?? false} />
              </View>
              <View>
                <SettingsRow
                  icon={BellIcon}
                  title="Alert me before it arrives"
                  description={yours ? `When it is 2 min from ${yours.stop.name}` : undefined}
                  trailing="switch"
                  checked={alertOn}
                  onCheckedChange={setAlertOn}
                />
                {fare && to && yours && route && (
                  <SettingsRow
                    icon={ReceiptIcon}
                    title={`Fare to ${alight?.stop.name ?? "your stop"}`}
                    description={fareLabel[fareType]}
                    trailing="value"
                    value={formatPeso(fare.breakdown.totalCentavos)}
                    onPress={() => nav.push(`/fare?route=${route.id}&from=${yours.stop.id}&to=${to}`)}
                    className="border-b-0"
                  />
                )}
              </View>
              {error && <Banner tone="danger" title="Tracking did not start" body={error} />}
              <Button
                label={`Track this ${kind.toLowerCase()}`}
                loading={busy}
                disabled={!online || !yours || !alight}
                onPress={track}
              />
            </>
          ) : (
            <Text className="py-6 text-center font-sans text-body-sm text-text-muted">Loading vehicle</Text>
          )}
      </MapPanel>
    </View>
  );
}
