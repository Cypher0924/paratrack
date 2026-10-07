import { clockTime } from "@repo/core";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { ArmchairIcon } from "phosphor-react-native/src/icons/Armchair";
import { CoinsIcon } from "phosphor-react-native/src/icons/Coins";
import { GaugeIcon } from "phosphor-react-native/src/icons/Gauge";
import { ShieldWarningIcon } from "phosphor-react-native/src/icons/ShieldWarning";
import { AppBar } from "../../components/AppBar";
import { Button } from "../../components/Button";
import { CommuterPage } from "../../components/CommuterPage";
import { RadioCard } from "../../components/RadioCard";
import { TextField } from "../../components/TextField";
import { vehicleKinds } from "../../components/VehicleMarker";
import { useTrip } from "../../data/hooks";
import { sendReport, type ReportKind } from "../../data/trips";
import { supabase } from "../../lib/supabase";
import { useNav, useParams } from "../../lib/nav";
import { useSessionGuard } from "../../lib/session";
import { showToast } from "../../lib/toast";
import { kindOf } from "./shared";
import { useTripSummary } from "./tripSummary";

const kinds: { value: ReportKind; title: string; description: string; icon: typeof ArmchairIcon }[] = [
  { value: "seats_wrong", title: "Seat count was wrong", description: "The app showed seats but the vehicle was full.", icon: ArmchairIcon },
  { value: "overcharged", title: "Overcharged fare", description: "You paid more than the fare shown.", icon: CoinsIcon },
  { value: "unsafe_driving", title: "Unsafe driving", description: "Speeding, overloading or reckless driving.", icon: GaugeIcon },
  { value: "safety", title: "Safety concern", description: "Harassment or anyone who made you feel unsafe.", icon: ShieldWarningIcon },
];

const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "Asia/Manila" });

/** Figma 39 Report a problem. */
export default function TripReport() {
  const { ready } = useSessionGuard("in");
  const { id } = useParams<{ id: string }>();
  const nav = useNav();
  const { trip } = useTrip(id);
  const { summarize } = useTripSummary();
  const [kind, setKind] = useState<ReportKind | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const send = async () => {
    if (!trip || !kind) return;
    setBusy(true);
    setError(undefined);
    try {
      await sendReport(supabase, { tripId: trip.id, kind, note });
      showToast("Report sent. Thank you.");
      nav.back();
    } catch {
      setError("We could not send your report. Check your connection and try again.");
      setBusy(false);
    }
  };

  if (!ready) return null;
  const s = trip ? summarize(trip) : null;
  const at = trip ? new Date(trip.boarded_at ?? trip.created_at) : null;
  const header = trip && at
    ? `${s?.vehicle?.label ?? vehicleKinds[kindOf(s?.route)].label}${s?.vehicle?.plate ? `, plate ${s.vehicle.plate}` : ""}, ${dayFmt.format(at)} at ${clockTime(at)}`
    : "";

  return (
    <CommuterPage className="pt-safe">
      <AppBar title="Report a problem" onBack={() => nav.back()} />
      <ScrollView className="flex-1" contentContainerClassName="gap-2 px-4 pb-6 pt-4 md:px-6">
        <Text className="font-sans text-body-sm text-text-muted">{header}</Text>
        <View role="radiogroup" className="gap-2">
          {kinds.map((k) => (
            <RadioCard key={k.value} selected={kind === k.value} title={k.title} description={k.description} icon={k.icon} onPress={() => setKind(k.value)} />
          ))}
        </View>
        <TextField
          label="What happened (optional)"
          helper="Reports go to the cooperative. We never share your number."
          error={error}
          value={note}
          onChangeText={setNote}
          maxLength={500}
          className="mt-2"
        />
      </ScrollView>
      <View className="px-4 pb-6 md:px-6">
        <Button label="Send report" disabled={!kind || !trip} loading={busy} onPress={send} />
      </View>
    </CommuterPage>
  );
}
