import axios from "axios";

// ✅ Use environment variable (IMPORTANT)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ✅ Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request interceptor (Attach JWT)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor (Handle errors globally)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🔐 Handle Unauthorized (Token expired)
    if (error.response?.status === 401) {
      console.warn("⚠️ Unauthorized - Logging out");

      localStorage.removeItem("authToken");

      // Optional: redirect to login
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
