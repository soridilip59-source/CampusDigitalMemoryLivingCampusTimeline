const mongoose = require("mongoose");

const memorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    story: {
      type: String,
      required: true
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
        "culture",
        "workshop",
        "campus-life",
        "other"
      ],
      required: true
    },

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

    public_id: {
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
memorySchema.index({ submittedBy: 1 });

const Memory = mongoose.model("Memory", memorySchema);

module.exports = Memory;