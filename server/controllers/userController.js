import User from "../models/User.js";

export async function listUsers(req, res, next) {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("name email avatar isOnline lastSeenAt")
      .sort({ name: 1 });

    return res.json({ users });
  } catch (e) {
    next(e);
  }
}
