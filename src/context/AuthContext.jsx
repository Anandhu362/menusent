import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Create the Context
const AuthContext = createContext();

// 2. Create the Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Safely decode the JWT token without needing external npm packages
  const decodeJWT = (tokenStr) => {
    try {
      const base64Url = tokenStr.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Failed to decode token", error);
      return null;
    }
  };

  // Run this every time the app loads or the token changes
  useEffect(() => {
    const initializeAuth = () => {
      if (token) {
        const decodedToken = decodeJWT(token);
        
        // Check if the token is decoded successfully AND is not expired
        // JWT expiration (exp) is in seconds, Date.now() is in milliseconds
        if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
          // Success: The user object will now hold { restaurantId, role, etc. }
          setUser(decodedToken);
        } else {
          // Token is expired or invalid
          logout();
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [token]);

  // Login action to save token and update state
  const login = (newToken) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
  };

  // Logout action to clear everything
  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Create a custom hook for easy access in other components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};