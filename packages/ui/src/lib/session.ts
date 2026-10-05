import { useEffect } from "react";
import { useNav } from "../lib/nav";
import { useSession } from "../data/hooks";

/**
 * Routing guard for the onboarding flow, from the plan's route map: signed-out users go to `/`,
 * signed-in users who open `/` go to `/home`. While the session is still loading nothing renders,
 * so a signed-in user never flashes the welcome screen.
 *
 * @param only `"out"` guards the signed-out screens (01-05), `"in"` guards `/`.
 */
export function useSessionGuard(only: "in" | "out") {
  const { session, loading } = useSession();
  const { replace, push } = useNav();

  useEffect(() => {
    if (loading) return;
    if (only === "out" && session) replace("/home");
    if (only === "in" && !session) replace("/");
  }, [loading, only, replace, session]);

  return { ready: !loading, signedIn: !!session, go: { replace, push } };
}