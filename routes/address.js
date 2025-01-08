const express = require("express");

const { requireSignin } = require("../middlewares");
const { add, get, update, deleteAddress } = require("../controllers/address");

const router = express.Router();

router.get("/user/address", requireSignin, get);
router.post("/user/address/add", requireSignin, add);
router.put("/user/address/update", requireSignin, update);
router.put("/user/address/delete", requireSignin, deleteAddress);

module.exports = router;
