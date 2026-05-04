import { useState, useEffect } from 'react';
import { getCategoriesByRestaurant } from '../api/category.api';
import { getMenuItemsByRestaurant } from '../api/menuItem.api';

export const useRestaurantMenu = (restaurantId) => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  // Initial state is null, which represents "All Items" in your UI
  const [activeCategory, setActiveCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchMenuData = async () => {
      setIsLoading(true);
      try {
        // Fetch both simultaneously for better performance
        const [fetchedCategories, fetchedItems] = await Promise.all([
          getCategoriesByRestaurant(restaurantId),
          getMenuItemsByRestaurant(restaurantId)
        ]);

        setCategories(fetchedCategories);
        setMenuItems(fetchedItems);

        // We removed the auto-select logic here so it defaults to "All Items"
        
      } catch (err) {
        setError(err.message || "Failed to load menu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, [restaurantId]);

  return { 
    categories, 
    menuItems, 
    activeCategory, 
    setActiveCategory, 
    isLoading, 
    error 
  };
};