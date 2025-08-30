const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");

const router = express.Router();

// verify token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: "Invalid token" });
  }
};

// Get current user info
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    res.json({ _id: user._id, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get all users with chat information
router.get("/users", authMiddleware, async (req, res) => {
  try {
    console.log('Users endpoint called by user:', req.user._id);
    const currentUserId = req.user._id;
    
    // Get all users except current user
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("-password");
    
    console.log(`Found ${users.length} users`);
    
    // Get latest messages and unread counts for each user
    const usersWithChatInfo = await Promise.all(users.map(async (user) => {
      try {
        // Get the latest message between current user and this user
        const latestMessage = await Message.findOne({
          $or: [
            { from: currentUserId, to: user._id },
            { from: user._id, to: currentUserId }
          ]
        })
        .sort({ createdAt: -1 })
        .populate('from to', 'name');

        // Get unread messages count
        const unreadCount = await Message.countDocuments({
          from: user._id,
          to: currentUserId,
          read: false
        });

        return {
          ...user.toObject(),
          latestMessage,
          unreadCount
        };
      } catch (userError) {
        console.error(`Error processing user ${user._id}:`, userError);
        return {
          ...user.toObject(),
          latestMessage: null,
          unreadCount: 0
        };
      }
    }));

    console.log('Sending users with chat info:', usersWithChatInfo.length);
    res.json(usersWithChatInfo);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token, user });
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Wrong password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token, user });
});

module.exports = router;
