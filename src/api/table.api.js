import apiClient from './apiClient';

/**
 * Fetch all tables for a specific restaurant
 * @param {string} restaurantId 
 * @returns {Promise} Axios response promise
 */
export const fetchTables = (restaurantId) => {
  return apiClient.get(`/api/tables/${restaurantId}`);
};

/**
 * Initialize a set number of tables for a restaurant
 * @param {string} restaurantId 
 * @param {number} count - Number of tables to generate
 * @returns {Promise} Axios response promise
 */
export const initializeTables = (restaurantId, count) => {
  return apiClient.post('/api/tables/init', { restaurantId, count });
};

/**
 * Update the status of a specific table
 * @param {string} tableId - The MongoDB _id of the table
 * @param {string} status - 'Available', 'Occupied', 'Reserved', or 'Cleaning'
 * @returns {Promise} Axios response promise
 */
export const updateTableStatus = (tableId, status) => {
  return apiClient.patch(`/api/tables/${tableId}/status`, { status });
};