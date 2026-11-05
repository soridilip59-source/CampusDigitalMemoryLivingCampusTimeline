const express = require("express");
const router = express.Router();

const {
  getPendingMemories,
  approveMemory,
  rejectMemory,
  getDashboardStats,
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");

const { adminOnly } = require("../middleware/adminMiddleware");

// Only admins can see pending memories
router.get("/memories", protect, adminOnly, getPendingMemories);
router.get("/stats", protect, adminOnly, getDashboardStats);

router.patch("/memories/:id/approve", protect, adminOnly, approveMemory);

router.patch("/memories/:id/reject", protect, adminOnly, rejectMemory);


module.exports = router;
