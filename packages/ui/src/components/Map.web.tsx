/// <reference types="google.maps" />
import { AdvancedMarker, AdvancedMarkerAnchorPoint, APIProvider, Map as GoogleMap, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { CrosshairIcon } from "phosphor-react-native/src/icons/Crosshair";
import colors from "../theme/colors";
import { IconButton } from "./IconButton";
import { MapCallout } from "./MapCallout";
import { DEFAULT_CENTER, type LatLng, type MapProps, type MapVehicleItem } from "./Map.types";
import { MapPlaceholder } from "./MapPlaceholder";
import { StopMarker } from "./StopMarker";
import { VehicleMarker } from "./VehicleMarker";
import { YouMarker } from "./YouMarker";

export * from "./Map.types";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;
const GLIDE_MS = 1000;

/** Eases a position toward each new ping so a vehicle glides instead of jumping. */
function useGlide(target: LatLng): LatLng {
  const [pos, setPos] = useState(target);
  const shown = useRef(target);
  useEffect(() => {
    const from = shown.current;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / GLIDE_MS);
      const next = { lat: from.lat + (target.lat - from.lat) * t, lng: from.lng + (target.lng - from.lng) * t };
      shown.current = next;
      setPos(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target.lat, target.lng]);
  return pos;
}

function GlidingVehicle({ v }: { v: MapVehicleItem }) {
  const pos = useGlide(v);
  return (
    <AdvancedMarker position={pos} anchorPoint={AdvancedMarkerAnchorPoint.CENTER} zIndex={v.selected ? 20 : 10}>
      <View className="items-center">
        {v.selected && v.eta && (
          <View className="absolute bottom-[48px]">
            <MapCallout name={v.label} eta={v.eta} />
          </View>
        )}
        <VehicleMarker type={v.type} status={v.status} seatsLeft={v.seatsLeft} selected={v.selected} label={v.label} onPress={v.onPress} />
      </View>
    </AdvancedMarker>
  );
}

function RoutePath({ path }: { path: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || path.length < 2) return;
    const line = new google.maps.Polyline({ path, strokeColor: colors.accent, strokeWeight: 4, strokeOpacity: 1, map });
    return () => line.setMap(null);
  }, [map, path]);
  return null;
}

/** Moves the camera: refits when the points change, otherwise centers once. Hands the map up for the recenter button. */
function Camera({ fit, center, leftInset = 0, onMap }: Pick<MapProps, "fit" | "center" | "leftInset"> & { onMap: (m: google.maps.Map | null) => void }) {
  const map = useMap();
  useEffect(() => onMap(map), [map, onMap]);
  const fitKey = (fit ?? []).map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|");
  useEffect(() => {
    if (!map || !fit || fit.length === 0) return;
    if (fit.length === 1) {
      map.setCenter(fit[0]);
      map.setZoom(16);
      if (leftInset) map.panBy(-leftInset / 2, 0);
      return;
    }
    const b = new google.maps.LatLngBounds();
    fit.forEach((p) => b.extend(p));
    map.fitBounds(b, { top: 100, left: 40 + leftInset, right: 40, bottom: 40 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitKey]);
  const centered = useRef(false);
  useEffect(() => {
    if (!map || !center || (fit && fit.length > 0) || centered.current) return;
    centered.current = true;
    map.setCenter(center);
    map.setZoom(16);
    if (leftInset) map.panBy(-leftInset / 2, 0);
  }, [map, center, fit]);
  return null;
}

/** Google Maps with the default style. Markers are the shared RN views inside Advanced Markers. */
export function TransitMap({ center, fit, routes = [], vehicles = [], stops = [], you, bottomInset = 0, leftInset = 0 }: MapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  if (!KEY || !MAP_ID) return <MapPlaceholder />;
  const start = center ?? fit?.[0] ?? DEFAULT_CENTER;
  return (
    <View className="absolute inset-0 bg-surface-muted">
      {/* The map ends at the sheet's top edge, so the Google logo and credit stay visible. */}
      <View className="absolute inset-x-0 top-0" style={{ bottom: bottomInset }}>
        <APIProvider apiKey={KEY}>
          <GoogleMap
            mapId={MAP_ID}
            defaultCenter={start}
            defaultZoom={15}
            disableDefaultUI
            clickableIcons={false}
            gestureHandling="greedy"
            style={{ width: "100%", height: "100%" }}
          >
            <Camera fit={fit} center={center} leftInset={leftInset} onMap={setMap} />
            {routes.map((r) => (
              <RoutePath key={r.id} path={r.path} />
            ))}
            {stops.map((s) => (
              <AdvancedMarker key={s.id} position={s} anchorPoint={AdvancedMarkerAnchorPoint.CENTER} zIndex={5}>
                <StopMarker kind={s.kind} name={s.name} onPress={s.onPress} />
              </AdvancedMarker>
            ))}
            {you && (
              <AdvancedMarker position={you} anchorPoint={AdvancedMarkerAnchorPoint.CENTER} zIndex={6}>
                <YouMarker />
              </AdvancedMarker>
            )}
            {vehicles.map((v) => (
              <GlidingVehicle key={v.id} v={v} />
            ))}
          </GoogleMap>
        </APIProvider>
        {center && (
          <View className="absolute bottom-[16px] right-[16px]">
            <IconButton
              variant="surface"
              icon={CrosshairIcon}
              label="Recenter map"
              onPress={() => {
                map?.panTo(center);
                map?.setZoom(16);
              }}
            />
          </View>
        )}
      </View>
    </View>
  );
}
