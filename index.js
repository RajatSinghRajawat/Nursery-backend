const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { connectDb } = require("./src/config/db");

const app = express();
const port = process.env.PORT || 3000;

const clientOrigin = process.env.CLIENT_ORIGIN || "*";

app.use(
  cors({
    origin: clientOrigin === "*" ? "*" : [clientOrigin],
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// Static uploads (if enabled by upload route)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));



connectDb().then(() => {
  app.listen(port, () => {
    console.log(`API listening at http://localhost:${port}`);
  });
});