import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
  console.log("isAuthenticated", isAuthenticated);
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    setIsAuthenticated(!!token);
    console.log("AuthContext updated:", isAuthenticated);  // Log here
     setAuthLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, authLoading, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);

