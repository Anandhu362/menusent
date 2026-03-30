import apiClient from "./apiClient";

/**
 * Creates a new menu item with an image upload
 * @param {FormData} formData - Must contain 'name', 'arabicName', 'price', 'categoryId', 'restaurantId', and 'image'
 */
export const addMenuItem = async (formData) => {
  // Removed manual 'Content-Type' header to let Axios auto-generate boundary for FormData
  const response = await apiClient.post('/api/menu-items', formData); 
  return response.data;
};

/**
 * Fetches all menu items for a specific restaurant
 * @param {string} restaurantId - The MongoDB ID of the restaurant
 */
export const getMenuItemsByRestaurant = async (restaurantId) => {
  const response = await apiClient.get('/api/menu-items', {
    params: { restaurantId }
  });
  return response.data;
};

/**
 * Updates an existing menu item
 * @param {string} itemId - The MongoDB ID of the menu item
 * @param {Object} updatedData - Object containing name, arabicName, price, currency, categoryId
 */
export const updateMenuItem = async (itemId, updatedData) => {
  // Ensure that 'arabicName' is included in the updatedData object passed from the Modal
  const response = await apiClient.put(`/api/menu-items/${itemId}`, updatedData);
  return response.data;
};

/**
 * ✅ NEW: Toggles the Active/Inactive (Out of Stock) status of a menu item
 * @param {string} itemId - The MongoDB ID of the menu item
 */
export const toggleItemActiveStatus = async (itemId) => {
  const response = await apiClient.patch(`/api/menu-items/${itemId}/toggle`);
  return response.data;
};

/**
 * Deletes a menu item from the database
 * @param {string} itemId - The MongoDB ID of the menu item
 */
export const deleteMenuItem = async (itemId) => {
  const response = await apiClient.delete(`/api/menu-items/${itemId}`);
  return response.data;
};

// --- SEARCH FUNCTION ---
/**
 * Searches for menu items globally based on a text query
 * @param {string} query - The search text (e.g., "biriyani")
 */
export const searchGlobalMenuItems = async (query) => {
  const response = await apiClient.get('/api/menu-items/search', {
    params: { q: query }
  });
  return response.data; // Returns an array of matching products
};

// ==========================================
// ✅ NEW: UNIVERSAL STOCK MANAGEMENT
// ==========================================
/**
 * Sets the universal stock limit for all items in a restaurant
 * @param {string} restaurantId - The ID of the restaurant
 * @param {number} stockNumber - The new stock limit
 */
export const setUniversalStock = async (restaurantId, stockNumber) => {
  const response = await apiClient.post('/api/menu-items/universal-stock', {
    restaurantId,
    stockNumber
  });
  return response.data;
};