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

const salesRoutes = require("./src/routes/salesRoutes");
const testimonialRoutes = require("./src/routes/testimonialRoutes");
const errorHandler = require("./src/middleware/errorMiddleware");

const app = express();
const port = process.env.PORT || 5008;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.use(express.static("public/Uploads"))
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "nursery-backend" });
});

// // Debug: log admin login hits to confirm origin + path.
// app.use("/api/admin/login", (req, _res, next) => {
//   console.log("[admin/login]", req.method, "origin=", req.headers.origin, "ua=", req.headers["user-agent"]);
//   next();
// });
connectDb().catch((err) => {
  console.error("Fatal startup error:", err?.message || err);
  process.exit(1);
});
app.use("/api", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/testimonials", testimonialRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use(errorHandler);

// async function start() {
//   await connectDb();
 

// start().catch((err) => {
//   console.error("Fatal startup error:", err?.message || err);
//   process.exit(1);
// });


 app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
