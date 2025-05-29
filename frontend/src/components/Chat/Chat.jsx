import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './Chatcss.css';

const Chat = () => {
  const { issueId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [activeAdmins, setActiveAdmins] = useState([]);
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.emit('joinRoom', issueId);

    // Update admin status if user is admin
    if (user.role === 'admin') {
      fetch('http://localhost:5000/api/chat/admin-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
    }

    // Listen for admin status changes
    newSocket.on('adminStatusChange', (adminData) => {
      setActiveAdmins(prev => {
        const exists = prev.some(admin => admin._id === adminData.adminId);
        if (exists) {
          return prev.map(admin => 
            admin._id === adminData.adminId ? {...admin, isOnline: adminData.isOnline} : admin
          );
        }
        return [...prev, adminData];
      });
    });

    // Listen for active admins updates
    newSocket.on('activeAdmins', (admins) => {
      setActiveAdmins(admins);
    });

    // Listen for incoming messages
    newSocket.on('message', (message) => {
      setMessages(prevMessages => [...prevMessages, message]);
      scrollToBottom();
    });

    setSocket(newSocket);

    // Load existing messages and active admins
    const fetchData = async () => {
      try {
        const [messagesRes, adminsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/chat/${issueId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }),
          fetch(`http://localhost:5000/api/users/active-admins`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);

        const messagesData = await messagesRes.json();
        const adminsData = await adminsRes.json();

        setMessages(messagesData);
        setActiveAdmins(adminsData);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    return () => {
      if (user.role === 'admin') {
        // Update admin status to offline when component unmounts
        fetch('http://localhost:5000/api/chat/admin-status', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isOnline: false })
        });
      }
      newSocket.close();
    };
  }, [issueId, user]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      issueId,
      content: newMessage,
      sender: user._id,
      senderName: user.username
    };

    // Emit message to server
    socket.emit('chatMessage', messageData);

    // Add message to local state immediately for instant feedback
    setMessages(prevMessages => [...prevMessages, {
      ...messageData,
      timestamp: new Date()
    }]);

    // Clear input
    setNewMessage('');
    scrollToBottom();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat Room</h3>
        <div className="active-admins">
          <span>Active Admins ({activeAdmins.length})</span>
          <div className="admin-list">
            {activeAdmins.map(admin => (
              <div key={admin._id} className="admin-item">
                <span className="admin-name">{admin.username}</span>
                <span className="admin-district">District: {admin.districtCode}</span>
                <span className="active-indicator"></span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="messages-area">
        {messages.map((msg, index) => (
          <div 
            key={index}
            className={`message ${msg.sender === user._id ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              <p>{msg.content}</p>
              <small>
                {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString()}
              </small>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          autoComplete="off"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;