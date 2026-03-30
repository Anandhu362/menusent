import apiClient from "./apiClient";

/**
 * Places a new order from the customer checkout page
 * @param {Object} orderData - The order details (items, total, customer info, restaurantId)
 */
export const placeOrder = async (orderData) => {
  const response = await apiClient.post('/api/orders', orderData);
  return response.data;
};

/**
 * Fetches all live orders for a specific restaurant (Used in the Admin Dashboard)
 * @param {string} restaurantId - The MongoDB ID of the restaurant
 */
export const getRestaurantOrders = async (restaurantId) => {
  const response = await apiClient.get(`/api/orders/restaurant/${restaurantId}`);
  return response.data; // Expecting an array of orders
};

/**
 * Updates the status of an existing order (e.g., Pending -> Preparing)
 * @param {string} orderId - The MongoDB ID of the order
 * @param {string} orderStatus - The new status string to apply
 */
export const updateOrderStatus = async (orderId, orderStatus) => {
  const response = await apiClient.patch(`/api/orders/${orderId}/status`, { orderStatus });
  return response.data;
};

/**
 * ✅ NEW: Fetches aggregated stats for the restaurant dashboard
 * Includes today's metrics, top-selling items, and recent orders
 * @param {string} restaurantId - The MongoDB ID of the restaurant
 */
export const fetchDashboardStats = async (restaurantId) => {
  const response = await apiClient.get(`/api/orders/restaurant/${restaurantId}/stats`);
  return response.data; 
};