import { ArrowLeftIcon } from "phosphor-react-native/src/icons/ArrowLeft";
import { MapPinIcon } from "phosphor-react-native/src/icons/MapPin";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Page } from "../../components/Page";
import { clockTime, formatPeso } from "@repo/core";
import { ArrivalRow } from "../../components/ArrivalRow";
import { IconButton } from "../../components/IconButton";
import { SettingsRow } from "../../components/SettingsRow";
import { useAllRouteStops, useLiveVehicles, useProfile, useRoutes, useStops } from "../../data/hooks";
import { useOriginStop } from "../../data/origin";
import { computeSearch } from "../../data/search";
import { useLocation } from "../../lib/location";
import { useNav } from "../../lib/nav";
import { useSessionGuard } from "../../lib/session";
import colors from "../../theme/colors";

/** Figma 07 Search: From (picked stop or your location), To (stop search), routes serving both in order. */
export default function Search() {
  const nav = useNav();
  useSessionGuard("in");
  const { data: stops } = useStops();
  const { data: routes } = useRoutes();
  const { data: routeStops } = useAllRouteStops();
  const { vehicles } = useLiveVehicles();
  const { profile } = useProfile();
  const originId = useOriginStop();
  const { position } = useLocation(!originId);
  const [q, setQ] = useState("");
  const [toId, setToId] = useState<string | null>(null);

  const origin = originId ? (stops ?? []).find((s) => s.id === originId) : undefined;
  const to = (stops ?? []).find((s) => s.id === toId);
  const fromLabel = origin?.name ?? (position ? "Your location" : "Choose a stop");

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t || to) return [];
    return (stops ?? []).filter((s) => s.name?.toLowerCase().includes(t)).slice(0, 8);
  }, [stops, q, to]);

  const results = useMemo(() => {
    const from = origin ? { stopId: origin.id } : position ? { position } : null;
    if (!from || !toId || !routes || !routeStops) return null;
    return computeSearch(from, toId, routes, routeStops, vehicles, profile?.fare_type ?? "regular", new Date());
  }, [origin, position, toId, routes, routeStops, vehicles, profile?.fare_type]);

  return (
    <Page>
    <ScrollView className="flex-1" contentContainerClassName="pb-8 pt-safe">
      <View className="flex-row items-center gap-2 pl-1 pr-2 pt-2">
        <IconButton icon={ArrowLeftIcon} label="Back" onPress={() => nav.back()} />
        <View className="flex-1 overflow-hidden rounded-control border border-border-strong bg-surface">
          <Pressable
            role="button"
            aria-label={`From, ${fromLabel}. Change`}
            onPress={() => nav.push("/stops")}
            className="flex-row items-center gap-3 px-4 py-2"
          >
            <View className="h-[20px] w-[20px] items-center justify-center">
              <View className="h-[12px] w-[12px] rounded-pill bg-live" />
            </View>
            <View className="flex-1">
              <Text className="font-sans text-caption text-text-muted">From</Text>
              <Text numberOfLines={1} className="font-sans-medium text-body-md text-foreground">
                {fromLabel}
              </Text>
            </View>
          </Pressable>
          <View className="h-px bg-border-subtle" />
          <View className="flex-row items-center gap-3 px-4 py-2">
            <MapPinIcon size={20} color={colors.foreground} />
            <View className="flex-1">
              <Text className="font-sans text-caption text-text-muted">To</Text>
              <TextInput
                value={to ? (to.name ?? "") : q}
                onChangeText={(t) => {
                  setToId(null);
                  setQ(t);
                }}
                placeholder="Search a stop"
                placeholderTextColor={colors["text-muted"]}
                aria-label="To"
                className="h-[22px] p-0 font-sans-medium text-body-md text-foreground outline-none"
              />
            </View>
          </View>
        </View>
        <View className="h-control-md w-control-md" />
      </View>

      <View className="px-4 pt-4">
        {matches.map((s) => (
          <SettingsRow
            key={s.id}
            title={s.name ?? ""}
            icon={MapPinIcon}
            trailing="none"
            onPress={() => {
              setToId(s.id);
              setQ("");
            }}
          />
        ))}
        {q.trim() !== "" && !to && matches.length === 0 && (
          <Text className="font-sans text-body-sm text-text-muted">No stops match.</Text>
        )}

        {to && (
          <View className="gap-1">
            <Text role="heading" className="font-sans-medium text-title-sm text-foreground">{`Routes to ${to.name}`}</Text>
            {results === null && !origin && !position && (
              <Text className="font-sans text-body-sm text-text-muted">Choose where you start to see routes.</Text>
            )}
            {results?.length === 0 && (
              <Text className="py-4 font-sans text-body-md text-text-secondary">No routes go from here to {to.name}.</Text>
            )}
            {results?.map((r) => (
              <ArrivalRow
                key={r.route.id}
                vehicleType={r.route.vehicle_type ?? "ejeep"}
                route={r.route.name ?? "Route"}
                meta={
                  r.next
                    ? `${r.fareCentavos === null ? "" : `${formatPeso(r.fareCentavos)} · `}arrive ${clockTime(r.next.arrive)}`
                    : r.fareCentavos === null
                      ? ""
                      : formatPeso(r.fareCentavos)
                }
                badge={
                  r.next
                    ? { tone: r.next.status === "filling" ? "warning" : "success", label: `${r.next.seatsLeft} seats left` }
                    : r.allFull
                      ? { tone: "danger", label: "Next bus full" }
                      : { tone: "neutral", label: "No vehicles right now" }
                }
                eta={r.next ? `${Math.max(1, Math.round(r.next.etaSec / 60))} min` : "--"}
                time={r.next ? clockTime(r.next.pickup) : ""}
                onPress={() => nav.push(`/route/${r.route.id}?to=${toId}`)}
              />
            ))}
            {results && results.length > 0 && (
              <Text className="pt-2 font-sans text-body-sm text-text-muted">Wait times count only vehicles with seats left.</Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
    </Page>
  );
}