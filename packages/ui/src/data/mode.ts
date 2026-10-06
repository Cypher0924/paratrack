import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export type AppMode = "commuter" | "driver";

// Which tab set Alerts and Account show. Opening /driver switches to driver, Home or the Account switch back to commuter.
const KEY = "paratrack.mode";
const listeners = new Set<(m: AppMode) => void>();
let current: AppMode | undefined;

export function setAppMode(mode: AppMode) {
  if (current === mode) return;
  current = mode;
  listeners.forEach((l) => l(mode));
  void AsyncStorage.setItem(KEY, mode);
}

export function useAppMode(): AppMode {
  const [mode, setMode] = useState<AppMode>(current ?? "commuter");
  useEffect(() => {
    listeners.add(setMode);
    if (current === undefined)
      AsyncStorage.getItem(KEY).then((v) => {
        current ??= v === "driver" ? "driver" : "commuter";
        setMode(current);
      });
    return () => {
      listeners.delete(setMode);
    };
  }, []);
  return mode;
}
