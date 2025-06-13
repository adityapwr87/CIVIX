import React from 'react';
import './ChatMessage.css';

const ChatMessage = ({ message, isOwnMessage }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const displayName = isOwnMessage ? 'You' : (message.senderName || 'Unknown User');

  return (
    <div className={`message ${isOwnMessage ? 'sent' : 'received'}`}>
      <div className="message-header">
        <span className="sender-name">{displayName}</span>
        <span className="timestamp">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div className="message-content">{message.content}</div>
    </div>
  );
};

export default ChatMessage;