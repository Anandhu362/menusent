import axios from 'axios';

// 1. USE YOUR SPECIFIC IP ADDRESS HERE
// Based on your screenshot, your IP is 192.168.1.89
// This allows phones on your Wi-Fi to "see" the backend.
const API_BASE_URL = 'http://192.168.1.89:5000'; 

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