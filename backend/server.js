require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const app = require("./app");
const Message = require("./models/Message");
const fs = require("fs");
const https = require("https");

connectDB();

const privateKey = fs.readFileSync("certs/privkey.pem", "utf8"); // <-- Update path as needed
const certificate = fs.readFileSync("certs/cert.pem", "utf8"); // <-- Update path as needed
const credentials = { key: privateKey, cert: certificate };

const server = https.createServer(credentials, app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("join", ({ userId }) => {
    socket.join(userId); // Each user joins their personal room
  });

  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId); // Join the private chat room
  });

  socket.on("send_message", async ({ sender, receiver, content, roomId }) => {
    if (!sender || !receiver || !content || !roomId) {
      console.warn("Missing required fields in message");
      return;
    }
    console.log("Message received:", { sender, receiver, content, roomId });
    try {
      const newMessage = new Message({
        sender,
        receiver,
        content,
      });
      await newMessage.save();
      console.log("Message saved to database:", newMessage);
      const msgData = {
        sender,
        receiver,
        content,
        timestamp: newMessage.createdAt,
      };

      io.to(roomId).emit("receive_message", msgData);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
