const express = require("express");

const { requireSignin, isAdmin } = require("../../middlewares");
const { update, getAll, getById } = require("../../controllers/admin/order");

const router = express.Router();

router.put("/order/update", requireSignin, isAdmin, update);
router.put("/order/", requireSignin, isAdmin, getAll);
router.get("/order/:_id", requireSignin, isAdmin, getById);

module.exports = router;
