const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const memoryRoutes = require("./routes/memoryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

 const app = express();



// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(helmet());

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/memories", memoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Campus Digital Memory API is running!"
  });
});





// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("API Error:", err.message);

// Handle invalid MongoDB ObjectId
if (err.name === "CastError") {
  return res.status(400).json({
    success: false,
    message: "Invalid resource ID"
  });
}

  if (err instanceof require("multer").MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size cannot exceed 10 MB"
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 media files are allowed"
      });
    }
  }

  if (err.message === "Only supported images and videos are allowed") {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  return res.status(500).json({
    success: false,
    message: "Something went wrong"
  });
});


module.exports = app;

