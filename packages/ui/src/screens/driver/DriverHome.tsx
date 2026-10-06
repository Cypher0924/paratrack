import { etaSeconds, seatStatus } from "@repo/core";
import { BroadcastIcon } from "phosphor-react-native/src/icons/Broadcast";
import { JeepIcon } from "phosphor-react-native/src/icons/Jeep";
import { MapPinIcon } from "phosphor-react-native/src/icons/MapPin";
import { PathIcon } from "phosphor-react-native/src/icons/Path";
import { PowerIcon } from "phosphor-react-native/src/icons/Power";
import { UsersIcon } from "phosphor-react-native/src/icons/Users";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Badge } from "../../components/Badge";
import { Banner } from "../../components/Banner";
import { Button } from "../../components/Button";
import { CapacityBar } from "../../components/CapacityBar";
import { CountButton } from "../../components/CountButton";
import { SettingsRow } from "../../components/SettingsRow";
import { TabBar, type Tab } from "../../components/TabBar";
import { vehicleKinds } from "../../components/VehicleMarker";
import { useRouteStops, useRoutes } from "../../data/hooks";
import { useNav } from "../../lib/nav";
import { useShift, type ShiftError } from "./useShift";

const UNDO_MS = 6000;

const errorCopy: Record<Exclude<ShiftError, null>, { title: string; body: string }> = {
  denied: { title: "Location is off", body: "Allow location for ParaTrack so commuters can see you, then go online again." },
  unsupported: { title: "No location on this device", body: "Open ParaTrack on a phone with location to share your position." },
  in_use: { title: "Vehicle already online", body: "Another driver is sharing this vehicle. Ask them to go offline first." },
  network: { title: "No connection", body: "Check your connection and try again." },
};

const commuters = (n: number) => (n === 1 ? "1 commuter is" : `${n} commuters are`);

/** Figma 15 Start shift, 16 Online, 17 Go offline confirm, 18 Marked full, 19 Full. */
export function DriverHome() {
  const nav = useNav();
  const s = useShift();
  const [confirm, setConfirm] = useState(false);
  const [undo, setUndo] = useState(false);

  useEffect(() => {
    if (s.signedOut) nav.replace("/");
    else if (!s.loading && !s.vehicle) nav.replace("/driver/verify");
    // nav is a new object every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.signedOut, s.loading, s.vehicle]);

  useEffect(() => {
    if (!undo) return;
    const id = setTimeout(() => setUndo(false), UNDO_MS);
    return () => clearTimeout(id);
  }, [undo]);

  const { data: routes } = useRoutes();
  const { data: routeStops } = useRouteStops(s.vehicle?.routeId);
  const nextStop = useMemo(() => {
    const route = routes?.find((r) => r.id === s.vehicle?.routeId);
    const pos = s.position;
    if (!route || !pos || routeStops.length === 0) return null;
    const sorted = [...routeStops].sort((a, b) => a.offsetM - b.offsetM);
    const next = sorted.find((rs) => rs.offsetM > pos.progressM) ?? sorted[0]!;
    const minutes = Math.max(1, Math.ceil(etaSeconds(pos, next.offsetM, route.length_m) / 60));
    return { name: next.stop.name ?? "", minutes };
  }, [routes, routeStops, s.position, s.vehicle?.routeId]);

  const v = s.vehicle;
  if (!v) return <View className="flex-1 bg-background" />;

  const kind = vehicleKinds[v.vehicleType].label.toLowerCase();
  const name = v.label ?? "your vehicle";
  const { status, seatsLeft } = seatStatus({ capacity: v.capacity, seatsTaken: s.seats, markedFull: s.markedFull });
  const countFull = s.seats >= v.capacity;
  const err = s.error ? errorCopy[s.error] : null;

  const onTab = (t: Tab) => t !== "drive" && nav.push(`/${t}`);
  const askOffline = () => {
    setConfirm(true);
    void s.refreshTrackers();
  };
  const markFull = (full: boolean) => {
    s.setFull(full);
    setUndo(full);
  };
  const leave = async () => {
    setConfirm(false);
    setUndo(false);
    await s.goOffline();
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        <ScrollView contentContainerClassName="px-4 pb-6 pt-safe" keyboardShouldPersistTaps="handled">
          <View className="gap-6 pt-4">
            {err && <Banner tone="warning" title={err.title} body={err.body} />}
            {s.online ? (
              <>
                <View className="flex-row items-center gap-[10px]">
                  <Badge tone="success" label="Online" icon={BroadcastIcon} />
                  <Text numberOfLines={1} className="flex-1 font-sans-medium text-title-sm text-foreground">
                    {v.routeName}
                  </Text>
                  <Button label="Go offline" variant="secondary" size="md" onPress={askOffline} />
                </View>

                <View className="items-center pt-2">
                  <Text className="font-sans text-body-sm text-text-muted">Passengers on board</Text>
                  <Text aria-live="polite" className="font-display text-display-2xl text-foreground">
                    {s.seats}
                  </Text>
                  <Text className="font-sans text-body-md text-text-secondary">of {v.capacity} seats</Text>
                </View>

                <View className="gap-[10px]">
                  <CapacityBar capacity={v.capacity} seatsTaken={s.seats} markedFull={s.markedFull} />
                  <View className="flex-row items-center gap-2">
                    <Badge
                      tone={status === "full" ? "danger" : status === "filling" ? "warning" : "success"}
                      label={s.markedFull ? "Marked full" : status === "full" ? "Full" : `${seatsLeft} seats left`}
                    />
                    <Text className="font-sans text-caption text-text-muted">Commuters see this live</Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1 items-center gap-2">
                    <CountButton kind="minus" disabled={s.seats <= 0} onPress={() => s.setCount(s.seats - 1)} className="w-full" />
                    <Text className="font-sans-medium text-body-sm text-text-secondary">Remove passenger</Text>
                  </View>
                  <View className="flex-1 items-center gap-2">
                    <CountButton kind="plus" disabled={countFull} onPress={() => s.setCount(s.seats + 1)} className="w-full" />
                    <Text className={countFull ? "font-sans-medium text-body-sm text-text-disabled" : "font-sans-medium text-body-sm text-text-secondary"}>
                      Add passenger
                    </Text>
                  </View>
                </View>

                {countFull && !s.markedFull ? (
                  <Banner
                    tone="danger"
                    title="You are full"
                    body={`Commuters see your ${kind} as full. Tap Remove passenger when someone gets off.`}
                  />
                ) : (
                  <Button
                    label={s.markedFull ? "Open seats again" : "Mark as full"}
                    variant="secondary"
                    onPress={() => markFull(!s.markedFull)}
                  />
                )}

                {nextStop && (
                  <SettingsRow
                    icon={MapPinIcon}
                    trailing="none"
                    title={`Next stop: ${nextStop.name}`}
                    description={`In ${nextStop.minutes} min. ${commuters(s.trackers)} tracking this ${kind}.`}
                    className="border-b-0"
                  />
                )}
              </>
            ) : (
              <>
                <View className="flex-row items-center gap-3">
                  <Text className="flex-1 font-display text-title-lg text-foreground">Start your shift</Text>
                  <Badge tone="neutral" label="Offline" icon={null} />
                </View>
                <Text className="font-sans text-body-md text-text-secondary">
                  Check your route and vehicle, then go online so commuters can see you.
                </Text>
                <View>
                  <SettingsRow icon={PathIcon} trailing="value" title="Route" value={v.routeName} />
                  <SettingsRow
                    icon={JeepIcon}
                    trailing="value"
                    title={v.label ?? "Vehicle"}
                    description={`Plate ${v.plate}, ${v.capacity} seats`}
                    value="Change"
                    onPress={() => nav.push("/driver/verify")}
                  />
                  <SettingsRow icon={UsersIcon} trailing="value" title="Passengers on board" value="0" />
                </View>
                <Banner
                  tone="info"
                  title="What commuters see"
                  body={`Your live location and free seats on ${v.routeName}. Both are hidden when you go offline.`}
                />
              </>
            )}
          </View>
        </ScrollView>

        {!s.online && (
          <View className="px-4 pb-3 pt-2">
            <Button label="Go online" icon={PowerIcon} loading={s.busy} onPress={s.goOnline} />
          </View>
        )}

        {undo && (
          <View
            role="status"
            className="absolute bottom-3 left-4 right-4 h-[56px] flex-row items-center gap-2 rounded-control border border-border-subtle bg-surface pl-4 pr-1 shadow-floating"
          >
            <Text className="flex-1 font-sans text-body-sm text-foreground">Commuters now see you as full.</Text>
            <Button label="Undo" variant="ghost" size="md" onPress={() => markFull(false)} />
          </View>
        )}
      </View>

      <TabBar variant="driver" active="drive" onSelect={onTab} />

      {confirm && (
        <View className="absolute inset-0 justify-end">
          <Pressable aria-label="Close" onPress={() => setConfirm(false)} className="absolute inset-0 bg-foreground/40" />
          <View
            role="dialog"
            aria-modal
            aria-label="Go offline?"
            className="gap-4 rounded-t-surface bg-surface px-4 pb-safe pt-4 shadow-sheet"
          >
            <View className="h-[5px] w-[40px] self-center rounded-pill bg-border" />
            <Text className="font-sans-medium text-title-md text-foreground">Go offline?</Text>
            <Text className="font-sans text-body-md text-text-secondary">
              {s.trackers === 0
                ? `No commuters are tracking ${name} right now. You will stop showing on the map.`
                : `${commuters(s.trackers)} tracking ${name}. They will stop seeing your location and seats.`}
            </Text>
            <View className="gap-3 pb-4">
              <Button label="Go offline" variant="danger" onPress={leave} />
              <Button label="Stay online" variant="secondary" onPress={() => setConfirm(false)} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
