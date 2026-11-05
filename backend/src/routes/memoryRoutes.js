const upload = require("../middleware/uploadMiddleware");

const express = require("express");

const router = express.Router();

const { createMemory, getApprovedMemories, getMyMemories ,getMemoryById} = require("../controllers/memoryController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect,upload.array("media",5) ,createMemory);
router.get("/mine", protect, getMyMemories);
router.get("/", getApprovedMemories);
router.get("/:id", getMemoryById);

module.exports = router;