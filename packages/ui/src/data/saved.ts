import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Client } from "./types";
import { must } from "./types";
import { useSession } from "./hooks";

export type SavedPlace = { id: string; label: string | null; stop_id: string | null };
export type SavedRoute = { route_id: string; alerts: boolean };

export const fetchSavedPlaces = async (client: Client): Promise<SavedPlace[]> =>
  must(await client.from("saved_places").select("id,label,stop_id").order("label"));

export const fetchSavedRoutes = async (client: Client): Promise<SavedRoute[]> =>
  must(await client.from("saved_routes").select("route_id,alerts"));

export const fetchSavedRouteIds = async (client: Client): Promise<string[]> =>
  (await fetchSavedRoutes(client)).map((r) => r.route_id);

// Every mounted useSaved refetches after a write, so screens stay in step.
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());
const done = async (p: PromiseLike<{ error: { message: string } | null }>) => {
  const { error } = await p;
  changed();
  if (error) throw new Error(error.message);
};

export const addPlace = (label: string, stopId: string) =>
  done(supabase.from("saved_places").insert({ label, stop_id: stopId }));
export const updatePlace = (id: string, label: string, stopId: string) =>
  done(supabase.from("saved_places").update({ label, stop_id: stopId }).eq("id", id));
export const deletePlace = (id: string) => done(supabase.from("saved_places").delete().eq("id", id));
export const saveRoute = (routeId: string) =>
  done(supabase.from("saved_routes").upsert({ route_id: routeId, alerts: true }));
export const unsaveRoute = (routeId: string) => done(supabase.from("saved_routes").delete().eq("route_id", routeId));
export const setRouteAlerts = (routeId: string, alerts: boolean) =>
  done(supabase.from("saved_routes").update({ alerts }).eq("route_id", routeId));

/** Own saved places and routes. RLS limits both to the signed-in user. Refetches after any write above. */
export const useSaved = () => {
  const { user } = useSession();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const userId = user?.id;
  const refresh = useCallback(() => {
    if (!userId) return;
    fetchSavedPlaces(supabase).then(setPlaces, () => {});
    fetchSavedRoutes(supabase).then(setRoutes, () => {});
  }, [userId]);
  useEffect(() => {
    refresh();
    listeners.add(refresh);
    return () => void listeners.delete(refresh);
  }, [refresh]);
  return { places, routes, routeIds: routes.map((r) => r.route_id), refresh };
};
