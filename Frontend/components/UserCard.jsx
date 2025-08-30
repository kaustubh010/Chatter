import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";
import OnlineStatusBadge from "./OnlineStatusBadge";
import TypingIndicator from "./TypingIndicator";

export default function UserCard({ user, conversation, onPress }) {
  const latestText = conversation.typing
    ? ""
    : conversation.latestMessage?.text || "No messages yet";
  const time = conversation.latestMessage
    ? new Date(conversation.latestMessage.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.rowBetween}>
          <Text numberOfLines={1} style={styles.name}>
            {user.name}
          </Text>
          <Text style={styles.time}>{time}</Text>
        </View>

        <View style={styles.rowBetween}>
          <View style={styles.row}>
            {conversation.typing ? (
              <View style={styles.typingRow}>
                <TypingIndicator />
                <Text style={styles.typingText}>Typing</Text>
              </View>
            ) : (
              <Text numberOfLines={1} style={styles.preview}>
                {latestText}
              </Text>
            )}
          </View>

          {conversation.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{conversation.unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={{ marginTop: 6 }}>
          <OnlineStatusBadge online={user.isOnline} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5FE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarText: { color: Colors.primary, fontWeight: "700" },
  content: { flex: 1 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  name: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "600",
    flex: 1,
    paddingRight: 8,
  },
  time: { fontSize: 12, color: "#11182799" },
  preview: { fontSize: 13, color: "#11182799", flex: 1 },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  typingText: { fontSize: 12, color: Colors.primary },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: { color: Colors.white, fontSize: 12, fontWeight: "700" },
});
