const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getCart,
  addOrUpdateItem,
  setItemQuantity,
  removeItem,
  clearCart,
} = require("../controllers/cartController");

router.use(authMiddleware);

router.get("/", getCart);
router.post("/items", addOrUpdateItem);
router.patch("/items/:productId", setItemQuantity);
router.delete("/items/:productId", removeItem);
router.delete("/", clearCart);

module.exports = router;
