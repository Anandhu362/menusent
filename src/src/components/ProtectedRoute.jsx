import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <-- NEW: Import our global auth state

export const ProtectedRoute = ({ children }) => {
  // Grab the global auth state
  const { user, token, isLoading } = useAuth();

  // 1. Wait for the AuthContext to finish checking the token
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fb]">
        <div className="w-8 h-8 border-4 border-[#ff6b35]/30 border-t-[#ff6b35] rounded-full animate-spin"></div>
      </div>
    );
  }

  // 2. If the loading is done but there is no valid user or token, kick them out
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If logged in and the token is valid, render the requested dashboard/page
  return children;
};