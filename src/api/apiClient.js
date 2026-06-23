import axios from 'axios';

// 1. Get the raw URL from environment variables
let envUrl = import.meta.env.VITE_API_BASE_URL || '';

// 2. Remove any accidental trailing slashes
envUrl = envUrl.replace(/\/+$/, '');

// 3. Guarantee that the base URL always ends exactly with /api
if (!envUrl.endsWith('/api')) {
  envUrl = `${envUrl}/api`;
}

const apiClient = axios.create({
  baseURL: envUrl,
});

// Request interceptor to handle tokens and fix route structures dynamically
apiClient.interceptors.request.use(
  (config) => {
    // Smart Fix: Strip accidental duplicate '/api' prefixes from individual calls
    if (config.url && config.url.startsWith('/api')) {
      config.url = config.url.replace(/^\/api/, '');
    }

    // Attach the JWT token if it exists
    const token = localStorage.getItem("authToken");
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