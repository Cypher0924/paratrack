import { clockTime, etaLabel, updatedAgo } from "@repo/core";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { BellIcon } from "phosphor-react-native/src/icons/Bell";
import { ClockIcon } from "phosphor-react-native/src/icons/Clock";
import { WarningIcon } from "phosphor-react-native/src/icons/Warning";
import { useNav, useParams } from "../../lib/nav";
import { Badge } from "../../components/Badge";
import { Banner } from "../../components/Banner";
import { Button } from "../../components/Button";
import { TransitMap } from "../../components/Map";
import { Plate } from "../../components/Plate";
import { SettingsRow } from "../../components/SettingsRow";
import { vehicleKinds } from "../../components/VehicleMarker";
import { BackButton, etaToStop, kindOf, liveSeat, marker, pointOf, ScrollSheet, seatBadge, TopOverlay, useNow, useOrigin, useSheetHeights, useTripContext } from "./shared";

/** Figma 11 Tracking, with 23 Stopped sharing when the vehicle goes offline. */
export default function Trip() {
  const { id } = useParams<{ id: string }>();
  const nav = useNav();
  const { trip, loaded, vehicle, route, boardStop, endTrip, setOnboard, setTripAlerts } = useTripContext(id);
  const origin = useOrigin();
  const now = useNow(2000);
  const [keepWaiting, setKeepWaiting] = useState(false);
  const [busy, setBusy] = useState(false);
  const heights = useSheetHeights(150, 440);

  useEffect(() => {
    if (!loaded) return;
    if (!trip) nav.replace("/home");
    else if (trip.status === "onboard") nav.replace(`/trip/${trip.id}/onboard`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, trip?.id, trip?.status]);

  const live = vehicle?.live ?? null;
  const online = !!live?.online;
  const seat = vehicle ? liveSeat(vehicle) : null;
  const eta = vehicle && route && boardStop ? etaToStop(vehicle, route, boardStop.offsetM) : null;
  const kind = vehicleKinds[kindOf(route)].label;
  const stopped = !!vehicle && !online;
  const lastSeenAt = live ? new Date(live.updated_at) : null;
  const path = useMemo(() => (route?.path ?? []).map(([lng, lat]) => ({ lat, lng })), [route]);
  const mapVehicle = vehicle ? marker(vehicle, route, { selected: true, eta: eta === null ? undefined : etaLabel(eta) }) : null;
  // A vehicle that went offline keeps its last position, so it can still be drawn there.
  const lastPoint = live && live.lat !== null && live.lng !== null ? { lat: live.lat, lng: live.lng } : null;
  const shown = mapVehicle ?? (vehicle && lastPoint && seat ? { id: vehicle.id, ...lastPoint, type: kindOf(route), status: seat.status, seatsLeft: seat.seatsLeft, label: vehicle.label ?? kind } : null);

  const run = async (fn: () => Promise<unknown>, then: string) => {
    setBusy(true);
    try {
      await fn();
      nav.replace(then);
    } catch {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-surface-muted">
      <TransitMap
        center={origin.point}
        fit={[...(shown ? [shown] : []), ...(boardStop ? [pointOf(boardStop.stop)] : [])]}
        routes={route ? [{ id: route.id, path }] : []}
        stops={boardStop ? [{ id: boardStop.stop.id, ...pointOf(boardStop.stop), name: boardStop.stop.name ?? "Stop", kind: "yours" }] : []}
        vehicles={shown ? [shown] : []}
        you={origin.position}
        bottomInset={heights[1] + 16}
      />
      <TopOverlay>
        <BackButton label="Back" />
      </TopOverlay>
      <View className="absolute inset-x-0 bottom-0">
        <ScrollSheet heights={heights}>
          {stopped && !keepWaiting && vehicle ? (
            <>
              <Banner
                tone="warning"
                icon={WarningIcon}
                title={`${vehicle.label} stopped sharing`}
                body={`Last seen${boardStop ? ` near ${boardStop.stop.name}` : ""}${lastSeenAt ? ` at ${clockTime(lastSeenAt)}` : ""}. It may still come, but we cannot track it.`}
              />
              <View className="flex-row items-center gap-[10px]">
                <Text className="font-sans-medium text-body-md text-foreground">{vehicle.label}</Text>
                {vehicle.plate && <Plate plate={vehicle.plate} />}
                <View className="flex-1" />
                {seat && lastSeenAt && <Badge tone="neutral" icon={ClockIcon} label={`${seat.seatsLeft} seats at ${clockTime(lastSeenAt)}`} />}
              </View>
              <Button label={`Find another ${kind.toLowerCase()}`} onPress={() => route && nav.replace(`/route/${route.id}`)} />
              <Button label="Keep waiting" variant="ghost" onPress={() => setKeepWaiting(true)} />
            </>
          ) : (
            <>
              <View>
                <Text className="font-sans text-body-sm text-text-muted">
                  {boardStop ? `Arriving at ${boardStop.stop.name} in` : "Arriving in"}
                </Text>
                <Text className="font-sans-medium text-display-xl text-foreground">{online && eta !== null ? etaLabel(eta) : "Not sharing"}</Text>
                {online && eta !== null && lastSeenAt && (
                  <Text className="font-sans text-body-md text-text-secondary">
                    {clockTime(new Date(now.getTime() + eta * 1000))} · {updatedAgo(lastSeenAt, now)}
                  </Text>
                )}
              </View>
              <View className="flex-row items-center gap-[10px]">
                <Text className="font-sans-medium text-body-md text-foreground">{vehicle?.label ?? ""}</Text>
                {vehicle?.plate && <Plate plate={vehicle.plate} />}
                <View className="flex-1" />
                {seat && <Badge {...seatBadge(seat)} />}
              </View>
              <SettingsRow
                icon={BellIcon}
                title="Alert me 2 min before it arrives"
                trailing="switch"
                checked={trip?.arrival_alert ?? true}
                onCheckedChange={(c) => trip && setTripAlerts(trip.id, { arrivalAlert: c })}
                className="border-b-0"
              />
              <View className="gap-3">
                <Button label="I'm on board" loading={busy} disabled={!trip} onPress={() => trip && run(() => setOnboard(trip.id), `/trip/${trip.id}/onboard`)} />
                <Button label="Stop tracking" variant="ghost" disabled={!trip || busy} onPress={() => trip && run(() => endTrip(trip.id), "/home")} />
              </View>
            </>
          )}
        </ScrollSheet>
      </View>
    </View>
  );
}
