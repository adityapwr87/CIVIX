import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = () => {
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        setUser(JSON.parse(userProfile));
      }
      setLoading(false);
    };

    initializeUser();
  }, []);

  const updateUser = (userData) => {
    localStorage.setItem('userProfile', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loading, updateUser, logout }}>
      {!loading && children}
    </UserContext.Provider>
  );
};