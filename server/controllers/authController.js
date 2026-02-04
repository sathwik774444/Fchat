import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

export async function register(req, res, next) {
  // console.log(req.body);
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      // avatar: avatar || "",
    });

    return res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        // avatar: user.avatar,
        isOnline: user.isOnline,
      },
      token: generateToken(user._id),
    });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await user.matchPassword(password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        // avatar: user.avatar,
        isOnline: user.isOnline,
      },
      token: generateToken(user._id),
    });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res) {
  return res.json({ user: req.user });
}
