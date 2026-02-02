export async function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const publicUrl = `/uploads/${req.file.filename}`;

  return res.status(201).json({
    file: {
      url: publicUrl,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });
}
