import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './ChatWindow.css';

const ChatWindow = () => {
  const { issueId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      newSocket.emit('joinRoom', issueId);
    });

    newSocket.on('roomUsers', (users) => {
      setActiveUsers(users);
    });

    newSocket.on('userOffline', (userId) => {
      setActiveUsers(prev => prev.filter(user => user._id !== userId));
    });

    newSocket.on('message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [issueId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit('chatMessage', {
      issueId,
      content: newMessage
    });

    setNewMessage('');
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>Chat Room</h3>
        <div className="active-users">
          {activeUsers.map(user => (
            <div key={user._id} className="user-status">
              <span className="status-indicator"></span>
              <span className="username">{user.username}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === user._id ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              <p>{msg.content}</p>
              <small>{msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString()}</small>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatWindow;