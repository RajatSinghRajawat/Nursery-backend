const express = require("express");
const router = express.Router();

const {authMiddleware} = require("../middleware/authMiddleware");
const { register, login, me, getAllusers, logout } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, me);
router.get("/getAllusers", getAllusers);
router.post("/logout", logout);

module.exports = router;

