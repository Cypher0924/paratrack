import type { Icon } from "phosphor-react-native";
import { BriefcaseIcon } from "phosphor-react-native/src/icons/Briefcase";
import { GraduationCapIcon } from "phosphor-react-native/src/icons/GraduationCap";
import { HouseIcon } from "phosphor-react-native/src/icons/House";
import { MapPinIcon } from "phosphor-react-native/src/icons/MapPin";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { ScrollView, Text, View } from "react-native";
import { AppBar } from "../../components/AppBar";
import { CommuterPage } from "../../components/CommuterPage";
import { SettingsRow } from "../../components/SettingsRow";
import { useStops } from "../../data/hooks";
import { useSaved } from "../../data/saved";
import { useNav } from "../../lib/nav";
import { useSessionGuard } from "../../lib/session";

const iconFor = (label: string | null): Icon => {
  const l = (label ?? "").toLowerCase();
  return l.includes("home") ? HouseIcon : l.includes("school") ? GraduationCapIcon : l.includes("work") || l.includes("office") ? BriefcaseIcon : MapPinIcon;
};

/** Figma 32 Saved places. Tapping a place edits it in the Add a place form. */
export default function SavedPlaces() {
  const nav = useNav();
  const { ready } = useSessionGuard("in");
  const { places } = useSaved();
  const { data: stops } = useStops();
  if (!ready) return null;
  return (
    <CommuterPage active="account" className="pt-safe">
      <AppBar title="Saved places" backLabel="Back to account" onBack={() => nav.back()} />
      <ScrollView className="flex-1 px-4 md:px-6" contentContainerClassName="pb-6">
        {places.map((p) => (
          <SettingsRow
            key={p.id}
            title={p.label || "Saved place"}
            description={stops?.find((s) => s.id === p.stop_id)?.name ?? undefined}
            icon={iconFor(p.label)}
            onPress={() => nav.push(`/account/places/new?id=${p.id}`)}
          />
        ))}
        <SettingsRow title="Add a place" icon={PlusIcon} trailing="none" onPress={() => nav.push("/account/places/new")} />
        <View className="pt-3">
          <Text className="font-sans text-body-sm text-text-muted">Saved places show first when you search for a destination.</Text>
        </View>
      </ScrollView>
    </CommuterPage>
  );
}
