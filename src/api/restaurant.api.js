import apiClient from "./apiClient";

// --- EXISTING ENDPOINTS ---

export const getAllRestaurants = async () => {
  // FIX: Added /api to match how it's mounted in app.js
  const response = await apiClient.get('/api/restaurants'); 
  return response.data;
};

/**
 * Get restaurant menu data by slug
 * @param {string} slug
 */
export const getRestaurantBySlug = async (slug) => {
  // FIX: Added /api to match how it's mounted in app.js
  const response = await apiClient.get(`/api/restaurants/${slug}`);
  return response.data;
};

/**
 * Removes a menu item from a specific restaurant's menu
 * @param {string} restaurantId - The MongoDB ID of the restaurant
 * @param {string} menuItemId - The MongoDB ID of the menu item
 */
export const removeMenuItemFromRestaurant = async (restaurantId, menuItemId) => {
  const response = await apiClient.delete(`/api/restaurants/${restaurantId}/menu-items/${menuItemId}`);
  return response.data;
};

// --- NEW ENDPOINT ---

/**
 * Creates a new restaurant (requires multipart/form-data for the logo)
 * @param {FormData} formData - The FormData object containing name, location, and logo file
 */
export const createRestaurant = async (formData) => {
  // FIX: Completely removed the manual headers object. 
  // Axios will now auto-generate the correct headers + boundary!
  const response = await apiClient.post('/api/restaurants/create', formData);
  return response.data;
};