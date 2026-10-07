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

// Read once so taps can decide synchronously (iOS only prompts inside the tap).
let snoozedUntil = 0;
void AsyncStorage.getItem(SNOOZE_KEY)
  .then((v) => void (snoozedUntil = Number(v) || 0))
  .catch(() => undefined);

/** "Turn on alerts": call straight from that button's press so the permission prompt stays inside the tap. */
export const acceptPrimer = (token: string) => {
  show(null);
  void enablePush(token).catch(() => undefined);
};

/** "Not now": no primer on this device for 7 days. */
export const declinePrimer = () => {
  show(null);
  snoozedUntil = Date.now() + SNOOZE_MS;
  void AsyncStorage.setItem(SNOOZE_KEY, String(snoozedUntil)).catch(() => undefined);
};

/**
 * For taps that turn an alert on. While permission is undecided and the primer is not snoozed it shows the primer,
 * otherwise it goes straight to enablePush. The snooze hides only the primer, so a tap still prompts.
 * Push is best effort: the alert still lands in the inbox.
 */
export function usePushOnTap() {
  const { session } = useSession();
  return () => {
    if (!session) return;
    const token = session.access_token;
    const decide = (undecided: boolean) =>
      undecided && !(snoozedUntil > Date.now()) ? show(token) : void enablePush(token).catch(() => undefined);
    // Web answers synchronously, keeping the prompt inside the tap. Native has no such rule.
    const u: boolean | Promise<boolean> = pushUndecided();
    if (typeof u === "boolean") decide(u);
    else void u.then(decide, () => decide(false));
  };
}
