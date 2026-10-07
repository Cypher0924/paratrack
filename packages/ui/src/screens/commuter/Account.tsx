import { BellIcon } from "phosphor-react-native/src/icons/Bell";
import { BookmarkIcon } from "phosphor-react-native/src/icons/Bookmark";
import { GraduationCapIcon } from "phosphor-react-native/src/icons/GraduationCap";
import { MapPinIcon } from "phosphor-react-native/src/icons/MapPin";
import { ReceiptIcon } from "phosphor-react-native/src/icons/Receipt";
import { SignOutIcon } from "phosphor-react-native/src/icons/SignOut";
import { SteeringWheelIcon } from "phosphor-react-native/src/icons/SteeringWheel";
import { WarningIcon } from "phosphor-react-native/src/icons/Warning";
import { Pressable, ScrollView, Text, View } from "react-native";
import { CommuterPage } from "../../components/CommuterPage";
import { Avatar } from "../../components/Avatar";
import { SegmentedControl } from "../../components/SegmentedControl";
import { SettingsRow } from "../../components/SettingsRow";
import { useNotifications, useProfile, useRoutes, useSession, useStops } from "../../data/hooks";
import { useSaved } from "../../data/saved";
import { useNav } from "../../lib/nav";
import { usePushOnTap } from "../../lib/push-toggle";
import { useSessionGuard } from "../../lib/session";
import { setAppMode, useAppMode } from "../../data/mode";
import { AddToHomeScreenHint } from "../../components/AddToHomeScreenHint";
import colors from "../../theme/colors";

const fareOptions = [
  { value: "regular", label: "Regular" },
  { value: "student", label: "Student" },
  { value: "senior", label: "Senior" },
  { value: "pwd", label: "PWD" },
] as const;

const fareNote = {
  regular: "Full fare",
  student: "Student fare, 20% off",
  senior: "Senior fare, 20% off",
  pwd: "PWD fare, 20% off",
} as const;

/** "639171234567" to "+63 917 123 4567". */
const prettyPhone = (p: string | undefined) => {
  const d = (p ?? "").replace(/\D/g, "");
  return d.startsWith("63") && d.length === 12 ? `+63 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}` : p ? `+${d}` : "";
};

const Heading = ({ children }: { children: string }) => (
  <Text className="font-sans-medium text-body-sm text-text-muted">{children}</Text>
);

/** Figma 14 Account. */
export default function Account() {
  const nav = useNav();
  const { ready } = useSessionGuard("in");
  const { user, signOut } = useSession();
  const pushOn = usePushOnTap();
  const mode = useAppMode();
  const { profile, update } = useProfile();
  const { unreadCount } = useNotifications();
  const { places, routeIds } = useSaved();
  const { data: stops } = useStops();
  const { data: routes } = useRoutes();
  if (!ready) return null;
  const fareType = profile?.fare_type ?? "regular";
  const name = profile?.display_name || "Your account";
  return (
    <CommuterPage tab="account" unread={unreadCount} className="pt-safe">
      <ScrollView contentContainerClassName="gap-5 px-4 pb-6 pt-4 md:px-6 md:pt-6">
        <Text role="heading" className="font-display text-title-lg text-foreground">
          Account
        </Text>
        <View className="flex-row items-center gap-3">
          <Avatar name={name} size={48} />
          <View className="flex-1 gap-[2px]">
            <Text className="font-sans-medium text-title-sm text-foreground">{name}</Text>
            <Text className="font-sans text-body-sm text-text-muted">{prettyPhone(user?.phone)}</Text>
          </View>
        </View>

        <View>
          <Heading>Riding</Heading>
          <SettingsRow title="Fare type" description={fareNote[fareType]} icon={GraduationCapIcon} trailing="none" />
          <View className="border-b border-border-subtle py-3">
            <SegmentedControl options={fareOptions} value={fareType} onChange={(v) => update({ fare_type: v })} />
          </View>
          <SettingsRow title="Your trips" icon={ReceiptIcon} onPress={() => nav.push("/account/trips")} />
          <SettingsRow title="Saved places" icon={MapPinIcon} trailing="none" />
          {places.length === 0 && <Text className="py-2 pl-9 font-sans text-body-sm text-text-muted">None saved yet</Text>}
          {places.map((p) => (
            <Text key={p.id} className="py-2 pl-9 font-sans text-body-md text-text-secondary">
              {p.label || stops?.find((s) => s.id === p.stop_id)?.name || "Saved place"}
            </Text>
          ))}
          <SettingsRow title="Saved routes" icon={BookmarkIcon} trailing="none" />
          {routeIds.length === 0 && <Text className="py-2 pl-9 font-sans text-body-sm text-text-muted">None saved yet</Text>}
          {routeIds.map((id) => (
            <Pressable key={id} role="button" onPress={() => nav.push(`/route/${id}`)} className="py-2 pl-9">
              <Text className="font-sans text-body-md text-text-secondary">{routes?.find((r) => r.id === id)?.name ?? "Route"}</Text>
            </Pressable>
          ))}
        </View>

        <View>
          <Heading>Notifications</Heading>
          <SettingsRow
            title="Arrival alerts"
            description="When your ride is 2 min away"
            icon={BellIcon}
            trailing="switch"
            checked={profile?.arrival_alerts ?? true}
            onCheckedChange={(v) => {
              if (v) pushOn();
              update({ arrival_alerts: v });
            }}
          />
          <SettingsRow
            title="Service updates"
            description="Delays, full vehicles, and route changes"
            icon={WarningIcon}
            trailing="switch"
            checked={profile?.service_updates ?? true}
            onCheckedChange={(v) => {
              if (v) pushOn();
              update({ service_updates: v });
            }}
          />
          <AddToHomeScreenHint />
        </View>

        <View>
          {mode === "driver" ? (
            <SettingsRow
              title="Switch to commuter mode"
              icon={SteeringWheelIcon}
              onPress={() => {
                setAppMode("commuter");
                nav.replace("/home");
              }}
            />
          ) : (
            <SettingsRow title="Switch to driver mode" icon={SteeringWheelIcon} onPress={() => nav.push("/driver/verify")} />
          )}
          <Pressable
            role="button"
            onPress={async () => {
              await signOut();
              nav.replace("/");
            }}
            className="min-h-control-md w-full flex-row items-center gap-3 border-b border-border-subtle py-[14px]"
          >
            <SignOutIcon size={24} color={colors["danger-text"]} />
            <Text className="font-sans text-body-md text-danger-text">Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </CommuterPage>
  );
}
