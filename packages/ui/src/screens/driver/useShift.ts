import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDriverVehicle, fetchVehicleLive, startShift, trackingCount, type DriverVehicle } from "../../data/driver";
import { useSession } from "../../data/hooks";
import { postDriver } from "../../lib/driverApi";
import { startSharing, stopSharing } from "../../lib/share";
import { supabase } from "../../lib/supabase";

export type ShiftError = "denied" | "unsupported" | "in_use" | "network" | null;

type SeatsResult = { seats_taken: number; marked_full: boolean };

/** The driver's shift: vehicle, online state, seat count, location sharing. */
export function useShift() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;
  // undefined = loading, null = this user hasn't verified a vehicle.
  const [vehicle, setVehicle] = useState<DriverVehicle | null | undefined>(undefined);
  const [online, setOnline] = useState(false);
  const [seats, setSeats] = useState(0);
  const [markedFull, setMarkedFull] = useState(false);
  const [position, setPosition] = useState<{ progressM: number; speedMps: number } | null>(null);
  const [trackers, setTrackers] = useState(0);
  const [error, setError] = useState<ShiftError>(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  const goneOffline = useCallback(() => {
    setOnline(false);
    setPosition(null);
    void stopSharing();
  }, []);

  // Load the vehicle, and pick up a shift that is already online (page reload, app restart).
  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      const v = await fetchDriverVehicle(supabase, userId);
      if (!active) return;
      setVehicle(v);
      if (!v) return;
      const live = await fetchVehicleLive(supabase, v.id);
      if (!active || !live?.online) return;
      setOnline(true);
      setSeats(live.seats_taken);
      setMarkedFull(live.marked_full);
      const r = await startSharing({ onError: (e) => e === "not_online" && goneOffline() });
      if (active && !r.ok) setError(r.error);
    })().catch(() => active && setVehicle(null));
    return () => {
      active = false;
    };
  }, [userId, goneOffline]);

  // While online: follow the server's progress, and the tracker count every third tick.
  const vehicleId = vehicle?.id;
  useEffect(() => {
    if (!online || !vehicleId) return;
    let active = true;
    let tick = 0;
    const poll = async () => {
      try {
        const live = await fetchVehicleLive(supabase, vehicleId);
        if (!active) return;
        if (live && !live.online) return goneOffline(); // the server ended a stale shift
        if (live?.lat != null) setPosition({ progressM: live.progress_m, speedMps: live.speed_mps });
        if (tick++ % 3 === 0) setTrackers(await trackingCount(supabase, vehicleId));
      } catch {
        // Offline: the next tick tries again.
      }
    };
    void poll();
    const id = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [online, vehicleId, goneOffline]);

  const goOnline = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const live = await startShift(supabase);
      const shared = await startSharing({ onError: (e) => e === "not_online" && goneOffline() });
      if (!shared.ok) {
        await postDriver("offline").catch(() => {});
        setError(shared.error);
        return;
      }
      setSeats(live.seats_taken);
      setMarkedFull(live.marked_full);
      setOnline(true);
    } catch (e) {
      setError(e instanceof Error && e.message === "vehicle_in_use" ? "in_use" : "network");
    } finally {
      setBusy(false);
    }
  }, [goneOffline]);

  // The latest tap wins. An older response must not overwrite a newer count.
  const send = useCallback(async (body: { count?: number; full?: boolean }) => {
    const mine = ++seq.current;
    try {
      const r = await postDriver<SeatsResult>("seats", body);
      if (mine !== seq.current) return;
      setSeats(r.seats_taken);
      setMarkedFull(r.marked_full);
      setError(null);
    } catch {
      if (mine === seq.current) setError("network");
    }
  }, []);

  const capacity = vehicle?.capacity ?? 0;
  const setCount = useCallback(
    (n: number) => {
      const next = Math.min(Math.max(n, 0), capacity);
      setSeats(next);
      void send({ count: next });
    },
    [capacity, send],
  );
  const setFull = useCallback(
    (full: boolean) => {
      setMarkedFull(full);
      void send({ full });
    },
    [send],
  );

  /** Returns false when the server could not end the shift, so the vehicle is still online. */
  const goOffline = useCallback(async () => {
    try {
      await postDriver("offline");
    } catch (e) {
      if (!(e instanceof Error && e.message === "not_online")) {
        setError("network");
        return false;
      }
    }
    goneOffline();
    return true;
  }, [goneOffline]);

  const refreshTrackers = useCallback(async () => {
    if (vehicleId) setTrackers(await trackingCount(supabase, vehicleId).catch(() => 0));
  }, [vehicleId]);

  return {
    signedOut: !sessionLoading && !session,
    loading: sessionLoading || (!!userId && vehicle === undefined),
    vehicle: vehicle ?? null,
    online,
    busy,
    seats,
    markedFull,
    position,
    trackers,
    error,
    clearError: () => setError(null),
    goOnline,
    goOffline,
    setCount,
    setFull,
    refreshTrackers,
  };
}
