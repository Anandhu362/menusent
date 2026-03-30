import React from "react";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Import the global cart hook
import { useCart } from "../context/CartContext";

export const CartPopup = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  // Pull cart data and actions directly from context instead of props
  const { cartItems, updateQuantity, removeFromCart } = useCart();

  if (!isOpen) return null;

  // Helper function to dynamically set the currency symbol
  const getCurrencySymbol = (currency) => {
    if (currency === 'INR') return '₹';
    if (currency === 'AED') return 'AED ';
    return '$'; // Default to USD
  };

  // Calculate the total price
  const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Determine the currency for the total (based on the first item in the cart)
  const cartCurrency = cartItems.length > 0 ? cartItems[0].currency : 'USD';

  // ✅ FIXED: Use item.cartItemId instead of item._id
  const handleDecrease = (item) => {
    if (item.quantity <= 1) {
      removeFromCart(item.cartItemId);
    } else {
      updateQuantity(item.cartItemId, -1);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      {/* Dark blurry backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Slide-up Modal */}
      <div className="bg-white w-full h-[75vh] md:h-auto md:max-h-[80vh] md:max-w-[400px] rounded-t-[32px] md:rounded-[32px] shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-full duration-300 z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-slate-900" />
            <h2 className="text-xl font-bold text-slate-900">Your Basket</h2>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingBag className="h-12 w-12 mb-3 opacity-20" />
              <p>Your basket is empty</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* ✅ FIXED: Key is now item.cartItemId */}
              {cartItems.map((item) => (
                <div key={item.cartItemId} className="flex items-center justify-between">
                  
                  {/* Item Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <img 
                      src={item.image?.gcsPath || '/fallback.png'} 
                      alt={item.name} 
                      className="h-12 w-12 rounded-xl object-cover border border-gray-100" 
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-900 line-clamp-1">{item.name}</span>
                      
                      {/* ✅ NEW: Display the variant size name if it exists (e.g., "Large") */}
                      {item.variantName && (
                        <span className="text-xs font-semibold text-slate-500 mb-0.5">
                          {item.variantName} {item.variantArabicName && `- ${item.variantArabicName}`}
                        </span>
                      )}

                      {/* Dynamically display the item's specific currency symbol */}
                      <span className="text-[#ff6b35] font-bold text-sm mt-0.5">
                        {getCurrencySymbol(item.currency)}{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1 border border-gray-100">
                    <button 
                      onClick={() => handleDecrease(item)}
                      className="h-7 w-7 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-sm hover:scale-105 transition-transform"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-bold text-sm w-4 text-center text-slate-900">
                      {item.quantity}
                    </span>
                    {/* ✅ FIXED: Use item.cartItemId */}
                    <button 
                      onClick={() => updateQuantity(item.cartItemId, 1)}
                      className="h-7 w-7 bg-[#ff6b35] rounded-full flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Process Button */}
        {cartItems.length > 0 && (
          <div className="p-6 bg-white border-t border-gray-100 rounded-b-[32px] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex justify-between items-center mb-4 px-1">
              <span className="text-gray-500 font-medium">Total</span>
              {/* Dynamically display the grand total currency symbol */}
              <span className="text-xl font-extrabold text-slate-900">
                {getCurrencySymbol(cartCurrency)}{totalPrice.toFixed(2)}
              </span>
            </div>
            <button 
              onClick={() => {
                navigate('/checkout');
                onClose(); 
              }}
              className="w-full bg-[#ff6b35] hover:bg-[#ff5a1f] text-white font-bold text-base h-14 rounded-full transition-colors shadow-lg active:scale-[0.98]"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPopup;