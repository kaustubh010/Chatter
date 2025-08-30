"use client";

import { useContext, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Colors } from "../theme/colors";
import { useChat } from "../context/ChatContext";
import UserCard from "../components/UserCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";

export default function HomeScreen({ navigation }) {
  const { users, conversations } = useChat();
  const { logout } = useContext(AuthContext);

  const onLogout = () => {
    logout();
    navigation.replace("Login");
  };

  // Sorted conversations list
  const data = useMemo(
    () => {
      const usersWithConversations = users.map(user => {
        const conversation = conversations.find(c => c.userId === user._id);
        return {
          user,
          conversation: conversation || {
            userId: user._id,
            latestMessage: null,
            unreadCount: 0,
            typing: false
          }
        };
      });

      // Sort by latest message time, then by online status, then by name
      return usersWithConversations.sort((a, b) => {
        // First, prioritize users with messages
        const aHasMessages = a.conversation.latestMessage ? 1 : 0;
        const bHasMessages = b.conversation.latestMessage ? 1 : 0;
        if (aHasMessages !== bHasMessages) {
          return bHasMessages - aHasMessages;
        }

        // If both have messages, sort by latest message time
        if (a.conversation.latestMessage && b.conversation.latestMessage) {
          const ta = new Date(a.conversation.latestMessage.createdAt).getTime();
          const tb = new Date(b.conversation.latestMessage.createdAt).getTime();
          return tb - ta;
        }

        // Then by online status
        if (a.user.isOnline !== b.user.isOnline) {
          return a.user.isOnline ? -1 : 1;
        }

        // Finally by name
        return a.user.name.localeCompare(b.user.name);
      });
    },
    [users, conversations]
  );

  const onlineCount = users.filter((u) => u.isOnline).length;
  const total = users.length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {/* Left spacer keeps center title really centered */}
        <View style={{ width: 80 }} />

        {/* Centered block */}
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Chats</Text>
          <Text style={styles.subtitle}>
            {onlineCount} Online • {total - onlineCount} Offline
          </Text>
        </View>

        {/* Right action */}
        <TouchableOpacity
          onPress={onLogout}
          style={styles.rightAction}
        >
          <Text style={styles.link}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.conversation.userId}
        renderItem={({ item }) => (
          <UserCard
            user={item.user}
            conversation={item.conversation}
            onPress={() =>
              navigation.navigate("Chat", { userId: item.user._id })
            }
          />
        )}
        contentContainerStyle={{}}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, color: Colors.text, fontWeight: "800" },
  subtitle: { fontSize: 12, color: "#11182799", marginTop: 2 },
  rightAction: { width: 80, alignItems: "flex-end" },
  link: { color: Colors.primary, fontWeight: "700" },
  list: { flex: 1, backgroundColor: Colors.white },
});
