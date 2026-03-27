const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\//.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error("Only image uploads are allowed"));
  },
});

function publicBase() {
  return (
    process.env.PUBLIC_BASE_URL ||
    `http://localhost:${process.env.PORT || 5000}`
  ).replace(/\/$/, "");
}

/** Wrap multer so errors return JSON instead of breaking the chain */
function captureMulter(mw) {
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ message: err.message || "Upload failed" });
        }
        return res.status(400).json({ message: err.message || "Upload failed" });
      }
      next();
    });
  };
}

router.post(
  "/image",
  authMiddleware,
  requireRole(["admin", "superadmin"]),
  captureMulter(upload.single("file")),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file" });
    }
    const url = `${publicBase()}/uploads/${req.file.filename}`;
    res.status(201).json({ url, path: `/uploads/${req.file.filename}` });
  }
);

router.post(
  "/images",
  authMiddleware,
  requireRole(["admin", "superadmin"]),
  captureMulter(upload.array("files", 24)),
  (req, res) => {
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ message: "No files" });
    }
    const base = publicBase();
    const urls = files.map((f) => `${base}/uploads/${f.filename}`);
    const paths = files.map((f) => `/uploads/${f.filename}`);
    res.status(201).json({ urls, paths });
  }
);

module.exports = router;
