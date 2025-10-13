// src/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL;

// Create a single socket instance
export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
});

// Optional: handle connection errors
socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err);
});
