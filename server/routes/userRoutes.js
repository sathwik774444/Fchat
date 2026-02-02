import express from "express";
import { listUsers } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, listUsers);

export default router;
