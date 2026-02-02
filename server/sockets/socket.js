import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import User from "../models/User.js";

const onlineUsers = new Map();

function addUserSocket(userId, socketId) {
  const key = String(userId);
  const set = onlineUsers.get(key) || new Set();
  set.add(socketId);
  onlineUsers.set(key, set);
}

function removeUserSocket(userId, socketId) {
  const key = String(userId);
  const set = onlineUsers.get(key);
  if (!set) return 0;
  set.delete(socketId);
  if (set.size === 0) {
    onlineUsers.delete(key);
    return 0;
  }
  onlineUsers.set(key, set);
  return set.size;
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Not authorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (e) {
      next(new Error("Not authorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;

    addUserSocket(userId, socket.id);

    await User.findByIdAndUpdate(
      userId,
      { isOnline: true, lastSeenAt: null },
      { new: true }
    ).catch(() => null);

    io.emit("presence:update", { userId, isOnline: true, lastSeenAt: null });

    socket.on("chat:join", (payload) => {
      const chatId = payload?.chatId;
      if (!chatId) return;
      socket.join(`chat:${chatId}`);
    });

    socket.on("chat:leave", (payload) => {
      const chatId = payload?.chatId;
      if (!chatId) return;
      socket.leave(`chat:${chatId}`);
    });

    socket.on("typing:start", (payload) => {
      const chatId = payload?.chatId;
      if (!chatId) return;
      socket.to(`chat:${chatId}`).emit("typing:update", {
        chatId,
        userId,
        isTyping: true,
      });
    });

    socket.on("typing:stop", (payload) => {
      const chatId = payload?.chatId;
      if (!chatId) return;
      socket.to(`chat:${chatId}`).emit("typing:update", {
        chatId,
        userId,
        isTyping: false,
      });
    });

    socket.on("disconnect", async () => {
      const remaining = removeUserSocket(userId, socket.id);
      if (remaining > 0) return;

      const lastSeenAt = new Date();

      await User.findByIdAndUpdate(
        userId,
        { isOnline: false, lastSeenAt },
        { new: true }
      ).catch(() => null);

      io.emit("presence:update", { userId, isOnline: false, lastSeenAt });
    });
  });

  return io;
}
