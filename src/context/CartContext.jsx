import React, { createContext, useState, useEffect, useContext } from 'react';

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

  // ✅ NEW: Initialize DISCOUNT state from localStorage
  const [discountData, setDiscountData] = useState(() => {
    try {
      const localPromo = localStorage.getItem('resto_promo');
      return localPromo ? JSON.parse(localPromo) : null;
    } catch (error) {
      return null;
    }
  });

  // Sync CART to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('resto_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // ✅ NEW: Sync DISCOUNT to localStorage whenever it changes
  useEffect(() => {
    if (discountData) {
      localStorage.setItem('resto_promo', JSON.stringify(discountData));
    } else {
      localStorage.removeItem('resto_promo');
    }
  }, [discountData]);

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

  // ✅ NEW: Apply Promo Action
  const applyPromo = (promoDetails) => {
    setDiscountData(promoDetails); // e.g., { code: 'OFFER50', percentage: 50 }
  };

  // ✅ NEW: Remove Promo Action
  const removePromo = () => {
    setDiscountData(null);
  };

  // ✅ UPDATED: Empty the cart AND the promo (used after a successful checkout)
  const clearCart = () => {
    setCartItems([]);
    setDiscountData(null); // Clear the promo state
    localStorage.removeItem('resto_cart');
    localStorage.removeItem('resto_promo'); // Clear promo from storage
  };

  // 3. Provide the state and actions to the rest of the app
  return (
    <CartContext.Provider 
      value={{ 
        cartItems, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart,
        discountData,     // ✅ Exported
        applyPromo,       // ✅ Exported
        removePromo       // ✅ Exported
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// 4. Create a custom hook for easy access in other components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};