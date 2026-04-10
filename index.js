const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { connectDb } = require("./src/config/db");
const userRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/admin");
const productRoutes = require("./src/routes/productRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const cartRoutes = require("./src/routes/cartRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");
const salesRoutes = require("./src/routes/salesRoutes");
const testimonialRoutes = require("./src/routes/testimonialRoutes");
const errorHandler = require("./src/middleware/errorMiddleware");

const app = express();
const port = process.env.PORT || 5008;

function parseOrigins(v) {
  return String(v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const allowedOrigins = [
  ...parseOrigins(process.env.CLIENT_ORIGINS),
  ...parseOrigins(process.env.CLIENT_ORIGIN),
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
].filter(Boolean);

function isLocalDevOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(String(origin || ""));
}

function isAllowedOrigin(origin) {
  if (!origin) return true; // server-to-server / curl / postman (no Origin header)
  if (isLocalDevOrigin(origin)) return true;
  return allowedOrigins.includes(origin);
}

const corsOptions = {
  origin(origin, cb) {
    if (isAllowedOrigin(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Ensure CORS headers are present even on error responses.
// (Browser often shows "CORS error" when the real issue is a 4xx/5xx without CORS headers.)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Vary", "Origin");
  }
  next();
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "nursery-backend" });
});

// Debug: log admin login hits to confirm origin + path.
app.use("/api/admin/login", (req, _res, next) => {
  console.log("[admin/login]", req.method, "origin=", req.headers.origin, "ua=", req.headers["user-agent"]);
  next();
});

app.use("/api", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/testimonials", testimonialRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use(errorHandler);

async function start() {
  await connectDb();
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Fatal startup error:", err?.message || err);
  process.exit(1);
});
