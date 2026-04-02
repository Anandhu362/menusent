import apiClient from "./apiClient";

/**
 * Creates a new category with an image upload
 * @param {Object|FormData} data - Can be a raw object or FormData
 */
export const addCategory = async (data) => {
  let payload = data;

  // Check if the incoming data is a plain object instead of FormData
  if (!(data instanceof FormData)) {
    payload = new FormData();
    payload.append('name', data.name);
    payload.append('restaurantId', data.restaurantId);
    
    // Check if the image exists and is an actual File object
    if (data.image && data.image instanceof File) {
      payload.append('image', data.image);
    } else if (data.predefinedImage) {
      // Handle cases where a string URL is passed instead of a file
      payload.append('predefinedImage', data.predefinedImage);
    }
  }

  // Axios will automatically set the correct Content-Type for FormData
  const response = await apiClient.post('/api/categories', payload, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
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
