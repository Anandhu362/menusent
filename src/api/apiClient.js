import axios from 'axios';

// Get the URL from the environment variables
let envUrl = import.meta.env.VITE_API_BASE_URL || '';

// Smart Clean: If the URL already ends with '/api', strip it off 
// so it doesn't conflict with local request paths like '/api/auth/login'
if (envUrl.endsWith('/api')) {
  envUrl = envUrl.slice(0, -4);
} else if (envUrl.endsWith('/api/')) {
  envUrl = envUrl.slice(0, -5);
}

const apiClient = axios.create({
  baseURL: envUrl,
});

// Add a request interceptor to automatically attach the JWT token
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