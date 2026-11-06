const Collection = require("../models/Collection");
const Memory = require("../models/Memory");
const { presentMemory, idOf } = require("../utils/memoryPresenter");

const fail = (status, message) => Object.assign(new Error(message), { status });

async function listCollections(req, res) {
  const collections = await Collection.find().sort({ createdAt: -1 });
  return res.json(collections.map((collection) => ({
    id: idOf(collection._id),
    name: collection.name,
    description: collection.description,
    memoryIds: collection.memories.map(idOf),
    count: collection.memories.length,
  })));
}

async function getCollection(req, res) {
  const collection = await Collection.findById(req.params.id).populate({
    path: "memories",
    match: { status: "approved" },
    populate: [
      { path: "submittedBy", select: "name batch" },
      { path: "comments.user", select: "name" },
    ],
  });
  if (!collection) throw fail(404, "Collection not found");
  return res.json({
    id: idOf(collection._id),
    name: collection.name,
    description: collection.description,
    memoryIds: collection.memories.map((memory) => idOf(memory._id)),
    count: collection.memories.length,
    memories: collection.memories.map((memory) => presentMemory(memory, req.user?._id)),
  });
}

async function createCollection(req, res) {
  const name = String(req.body?.name || "").trim();
  if (!name) throw fail(400, "Collection name is required");
  const collection = await Collection.create({
    name,
    description: String(req.body?.description || "").trim(),
  });
  return res.status(201).json({
    id: idOf(collection._id),
    name: collection.name,
    description: collection.description,
    memoryIds: [],
    count: 0,
  });
}

async function updateCollection(req, res) {
  const updates = {};
  if (req.body?.name !== undefined) updates.name = String(req.body.name).trim();
  if (req.body?.description !== undefined) updates.description = String(req.body.description).trim();
  if (updates.name === "") throw fail(400, "Collection name is required");
  const collection = await Collection.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!collection) throw fail(404, "Collection not found");
  return res.json({
    id: idOf(collection._id),
    name: collection.name,
    description: collection.description,
    memoryIds: collection.memories.map(idOf),
    count: collection.memories.length,
  });
}

async function deleteCollection(req, res) {
  const collection = await Collection.findByIdAndDelete(req.params.id);
  if (!collection) throw fail(404, "Collection not found");
  return res.json({ success: true });
}

async function addMemory(req, res) {
  const { memoryId } = req.body || {};
  const [collection, memory] = await Promise.all([
    Collection.findById(req.params.id),
    Memory.findOne({ _id: memoryId, status: "approved" }),
  ]);
  if (!collection || !memory) throw fail(404, "Collection or approved memory not found");
  if (!collection.memories.some((id) => idOf(id) === String(memoryId))) {
    collection.memories.push(memory._id);
    await collection.save();
  }
  return res.json({ success: true });
}

async function removeMemory(req, res) {
  const collection = await Collection.findByIdAndUpdate(
    req.params.id,
    { $pull: { memories: req.params.memoryId } },
    { new: true },
  );
  if (!collection) throw fail(404, "Collection not found");
  return res.json({ success: true });
}

module.exports = {
  listCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addMemory,
  removeMemory,
};
