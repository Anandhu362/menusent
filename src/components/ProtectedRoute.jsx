import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  // Check if our fake token exists
  const isAuthenticated = localStorage.getItem("authToken");

  if (!isAuthenticated) {
    // If not logged in, redirect to Login page
    return <Navigate to="/login" replace />;
  }

  // If logged in, show the Admin page
  return children;
};