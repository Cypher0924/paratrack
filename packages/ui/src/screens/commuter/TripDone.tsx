import { tripMinutes, tripRange } from "@repo/core";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { AppBar } from "../../components/AppBar";
import { Banner } from "../../components/Banner";
import { Button } from "../../components/Button";
import { Chip } from "../../components/Chip";
import { CommuterPage } from "../../components/CommuterPage";
import { LineItem } from "../../components/LineItem";
import { StatusDisc } from "../../components/StatusDisc";
import { vehicleKinds } from "../../components/VehicleMarker";
import { useTrip } from "../../data/hooks";
import { useNav, useParams, useQuery } from "../../lib/nav";
import { useSessionGuard } from "../../lib/session";
import { useToast } from "../../lib/toast";
import { kindOf } from "./shared";
import { fareLabel, useTripSummary } from "./tripSummary";

const options = [
  { value: "on_time", label: "On time" },
  { value: "seats_right", label: "Seat count was right" },
  { value: "safe_driving", label: "Safe driving" },
  { value: "clean", label: "Clean" },
  { value: "friendly", label: "Friendly driver" },
] as const;

/** Figma 38 Trip complete. Also the recap behind a row in Your trips (41). */
export default function TripDone() {
  const { ready } = useSessionGuard("in");
  const { id } = useParams<{ id: string }>();
  const { from } = useQuery();
  const nav = useNav();
  const { trip, loaded, sendFeedback } = useTrip(id);
  const { summarize, fareType } = useTripSummary();
  const toast = useToast();
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const home = () => nav.replace("/home");
  const finish = async () => {
    setBusy(true);
    try {
      if (picked.length) await sendFeedback(picked);
      home();
    } catch {
      setBusy(false);
    }
  };

  if (!ready) return null;
  const s = trip ? summarize(trip) : null;
  const sent = (trip?.feedback.length ?? 0) > 0;
  const mins = trip ? tripMinutes(trip) : null;
  const vehicleName = s?.vehicle?.label ?? vehicleKinds[kindOf(s?.route)].label;
  const toggle = (v: string) => setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  return (
    <CommuterPage className="pt-safe">
      <AppBar title="Trip complete" onBack={() => (from === "trips" ? nav.back() : home())} />
      {loaded && !trip ? (
        <Text className="px-4 py-6 font-sans text-body-md text-text-secondary md:px-6">We could not find this trip.</Text>
      ) : (
        <>
          <ScrollView className="flex-1" contentContainerClassName="gap-3 px-4 pb-6 pt-4 md:px-6">
            <StatusDisc tone="success" icon={CheckIcon} />
            <Text role="heading" className="font-sans-medium text-title-md text-foreground">
              {`You got off at ${s?.alight ?? ""}`}
            </Text>
            {trip && (
              <Text className="font-sans text-body-sm text-text-muted">
                {`${vehicleName}${s?.route ? ` on ${s.route.name}` : ""}, ${tripRange(trip, new Date())}`}
              </Text>
            )}
            <View>
              <LineItem label={`Fare paid, ${fareLabel[fareType]}`} amount={s?.fare || "—"} />
              <LineItem label="Trip time" amount={mins === null ? "—" : `${mins} min`} />
            </View>
            {trip && !sent && (
              <>
                <Text className="font-sans-medium text-body-md text-foreground">How was this ride?</Text>
                <View className="flex-row flex-wrap gap-x-2">
                  {options.map((o) => (
                    <Chip key={o.value} label={o.label} selected={picked.includes(o.value)} onPress={() => toggle(o.value)} />
                  ))}
                </View>
              </>
            )}
            {toast && <Banner tone="success" title={toast} />}
          </ScrollView>
          <View className="gap-2 px-4 pb-6 md:px-6">
            {trip && !sent && <Button label={picked.length ? "Send feedback" : "Done"} loading={busy} onPress={finish} />}
            <Button
              label="Report a problem"
              variant={sent ? "secondary" : "ghost"}
              disabled={busy || !trip}
              onPress={() => trip && nav.push(`/trip/${trip.id}/report`)}
            />
          </View>
        </>
      )}
    </CommuterPage>
  );
}
