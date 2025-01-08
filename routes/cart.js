const express = require("express");

const { requireSignin } = require("../middlewares");
const { add, get, removeItem } = require("../controllers/cart");

const router = express.Router();

router.get("/user/cart", requireSignin, get);
router.post("/user/cart/add", requireSignin, add);
router.post("/user/cart/remove", requireSignin, removeItem);

module.exports = router;
