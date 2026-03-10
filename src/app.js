const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDb } = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

connectDb();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

module.exports = app;

