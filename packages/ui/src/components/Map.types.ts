import type { SeatStatus } from "@repo/core";
import type { VehicleType } from "./VehicleMarker";

export type LatLng = { lat: number; lng: number };

export type MapVehicleItem = LatLng & {
  id: string;
  type: VehicleType;
  status: SeatStatus;
  seatsLeft: number;
  /** Spoken name and callout title, for example "E-jeep 18". */
  label: string;
  selected?: boolean;
  /** Shows a callout above the selected marker, for example "7 min". */
  eta?: string;
  onPress?: () => void;
};

export type MapStopItem = LatLng & {
  id: string;
  name: string;
  kind?: "stop" | "yours" | "destination";
  onPress?: () => void;
};

export type MapRouteItem = { id: string; path: LatLng[] };

export type MapProps = {
  /** Where the recenter button goes. Also the first camera position when `fit` is empty. */
  center?: LatLng | null;
  /** Points to bring into view. The camera refits when they change. */
  fit?: LatLng[];
  routes?: MapRouteItem[];
  vehicles?: MapVehicleItem[];
  stops?: MapStopItem[];
  you?: LatLng | null;
  /** Height of whatever covers the bottom of the map, so the Google logo stays visible above it. */
  bottomInset?: number;
};

// Tarlac City, used when nothing else says where to look.
export const DEFAULT_CENTER: LatLng = { lat: 15.4895, lng: 120.592 };

export const PLACEHOLDER = "Map needs a Google Maps key";
