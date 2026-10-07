import { groupTrips, tripRange } from "@repo/core";
import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { AppBar } from "../../components/AppBar";
import { CommuterPage } from "../../components/CommuterPage";
import { StatusDisc } from "../../components/StatusDisc";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { Pressable } from "react-native";
import { vehicleKinds } from "../../components/VehicleMarker";
import { useTripHistory } from "../../data/hooks";
import type { Trip } from "../../data/types";
import { useNav } from "../../lib/nav";
import { useSessionGuard } from "../../lib/session";
import colors from "../../theme/colors";
import { kindOf } from "./shared";
import { useTripSummary } from "./tripSummary";

/** Figma 41 Your trips. */
export default function TripHistory() {
  const { ready } = useSessionGuard("in");
  const nav = useNav();
  const { trips, loaded } = useTripHistory();
  const { summarize } = useTripSummary();
  const now = new Date();
  const groups = useMemo(() => groupTrips(trips, new Date()), [trips]);

  if (!ready) return null;
  const group = (title: string, items: Trip[]) =>
    items.length === 0 ? null : (
      <View key={title}>
        <Text className="font-sans-medium text-body-sm text-text-secondary">{title}</Text>
        {items.map((t) => {
          const s = summarize(t);
          const kind = vehicleKinds[kindOf(s.route)];
          return (
            <Pressable
              key={t.id}
              role="button"
              onPress={() => nav.push(`/trip/${t.id}/done?from=trips`)}
              className="min-h-control-md w-full flex-row items-center gap-3 border-b border-border-subtle py-[14px]"
            >
              <kind.Icon size={24} color={colors["text-secondary"]} />
              <View className="flex-1 gap-[2px]">
                <Text className="font-sans text-body-md text-foreground">{`${s.route?.name ?? kind.label} to ${s.alight}`}</Text>
                <Text className="font-sans text-body-sm text-text-muted">
                  {`${s.vehicle?.label ?? kind.label}, ${tripRange(t, now)}`}
                </Text>
              </View>
              <Text className="font-sans text-body-sm text-text-secondary">{s.fare}</Text>
              <CaretRightIcon size={20} color={colors["text-muted"]} />
            </Pressable>
          );
        })}
      </View>
    );

  return (
    <CommuterPage tab="account" className="pt-safe">
      <AppBar title="Your trips" onBack={() => nav.back()} />
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-6 pt-4 md:px-6">
        {loaded && trips.length === 0 ? (
          <View className="items-center gap-3 py-12">
            <StatusDisc tone="neutral" />
            <Text className="font-sans-medium text-body-md text-foreground">No trips yet</Text>
            <Text className="text-center font-sans text-body-sm text-text-muted">Rides you finish show up here.</Text>
          </View>
        ) : (
          <>
            {group("Today", groups.today)}
            {group("This week", groups.week)}
            {group("Earlier", groups.earlier)}
          </>
        )}
        <Text className="font-sans text-body-sm text-text-muted">Trips are linked to your account, not to your location trail.</Text>
      </ScrollView>
    </CommuterPage>
  );
}
