import { Pressable, ScrollView, Text, View } from "react-native";
import { AppBar } from "../../components/AppBar";
import { CommuterPage } from "../../components/CommuterPage";
import { Switch } from "../../components/Switch";
import { vehicleKinds } from "../../components/VehicleMarker";
import { useRoutes } from "../../data/hooks";
import { setRouteAlerts, useSaved } from "../../data/saved";
import { useNav } from "../../lib/nav";
import { usePushOnTap } from "../../lib/push-toggle";
import { useSessionGuard } from "../../lib/session";
import colors from "../../theme/colors";

/** Figma 34 Saved routes. The switch sets alerts for that route. */
export default function SavedRoutes() {
  const nav = useNav();
  const { ready } = useSessionGuard("in");
  const pushOn = usePushOnTap();
  const { routes: saved } = useSaved();
  const { data: routes } = useRoutes();
  if (!ready) return null;
  return (
    <CommuterPage active="account" className="pt-safe">
      <AppBar title="Saved routes" backLabel="Back to account" onBack={() => nav.back()} />
      <ScrollView className="flex-1 px-4 md:px-6" contentContainerClassName="pb-6">
        {saved.length === 0 && (
          <Text className="py-4 font-sans text-body-md text-text-secondary">
            No saved routes yet. Tap the bookmark on a route page to save it.
          </Text>
        )}
        {saved.map((s) => {
          const r = routes?.find((x) => x.id === s.route_id);
          const { Icon, label } = vehicleKinds[r?.vehicle_type ?? "ejeep"];
          return (
            <View key={s.route_id} className="min-h-control-md flex-row items-center gap-3 border-b border-border-subtle py-[14px]">
              <Pressable role="button" onPress={() => nav.push(`/route/${s.route_id}`)} className="flex-1 flex-row items-center gap-3">
                <Icon size={24} color={colors["text-secondary"]} />
                <View className="flex-1 gap-[2px]">
                  <Text className="font-sans text-body-md text-foreground">{r?.name ?? "Route"}</Text>
                  <Text className="font-sans text-body-sm text-text-muted">
                    {s.alerts ? `${label}. Alerts for delays and full vehicles.` : `${label}. Alerts off.`}
                  </Text>
                </View>
              </Pressable>
              <Switch
                value={s.alerts}
                label={`Alerts for ${r?.name ?? "route"}`}
                onValueChange={(v) => {
                  if (v) pushOn();
                  void setRouteAlerts(s.route_id, v);
                }}
              />
            </View>
          );
        })}
      </ScrollView>
    </CommuterPage>
  );
}
