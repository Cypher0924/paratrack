import type { ReactNode } from "react";
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import colors from "../theme/colors";

/**
 * The Figma "Map/City" backdrop (2010:42): a stylized Tarlac City, 1 unit = 1px, drawn inside a
 * clipping viewport and offset. This is illustration artwork, not live map data — the real map
 * arrives in Task 7 with Google Maps. Markers and routes sit above it.
 *
 * Coordinates come from the Figma insets (percent of the 1000 x 1400 world frame) converted to px.
 * Roads are white on `map-land`, with a park and rotated street labels.
 */

/** [left, top, width, height] in world px. */
const roads: [number, number, number, number][] = [
  // Boulevards, drawn first so the smaller streets sit on top.
  [430, -20, 90, 1440],
  [-30, 492, 1060, 93],
  [-20, 440, 420, 120],
  [610, 515, 270, 115],
  [560, 30, 425, 375],
  [300, 800, 140, 150],
  [575, 800, 65, 50],
  [40, 1180, 80, 70],
  [700, 175, 145, 87],
  [870, 55, 80, 80],
  [735, 118, 70, 42],
  [905, 290, 55, 50],
  [590, 80, 60, 50],
  [335, 845, 70, 50],
  [300, 1115, 155, 110],
  [530, 1235, 80, 60],
  [165, 860, 70, 70],
];

/** [text, left, top, rotation] in world px. */
const labels: [string, number, number, number][] = [
  ["Romulo Blvd", 217, 419, -1.1],
  ["Rizal Ave", 226, 760, 1.4],
  ["Zamora St", 692, 1095, 1.65],
  ["MacArthur Hwy", 428, 208, -88.6],
  ["Luna St", 138, 620, -90.4],
  ["Mabini St", 823, 935, -89.1],
  ["Bonifacio Ave", 116, 1162, -33.5],
  ["Capitol Park", 338, 918, 0],
  ["SM City", 357, 1163, 0],
  ["Bus terminal", 537, 1258, 0],
  ["Plaza", 593, 818, 0],
];

export type MapPreviewProps = {
  /** Viewport size. Screens are 390 wide, the map band is 480 tall. */
  width?: number;
  height?: number;
  /** How far the 1000 x 1400 world is moved inside the viewport. */
  offsetX?: number;
  offsetY?: number;
  /** SVG path in viewport px for the route line. Omit for a map with no route. */
  routePath?: string;
  /** Markers, positioned absolutely over the map. */
  children?: ReactNode;
  className?: string;
};

export function MapPreview({
  width = 390,
  height = 480,
  offsetX = -330,
  offsetY = -600,
  routePath,
  children,
  className,
}: MapPreviewProps) {
  return (
    <View className={`overflow-hidden bg-map-land ${className ?? ""}`} style={{ width, height }}>
      <View className="absolute bg-map-land" style={{ left: offsetX, top: offsetY, width: 1000, height: 1400 }}>
        {/* Park */}
        <View className="absolute rounded-md bg-map-park" style={{ left: 548, top: 940, width: 130, height: 150 }} />
        {roads.map(([l, t, w, h]) => (
          <View key={`${l}-${t}`} className="absolute border border-map-road-casing bg-map-road" style={{ left: l, top: t, width: w, height: h }} />
        ))}
        {labels.map(([text, l, t, rot]) => (
          <Text
            key={text}
            style={{ left: l, top: t, transform: [{ rotate: `${rot}deg` }] }}
            className="absolute text-map-label font-sans-medium"
          >
            {text}
          </Text>
        ))}
      </View>
      {routePath && (
        <Svg width={width} height={height} className="absolute inset-0">
          <Path d={routePath} stroke={colors.accent} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      )}
      {children}
    </View>
  );
}