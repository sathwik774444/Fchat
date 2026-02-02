import express from "express";
import { allMessages, sendMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/:chatId", allMessages);
router.post("/", sendMessage);

export default router;
