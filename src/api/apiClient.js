import axios from 'axios';

// 1. USE YOUR SPECIFIC IP ADDRESS HERE
// Based on your screenshot, your IP is 192.168.1.89
// This allows phones on your Wi-Fi to "see" the backend.
const API_BASE_URL = 'http://192.168.1.89:5000'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default apiClient;