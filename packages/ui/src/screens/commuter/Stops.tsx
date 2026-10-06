import { MapPinIcon } from "phosphor-react-native/src/icons/MapPin";
import { CrosshairIcon } from "phosphor-react-native/src/icons/Crosshair";
import { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { AppBar } from "../../components/AppBar";
import { SettingsRow } from "../../components/SettingsRow";
import { useStops } from "../../data/hooks";
import { setOriginStop } from "../../data/origin";
import { useNav } from "../../lib/nav";
import { useSessionGuard } from "../../lib/session";
import colors from "../../theme/colors";

/** Stop picker: choosing a stop sets the origin, "Use my location" clears it. */
export default function Stops() {
  const nav = useNav();
  useSessionGuard("in");
  const { data: stops } = useStops();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (stops ?? []).filter((s) => s.name && (!t || s.name.toLowerCase().includes(t))).sort((a, b) => a.name!.localeCompare(b.name!));
  }, [stops, q]);
  const pick = async (id: string | null) => {
    await setOriginStop(id);
    nav.back();
  };
  return (
    <View className="flex-1 bg-background pt-safe">
      <AppBar title="Choose your stop" backLabel="Back" onBack={() => nav.back()} />
      <View className="px-4 pb-2 pt-2">
        <View className="h-control-md flex-row items-center gap-2 rounded-control border border-border-strong bg-surface px-4">
          <MapPinIcon size={20} color={colors["text-muted"]} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search stops"
            aria-label="Search stops"
            className="flex-1 font-sans-medium text-body-md text-foreground outline-none"
          />
        </View>
      </View>
      <ScrollView className="flex-1 px-4">
        <SettingsRow title="Use my location" icon={CrosshairIcon} trailing="none" onPress={() => pick(null)} />
        {list.map((s) => (
          <SettingsRow key={s.id} title={s.name!} icon={MapPinIcon} trailing="none" onPress={() => pick(s.id)} />
        ))}
        {stops && list.length === 0 && <Text className="py-4 font-sans text-body-sm text-text-muted">No stops match.</Text>}
      </ScrollView>
    </View>
  );
}
