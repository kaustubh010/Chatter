import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiService } from "../services/api";
import { socketService } from "../services/socket";
import { AuthContext } from "./AuthContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user: currentUser, token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const messagesRef = useRef({});

  // Initialize data
  useEffect(() => {
    if (!currentUser || !token) {
      setUsers([]);
      setConversations([]);
      setOnlineUsers([]);
      setTypingUsers({});
      messagesRef.current = {};
      setIsLoading(false);
      return;
    }

    const initializeData = async () => {
      try {
        setIsLoading(true);

        // Fetch users and their conversation data
        const usersData = await apiService.getUsers();
        setUsers(usersData);

        // Convert users to conversations
        const convos = usersData.map((user) => ({
          userId: user._id,
          latestMessage: user.latestMessage || null,
          unreadCount: user.unreadCount || 0,
          typing: false,
        }));

        setConversations(convos);
      } catch (error) {
        console.error("Error initializing chat data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [currentUser, token]);

  // Setting up socket event listeners
  useEffect(() => {
    if (!currentUser) return;

    // Listen for new messages
    socketService.onNewMessage((message) => {
      const otherUserId =
        message.from._id === currentUser._id
          ? message.to._id
          : message.from._id;

      // Add the new message to the messages array
      messagesRef.current[otherUserId] = [
        ...(messagesRef.current[otherUserId] || []),
        message,
      ];

      // Update conversation
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.userId === otherUserId) {
            return {
              ...conv,
              latestMessage: message,
              unreadCount:
                message.from._id !== currentUser._id
                  ? conv.unreadCount + 1
                  : conv.unreadCount,
              typing: false,
            };
          }
          return conv;
        })
      );
    });

    // Listen for message confirmation
    socketService.onMessageSent((message) => {
      const otherUserId =
        message.from._id === currentUser._id
          ? message.to._id
          : message.from._id;

      // Update message in cache with server-generated ID
      if (messagesRef.current[otherUserId]) {
        const messages = messagesRef.current[otherUserId];
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.text === message.text) {
          messages[messages.length - 1] = message;
        }
      }
    });

    // Listen for user online/offline status
    socketService.onUserOnline((userId) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, isOnline: true } : user
        )
      );
    });

    socketService.onUserOffline((userId) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, isOnline: false } : user
        )
      );
    });

    // Listen for typing events
    socketService.onTypingStart((data) => {
      setTypingUsers((prev) => ({ ...prev, [data.from]: true }));
      setConversations((prev) =>
        prev.map((conv) =>
          conv.userId === data.from ? { ...conv, typing: true } : conv
        )
      );
    });

    socketService.onTypingStop((data) => {
      setTypingUsers((prev) => ({ ...prev, [data.from]: false }));
      setConversations((prev) =>
        prev.map((conv) =>
          conv.userId === data.from ? { ...conv, typing: false } : conv
        )
      );
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, [currentUser]);

  const getUser = (userId) => users.find((u) => u._id === userId);

  const setTyping = (userId, typing) => {
    if (!currentUser) return;

    if (typing) {
      socketService.startTyping({
        from: currentUser._id,
        to: userId,
      });
    } else {
      socketService.stopTyping({
        from: currentUser._id,
        to: userId,
      });
    }
  };

  const sendMessage = async (userId, text) => {
    if (!currentUser) return;

    try {
      const message = {
        _id: Math.random().toString(36).slice(2),
        text,
        createdAt: new Date(),
        from: { _id: currentUser._id, name: currentUser.name },
        to: { _id: userId, name: getUser(userId)?.name },
        read: false,
      };

      messagesRef.current[userId] = [
        ...(messagesRef.current[userId] || []),
        message,
      ];

      setConversations((prev) =>
        prev.map((c) =>
          c.userId === userId
            ? {
                ...c,
                latestMessage: message,
                typing: false,
                unreadCount: 0,
              }
            : c
        )
      );

      // send message through socket
      socketService.sendMessage({
        from: currentUser._id,
        to: userId,
        text,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      messagesRef.current[userId] = (messagesRef.current[userId] || []).slice(
        0,
        -1
      );
    }
  };

  const markMessagesAsRead = async (userId) => {
    if (!currentUser) return;

    try {
      await apiService.markMessagesAsRead(userId);

      // Update conversations state
      setConversations((prev) =>
        prev.map((conv) =>
          conv.userId === userId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Load messages for a user
  const loadMessages = async (userId) => {
    if (!currentUser || messagesRef.current[userId]) return;

    try {
      const messages = await apiService.getMessages(userId);
      messagesRef.current[userId] = messages;
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  // Get messages
  const getMessages = async (userId) => {
    if (!messagesRef.current[userId]) {
      try {
        const messages = await apiService.getMessages(userId);
        messagesRef.current[userId] = messages;
      } catch (err) {
        console.error("Error fetching messages:", err);
        messagesRef.current[userId] = [];
      }
    }
    return messagesRef.current[userId];
  };

  const value = useMemo(
    () => ({
      users,
      conversations,
      onlineUsers,
      typingUsers,
      getMessages,
      sendMessage,
      setTyping,
      getUser,
      markMessagesAsRead,
      isLoading,
    }),
    [users, conversations, onlineUsers, typingUsers, isLoading]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};
