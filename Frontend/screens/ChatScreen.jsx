"use client";

import { useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useChat } from "../context/ChatContext";
import { Colors } from "../theme/colors";
import OnlineStatusBadge from "../components/OnlineStatusBadge";
import MessageBubble from "../components/MessageBubble";
import InputBar from "../components/InputBar";
import TypingIndicator from "../components/TypingIndicator";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";

export default function ChatScreen({ route, navigation }) {
  const { userId } = route.params;
  const { user: currentUser } = useContext(AuthContext);
  const {
    getUser,
    getMessages,
    sendMessage,
    setTyping,
    conversations,
    markMessagesAsRead,
    markMessageAsRead,
    messages, // Direct access to messages state
  } = useChat();

  const user = getUser(userId);

  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  const convo = useMemo(
    () => conversations.find((c) => c.userId === userId),
    [conversations, userId]
  );

  // Get real-time messages directly from context state
  const currentMessages = messages[userId] || [];

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Initial message loading
  useEffect(() => {
    let isMounted = true;

    const loadInitialMessages = async () => {
      if (isInitialized) return;
      
      setLoading(true);
      try {
        await getMessages(userId);
        if (isMounted) {
          setIsInitialized(true);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialMessages();

    return () => {
      isMounted = false;
    };
  }, [userId, getMessages, isInitialized]);

  // Mark messages as read when user opens chat or when new unread messages arrive
  useEffect(() => {
    if (convo && convo.unreadCount > 0) {
      markMessagesAsRead(userId);
      
      // Mark individual messages as read via socket for real-time tick updates
      currentMessages
        .filter(msg => msg.from._id === userId && !msg.read)
        .forEach(msg => {
          markMessageAsRead(msg._id, msg.from._id);
        });
    }
  }, [userId, convo?.unreadCount, markMessagesAsRead, markMessageAsRead, currentMessages]);

  const onChange = (e) => {
    setText(e);
    setTyping(userId, e.trim().length > 0);
  };

  const onSend = () => {
    if (!text.trim()) return;
    sendMessage(userId, text.trim());
    setText("");
    setTyping(userId, false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.leftAction}
        >
          <Text style={styles.backIcon}>{"‹"}</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* User info */}
        <View style={styles.headerCenter}>
          <Text style={styles.name} numberOfLines={1}>
            {user?.name}
          </Text>
          <View style={{ marginTop: 2 }}>
            <OnlineStatusBadge online={!!user?.isOnline} />
          </View>
        </View>

        <View style={{ width: 80 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={10}
      >
        {loading ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={[...currentMessages].reverse()}
            keyExtractor={(item) => item._id}
            inverted
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                currentUserId={currentUser?._id ?? ""}
              />
            )}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 8,
              paddingTop: 12,
            }}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No messages yet. Start the conversation 👋
                  </Text>
                </View>
              )
            }
          />
        )}

        {convo?.typing && (
          <View style={styles.typingBar}>
            <TypingIndicator />
            <Text style={styles.typingText}>
              {user?.name.split(" ")[0]} is typing
            </Text>
          </View>
        )}

        <InputBar value={text} onChangeText={onChange} onSend={onSend} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftAction: { width: 80, flexDirection: "row", alignItems: "center", gap: 2 },
  backIcon: { fontSize: 24, color: Colors.primary, marginRight: 2 },
  backText: { color: Colors.primary, fontWeight: "700" },
  headerCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  name: {
    color: Colors.text,
    fontWeight: "800",
    fontSize: 20,
    maxWidth: "80%",
    textAlign: "center",
  },
  list: { flex: 1, backgroundColor: Colors.white },
  typingBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  typingText: { color: Colors.primary, fontSize: 12, fontWeight: "600" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 25,
    fontWeight: "600",
    color: Colors.textLight,
    textAlign: "center",
  },
});
