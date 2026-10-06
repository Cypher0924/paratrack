import Constants from "expo-constants";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type MapMarker } from "react-native-maps";
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

// app.config.ts sets this when GOOGLE_MAPS_ANDROID_API_KEY was present at build time. The key itself is never exposed to JS.
const HAS_KEY = Constants.expoConfig?.extra?.hasMapsKey === true;
const GLIDE_MS = 1000;

const coord = (p: LatLng) => ({ latitude: p.lat, longitude: p.lng });

function VehicleMarkerOnMap({ v }: { v: MapVehicleItem }) {
  const ref = useRef<MapMarker>(null);
  const first = useRef(true);
  // The marker keeps its first coordinate as a prop and glides to later ones natively.
  const initial = useRef(coord(v));
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    ref.current?.animateMarkerToCoordinate(coord(v), GLIDE_MS);
  }, [v.lat, v.lng]);
  return (
    <Marker
      ref={ref}
      coordinate={initial.current}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={v.selected ? 20 : 10}
      // Views are drawn to a bitmap, so the marker must re-capture when seats or selection change.
      tracksViewChanges
      onPress={v.onPress}
    >
      <View className="items-center">
        {v.selected && v.eta && (
          <View className="absolute bottom-[48px]">
            <MapCallout name={v.label} eta={v.eta} />
          </View>
        )}
        <VehicleMarker type={v.type} status={v.status} seatsLeft={v.seatsLeft} selected={v.selected} label={v.label} />
      </View>
    </Marker>
  );
}

/** Google Maps (default style) through react-native-maps. Markers are the shared RN views. */
export function TransitMap({ center, fit, routes = [], vehicles = [], stops = [], you, bottomInset = 0 }: MapProps) {
  const ref = useRef<MapView>(null);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    // ponytail: stops and you stop re-capturing their bitmaps after first paint, markers that change props keep tracking.
    const t = setTimeout(() => setSettled(true), 1500);
    return () => clearTimeout(t);
  }, []);
  const fitKey = (fit ?? []).map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|");
  useEffect(() => {
    if (!fit || fit.length === 0) return;
    if (fit.length === 1) ref.current?.animateToRegion({ ...coord(fit[0]), latitudeDelta: 0.008, longitudeDelta: 0.008 });
    else ref.current?.fitToCoordinates(fit.map(coord), { edgePadding: { top: 100, left: 40, right: 40, bottom: 40 }, animated: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);
  const centered = useRef(false);
  useEffect(() => {
    if (!center || (fit && fit.length > 0) || centered.current) return;
    centered.current = true;
    ref.current?.animateToRegion({ ...coord(center), latitudeDelta: 0.008, longitudeDelta: 0.008 });
  }, [center, fit]);

  if (!HAS_KEY) return <MapPlaceholder />;
  const start = center ?? fit?.[0] ?? DEFAULT_CENTER;
  return (
    <View className="absolute inset-0 bg-surface-muted">
      <MapView
        ref={ref}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={{ ...coord(start), latitudeDelta: 0.012, longitudeDelta: 0.012 }}
        // The sheet covers the bottom, so pad the map to keep the Google logo above it.
        mapPadding={{ top: 0, left: 0, right: 0, bottom: bottomInset }}
        toolbarEnabled={false}
        zoomControlEnabled={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsBuildings={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {routes.map((r) => (
          <Polyline key={r.id} coordinates={r.path.map(coord)} strokeColor={colors.accent} strokeWidth={4} />
        ))}
        {stops.map((s) => (
          <Marker key={s.id} coordinate={coord(s)} anchor={{ x: 0.5, y: 0.5 }} zIndex={5} tracksViewChanges={!settled} onPress={s.onPress}>
            <StopMarker kind={s.kind} name={s.name} />
          </Marker>
        ))}
        {you && (
          <Marker coordinate={coord(you)} anchor={{ x: 0.5, y: 0.5 }} zIndex={6} tracksViewChanges={!settled}>
            <YouMarker />
          </Marker>
        )}
        {vehicles.map((v) => (
          <VehicleMarkerOnMap key={v.id} v={v} />
        ))}
      </MapView>
      {center && (
        <View className="absolute right-[16px]" style={{ bottom: bottomInset + 16 }}>
          <IconButton
            variant="surface"
            icon={CrosshairIcon}
            label="Recenter map"
            onPress={() => ref.current?.animateToRegion({ ...coord(center), latitudeDelta: 0.008, longitudeDelta: 0.008 })}
          />
        </View>
      )}
    </View>
  );
}
