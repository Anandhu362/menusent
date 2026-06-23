import React, { createContext, useState, useEffect, useContext } from 'react';
import { getRestaurantBySlug, getRestaurantOffers } from '../api/restaurant.api.js';

// 1. Create the Context
const CartContext = createContext();

// 2. Create the Provider Component
export const CartProvider = ({ children }) => {
  
  // Initialize CART state directly from localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem('resto_cart');
      const parsedData = localData ? JSON.parse(localData) : [];
      return parsedData.map(item => ({
        ...item,
        cartItemId: item.cartItemId || item._id
      }));
    } catch (error) {
      console.error("Failed to parse cart from local storage", error);
      return [];
    }
  });

  // Initialize DISCOUNT state from localStorage
  const [discountData, setDiscountData] = useState(() => {
    try {
      const localPromo = localStorage.getItem('resto_promo');
      return localPromo ? JSON.parse(localPromo) : null;
    } catch (error) {
      return null;
    }
  });

  // Initialize state to hold fetched restaurant offers
  const [restaurantOffers, setRestaurantOffers] = useState([]);

  // Sync CART to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('resto_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Sync DISCOUNT to localStorage whenever it changes
  useEffect(() => {
    if (discountData) {
      localStorage.setItem('resto_promo', JSON.stringify(discountData));
    } else {
      localStorage.removeItem('resto_promo');
    }
  }, [discountData]);

  // ✅ ROBUST FETCH: Fetch active offers for the restaurant whenever the cart changes
  useEffect(() => {
    const fetchOffers = async () => {
      // Only fetch if there are items in the cart
      if (cartItems.length > 0) {
        try {
          const slug = cartItems[0]?.restaurantSlug;
          const restaurantId = cartItems[0]?.restaurantId || cartItems[0]?.restaurantIds?.[0];

          if (slug) {
            // First try fetching by slug
            const restaurantData = await getRestaurantBySlug(slug);
            if (restaurantData && restaurantData.isOffersEnabled && restaurantData.offers) {
              setRestaurantOffers(restaurantData.offers);
            } else {
              setRestaurantOffers([]);
            }
          } else if (restaurantId) {
            // Fallback: If no slug exists in cart item, fetch by ID
            const offersData = await getRestaurantOffers(restaurantId);
            setRestaurantOffers(offersData || []);
          }
        } catch (error) {
          console.error("Failed to fetch restaurant offers:", error);
          setRestaurantOffers([]);
        }
      } else {
        // Clear offers if the cart is emptied
        setRestaurantOffers([]);
      }
    };

    fetchOffers();
  }, [cartItems]);

  // --- CART ACTIONS ---

  const addToCart = (product, selectedVariant = null) => {
    setCartItems((prevItems) => {
      const cartItemId = selectedVariant 
        ? `${product._id}-${selectedVariant.name}` 
        : product._id;

      const existingItem = prevItems.find((item) => item.cartItemId === cartItemId);
      
      if (existingItem) {
        return prevItems.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      const newItem = {
        ...product,
        cartItemId, 
        price: selectedVariant ? parseFloat(selectedVariant.price) : parseFloat(product.price),
        variant: selectedVariant ? selectedVariant.name : null, 
        variantName: selectedVariant ? selectedVariant.name : null, 
        variantArabicName: selectedVariant ? selectedVariant.arabicName : null,
        quantity: 1
      };

      return [...prevItems, newItem];
    });
  };

  const removeFromCart = (cartItemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, amount) => {
    setCartItems((prevItems) => 
      prevItems.map((item) => {
        if (item.cartItemId === cartItemId) {
          const newQuantity = item.quantity + amount;
          return { ...item, quantity: Math.max(1, newQuantity) };
        }
        return item;
      })
    );
  };

  const applyPromo = (promoDetails) => {
    setDiscountData(promoDetails); 
  };

  const removePromo = () => {
    setDiscountData(null);
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscountData(null); 
    localStorage.removeItem('resto_cart');
    localStorage.removeItem('resto_promo'); 
  };

  return (
    <CartContext.Provider 
      value={{ 
        cartItems, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart,
        discountData,     
        applyPromo,       
        removePromo,
        restaurantOffers 
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};