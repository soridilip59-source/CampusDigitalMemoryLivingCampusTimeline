
require("dotenv").config({
  path: "./.env"
});

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const app = require("./app");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"]
  }
});

// Make Socket.IO available to Express controllers
app.set("io", io);

// Socket.IO JWT Authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const cleanToken = token.replace(/^Bearer\s+/i, "");

    const decoded = jwt.verify(
      cleanToken,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id)
      .select("_id role");

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.data.userId = user._id.toString();
    socket.data.role = user.role;

    next();

  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});

// Socket connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.data.userId);

  // Every user joins their private room
  socket.join(`user:${socket.data.userId}`);

  // Admin joins admin room
  if (socket.data.role === "admin") {
    socket.join("admins");
    console.log("Admin connected");
  }

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.data.userId);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Socket.IO is ready!");
});
