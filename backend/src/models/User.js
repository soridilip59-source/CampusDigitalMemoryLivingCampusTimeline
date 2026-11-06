const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
  type: String,
  required: true,
  trim: true,
  minlength: 2,
  maxlength: 50,
},
    email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
match: [
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  "Please enter a valid email"
]},
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
   password: {
  type: String,
  required: function () { return !this.googleId; },
  minlength: 8,
  select: false,
},
    role: {
      type: String,
      enum: ["contributor", "admin"],
      default: "contributor",
    },
    batch: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
