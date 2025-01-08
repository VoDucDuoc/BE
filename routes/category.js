// const multer = require("multer");
// const express = require("express");
// const shortid = require("shortid");

// const { requireSignin, isAdmin } = require("../middlewares");
// const { get, create, update, remove } = require("../controllers/category");

// const router = express.Router();
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     cb(null, shortid.generate() + "-" + file.originalname);
//   },
// });
// const upload = multer({ storage });

// router.get("/category/", get);
// router.post(
//   "/category/create",
//   requireSignin,
//   isAdmin,
//   upload.single("categoryImage"),
//   create
// );
// router.put("/category/delete", remove);
// router.put("/category/update", upload.array("categoryImage"), update);

// module.exports = router;

const multer = require("multer");
const express = require("express");
const shortid = require("shortid");

const { requireSignin, isAdmin } = require("../middlewares");
const {
  get,
  create,
  update,
  remove,
  getAll,
  findDiffFromTwoObj,
  enable,
} = require("../controllers/category");

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // cb(null, shortid.generate() + "-" + file.originalname);
    const { name } = JSON.parse(req.body.categoryData);
    cb(null, name + "-" + Date.now() + ".jpg");
  },
});
const upload = multer({ storage });
router.get("/category/", getAll);
router.get("/category/:id", get);
router.post(
  "/category/create",
  requireSignin,
  isAdmin,
  upload.single("categoryImage"),
  create
);
router.delete("/category/:id", requireSignin, isAdmin, remove);
router.put(
  "/category/:id",
  requireSignin,
  isAdmin,
  upload.single("categoryImage"),
  update
);
router.put("/category/enable/:id", requireSignin, isAdmin, enable);

module.exports = router;
