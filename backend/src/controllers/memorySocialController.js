const Memory = require("../models/Memory");
const Notification = require("../models/Notification");
const Collection = require("../models/Collection");
const User = require("../models/User");
const { presentMemory, idOf, REACTIONS } = require("../utils/memoryPresenter");
const { uploadMemoryMedia } = require("./memoryController");

const fail = (status, message) => Object.assign(new Error(message), { status });
const populateMemory = (query) => query
  .populate("submittedBy", "name batch")
  .populate("comments.user", "name")
  .populate("reports.user", "name");

async function notifyUser(req, recipient, memory, type, text) {
  if (!recipient || String(recipient) === String(req.user._id)) return;
  const notification = await Notification.create({
    recipient,
    memory: memory._id,
    type,
    title: memory.title,
    message: text,
    actorName: req.user.name,
    text,
  });
  const io = req.app.get("io");
  if (io) {
    io.to(`user:${recipient}`).emit("notification:new", {
      id: idOf(notification._id),
      memoryId: idOf(memory._id),
      actorName: req.user.name,
      text,
      type,
      read: false,
      createdAt: notification.createdAt,
    });
  }
}

async function getStats(req, res) {
  const [total, contributors, grouped] = await Promise.all([
    Memory.countDocuments({ status: "approved" }),
    Memory.distinct("submittedBy", { status: "approved" }),
    Memory.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$year", count: { $sum: 1 } } },
    ]),
  ]);
  return res.json({
    total,
    contributors: contributors.length,
    years: Object.fromEntries(grouped.map(({ _id, count }) => [_id, count])),
    firstYear: 2018,
  });
}

async function getHomeExtras(req, res) {
  const now = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  const [memories, onThisDayMemories, featuredMemories] = await Promise.all([
    populateMemory(Memory.find({ status: "approved" }).sort({ createdAt: -1 }).limit(200)),
    populateMemory(Memory.find({
      status: "approved",
      year: { $lt: now.getFullYear() },
      eventDate: { $type: "date" },
      $expr: {
        $and: [
          { $eq: [{ $month: "$eventDate" }, now.getMonth() + 1] },
          { $eq: [{ $dayOfMonth: "$eventDate" }, now.getDate()] },
        ],
      },
    })),
    populateMemory(Memory.find({ status: "approved", featured: true }).sort({ updatedAt: -1 })),
  ]);
  const userId = req.user?._id;
  const trending = memories
    .map((memory) => ({
      ...presentMemory(memory, userId),
      weekScore: (memory.comments || []).filter((comment) => new Date(comment.createdAt) >= sevenDaysAgo).length
        + (memory.likeEvents || []).filter((event) => new Date(event.at) >= sevenDaysAgo).length,
    }))
    .filter((memory) => memory.weekScore > 0)
    .sort((a, b) => b.weekScore - a.weekScore)
    .slice(0, 5);
  return res.json({
    trending,
    onThisDay: onThisDayMemories.map((memory) => presentMemory(memory, userId)),
    featured: featuredMemories.map((memory) => presentMemory(memory, userId)),
  });
}

async function checkDuplicates(req, res) {
  const title = String(req.body?.title || "").trim().toLowerCase();
  const year = Number(req.body?.year);
  if (title.length < 4 || !Number.isInteger(year)) return res.json([]);
  const candidates = await Memory.find({ year, status: { $ne: "rejected" } }).select("title status");
  const duplicates = candidates
    .map((memory) => {
      const candidate = memory.title.trim().toLowerCase();
      const score = candidate === title ? 1 : (candidate.includes(title) || title.includes(candidate) ? 0.6 : 0);
      return { id: idOf(memory._id), title: memory.title, year, status: memory.status, score };
    })
    .filter((memory) => memory.score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return res.json(duplicates);
}

async function toggleLike(req, res) {
  const memory = await Memory.findOne({ _id: req.params.id, status: "approved" });
  if (!memory) throw fail(404, "Memory not found");
  const userId = String(req.user._id);
  const index = memory.likes.findIndex((like) => idOf(like) === userId);
  const liked = index < 0;
  if (liked) {
    memory.likes.push(req.user._id);
    memory.likeEvents.push({ user: req.user._id, at: new Date() });
    await notifyUser(req, memory.submittedBy, memory, "like", `${req.user.name} liked your memory`);
  } else {
    memory.likes.splice(index, 1);
  }
  await memory.save();
  return res.json({ liked, likesCount: memory.likes.length });
}

async function toggleReaction(req, res) {
  const { emoji } = req.body || {};
  if (!REACTIONS.includes(emoji)) throw fail(400, "Unsupported reaction");
  const memory = await Memory.findOne({ _id: req.params.id, status: "approved" });
  if (!memory) throw fail(404, "Memory not found");
  const userId = String(req.user._id);
  const existing = memory.reactions.find((reaction) => idOf(reaction.user) === userId);
  if (existing?.emoji === emoji) {
    memory.reactions = memory.reactions.filter((reaction) => idOf(reaction.user) !== userId);
  } else {
    memory.reactions = memory.reactions.filter((reaction) => idOf(reaction.user) !== userId);
    memory.reactions.push({ user: req.user._id, emoji });
    await notifyUser(req, memory.submittedBy, memory, "reaction", `${req.user.name} reacted ${emoji} to your memory`);
  }
  await memory.save();
  return res.json(presentMemory(await populateMemory(Memory.findById(memory._id)), req.user._id));
}

async function addComment(req, res) {
  const text = String(req.body?.text || "").trim();
  if (!text || text.length > 300) throw fail(400, "Comment must be 1–300 characters");
  const memory = await Memory.findOne({ _id: req.params.id, status: "approved" });
  if (!memory) throw fail(404, "Memory not found");
  memory.comments.push({ user: req.user._id, text });
  await memory.save();
  await notifyUser(req, memory.submittedBy, memory, "comment", `${req.user.name} commented on your memory`);
  const populated = await populateMemory(Memory.findById(memory._id));
  const result = presentMemory(populated, req.user._id);
  return res.status(201).json({ comments: result.comments, comment: result.comments[result.comments.length - 1] });
}

async function deleteComment(req, res) {
  const memory = await Memory.findById(req.params.id);
  if (!memory) throw fail(404, "Memory not found");
  const comment = memory.comments.id(req.params.commentId);
  if (!comment) throw fail(404, "Comment not found");
  if (idOf(comment.user) !== String(req.user._id) && req.user.role !== "admin") {
    throw fail(403, "You cannot delete this comment");
  }
  comment.deleteOne();
  await memory.save();
  const populated = await populateMemory(Memory.findById(memory._id));
  return res.json(presentMemory(populated, req.user._id).comments);
}

async function editOwn(req, res) {
  const memory = await Memory.findOne({ _id: req.params.id, submittedBy: req.user._id });
  if (!memory || !["pending", "rejected"].includes(memory.status)) {
    throw fail(403, "Only your pending or rejected memories can be edited");
  }
  const fields = {
    title: "title", description: "story", story: "story", year: "year",
    type: "category", category: "category", eventDate: "eventDate",
    batch: "batch", related: "related", tags: "tags",
  };
  for (const [source, target] of Object.entries(fields)) {
    if (req.body?.[source] !== undefined) {
      const value = req.body[source];
      memory[target] = source === "eventDate" && value === "" ? undefined : value;
    }
  }
  if (req.body?.imagesProvided === "true" || req.body?.existingImages !== undefined || req.files?.length) {
    const requested = Array.isArray(req.body.existingImages)
      ? req.body.existingImages
      : req.body.existingImages ? [req.body.existingImages] : [];
    const existing = memory.media.filter((item) => requested.includes(item.url));
    const uploaded = req.files?.length ? await uploadMemoryMedia(req.files) : [];
    memory.media = [...existing, ...uploaded];
  }
  if (req.body?.year !== undefined && req.body?.batch === undefined) {
    memory.batch = `Batch ${req.body.year}`;
  }
  if (memory.status === "rejected") {
    memory.status = "pending";
    memory.rejectionReason = undefined;
  }
  await memory.save();
  return res.json(presentMemory(await populateMemory(Memory.findById(memory._id)), req.user._id));
}

async function deleteOwn(req, res) {
  const memory = await Memory.findOne({ _id: req.params.id, submittedBy: req.user._id });
  if (!memory || memory.status !== "pending") throw fail(403, "Only your pending memories can be deleted");
  await Collection.updateMany({}, { $pull: { memories: memory._id } });
  await memory.deleteOne();
  return res.json({ success: true });
}

async function reportMemory(req, res) {
  const reason = String(req.body?.reason || "");
  if (!["wrong info", "duplicate", "inappropriate"].includes(reason)) {
    throw fail(400, "Choose a valid report reason");
  }
  const memory = await Memory.findOne({ _id: req.params.id, status: "approved" });
  if (!memory) throw fail(404, "Memory not found");
  if (!memory.reports.some((report) => idOf(report.user) === String(req.user._id))) {
    memory.reports.push({ user: req.user._id, reason });
    await memory.save();
    const admins = await User.find({ role: "admin" }).select("_id");
    const text = `${req.user.name} reported “${memory.title}”: ${reason}`;
    await Notification.insertMany(admins.map((admin) => ({
      recipient: admin._id,
      memory: memory._id,
      type: "report",
      title: memory.title,
      message: text,
      actorName: req.user.name,
      text,
    })));
    const io = req.app.get("io");
    if (io) {
      const event = {
        memoryId: idOf(memory._id),
        actorName: req.user.name,
        text,
        type: "report",
        read: false,
        createdAt: new Date().toISOString(),
      };
      admins.forEach((admin) => io.to(`user:${idOf(admin._id)}`).emit("notification:new", event));
    }
  }
  return res.json({ success: true });
}

async function listReported(req, res) {
  const memories = await populateMemory(Memory.find({ "reports.0": { $exists: true } }).sort({ updatedAt: -1 }));
  return res.json(memories.map((memory) => presentMemory(memory)));
}

async function dismissReport(req, res) {
  const memory = await Memory.findById(req.params.id);
  if (!memory) throw fail(404, "Memory not found");
  memory.reports = [];
  await memory.save();
  return res.json({ success: true });
}

async function deleteReported(req, res) {
  const memory = await Memory.findOneAndDelete({ _id: req.params.id, "reports.0": { $exists: true } });
  if (!memory) throw fail(404, "Reported memory not found");
  await Collection.updateMany({}, { $pull: { memories: memory._id } });
  return res.json({ success: true });
}

async function setFeatured(req, res) {
  const memory = await Memory.findByIdAndUpdate(
    req.params.id,
    { featured: Boolean(req.body?.featured) },
    { new: true },
  );
  if (!memory) throw fail(404, "Memory not found");
  const populated = await populateMemory(Memory.findById(memory._id));
  const result = presentMemory(populated, req.user._id);
  const io = req.app.get("io");
  if (io) io.emit("memory:updated", { memory: result, changed: ["featured"] });
  return res.json(result);
}

async function getCollectionsForMemory(req, res) {
  const collections = await Collection.find({ memories: req.params.id }).select("name");
  return res.json(collections.map((collection) => ({ id: idOf(collection._id), name: collection.name })));
}

module.exports = {
  getStats,
  getHomeExtras,
  checkDuplicates,
  toggleLike,
  toggleReaction,
  addComment,
  deleteComment,
  editOwn,
  deleteOwn,
  reportMemory,
  listReported,
  dismissReport,
  deleteReported,
  setFeatured,
  getCollectionsForMemory,
};
