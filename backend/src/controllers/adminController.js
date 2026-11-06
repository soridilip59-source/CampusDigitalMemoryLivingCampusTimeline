const Memory = require("../models/Memory");
const Notification = require("../models/Notification");
const { presentMemory } = require("../utils/memoryPresenter");

// Get all pending memories
const getPendingMemories = async (req, res) => {
  try {
    const { status = "pending" } = req.query;

    const allowedStatuses = ["pending", "approved", "rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid memory status",
      });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const [memories, total, pending, approved, rejected, reported] = await Promise.all([
      Memory.find({ status })
        .populate("submittedBy", "name email batch")
        .populate("duplicateOf", "title")
        .populate("comments.user", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Memory.countDocuments({ status }),
      Memory.countDocuments({ status: "pending" }),
      Memory.countDocuments({ status: "approved" }),
      Memory.countDocuments({ status: "rejected" }),
      Memory.countDocuments({ "reports.0": { $exists: true } }),
    ]);

    return res.status(200).json({
      success: true,
      status,
      count: total,
      total,
      page,
      hasMore: page * limit < total,
      counts: { pending, approved, rejected, reported },
      items: memories.map((memory) => ({
        ...presentMemory(memory, req.user._id),
        duplicateTitle: memory.duplicateOf?.title || null,
      })),
    });
  } catch (error) {
    console.error("Admin memories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch memories",
    });
  }
};

//Ab admin dashboard ke liye ek API banayenge jo batayegi:
const getDashboardStats = async (req, res) => {
  try {
    const [totalMemories, pendingMemories, approvedMemories, rejectedMemories] =
      await Promise.all([
        Memory.countDocuments(),
        Memory.countDocuments({ status: "pending" }),
        Memory.countDocuments({ status: "approved" }),
        Memory.countDocuments({ status: "rejected" }),
      ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalMemories,
        pendingMemories,
        approvedMemories,
        rejectedMemories,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};

// Approve a memory

const approveMemory = async (req, res) => {
  try {
    const { id } = req.params;

    const memory = await Memory.findById(id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found",
      });
    }

    if (memory.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending memories can be approved",
      });
    }

    // Prevent users from approving their own memories
    if (memory.submittedBy.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You cannot approve your own memory",
      });
    }

    memory.status = "approved";
    memory.approvedBy = req.user._id;
    memory.approvedAt = new Date();

    await memory.save();

 // Save notification and emit event
try {
  const notification = await Notification.create({
    recipient: memory.submittedBy,
    type: "memory:approved",
    title: "Memory Approved!",
    message: `Your memory "${memory.title}" has been approved.`,
    memory: memory._id,
  });

  const io = req.app.get("io");

  if (io) {
    io.to(`user:${memory.submittedBy.toString()}`).emit("memory:approved", {
      notificationId: notification._id,
      memoryId: memory._id,
      title: memory.title,
      status: memory.status,
      message: "Your memory has been approved!",
    });
  }
} catch (notificationError) {
  console.error("Approval notification error:", notificationError);
}



    return res.status(200).json({
      success: true,
      message: "Memory approved successfully",
      memory,
    });
  } catch (error) {
    console.error("Approve memory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to approve memory",
    });
  }
};

const rejectMemory = async (req, res) => {
  try {
    const { id } = req.params;
    const rejectionReason = req.body?.reason || req.body?.rejectionReason;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const memory = await Memory.findById(id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found",
      });
    }

    if (memory.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending memories can be rejected",
      });
    }

    memory.status = "rejected";
    memory.rejectionReason = rejectionReason.trim();

    await memory.save();
// Save notification and emit event
try {
  const notification = await Notification.create({
    recipient: memory.submittedBy,
    type: "memory:rejected",
    title: "Memory Rejected",
    message: `Your memory "${memory.title}" was rejected. Reason: ${memory.rejectionReason}`,
    memory: memory._id,
  });

  const io = req.app.get("io");

  if (io) {
    io.to(`user:${memory.submittedBy.toString()}`).emit("memory:rejected", {
      notificationId: notification._id,
      memoryId: memory._id,
      title: memory.title,
      status: memory.status,
      rejectionReason: memory.rejectionReason,
      message: "Your memory has been rejected.",
    });
  }
} catch (notificationError) {
  console.error("Rejection notification error:", notificationError);
}

  return res.status(200).json({
  success: true,
  message: "Memory rejected successfully",
  memory,
});

} catch (error) {
  console.error("Reject memory error:", error);

  return res.status(500).json({
    success: false,
    message: "Failed to reject memory",
  });
}
};

const reviewMemory = async (req, res) => {
  const { status, reason } = req.body || {};
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid review status" });
  }
  if (status === "rejected" && !String(reason || "").trim()) {
    return res.status(400).json({ success: false, message: "Rejection reason is required" });
  }
  const memory = await Memory.findById(req.params.id).populate("submittedBy", "name batch");
  if (!memory) return res.status(404).json({ success: false, message: "Memory not found" });
  memory.status = status;
  memory.rejectionReason = status === "rejected" ? String(reason).trim() : undefined;
  if (status === "approved") {
    memory.approvedBy = req.user._id;
    memory.approvedAt = new Date();
  }
  await memory.save();
  const io = req.app.get("io");
  const result = presentMemory(memory, req.user._id);
  if (io) {
    if (status === "approved") io.emit("memory:published", result);
    io.emit("memory:reviewed", {
      id: result.id,
      title: result.title,
      status,
      reason: result.rejectReason,
      userId: result.contributor.id,
    });
  }
  const type = status === "approved" ? "memory:approved" : "memory:rejected";
  const message = status === "approved"
    ? `Your memory "${memory.title}" has been approved.`
    : `Your memory "${memory.title}" was rejected. Reason: ${memory.rejectionReason}`;
  const notification = await Notification.create({
    recipient: memory.submittedBy._id,
    memory: memory._id,
    type,
    title: memory.title,
    message,
    actorName: req.user.name,
    text: message,
  });
  if (io) {
    io.to(`user:${String(memory.submittedBy._id)}`).emit("notification:new", {
      id: String(notification._id),
      memoryId: String(memory._id),
      actorName: req.user.name,
      text: message,
      type,
      read: false,
      createdAt: notification.createdAt,
    });
  }
  return res.json(result);
};

const updateMemory = async (req, res) => {
  const memory = await Memory.findById(req.params.id);
  if (!memory) return res.status(404).json({ success: false, message: "Memory not found" });
  const mapping = { description: "story", type: "category" };
  for (const [field, value] of Object.entries(req.body || {})) {
    const target = mapping[field] || field;
    if (["year", "eventDate", "title", "story", "category", "featured"].includes(target)) {
      memory[target] = value;
    }
  }
  if (req.body?.year !== undefined && !req.body?.batch) memory.batch = `Batch ${req.body.year}`;
  await memory.save();
  const result = presentMemory(
    await Memory.findById(memory._id).populate("submittedBy", "name batch"),
    req.user._id,
  );
  const changed = Object.keys(req.body || {}).map((key) => key === "eventDate" ? "date" : key);
  const io = req.app.get("io");
  if (io && changed.length) io.emit("memory:updated", { memory: result, changed });
  return res.json(result);
};



module.exports = {
  getPendingMemories,
  approveMemory,
  rejectMemory,
  getDashboardStats,
  reviewMemory,
  updateMemory,
};
