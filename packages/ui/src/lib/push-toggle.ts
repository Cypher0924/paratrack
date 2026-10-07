import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSession } from "../data/hooks";
import { enablePush, pushUndecided } from "./push";

// Primer state is module-level so callers keep one function and a single <PushPrimer /> renders the sheet.
const SNOOZE_KEY = "paratrack.pushPrimerUntil";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const listeners = new Set<(token: string | null) => void>();
export const subscribePrimer = (l: (token: string | null) => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
const show = (token: string | null) => listeners.forEach((l) => l(token));

/** "Turn on alerts": call straight from that button's press so the permission prompt stays inside the tap. */
export const acceptPrimer = (token: string) => {
  show(null);
  void enablePush(token).catch(() => undefined);
};

/** "Not now": no primer on this device for 7 days. */
export const declinePrimer = () => {
  show(null);
  void AsyncStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS)).catch(() => undefined);
};

/**
 * For taps that turn an alert on. While permission is undecided it shows the primer, otherwise it goes straight
 * to enablePush. Push is best effort: the alert still lands in the inbox.
 */
export function usePushOnTap() {
  const { session } = useSession();
  return () => {
    if (!session) return;
    const token = session.access_token;
    void (async () => {
      if (!(await pushUndecided().catch(() => false))) return void enablePush(token).catch(() => undefined);
      const until = Number(await AsyncStorage.getItem(SNOOZE_KEY).catch(() => null));
      if (!(until > Date.now())) show(token);
    })();
  };
}
