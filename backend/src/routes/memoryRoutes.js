const express = require("express");
const router = express.Router();

const memoryController = require("../controllers/memoryController");
const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");

// Create memory (login required)
router.post(
    "/",
    protect,
    upload.single("image"),
    memoryController.createMemory
);

// Get all memories
router.get(
    "/",
    memoryController.getAllMemories
);

module.exports = router;