const express = require("express");
const router = express.Router();

const {
  getPendingMemories,
  approveMemory,
  rejectMemory,
  getDashboardStats,
  reviewMemory,
  updateMemory,
} = require("../controllers/adminController");
const social = require("../controllers/memorySocialController");
const collections = require("../controllers/collectionController");

const { protect } = require("../middleware/authMiddleware");

const { adminOnly } = require("../middleware/adminMiddleware");

// Only admins can see pending memories
router.get("/memories", protect, adminOnly, getPendingMemories);
router.get("/stats", protect, adminOnly, getDashboardStats);
router.get("/memories/reported", protect, adminOnly, social.listReported);
router.patch("/memories/:id/review", protect, adminOnly, reviewMemory);
router.patch("/memories/:id/report/dismiss", protect, adminOnly, social.dismissReport);
router.delete("/memories/:id", protect, adminOnly, social.deleteReported);
router.patch("/memories/:id", protect, adminOnly, updateMemory);
router.patch("/memories/:id/featured", protect, adminOnly, social.setFeatured);
router.post("/collections", protect, adminOnly, collections.createCollection);
router.patch("/collections/:id", protect, adminOnly, collections.updateCollection);
router.delete("/collections/:id", protect, adminOnly, collections.deleteCollection);
router.post("/collections/:id/memories", protect, adminOnly, collections.addMemory);
router.delete("/collections/:id/memories/:memoryId", protect, adminOnly, collections.removeMemory);

router.patch("/memories/:id/approve", protect, adminOnly, approveMemory);

router.patch("/memories/:id/reject", protect, adminOnly, rejectMemory);


module.exports = router;
