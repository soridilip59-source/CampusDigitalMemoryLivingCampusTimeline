const express = require("express");
const controller = require("../controllers/collectionController");
const { optionalProtect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", controller.listCollections);
router.get("/:id", optionalProtect, controller.getCollection);

module.exports = router;
