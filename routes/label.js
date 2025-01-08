const express = require("express");

const { requireSignin, isAdmin } = require("../middlewares");
const { get, getAll, create, update, remove, addLabelToProduct, removeLabelFromProduct } = require("../controllers/label");

const router = express.Router();

router.post("/label/addLabel", addLabelToProduct);
router.post("/label/removeLabel", removeLabelFromProduct);

// router.get("/label/:id", requireSignin, isAdmin, get);
// router.get("/label", requireSignin, isAdmin, getAll);
// router.post("/label", requireSignin, isAdmin, create);
// router.put("/label/:id", requireSignin, isAdmin, update);
// router.delete("/label/:id", requireSignin, isAdmin, remove);

router.get("/label/:id", get);
router.get("/label", getAll);
router.post("/label", create);
router.put("/label/:id", update);
router.delete("/label/:id", remove);

module.exports = router;
