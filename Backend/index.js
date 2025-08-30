const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const os = require("os");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/message");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// HTTP + Socket
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// MongoDB connect
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("MongoDB connected");
});

// Routes
app.use("/auth", authRoutes);
app.use("/messages", messageRoutes);

// Socket logic
let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", async (userId) => {
    const User = require("./models/User");
    onlineUsers[userId] = socket.id;
    
    // Update user's online status and last seen
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date()
    });
    
    io.emit("user:online", userId);
  });

  socket.on("message:send", async ({ from, to, text }) => {
    try {
      const Message = require("./models/Message");
      const msg = await Message.create({ from, to, text });
      await msg.populate('from to', 'name');

      // Send to sender for confirmation
      socket.emit("message:sent", msg);
      
      // Send to recipient if online
      if (onlineUsers[to]) {
        io.to(onlineUsers[to]).emit("message:new", msg);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit("message:error", { error: "Failed to send message" });
    }
  });

  socket.on("typing:start", ({ from, to }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("typing:start", { from });
    }
  });

  socket.on("typing:stop", ({ from, to }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("typing:stop", { from });
    }
  });

  socket.on("message:read", async ({ messageId, userId }) => {
    try {
      const Message = require("./models/Message");
      await Message.findByIdAndUpdate(messageId, { read: true });
      
      if (onlineUsers[userId]) {
        io.to(onlineUsers[userId]).emit("message:read", { messageId });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  socket.on("disconnect", async () => {
    const userId = Object.keys(onlineUsers).find(key => onlineUsers[key] === socket.id);
    if (userId) {
      try {
        const User = require("./models/User");
        delete onlineUsers[userId];
        
        // Update user's online status and last seen
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date()
        });
        
        io.emit("user:offline", userId);
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    }
  });
});

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
}

server.listen(5000, "0.0.0.0", () => {
  const ip = getLocalIP();
  console.log("Server running at:");
  console.log(`- Local:   http://localhost:5000`);
  console.log(`- Network: http://${ip}:5000`);
});
