const { io } = require("socket.io-client");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Enter your JWT token: ", (token) => {
  const socket = io("http://localhost:5000", {
    auth: {
      token: token.trim()
    }
  });

  socket.on("connect", () => {
    console.log("Socket connected successfully!");
    console.log("Socket ID:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.log("Connection failed:", error.message);
  });

  socket.on("memory:submitted", (data) => {
    console.log("New memory submitted:", data);
  });

  socket.on("memory:approved", (data) => {
    console.log("Memory approved:", data);
  });

  socket.on("memory:rejected", (data) => {
    console.log("Memory rejected:", data);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  rl.close();
});