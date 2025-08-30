import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MessageBubble({
  message,
  currentUserId,
}) {
  const isMe = message.from._id === currentUserId;

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, isMe ? styles.me : styles.other]}>
        <Text style={[styles.text, isMe ? styles.meText : styles.otherText]}>
          {message.text}
        </Text>
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
  },
});
