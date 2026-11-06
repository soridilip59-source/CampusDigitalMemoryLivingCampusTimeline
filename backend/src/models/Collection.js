const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    memories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Memory" }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Collection", collectionSchema);
