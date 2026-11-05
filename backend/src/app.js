const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Test route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Campus Digital Memory API is running!"
  });
});

module.exports = app;