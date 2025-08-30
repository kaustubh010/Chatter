import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";

export default function OnlineStatusBadge({
  online,
  compact,
}) {
  return (
    <View style={[styles.row, compact && { gap: 6 }]}>
      <View
        style={[
          styles.dot,
          { backgroundColor: online ? Colors.online : "#11182744" },
        ]}
      />
      {!compact && (
        <Text style={styles.text}>{online ? "Online" : "Offline"}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  text: { fontSize: 12, color: "#111827AA", textAlignVertical: "center" },
});
