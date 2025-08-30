const express = require("express");
const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const User = require("../models/User");

const router = express.Router();

// Middleware to verify token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Get all messages between current user and another user
router.get("/:otherUserId", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { otherUserId } = req.params;
    
    const msgs = await Message.find({
      $or: [
        { from: currentUserId, to: otherUserId },
        { from: otherUserId, to: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('from to', 'name');

    res.json(msgs);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark messages as read
router.post("/:otherUserId/mark-read", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { otherUserId } = req.params;
    
    await Message.updateMany(
      { from: otherUserId, to: currentUserId, read: false },
      { read: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
