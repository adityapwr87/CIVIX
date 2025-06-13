import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const connectSocket = useCallback(() => {
    // Get token without Bearer prefix - let backend handle it
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('No authentication token found');
      return null;
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace('Bearer ', '');

    // Create socket instance with clean token
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: cleanToken // Send token without Bearer prefix
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 5000,
      forceNew: true
    });

    // Debug token
    console.log('Connecting with token:', cleanToken.substring(0, 20) + '...');

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);

      if (err.message.includes('Authentication failed') || 
          err.message.includes('invalid signature')) {
        console.log('Token validation failed, clearing token...');
        localStorage.removeItem('token');
        window.location.href = '/login'; // Redirect to login
      }
    });

    newSocket.on('error', (err) => {
      console.error('Socket error:', err);
      setError(`Socket error: ${err.message}`);
    });

    return newSocket;
  }, []);

  // Setup and cleanup
  useEffect(() => {
    const newSocket = connectSocket();
    if (newSocket) {
      setSocket(newSocket);
      
      return () => {
        console.log('Cleaning up socket connection...');
        newSocket.off('connect');
        newSocket.off('connect_error');
        newSocket.off('error');
        newSocket.disconnect();
      };
    }
  }, [connectSocket]);

  const value = {
    socket,
    isConnected,
    error,
    setError,
    reconnect: connectSocket // Expose reconnect function
  };

  return (
    <ChatContext.Provider value={value}>
      {error && <div className="chat-error">{error}</div>}
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);