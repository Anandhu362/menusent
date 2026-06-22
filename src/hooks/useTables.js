import { useState, useEffect, useCallback } from 'react';
import { fetchTables } from '../api/table.api';

/**
 * Custom hook to fetch and poll table data for a specific restaurant.
 * @param {string} restaurantId - The ID of the restaurant.
 * @param {number} pollingInterval - How often to refresh the data in milliseconds (default: 5000ms).
 */
export const useTables = (restaurantId, pollingInterval = 5000) => {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize the fetch function so it doesn't recreate on every render
  const loadTables = useCallback(async (isInitialFetch = false) => {
    if (!restaurantId) {
      if (isInitialFetch) setIsLoading(false);
      return;
    }

    // Only show loading spinner on the very first load, not on background polls
    if (isInitialFetch) setIsLoading(true);

    try {
      const response = await fetchTables(restaurantId);
      setTables(response.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch tables:", err);
      setError(err.response?.data?.message || "Failed to sync tables.");
    } finally {
      if (isInitialFetch) setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    let intervalId;

    // 1. Initial Fetch on component mount
    loadTables(true);

    // 2. Set up background polling
    if (restaurantId) {
      intervalId = setInterval(() => {
        loadTables(false); // false = silent background update
      }, pollingInterval);
    }

    // 3. Cleanup interval when component unmounts or restaurantId changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [loadTables, restaurantId, pollingInterval]);

  // Provide manual refresh function just in case a component needs to force a sync
  const refreshTables = () => loadTables(false);

  return { 
    tables, 
    isLoading, 
    error, 
    refreshTables, 
    setTables // Exported in case you need to do optimistic UI updates locally
  };
};

export default useTables;