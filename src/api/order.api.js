import apiClient from "./apiClient";

/**
 * Places a new order from the customer checkout page.
 * @param {Object} orderData - Includes items, customer info, and restaurantId.
 */
export const placeOrder = async (orderData) => {
  const response = await apiClient.post('/api/orders', orderData);
  return response.data;
};

/**
 * ✅ UPDATED: Public route for comprehensive customer tracking.
 * Fetches all details needed for the tracking UI:
 * - Order Status (Real-time ready)
 * - Itemized list with prices
 * - Customer & Delivery details
 * - Restaurant info (Name & Slug for navigation)
 * @param {string} orderId - The MongoDB ID of the order
 */
export const trackOrder = async (orderId) => {
  // This calls the GET /api/orders/track/:id endpoint in your backend
  const response = await apiClient.get(`/api/orders/track/${orderId}`);
  
  // The backend controller was updated to populate restaurant details 
  // and select all necessary fields for the tracking summary.
  return response.data;
};

/**
 * Fetches all live orders for a specific restaurant dashboard.
 * Used to populate the Kanban board for restaurant owners.
 * @param {string} restaurantId - The MongoDB ID of the restaurant
 */
export const getRestaurantOrders = async (restaurantId) => {
  const response = await apiClient.get(`/api/orders/restaurant/${restaurantId}`);
  return response.data; 
};

/**
 * Updates the status of an existing order.
 * Triggers the Firebase Realtime sync in the backend so the customer
 * tracking page updates instantly.
 * @param {string} orderId - The MongoDB ID of the order
 * @param {string} orderStatus - 'Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'
 */
export const updateOrderStatus = async (orderId, orderStatus) => {
  const response = await apiClient.patch(`/api/orders/${orderId}/status`, { orderStatus });
  return response.data;
};

/**
 * Fetches aggregated metrics for the restaurant dashboard.
 * Includes today's sales, order counts, and top-selling menu items.
 * @param {string} restaurantId - The MongoDB ID of the restaurant
 */
export const fetchDashboardStats = async (restaurantId) => {
  const response = await apiClient.get(`/api/orders/restaurant/${restaurantId}/stats`);
  return response.data; 
};

/**
 * ✅ NEW: Calculates the dynamic delivery fee using Google Maps Distance Matrix.
 * @param {Object} payload - Contains { restaurantId, customerLat, customerLng }
 */
export const fetchDeliveryFee = async (payload) => {
  const response = await apiClient.post('/api/orders/calculate-fee', payload);
  return response.data;
};