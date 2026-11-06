const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 300 },
  },
  { timestamps: true },
);

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
  },
  { timestamps: true },
);

const memorySchema = new mongoose.Schema(
  {
   title: {
  type: String,
  required: true,
  trim: true,
  maxlength: 100
},

   story: {
  type: String,
  required: true,
  trim: true,
  maxlength: 5000
},

    year: {
      type: Number,
      required: true,
      min: 2018
    },

    eventDate: {
      type: Date
    },

    category: {
      type: String,
      enum: [
        "event",
        "achievement",
        "cultural",
        "learning",
        "infrastructure",
        "project"
      ],
      required: true
    },
    batch: { type: String, trim: true, default: "" },
    related: { type: String, trim: true, default: "" },

    tags: [{
      type: String,
      trim: true
    }],

    media: [
      {
        url: {
          type: String,
          required: true
        },

        type: {
          type: String,
          enum: ["image", "video"],
          required: true
        },

        altText: {
          type: String,
          trim: true
        }
      }
    ],

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    rejectionReason: {
      type: String,
      trim: true
    },
    featured: { type: Boolean, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likeEvents: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, at: { type: Date, default: Date.now } }],
    reactions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      emoji: { type: String, enum: ["❤️", "😂", "😢", "🔥"], required: true },
    }],
    comments: [commentSchema],
    reports: [reportSchema],
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: "Memory" },
    duplicateScore: { type: Number },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    approvedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Improve common database queries
memorySchema.index({ status: 1, year: -1 });
memorySchema.index({ submittedBy: 1, createdAt: -1 });
memorySchema.index({ featured: 1, status: 1 });
const Memory = mongoose.model("Memory", memorySchema);

module.exports = Memory;