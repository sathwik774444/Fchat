import Chat from "../models/Chat.js";
import User from "../models/User.js";

export async function accessChat(req, res, next) {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    const otherUser = await User.findById(userId).select("_id");
    if (!otherUser) return res.status(404).json({ message: "User not found" });

    const existing = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [req.user._id, otherUser._id] },
    })
      .populate("users", "name email avatar isOnline lastSeenAt")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      });

    if (existing) return res.json({ chat: existing });

    const chat = await Chat.create({
      chatName: "",
      isGroupChat: false,
      users: [req.user._id, otherUser._id],
    });

    const fullChat = await Chat.findById(chat._id)
      .populate("users", "name email avatar isOnline lastSeenAt")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      });

    return res.status(201).json({ chat: fullChat });
  } catch (e) {
    next(e);
  }
}

export async function fetchChats(req, res, next) {
  try {
    const chats = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "name email avatar isOnline lastSeenAt")
      .populate("groupAdmin", "name email avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      })
      .sort({ updatedAt: -1 });

    return res.json({ chats });
  } catch (e) {
    next(e);
  }
}

export async function createGroupChat(req, res, next) {
  try {
    const { name, users } = req.body;

    if (!name || !Array.isArray(users) || users.length < 2) {
      return res.status(400).json({ message: "Group requires name and at least 2 users" });
    }

    const memberIds = [...new Set([...users, String(req.user._id)])];

    const group = await Chat.create({
      chatName: name,
      isGroupChat: true,
      users: memberIds,
      groupAdmin: req.user._id,
    });

    const fullGroup = await Chat.findById(group._id)
      .populate("users", "name email avatar isOnline lastSeenAt")
      .populate("groupAdmin", "name email avatar");

    return res.status(201).json({ chat: fullGroup });
  } catch (e) {
    next(e);
  }
}

export async function renameGroup(req, res, next) {
  try {
    const { chatId, name } = req.body;
    if (!chatId || !name) return res.status(400).json({ message: "Missing fields" });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    if (!chat.isGroupChat) return res.status(400).json({ message: "Not a group chat" });

    const isMember = chat.users.some((u) => String(u) === String(req.user._id));
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    if (String(chat.groupAdmin) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only admin can rename group" });
    }

    chat.chatName = name;
    await chat.save();

    const fullChat = await Chat.findById(chatId)
      .populate("users", "name email avatar isOnline lastSeenAt")
      .populate("groupAdmin", "name email avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      });

    return res.json({ chat: fullChat });
  } catch (e) {
    next(e);
  }
}

export async function addToGroup(req, res, next) {
  try {
    const { chatId, userId } = req.body;
    if (!chatId || !userId) return res.status(400).json({ message: "Missing fields" });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    if (!chat.isGroupChat) return res.status(400).json({ message: "Not a group chat" });

    const isMember = chat.users.some((u) => String(u) === String(req.user._id));
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    if (String(chat.groupAdmin) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    if (!chat.users.some((u) => String(u) === String(userId))) {
      chat.users.push(userId);
      await chat.save();
    }

    const fullChat = await Chat.findById(chatId)
      .populate("users", "name email avatar isOnline lastSeenAt")
      .populate("groupAdmin", "name email avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      });

    return res.json({ chat: fullChat });
  } catch (e) {
    next(e);
  }
}

export async function removeFromGroup(req, res, next) {
  try {
    const { chatId, userId } = req.body;
    if (!chatId || !userId) return res.status(400).json({ message: "Missing fields" });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    if (!chat.isGroupChat) return res.status(400).json({ message: "Not a group chat" });

    const isMember = chat.users.some((u) => String(u) === String(req.user._id));
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    const isAdmin = String(chat.groupAdmin) === String(req.user._id);
    const isSelf = String(userId) === String(req.user._id);
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "Only admin can remove other members" });
    }

    chat.users = chat.users.filter((u) => String(u) !== String(userId));

    if (chat.users.length < 2) {
      await chat.deleteOne();
      return res.json({ deleted: true });
    }

    if (String(chat.groupAdmin) === String(userId)) {
      chat.groupAdmin = chat.users[0];
    }

    await chat.save();

    const fullChat = await Chat.findById(chatId)
      .populate("users", "name email avatar isOnline lastSeenAt")
      .populate("groupAdmin", "name email avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      });

    return res.json({ chat: fullChat });
  } catch (e) {
    next(e);
  }
}
