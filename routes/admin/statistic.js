const express = require("express");

const { requireSignin, isAdmin } = require("../../middlewares");
const { statistic } = require("../../controllers/admin/statistic");

const router = express.Router();

// router.put("/order/update", requireSignin, isAdmin, update);
// router.put("/order/", requireSignin, isAdmin, getAll);
// router.get("/statistic/",requireSignin, isAdmin, statistic);
router.get("/statistic/", statistic);

module.exports = router;
