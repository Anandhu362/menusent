import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import apiClient from "../api/apiClient"; 
import { useAuth } from "../context/AuthContext"; // <-- NEW: Import the global auth context

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // <-- NEW: Extract login and logout from Context
  const { login, logout } = useAuth();

  // Clear any existing/expired tokens when the login page loads
  useEffect(() => {
    logout(); // <-- UPDATED: Use context logout instead of manual localStorage
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let token = null;

      // ✅ SMART LOGIN FLOW: 
      // First, try to log in as a Restaurant Owner
      try {
        const response = await apiClient.post("/api/auth/restaurant-login", {
          email,
          password
        });
        token = response.data.token;
      } catch (restaurantError) {
        // If restaurant login fails, fallback and try Super Admin login
        const response = await apiClient.post("/api/auth/login", {
          email,
          password
        });
        token = response.data.token;
      }

      // 1. Store the new JWT token securely using our AuthContext
      login(token);
      
      // 2. Navigate to Admin Dashboard 
      navigate("/restaurant/dashboard");

    } catch (err) {
      // Handle Errors (This only runs if BOTH restaurant and admin logins fail)
      console.error("Login failed:", err);
      const errorMessage = err.response?.data?.message || "Login failed. Please check your credentials.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F6] flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl shadow-gray-200/50 w-full max-w-md">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2">Admin Login</h1>
            <p className="text-gray-400 text-sm">Enter your credentials to access the dashboard.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-sm font-bold p-3 rounded-xl mb-6 text-center border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-xl px-4 py-3 outline-none font-bold transition-all"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-xl px-4 py-3 outline-none font-bold transition-all"
                placeholder="•••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white h-14 rounded-xl font-bold text-lg hover:bg-orange-500 transition-colors shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                // Simple Loading Spinner
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Login"
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;