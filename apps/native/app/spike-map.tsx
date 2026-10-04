import { StyleSheet, View } from "react-native";
import { Camera, Map, ViewAnnotation } from "@maplibre/maplibre-react-native";

const TARLAC: [number, number] = [120.5963, 15.4755]; // [lng, lat]

export default function SpikeMap() {
  return (
    <View style={styles.flex}>
      <Map style={styles.flex} mapStyle="https://tiles.openfreemap.org/styles/liberty">
        <Camera initialViewState={{ center: TARLAC, zoom: 13 }} />
        <ViewAnnotation id="tarlac" lngLat={TARLAC}>
          <View style={styles.pin} />
        </ViewAnnotation>
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pin: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#e11d48", borderWidth: 3, borderColor: "#fff" },
});
