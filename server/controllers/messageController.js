import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

export async function allMessages(req, res, next) {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId).select("users");
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const isMember = chat.users.some((u) => String(u) === String(req.user._id));
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name email avatar")
      .sort({ createdAt: 1 });

    return res.json({ messages });
  } catch (e) {
    next(e);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const { chatId, content, attachments } = req.body;

    if (!chatId) return res.status(400).json({ message: "Missing chatId" });

    const chat = await Chat.findById(chatId).select("users");
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const isMember = chat.users.some((u) => String(u) === String(req.user._id));
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    const message = await Message.create({
      sender: req.user._id,
      chat: chatId,
      content: content || "",
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    const full = await Message.findById(message._id).populate("sender", "name email avatar");

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id }, { new: true });

    const io = req.app.get("io");
    if (io) {
      io.to(`chat:${chatId}`).emit("message:new", { message: full });
    }

    return res.status(201).json({ message: full });
  } catch (e) {
    next(e);
  }
}
