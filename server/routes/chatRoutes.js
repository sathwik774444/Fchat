import express from "express";
import {
  accessChat,
  addToGroup,
  createGroupChat,
  fetchChats,
  removeFromGroup,
  renameGroup,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", accessChat);
router.get("/", fetchChats);
router.post("/group", createGroupChat);
router.put("/group/rename", renameGroup);
router.put("/group/add", addToGroup);
router.put("/group/remove", removeFromGroup);

export default router;
