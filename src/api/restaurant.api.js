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

// ==========================================
// --- OWNER DASHBOARD ENDPOINTS (NEW) ---
// ==========================================

/**
 * Fetches the logged-in owner's profile details
 */
export const getOwnerProfile = async () => {
  const response = await apiClient.get('/api/restaurants/owner/profile');
  return response.data;
};

/**
 * Updates the logged-in owner's profile details (name, location, logo)
 * @param {FormData|Object} data - The form data containing name, location, whatsappNumber, and optional logo file
 */
export const updateOwnerProfile = async (data) => {
  let payload = data;

  // Smart check: If frontend passes a raw object instead of FormData, convert it automatically
  if (!(data instanceof FormData)) {
    payload = new FormData();
    if (data.name) payload.append('name', data.name);
    if (data.location) payload.append('location', data.location);
    if (data.whatsappNumber) payload.append('whatsappNumber', data.whatsappNumber);
    if (data.logo && data.logo instanceof File) {
      payload.append('logo', data.logo);
    }
  }

  // Uses the protected /owner/profile route
  const response = await apiClient.put('/api/restaurants/owner/profile', payload);
  return response.data;
};

/**
 * Changes the logged-in owner's password
 * @param {Object} passwordData - Should contain { currentPassword, newPassword }
 */
export const changeOwnerPassword = async (passwordData) => {
  // Uses the protected /owner/password route
  const response = await apiClient.put('/api/restaurants/owner/password', passwordData);
  return response.data;
};