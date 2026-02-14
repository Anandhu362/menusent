import apiClient from "./apiClient";

// NEW: Get list of all restaurants for the dropdown
export const getAllRestaurants = async () => {
  const response = await apiClient.get('/restaurants'); // Matches the new route we created
  return response.data;
};

/**
 * Get restaurant menu data by slug
 * @param {string} slug
 */
export const getRestaurantBySlug = async (slug) => {
  const response = await apiClient.get(`/restaurants/${slug}`);
  return response.data;
};