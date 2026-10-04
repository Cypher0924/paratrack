import { StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>ParaTrack spikes</Text>
      <Link href="/spike-map" style={styles.link}>
        Map
      </Link>
      <Link href="/spike-location" style={styles.link}>
        Background location
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", gap: 20 },
  header: { fontWeight: "bold", fontSize: 28 },
  link: { fontSize: 20, color: "#0a60ff" },
});
