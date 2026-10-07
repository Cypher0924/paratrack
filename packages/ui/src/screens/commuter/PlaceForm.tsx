import { MapPinIcon } from "phosphor-react-native/src/icons/MapPin";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { AppBar } from "../../components/AppBar";
import { Button } from "../../components/Button";
import { CommuterPage } from "../../components/CommuterPage";
import { SettingsRow } from "../../components/SettingsRow";
import { TextField } from "../../components/TextField";
import { useStops } from "../../data/hooks";
import { addPlace, deletePlace, updatePlace, useSaved } from "../../data/saved";
import { useNav, useQuery } from "../../lib/nav";
import { useSessionGuard } from "../../lib/session";

/** Figma 33 Add a place. With `?id=` it edits that place and shows Delete. */
export default function PlaceForm() {
  const nav = useNav();
  const { ready } = useSessionGuard("in");
  const { id } = useQuery();
  const { places } = useSaved();
  const { data: stops } = useStops();
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [stopId, setStopId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const editing = id ? places.find((p) => p.id === id) : undefined;
  useEffect(() => {
    if (!editing) return;
    setName(editing.label ?? "");
    setStopId(editing.stop_id);
    setQ(stops?.find((s) => s.id === editing.stop_id)?.name ?? "");
  }, [editing, stops]);

  const picked = stops?.find((s) => s.id === stopId);
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (picked) return [];
    return (stops ?? []).filter((s) => s.name && (!t || s.name.toLowerCase().includes(t))).slice(0, 6);
  }, [stops, q, picked]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      nav.back();
    } catch {
      setError("Could not save. Try again.");
      setBusy(false);
    }
  };
  if (!ready) return null;
  return (
    <CommuterPage active="account" className="pt-safe">
      <AppBar title={id ? "Edit place" : "Add a place"} backLabel="Back to saved places" onBack={() => nav.back()} />
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-6 pt-4 md:px-6" keyboardShouldPersistTaps="handled">
        <TextField label="Name" placeholder="Home, School, Work" value={name} onChangeText={setName} />
        <View className="gap-2">
          <TextField
            label="Nearest stop"
            placeholder="Search a stop"
            leadingIcon={MapPinIcon}
            value={q}
            onChangeText={(t) => {
              setStopId(null);
              setQ(t);
            }}
            helper="We use the stop, not your exact address."
          />
          {matches.map((s) => (
            <SettingsRow
              key={s.id}
              title={s.name!}
              icon={MapPinIcon}
              trailing="none"
              onPress={() => {
                setStopId(s.id);
                setQ(s.name!);
              }}
            />
          ))}
          {!picked && q.trim() !== "" && matches.length === 0 && <Text className="font-sans text-body-sm text-text-muted">No stops match.</Text>}
        </View>
        {error !== "" && <Text className="font-sans text-body-sm text-danger-text">{error}</Text>}
        <Button
          label="Save place"
          loading={busy}
          disabled={!name.trim() || !stopId}
          onPress={() => run(() => (editing ? updatePlace(editing.id, name.trim(), stopId!) : addPlace(name.trim(), stopId!)))}
        />
        {editing && <Button label="Delete place" variant="danger" disabled={busy} onPress={() => run(() => deletePlace(editing.id))} />}
      </ScrollView>
    </CommuterPage>
  );
}
