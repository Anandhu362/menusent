// src/utils/imageHelpers.js

export const getOptimizedImageUrl = (originalPath, width) => {
  // 1. Handle missing paths (Defaults to the local food fallback)
  if (!originalPath) return '/fallback-food.png'; 
  
  // 2. ✅ FIX: If it's a local path (like our fallback), return it directly!
  // Do not send local relative paths to the optimization API.
  if (originalPath.startsWith('/')) {
    return originalPath;
  }

  // 3. If it's already an external non-GCS link, return it safely
  if (originalPath.startsWith('http') && !originalPath.includes('storage.googleapis.com')) {
     return originalPath;
  }

  // 4. Pull the Load Balancer URL from .env, fallback to localhost for testing
  const baseUrl = import.meta.env.VITE_IMAGE_API_URL || 'http://localhost:5000'; 
  
  // 5. Encode the original URL and append the width and WebP format parameters
  return `${baseUrl}/api/assets/optimize?src=${encodeURIComponent(originalPath)}&w=${width}&fmt=webp`;
};