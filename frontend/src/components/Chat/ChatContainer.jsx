import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUsers, FaUserShield } from 'react-icons/fa';
import { useChat } from '../../context/ChatContext';
import ChatMessage from './ChatMessage';
import './ChatContainer.css';

const ChatContainer = ({ listMode }) => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState({ users: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket, isConnected } = useChat();
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch active users
  useEffect(() => {
    fetchActiveUsers();
    // Set up polling for active users every 30 seconds
    const interval = setInterval(fetchActiveUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/chat/active-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch active users');
      const data = await response.json();
      setActiveUsers(data);
    } catch (error) {
      console.error('Error fetching active users:', error);
    }
  };

  // Fetch chat history
  useEffect(() => {
    const fetchMessages = async () => {
      if (!issueId) {
        setError('No issue ID provided');
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(
          `http://localhost:5000/api/chat/history/${issueId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.statusText}`);
        }

        const data = await response.json();
        setMessages(data);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [issueId, navigate]);

  // Join chat room when component mounts
  useEffect(() => {
    if (!socket || !isConnected || !issueId) return;

    // Join the specific issue chat room
    socket.emit('joinRoom', { issueId }, (error) => {
      if (error) {
        setError(error);
        console.error('Error joining room:', error);
      } else {
        console.log('Successfully joined room:', issueId);
      }
    });

    return () => {
      socket.emit('leaveRoom', { issueId });
    };
  }, [socket, isConnected, issueId]);

  // Add message listener
  useEffect(() => {
    if (!socket) return;

    console.log('Setting up message listeners');

    socket.on('newMessage', (message) => {
      console.log('Received new message:', message);
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socket.on('messageError', ({ error }) => {
      console.error('Message error:', error);
      setError(error);
    });

    return () => {
      socket.off('newMessage');
      socket.off('messageError');
    };
  }, [socket, scrollToBottom]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket || !isConnected) return;

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const messageData = {
        issueId,
        content: newMessage.trim(),
        sender: user.id,
        senderName: user.username, // Add username
        timestamp: new Date().toISOString()
      };

      console.log('Sending message:', messageData);
      
      socket.emit('sendMessage', messageData);
      setNewMessage('');
      messageInputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    }
  };

  if (loading) return <div className="chat-loading">Loading messages...</div>;
  if (error) return <div className="chat-error">Error: {error}</div>;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat {issueId && `- Issue #${issueId.slice(-6)}`}</h2>
        <div className="active-users">
          <div className="user-count">
            <FaUsers />
            <span>{activeUsers.users} Users Online</span>
          </div>
          <div className="admin-count">
            <FaUserShield />
            <span>{activeUsers.admins} Admins Online</span>
          </div>
        </div>
        {!isConnected && (
          <div className="connection-warning">
            Connecting to chat server...
          </div>
        )}
      </div>

      <div className="messages-area">
        {messages.map((message, index) => (
          <ChatMessage 
            key={message._id || index}
            message={message}
            isOwnMessage={message.sender === localStorage.getItem('userId')}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={!isConnected}
          ref={messageInputRef}
          className="message-input"
        />
        <button 
          type="submit" 
          disabled={!isConnected || !newMessage.trim()}
          className="send-button"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatContainer;