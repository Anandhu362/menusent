import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Create the Context
const CartContext = createContext();

// 2. Create the Provider Component
export const CartProvider = ({ children }) => {
  
  // Initialize state directly from localStorage so it survives navigation and refreshes
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem('resto_cart');
      const parsedData = localData ? JSON.parse(localData) : [];
      
      // Migration step: ensure all existing items in old local storage have a cartItemId
      return parsedData.map(item => ({
        ...item,
        cartItemId: item.cartItemId || item._id
      }));
    } catch (error) {
      console.error("Failed to parse cart from local storage", error);
      return [];
    }
  });

  // Sync to localStorage whenever cartItems change
  useEffect(() => {
    localStorage.setItem('resto_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // --- CART ACTIONS ---

  // ✅ UPDATED: Add to cart now accepts an optional selectedVariant parameter
  const addToCart = (product, selectedVariant = null) => {
    setCartItems((prevItems) => {
      
      // Create a unique composite ID. 
      // E.g., if product is "Tea" and variant is "Large", ID becomes "64abc...-Large"
      const cartItemId = selectedVariant 
        ? `${product._id}-${selectedVariant.name}` 
        : product._id;

      const existingItem = prevItems.find((item) => item.cartItemId === cartItemId);
      
      if (existingItem) {
        // If the exact same size of the item exists, increment the quantity
        return prevItems.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      // If it's a new size/item, construct the cart object overriding the base price
      const newItem = {
        ...product,
        cartItemId, // Save the unique row ID
        price: selectedVariant ? parseFloat(selectedVariant.price) : parseFloat(product.price),
        
        // ✅ FIX: Added "variant" so it matches what Checkout.jsx and the backend expect
        variant: selectedVariant ? selectedVariant.name : null, 
        
        variantName: selectedVariant ? selectedVariant.name : null, // Kept this just in case you use it elsewhere
        variantArabicName: selectedVariant ? selectedVariant.arabicName : null,
        quantity: 1
      };

      return [...prevItems, newItem];
    });
  };

  // Remove uses the unique cartItemId
  const removeFromCart = (cartItemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.cartItemId !== cartItemId));
  };

  // Update uses the unique cartItemId
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

  // Empty the cart (used after a successful checkout)
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('resto_cart');
  };

  // 3. Provide the state and actions to the rest of the app
  return (
    <CartContext.Provider 
      value={{ 
        cartItems, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart 
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