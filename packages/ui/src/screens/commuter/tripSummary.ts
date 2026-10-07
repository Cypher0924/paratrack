import { formatPeso } from "@repo/core";
import type { FareType } from "@repo/core";
import { useCallback } from "react";
import { computeFare } from "../../data/compute";
import { useAllRouteStops, useLiveVehicles, useProfile, useRoutes, useStops } from "../../data/hooks";
import type { Trip } from "../../data/types";

export const fareLabel = {
  regular: "regular fare",
  student: "student 20% off",
  senior: "senior 20% off",
  pwd: "PWD 20% off",
} as const;

/** Looks up what a trip row or recap shows: vehicle, route, alight stop and fare. */
export const useTripSummary = () => {
  const { vehicles } = useLiveVehicles();
  const { data: routes } = useRoutes();
  const { data: routeStops } = useAllRouteStops();
  const { data: stops } = useStops();
  const { profile } = useProfile();
  const fareType: FareType = profile?.fare_type ?? "regular";
  const summarize = useCallback(
    (t: Trip) => {
      const vehicle = vehicles.find((v) => v.id === t.vehicle_id) ?? null;
      const route = routes?.find((r) => r.id === vehicle?.route_id);
      const alight = stops?.find((s) => s.id === t.alight_stop_id)?.name ?? "your stop";
      // ponytail: the fare is recomputed from current rates and the current fare type. Store it on the trip if rates change.
      const f = t.board_stop_id && t.alight_stop_id ? computeFare(route, routeStops ?? [], t.board_stop_id, t.alight_stop_id, fareType) : null;
      return { vehicle, route, alight, fare: f ? formatPeso(f.breakdown.totalCentavos) : "" };
    },
    [vehicles, routes, routeStops, stops, fareType],
  );
  return { summarize, fareType };
};
