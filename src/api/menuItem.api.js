import apiClient from "./apiClient";

/**
 * Creates a new menu item with an image upload
 * @param {Object|FormData} data - Can be a raw object or FormData
 */
export const addMenuItem = async (data) => {
  let payload = data;

  // Check if the incoming data is a plain object instead of FormData
  if (!(data instanceof FormData)) {
    payload = new FormData();
    
    // Loop through all data keys and append text fields automatically
    Object.keys(data).forEach(key => {
      // Skip the image key here, we handle it below
      if (key !== 'image' && data[key] !== undefined && data[key] !== null) {
        payload.append(key, data[key]);
      }
    });
    
    // Explicitly handle the image file
    if (data.image && data.image instanceof File) {
      payload.append('image', data.image);
    } else if (data.predefinedImage) {
      // In case you support predefined string URLs in the future
      payload.append('predefinedImage', data.predefinedImage);
    }
  }

  // Send the request with the multipart header
  const response = await apiClient.post('/api/menu-items', payload, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
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
