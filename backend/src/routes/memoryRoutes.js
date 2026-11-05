const express = require("express");

const router = express.Router();

const { createMemory, getApprovedMemories, getMyMemories ,getMemoryById} = require("../controllers/memoryController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createMemory);
router.get("/mine", protect, getMyMemories);
router.get("/", getApprovedMemories);
router.get("/:id", getMemoryById);

module.exports = router;