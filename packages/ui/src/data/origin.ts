import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

// The stop the commuter picked instead of sharing location. Kept on the device only.
const KEY = "paratrack.originStopId";
const listeners = new Set<(id: string | null) => void>();
let current: string | null | undefined;

export async function setOriginStop(id: string | null) {
  current = id;
  listeners.forEach((l) => l(id));
  await (id ? AsyncStorage.setItem(KEY, id) : AsyncStorage.removeItem(KEY));
}

/** The picked stop id, or null. Shared across screens and kept across launches. */
export function useOriginStop(): string | null {
  const [id, setId] = useState<string | null>(current ?? null);
  useEffect(() => {
    listeners.add(setId);
    if (current === undefined)
      AsyncStorage.getItem(KEY).then((v) => {
        current ??= v;
        setId(current);
      });
    return () => {
      listeners.delete(setId);
    };
  }, []);
  return id;
}
