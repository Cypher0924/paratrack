import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Client } from "./types";
import { must } from "./types";
import { useSession } from "./hooks";

export type SavedPlace = { id: string; label: string | null; stop_id: string | null };

export const fetchSavedPlaces = async (client: Client): Promise<SavedPlace[]> =>
  must(await client.from("saved_places").select("id,label,stop_id"));

export const fetchSavedRouteIds = async (client: Client): Promise<string[]> =>
  must(await client.from("saved_routes").select("route_id")).map((r) => r.route_id);

/** Own saved places and saved route ids. RLS limits both to the signed-in user. */
export const useSaved = () => {
  const { user } = useSession();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [routeIds, setRouteIds] = useState<string[]>([]);
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    fetchSavedPlaces(supabase).then(setPlaces, () => {});
    fetchSavedRouteIds(supabase).then(setRouteIds, () => {});
  }, [userId]);
  return { places, routeIds };
};
