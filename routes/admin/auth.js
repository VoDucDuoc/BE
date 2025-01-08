const express = require("express");

const {
  validateSignin,
  validateSignup,
  isAuthValidated,
} = require("../../validators/auth");
const { requireSignin, isAdmin } = require("../../middlewares");
const { signup } = require("../../controllers/admin/auth");
const { signin, signout } = require("../../controllers/auth");
const { staffSignup } = require("../../controllers/admin/staff-auth");

const router = express.Router();

router.post("/admin/signout", requireSignin, signout);
router.post("/admin/signin", validateSignin, isAuthValidated, signin);
router.post("/admin/signup", validateSignup, isAuthValidated, signup);
router.post(
  "/admin/staff-signup",
  requireSignin,
  isAdmin,
  validateSignup,
  isAuthValidated,
  staffSignup
);

module.exports = router;
