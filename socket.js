const socketIo = require("socket.io");
const userModel = require("./routes/users"); // Import your user model

module.exports = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: "*", // Adjust in production
      methods: ["GET", "POST"],
    },
  });

  // Store online users and typing indicators
  const onlineUsers = new Map();
  const typingUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`New connection: ${socket.id}`);

    // Middleware to attach user data
    socket.use(async (packet, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Authentication error"));

        // Verify user token (adjust based on your auth system)
        const user = await userModel.findById(token);
        if (!user) return next(new Error("Invalid user"));

        socket.user = user;
        onlineUsers.set(user._id.toString(), socket.id);
        next();
      } catch (error) {
        next(new Error("Authentication failed"));
      }
    });

    // Error handling middleware
    socket.on("error", (err) => {
      console.error(`Socket error (${socket.id}): ${err.message}`);
      socket.disconnect(true);
    });

    // Join chat room
    socket.on("joinChat", async (chatId) => {
      try {
        const chat = await chatModel.findById(chatId);
        if (!chat) return socket.emit("error", "Chat not found");

        if (!chat.participants.includes(socket.user._id)) {
          return socket.emit("error", "Not authorized for this chat");
        }

        socket.join(chatId);
        console.log(`User ${socket.user.username} joined chat ${chatId}`);

        // Notify others in the chat about online status
        socket.to(chatId).emit("userOnline", {
          userId: socket.user._id,
          chatId,
        });
      } catch (error) {
        socket.emit("error", "Failed to join chat");
      }
    });

    // Handle typing indicator
    socket.on("typing", ({ chatId, isTyping }) => {
      try {
        if (!chatId) throw new Error("No chat ID provided");

        if (isTyping) {
          typingUsers.set(socket.user._id.toString(), chatId);
          socket.to(chatId).emit("typing", {
            userId: socket.user._id,
            chatId,
          });
        } else {
          typingUsers.delete(socket.user._id.toString());
          socket.to(chatId).emit("stopTyping", {
            userId: socket.user._id,
            chatId,
          });
        }
      } catch (error) {
        socket.emit("error", "Typing indicator failed");
      }
    });

    // Handle message delivery status
    socket.on("messageDelivered", async ({ messageId, chatId }) => {
      try {
        const chat = await chatModel.findById(chatId);
        const message = chat.messages.id(messageId);

        if (message && message.status !== "read") {
          message.status = "delivered";
          await chat.save();

          io.to(chatId).emit("messageStatus", {
            messageId,
            status: "delivered",
            chatId,
          });
        }
      } catch (error) {
        console.error("Delivery confirmation error:", error);
      }
    });

    // Handle message read status
    socket.on("markAsRead", async ({ messageIds, chatId }) => {
      try {
        const chat = await chatModel.findById(chatId);

        chat.messages = chat.messages.map((msg) => {
          if (messageIds.includes(msg._id.toString())) {
            msg.status = "read";
          }
          return msg;
        });

        await chat.save();
        io.to(chatId).emit("messagesRead", { messageIds, chatId });
      } catch (error) {
        console.error("Read status error:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      onlineUsers.delete(socket.user?._id.toString());
      typingUsers.delete(socket.user?._id.toString());

      // Notify all relevant chats about offline status
      if (socket.user?._id) {
        io.emit("userOffline", { userId: socket.user._id });
      }
    });
  });

  // Add utility methods
  io.getOnlineUsers = () => Array.from(onlineUsers.keys());
  io.isTyping = (userId) => typingUsers.has(userId);

  return io;
};
