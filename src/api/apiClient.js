import axios from 'axios';

// 1. USE YOUR DYNAMIC ENVIRONMENT VARIABLE HERE
// This tells the app to look at your .env file locally, or your Vercel settings in production!
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// NEW: Add a request interceptor to automatically attach the JWT token
apiClient.interceptors.request.use(
  (config) => {
    // 1. Grab the token from the browser's storage
    const token = localStorage.getItem("authToken");

    // 2. If a token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;