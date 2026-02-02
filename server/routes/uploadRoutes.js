import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import multer from "multer";

import { upload } from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.post("/", protect, uploadMiddleware.single("file"), upload);

export default router;
