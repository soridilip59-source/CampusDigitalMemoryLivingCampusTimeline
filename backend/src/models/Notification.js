const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: { type: String, required: true },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    memory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Memory",
    },
    actorName: { type: String, default: "" },
    text: { type: String, default: "" },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
