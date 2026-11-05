const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const memoryValidator = require("../validators/memoryValidator");
const validateRequest = require("../middleware/validationMiddleware");

const {
  createMemory,
  getApprovedMemories,
  getMyMemories,
  getMemoryById
} = require("../controllers/memoryController");

const { protect } = require("../middleware/authMiddleware");

// Create a new memory
router.post(
  "/",
  protect,
  upload.array("media", 5),
  memoryValidator,
  validateRequest,
  createMemory
);

// Get logged-in user's memories
router.get("/mine", protect, getMyMemories);

// Get all approved memories
router.get("/", getApprovedMemories);

// Get a single approved memory
router.get("/:id", getMemoryById);

module.exports = router;