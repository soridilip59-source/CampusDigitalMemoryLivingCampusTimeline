const Memory = require("../models/Memory");
const Notification = require("../models/Notification");

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

    const memories = await Memory.find({ status })
      .populate("submittedBy", "name email batch")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      status,
      count: memories.length,
      memories,
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
    const { rejectionReason } = req.body;

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



module.exports = {
  getPendingMemories,
  approveMemory,
  rejectMemory,
  getDashboardStats,
};
