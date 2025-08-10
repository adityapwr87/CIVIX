import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Chat.css"; // External CSS
import Navbar from "../Navbar/Navbar";
import { getChatMessages } from "../../services/api";
const socket = io("https://civix-2-backend.onrender.com");

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, receiverUser } = location.state || {};

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const bottomRef = useRef(null);

  const roomId =
    currentUser && receiverUser
      ? [currentUser._id, receiverUser._id].sort().join("-")
      : "";

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await getChatMessages(
          currentUser._id,
          receiverUser._id
        );
        setChat(res.data);
      } catch (err) {
        console.error(
          "Failed to load chat history:",
          err.response?.data || err.message
        );
      }
    };

    if (!currentUser || !receiverUser) {
      navigate("/");
      return;
    }

    socket.emit("join", { userId: currentUser._id });
    socket.emit("joinRoom", { roomId });
    loadHistory();

    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [currentUser, receiverUser, roomId, navigate]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const msgData = {
      sender: currentUser._id,
      receiver: receiverUser._id,
      content: message,
      timestamp: Date.now(),
    };

    socket.emit("send_message", { ...msgData, roomId });
    setMessage(""); // Clear input only
  };

  return (
    <div>
      <Navbar />
      <div className="chat-container">
        <div className="chat-header">
          <span>
            <button
              className="chat-user-button"
              onClick={() => navigate(`/user/${receiverUser?._id}`)}
            >
              {receiverUser?.username}
            </button>
          </span>
        </div>

        <div className="chat-messages">
          {chat.map((msg, index) => (
            <div
              key={index}
              className={`chat-bubble ${
                msg.sender === currentUser._id ? "sent" : "received"
              }`}
            >
              {msg.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-container">
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
