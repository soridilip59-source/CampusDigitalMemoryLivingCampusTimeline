const User = require("../models/User");
const Notification = require("../models/Notification");
const Memory = require("../models/Memory");
const uploadToCloudinary = require("../utils/cloudinaryUpload");
const { presentMemory } = require("../utils/memoryPresenter");

// Upload multiple files to Cloudinary
const uploadMemoryMedia = async (files) => {
  const uploadedMedia = [];

  for (const file of files) {
    const result = await uploadToCloudinary(
      file.buffer,
      "campus-digital-memory"
    );

    uploadedMedia.push({
      url: result.url,
      type: result.resourceType === "video" ? "video" : "image",
      altText: file.originalname,
    });
  }

  return uploadedMedia;
};

// Submit a new campus memory
const createMemory = async (req, res) => {
  try {
    const {
      title,
      story,
      year,
      eventDate,
      category,
      batch,
      related,
      tags,
    } = req.body || {};

    // Validate required fields
    if (!title || !story || !year || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, story, year and category are required",
      });
    }

    const duplicates = await Memory.find({
      year: Number(year),
      status: { $ne: "rejected" },
      title: { $regex: String(title).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
    }).select("title year status").limit(3);

    // Upload media files to Cloudinary
    const media = req.files?.length
      ? await uploadMemoryMedia(req.files)
      : [];

    // Format tags
    const formattedTags = Array.isArray(tags)
      ? tags
      : typeof req.body?.["tags[]"] === "string"
        ? [req.body["tags[]"]]
      : typeof tags === "string" && tags.trim()
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

    // Save memory in MongoDB
    const memory = await Memory.create({
      title,
      story,
      year: Number(year),
      eventDate: eventDate || undefined,
      category,
      batch: batch || `Batch ${year}`,
      related: related || "",
      tags: formattedTags,
      media,
      submittedBy: req.user._id,
      status: "pending",
      duplicateOf: duplicates[0]?._id,
      duplicateScore: duplicates.length ? 1 : undefined,
    });

    // Create notifications for admins
    try {
      const admins = await User.find({
        role: "admin",
      }).select("_id");

      if (admins.length > 0) {
        const notifications = admins.map((admin) => ({
          recipient: admin._id,
          type: "memory:submitted",
          title: "New Memory Submitted",
          message: `A new memory "${memory.title}" is waiting for review.`,
          memory: memory._id,
        }));

        await Notification.insertMany(notifications);
      }
    } catch (notificationError) {
      console.error("Admin notification error:", notificationError);
    }

    // Get Socket.IO instance
    const io = req.app.get("io");

    // Notify connected admins
    if (io) {
      const event = {
        memoryId: memory._id,
        id: memory._id,
        title: memory.title,
        year: memory.year,
        category: memory.category,
        submittedBy: req.user._id,
        by: req.user.name,
      };
      io.to("admins").emit("memory:submitted", event);
      io.to("admins").emit("memory:new", event);
      if (duplicates.length) {
        io.to("admins").emit("memory:duplicate", {
          id: String(memory._id),
          title: memory.title,
          of: {
            id: String(duplicates[0]._id),
            title: duplicates[0].title,
            year: duplicates[0].year,
            status: duplicates[0].status,
            score: 1,
          },
        });
      }
    }

    const populatedMemory = await Memory.findById(memory._id).populate("submittedBy", "name batch");
    return res.status(201).json({
      success: true,
      message: "Memory submitted successfully",
      memory: presentMemory(populatedMemory, req.user._id),
      duplicates: duplicates.map((duplicate) => ({
        id: String(duplicate._id),
        title: duplicate.title,
        year: duplicate.year,
        status: duplicate.status,
        score: 1,
      })),
    });
  } catch (error) {
    console.error("Error submitting memory:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit memory",
    });
  }
};

// Get all approved memories for public timeline
const getApprovedMemories = async (req, res) => {
  try {
    const {
      q,
      search,
      year,
      batch,
      type,
      category,
      page = 1,
      limit = 10,
    } = req.query;

    // Only approved memories are publicly visible
    const filter = {
      status: "approved",
    };

    // Search by title or story
    if (search && search.trim()) {
      const safeSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { story: { $regex: safeSearch, $options: "i" } },
      ];
    }
    if (q && q.trim()) {
      const safeSearch = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { story: { $regex: safeSearch, $options: "i" } },
        { tags: { $regex: safeSearch, $options: "i" } },
        { related: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Filter by year
    if (year) {
      filter.year = Number(year);
    }

    // Filter by category
    if (category || type) {
      filter.category = category || type;
    }
    if (batch) {
      filter.batch = batch;
    }

    // Pagination
    const currentPage = Math.max(1, Number(page) || 1);
    const perPage = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * perPage;

    const direction = req.query.sort === "asc" ? 1 : -1;
    const [memories, totalMemories] = await Promise.all([
      Memory.find(filter)
        .populate("submittedBy", "name batch")
        .populate("comments.user", "name")
        .populate("reports.user", "name")
        .sort({ year: direction, eventDate: direction, createdAt: direction })
        .skip(skip)
        .limit(perPage),

      Memory.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      totalMemories,
      currentPage,
      totalPages: Math.ceil(totalMemories / perPage),
      items: memories.map((memory) => presentMemory(memory, req.user?._id)),
      total: totalMemories,
      page: currentPage,
      hasMore: currentPage * perPage < totalMemories,
      memories: memories.map((memory) => presentMemory(memory, req.user?._id)),
    });
  } catch (error) {
    console.error("Get approved memories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch memories",
    });
  }
};

// Get memories submitted by the logged-in user
const getMyMemories = async (req, res) => {
  try {
    const memories = await Memory.find({
      submittedBy: req.user._id,
    }).populate("submittedBy", "name batch")
      .populate("comments.user", "name")
      .populate("reports.user", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: memories.length,
      memories: memories.map((memory) => presentMemory(memory, req.user._id)),
      items: memories.map((memory) => presentMemory(memory, req.user._id)),
    });
  } catch (error) {
    console.error("Error fetching my memories:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your memories",
    });
  }
};

// Get a single approved memory by ID
const getMemoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const memory = await Memory.findOne({
      _id: id,
      status: "approved",
    }).populate("submittedBy", "name batch")
      .populate("comments.user", "name")
      .populate("reports.user", "name");

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found",
      });
    }

    return res.status(200).json({
      success: true,
      memory: presentMemory(memory, req.user?._id),
    });
  } catch (error) {
    console.error("Get memory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch memory",
    });
  }
};

module.exports = {
  createMemory,
  getApprovedMemories,
  getMyMemories,
  getMemoryById,
  uploadMemoryMedia,
};