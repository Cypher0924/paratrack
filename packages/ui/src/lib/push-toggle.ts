import { useSession } from "../data/hooks";
import { enablePush } from "./push";

/**
 * For taps that turn an alert on. Uses the token already in memory so the permission prompt stays inside the tap
 * (iOS requires that). Push is best effort: the alert still lands in the inbox.
 */
export function usePushOnTap() {
  const { session } = useSession();
  return () => {
    if (session) void enablePush(session.access_token).catch(() => undefined);
  };
}
