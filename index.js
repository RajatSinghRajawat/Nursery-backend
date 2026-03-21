const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { connectDb } = require("./src/config/db");
const userRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/admin");

const app = express();
const port = process.env.PORT || 3000;


app.use(
  cors()
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// Static uploads (if enabled by upload route)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));



connectDb()

app.use("/api", userRoutes);
app.use("/api/admin" , adminRoutes)



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});