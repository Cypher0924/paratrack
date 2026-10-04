import { useCallback, useEffect, useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

const TASK = "spike-location-task";
const KEY = "spike-location-log";

type Entry = { time: number; lat: number; lng: number; health?: number | string };

async function ping(): Promise<number | string> {
  try {
    const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "" },
    });
    return res.status;
  } catch (e) {
    return String(e);
  }
}

// Must be defined at module scope so it is registered when the headless task starts.
TaskManager.defineTask(TASK, async ({ data, error }) => {
  if (error) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  const health = await ping();
  const log: Entry[] = JSON.parse((await AsyncStorage.getItem(KEY)) ?? "[]");
  for (const l of locations) {
    log.push({ time: l.timestamp, lat: l.coords.latitude, lng: l.coords.longitude, health });
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(log));
});

export default function SpikeLocation() {
  const [log, setLog] = useState<Entry[]>([]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");

  const refresh = useCallback(async () => {
    setLog(JSON.parse((await AsyncStorage.getItem(KEY)) ?? "[]"));
    setRunning(await Location.hasStartedLocationUpdatesAsync(TASK));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const start = async () => {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== "granted") return setStatus("Foreground permission denied");
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== "granted") return setStatus("Background permission denied");
    await Location.startLocationUpdatesAsync(TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
      foregroundService: {
        notificationTitle: "ParaTrack",
        notificationBody: "ParaTrack is sharing your location",
      },
    });
    setStatus("Started");
    refresh();
  };

  const stop = async () => {
    if (await Location.hasStartedLocationUpdatesAsync(TASK)) await Location.stopLocationUpdatesAsync(TASK);
    setStatus("Stopped");
    refresh();
  };

  const clear = async () => {
    await AsyncStorage.removeItem(KEY);
    refresh();
  };

  let maxGap = 0;
  for (let i = 1; i < log.length; i++) maxGap = Math.max(maxGap, log[i].time - log[i - 1].time);
  const nonOk = log.filter((e) => e.health !== 200).length;

  return (
    <View style={styles.container}>
      <Text>
        {running ? "Running" : "Stopped"} {status}
      </Text>
      <View style={styles.row}>
        <Button title="Start" onPress={start} />
        <Button title="Stop" onPress={stop} />
        <Button title="Refresh" onPress={refresh} />
        <Button title="Clear" onPress={clear} />
      </View>
      <Text>
        Entries: {log.length} | Largest gap: {(maxGap / 1000).toFixed(1)} s | Non-200 health: {nonOk}
      </Text>
      <FlatList
        data={[...log].reverse()}
        keyExtractor={(e) => String(e.time)}
        renderItem={({ item }) => (
          <Text style={styles.item}>
            {new Date(item.time).toLocaleTimeString()} {item.lat.toFixed(5)},{item.lng.toFixed(5)} health {String(item.health)}
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: "#fff" },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  item: { fontSize: 12, fontFamily: "monospace" },
});
