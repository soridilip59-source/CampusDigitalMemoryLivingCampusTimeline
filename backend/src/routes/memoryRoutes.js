const express = require("express");

const router = express.Router();

const { createMemory, getApprovedMemories, getMyMemories } = require("../controllers/memoryController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createMemory);
router.get("/mine", protect, getMyMemories);
router.get("/", getApprovedMemories);

module.exports = router;