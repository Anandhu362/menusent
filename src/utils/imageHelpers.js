// src/utils/imageHelpers.js

export const getOptimizedImageUrl = (originalPath, width) => {
  if (!originalPath) return '/fallback-image.png'; // Replace with your actual fallback image path
  
  // If it's already an external non-GCS link, return it safely
  if (originalPath.startsWith('http') && !originalPath.includes('storage.googleapis.com')) {
     return originalPath;
  }

  // ✅ Pull the Load Balancer URL from .env, fallback to localhost for testing
  const baseUrl = import.meta.env.VITE_IMAGE_API_URL || 'http://localhost:5000'; 
  
  // Encode the original URL and append the width and WebP format parameters
  return `${baseUrl}/api/assets/optimize?src=${encodeURIComponent(originalPath)}&w=${width}&fmt=webp`;
};