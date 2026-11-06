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
const social = require("../controllers/memorySocialController");

const { protect, optionalProtect } = require("../middleware/authMiddleware");

router.get("/stats", social.getStats);
router.get("/home-extras", optionalProtect, social.getHomeExtras);
router.post("/check-duplicates", social.checkDuplicates);

// Create a new memory
router.post(
  "/",
  protect,
  upload.array("media", 4),
  memoryValidator,
  validateRequest,
  createMemory
);

// Get logged-in user's memories
router.get("/mine", protect, getMyMemories);

router.post("/:id/like", protect, social.toggleLike);
router.post("/:id/reactions", protect, social.toggleReaction);
router.post("/:id/comments", protect, social.addComment);
router.delete("/:id/comments/:commentId", protect, social.deleteComment);
router.patch("/:id", protect, upload.array("media", 4), social.editOwn);
router.delete("/:id", protect, social.deleteOwn);
router.post("/:id/report", protect, social.reportMemory);
router.get("/:id/collections", social.getCollectionsForMemory);

// Get all approved memories
router.get("/", optionalProtect, getApprovedMemories);

// Get a single approved memory
router.get("/:id", optionalProtect, getMemoryById);

module.exports = router;