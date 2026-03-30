import apiClient from "./apiClient";

/**
 * Creates a new category with an image upload
 * @param {FormData} formData - Must contain 'name', 'restaurantId', and 'image' (File)
 */
export const addCategory = async (formData) => {
  // Removed manual 'Content-Type' header so Axios can auto-generate the boundary
  const response = await apiClient.post('/api/categories', formData);
  return response.data;
};

/**
 * Fetches all categories for a specific restaurant
 * @param {string} restaurantId - The MongoDB ID of the restaurant
 */
export const getCategoriesByRestaurant = async (restaurantId) => {
  const response = await apiClient.get('/api/categories', {
    params: { restaurantId }
  });
  return response.data;
};

/**
 * Updates the display order of categories
 * @param {Object} orderData - Should contain { orderedIds: [id1, id2, ...] }
 */
export const updateCategoryOrder = async (orderData) => {
  const response = await apiClient.put('/api/categories/reorder', orderData);
  return response.data;
};

/**
 * Updates the image of an existing category
 * @param {string} categoryId - The MongoDB ID of the category
 * @param {FormData} formData - Must contain the new 'image' file
 */
export const updateCategoryImage = async (categoryId, formData) => {
  // Make sure your backend route exactly matches this URL path.
  const response = await apiClient.put(`/api/categories/${categoryId}/update-image`, formData);
  return response.data;
};

// --- NEW FUNCTION ---
/**
 * Fetches all unique global categories across the database to populate suggestions
 * @returns {Array} List of unique category objects with name and image
 */
export const getGlobalCategories = async () => {
  const response = await apiClient.get('/api/categories/global');
  return response.data;
};