import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useOnline } from "../lib/online";
import { checkCode, fetchProfile, sendCode, updateProfile } from "./auth";
import { useCached } from "./cache";
import { computeFare, computeNearby } from "./compute";
import { fetchNotifications, markAllRead as markAllReadQuery, unreadCount } from "./notifications";
import { fetchLiveVehicles, fetchRouteStops, fetchRoutes, fetchStops, mergeLive } from "./queries";
import { endTrip as endTripQuery, fetchActiveTrips, setOnboard as setOnboardQuery, setTripAlerts as setTripAlertsQuery, startTrip as startTripQuery } from "./trips";
import type { AppNotification, FareType, LiveVehicle, Profile, ProfilePatch, Trip, VehicleLive } from "./types";

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return {
    session,
    user: session?.user ?? null,
    loading,
    signInWithPhone: (e164: string) => sendCode(supabase, e164),
    verifyCode: (e164: string, code: string) => checkCode(supabase, e164, code),
    signOut: () => supabase.auth.signOut(),
  };
};

export const useProfile = () => {
  const { user } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return setProfile(null);
    fetchProfile(supabase, userId).then(setProfile, setError);
  }, [userId]);
  const update = useCallback(
    async (patch: ProfilePatch) => {
      if (!userId) return;
      setProfile(await updateProfile(supabase, userId, patch));
    },
    [userId],
  );
  return { profile, loading: !!userId && !profile && !error, error, update };
};

export const useRoutes = () => useCached("routes", () => fetchRoutes(supabase));
export const useStops = () => useCached("stops", () => fetchStops(supabase));
export const useAllRouteStops = () => useCached("route_stops", () => fetchRouteStops(supabase));

export const useRouteStops = (routeId: string | undefined) => {
  const { data, error, loading } = useAllRouteStops();
  const stops = useMemo(() => (data ?? []).filter((rs) => rs.routeId === routeId), [data, routeId]);
  return { data: routeId ? stops : [], error, loading };
};

export type LiveStatus = "connecting" | "live" | "offline";

// supabase.channel(name) returns the existing channel for a reused name, so each hook instance needs its own.
let channelSeq = 0;

export const useLiveVehicles = () => {
  const online = useOnline();
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [channel, setChannel] = useState<LiveStatus>("connecting");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!online) return;
    let active = true;
    const load = () =>
      fetchLiveVehicles(supabase).then(
        (v) => {
          if (!active) return;
          setVehicles(v);
          setLastUpdate(new Date());
        },
        () => active && setChannel("offline"),
      );
    const ch = supabase
      .channel(`vehicle_live:${++channelSeq}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicle_live" }, (p) => {
        if (!p.new || !("vehicle_id" in p.new)) return;
        setVehicles((vs) => mergeLive(vs, p.new as VehicleLive));
        setLastUpdate(new Date());
      })
      .subscribe((s) => {
        if (!active) return;
        if (s === "SUBSCRIBED") {
          setChannel("live");
          load(); // catches anything missed before the socket opened or while it was down
        } else setChannel(s === "CLOSED" || s === "CHANNEL_ERROR" || s === "TIMED_OUT" ? "offline" : "connecting");
      });
    load();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [online]);

  const status: LiveStatus = !online ? "offline" : channel;
  return { vehicles, status, lastUpdate };
};

export const useNearby = (position: { lat: number; lng: number } | null) => {
  const { data: routes } = useRoutes();
  const { data: routeStops } = useAllRouteStops();
  const { vehicles, status, lastUpdate } = useLiveVehicles();
  const lat = position?.lat;
  const lng = position?.lng;
  const rows = useMemo(
    () => (lat === undefined || lng === undefined || !routes || !routeStops ? [] : computeNearby({ lat, lng }, routes, routeStops, vehicles)),
    [lat, lng, routes, routeStops, vehicles],
  );
  return { rows, status, loading: !routes || !routeStops, lastUpdate };
};

export const useTrips = () => {
  const { user } = useSession();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loaded, setLoaded] = useState(false);
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return setTrips([]);
    fetchActiveTrips(supabase)
      .then(setTrips, () => {})
      .finally(() => setLoaded(true));
  }, [userId]);
  const replace = (t: Trip) =>
    setTrips((ts) => (t.status === "ended" ? ts.filter((x) => x.id !== t.id) : ts.some((x) => x.id === t.id) ? ts.map((x) => (x.id === t.id ? t : x)) : [t, ...ts]));
  return {
    trips,
    loaded,
    startTrip: async (a: { vehicleId: string; boardStopId: string; alightStopId: string }) => {
      const t = await startTripQuery(supabase, a);
      replace(t);
      return t;
    },
    setOnboard: async (tripId: string) => replace(await setOnboardQuery(supabase, tripId)),
    endTrip: async (tripId: string) => replace(await endTripQuery(supabase, tripId)),
    setTripAlerts: async (tripId: string, alerts: { arrivalAlert?: boolean; paraAlert?: boolean }) =>
      replace(await setTripAlertsQuery(supabase, tripId, alerts)),
  };
};

export const useNotifications = () => {
  const { user } = useSession();
  const [items, setItems] = useState<AppNotification[]>([]);
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return setItems([]);
    let active = true;
    fetchNotifications(supabase).then((n) => active && setItems(n), () => {});
    // RLS limits Realtime delivery to this user's rows.
    const ch = supabase
      .channel(`notifications:${userId}:${++channelSeq}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (p) =>
        setItems((n) => [p.new as AppNotification, ...n]),
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [userId]);
  const markAllRead = useCallback(async () => {
    await markAllReadQuery(supabase);
    const now = new Date().toISOString();
    setItems((n) => n.map((x) => (x.read_at ? x : { ...x, read_at: now })));
  }, []);
  return { notifications: items, unreadCount: unreadCount(items), markAllRead };
};

export const useFare = (routeId: string, fromStopId: string, toStopId: string, fareType: FareType) => {
  const { data: routes } = useRoutes();
  const { data: routeStops } = useAllRouteStops();
  return useMemo(
    () => (routes && routeStops ? computeFare(routes.find((r) => r.id === routeId), routeStops, fromStopId, toStopId, fareType) : null),
    [routes, routeStops, routeId, fromStopId, toStopId, fareType],
  );
};
