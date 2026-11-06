const express = require("express");
const User = require("../models/User");
const Memory = require("../models/Memory");
const { optionalProtect } = require("../middleware/authMiddleware");
const { presentMemory, idOf } = require("../utils/memoryPresenter");

const router = express.Router();

router.get("/:id/profile", optionalProtect, async (req, res) => {
  const user = await User.findById(req.params.id).select("name batch");
  if (!user) return res.status(404).json({ success: false, message: "Contributor not found" });
  const memories = await Memory.find({ submittedBy: user._id, status: "approved" })
    .populate("submittedBy", "name batch")
    .populate("comments.user", "name")
    .sort({ createdAt: -1 });
  const totalLikes = memories.reduce((total, memory) => total + memory.likes.length, 0);
  const allLikes = await Memory.aggregate([
    { $match: { status: "approved" } },
    { $group: { _id: "$submittedBy", total: { $sum: { $size: { $ifNull: ["$likes", []] } } } } },
    { $group: { _id: null, max: { $max: "$total" } } },
  ]);
  const maxLikes = allLikes[0]?.max || 0;
  const badges = [
    ...(memories.length ? ["First Memory"] : []),
    ...(memories.length >= 5 ? ["5 Memories"] : []),
    ...(totalLikes > 0 && totalLikes >= maxLikes ? ["Most Liked"] : []),
  ];
  return res.json({
    id: idOf(user._id),
    name: user.name,
    batch: user.batch || "",
    memories: memories.map((memory) => presentMemory(memory, req.user?._id)),
    totalLikes,
    badges,
  });
});

module.exports = router;
