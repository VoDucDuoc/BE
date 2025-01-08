const { check, validationResult } = require("express-validator");
const { BadRequest } = require("../ulti/response");
exports.validateSignup = [
  check("firstName").notEmpty().withMessage("First name is required"),
  check("lastName").notEmpty().withMessage("Last name is required"),
  check("email").isEmail().withMessage("Valid email is required"),
  check("password")
    .isLength({ min: 3 })
    .withMessage("Password must be at least 3 character long")
    .custom((_, { req }) => {
      if (req.body.password !== req.body.confirmPassword) {
        throw new Error("Passwords don't match");
      } else {
        return true;
      }
    }),
];
exports.validateSignin = [
  check("email").isEmail().withMessage("Valid email is required"),
  check("password")
    .isLength({ min: 3 })
    .withMessage("Password must be at least 3 character long"),
];
exports.isAuthValidated = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.array().length <= 0) return next();
  return BadRequest(res, errors.array()[0].msg);
};
