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

const corsOrigins = (process.env.CORS_ORIGIN ||
  "http://localhost:5000,http://localhost:5001,http://localhost:5002,http://localhost:5003,http://localhost:5173,http://localhost:5174,http://127.0.0.1:5000,http://127.0.0.1:5001,http://127.0.0.1:5002,http://127.0.0.1:5003,http://127.0.0.1:5173,http://127.0.0.1:5174")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "nursery-backend" });
});

connectDb();

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
