const User = require("../models/User");
const Notification = require("../models/Notification");
const Memory = require("../models/Memory");


//submit a new campus memory


const createMemory = async (req, res) => {
  try {
    const {
      title,
      story,
      year,
      eventDate,
      category,
      tags
    } = req.body || {};

    // Validate required fields
    if (!title || !story || !year || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, story, year and category are required"
      });
    }

    // Save memory in MongoDB
    const memory = await Memory.create({
      title,
      story,
      year: Number(year),
      eventDate: eventDate || undefined,
      category,
      tags: tags || [],
      submittedBy: req.user._id,
      status: "pending"
    });


    
// Find all admin users
const admins = await User.find({
  role: "admin"
}).select("_id");

// Create notifications for admins
if (admins.length > 0) {
  const notifications = admins.map((admin) => ({
    recipient: admin._id,
    type: "memory:submitted",
    title: "New Memory Submitted",
    message: `A new memory "${memory.title}" is waiting for review.`,
    memory: memory._id
  }));

  // Save notifications in MongoDB
  await Notification.insertMany(notifications);
}




    // Get Socket.IO instance
    const io = req.app.get("io");

    // Notify connected admins
    if (io) {
      io.to("admins").emit("memory:submitted", {
        memoryId: memory._id,
        title: memory.title,
        year: memory.year,
        category: memory.category,
        submittedBy: req.user._id
      });
    }

    return res.status(201).json({
      success: true,
      message: "Memory submitted successfully",
      memory
    });

  } catch (error) {
    console.error("Error submitting memory:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit memory"
    });
  }
};


// Get all approved memories for public timeline
const getApprovedMemories = async (req, res) => {
  try {
    const {
      search,
      year,
      category,
      page = 1,
      limit = 10
    } = req.query;

    // Only approved memories
    const filter = {
      status: "approved"
    };

    // Search by title or story
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { story: { $regex: search, $options: "i" } }
      ];
    }

    // Filter by year
    if (year) {
      filter.year = Number(year);
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Pagination
    const currentPage = Math.max(1, Number(page) || 1);
    const perPage = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * perPage;

    const memories = await Memory.find(filter)
      .populate("submittedBy", "name batch")
      .sort({ year: -1 })
      .skip(skip)
      .limit(perPage);

    const totalMemories = await Memory.countDocuments(filter);

    return res.status(200).json({
      success: true,
      totalMemories,
      currentPage,
      totalPages: Math.ceil(totalMemories / perPage),
      memories
    });

  } catch (error) {
    console.error("Get approved memories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch memories"
    });
  }
};

// Get memories submitted by the logged-in user

const getMyMemories = async (req, res) => {
    try {
        const memories = await Memory.find({
            submittedBy: req.user._id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: memories.length,
            memories
        });

    } catch (error) {
        console.error("Error fetching my memories:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch your memories"
        });
    }
};

const getMemoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const memory = await Memory.findOne({
      _id: id,
      status: "approved"
    }).populate("submittedBy", "name batch");

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found"
      });
    }

    return res.status(200).json({
      success: true,
      memory
    });

  } catch (error) {
    console.error("Get memory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch memory"
    });
  }
};

module.exports = { createMemory, getApprovedMemories, getMyMemories , getMemoryById};