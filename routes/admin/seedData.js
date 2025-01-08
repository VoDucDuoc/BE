const express = require("express");

const { requireSignin, isAdmin } = require("../../middlewares");
const { seedDataProduct, seedDataOrder } = require("../../controllers/admin/seedData");

const router = express.Router();

router.get("/seed/product", seedDataProduct);
router.get("/seed/order",  seedDataOrder);
// router.get("/order/:_id", requireSignin, isAdmin, getById);

module.exports = router;
