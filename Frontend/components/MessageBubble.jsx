import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Tick component for read/unread status
const MessageTick = ({ isRead }) => {
  return (
    <Text style={[styles.tick, isRead ? styles.readTick : styles.unreadTick]}>
      ✓✓
    </Text>
  );
};

export default function MessageBubble({ message, currentUserId }) {
  const isMe = message.from._id === currentUserId;

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, isMe ? styles.me : styles.other]}>
        <View style={styles.messageContent}>
          {/* Message text should shrink if needed */}
          <Text
            style={[styles.text, isMe ? styles.meText : styles.otherText]}
          >
            {message.text}
          </Text>

          {/* Inline ticks */}
          {isMe && <MessageTick isRead={message.read} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: "75%",
  },
  me: {
    backgroundColor: "#0A84FF",
    borderTopRightRadius: 4,
    alignSelf: "flex-end",
  },
  other: {
    backgroundColor: "#E5E5EA",
    borderTopLeftRadius: 4,
    alignSelf: "flex-start",
  },
  meText: {
    color: "#fff",
  },
  otherText: {
    color: "#000",
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    flexShrink: 1, // allows text to shrink so ticks stay inline
  },
  messageContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    flexShrink: 1,
  },
  tick: {
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 4, // small gap between text and ticks
  },
  readTick: {
    color: "#33ff00ff",
  },
  unreadTick: {
    color: "rgba(255, 255, 255, 0.7)",
  },
});
