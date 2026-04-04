import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, User, Building, Map, Receipt, CheckCircle2 } from 'lucide-react';
import { placeOrder } from '../api/order.api'; // ✅ NEW: Import the API function

// Import the global cart hook
import { useCart } from '../context/CartContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();

  // State to handle the success screen and store the Order ID
  const [orderSuccess, setOrderSuccess] = useState(null);

  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const vatAmount = subtotal * 0.05; 
  const grandTotal = subtotal + vatAmount;
  const cartCurrency = cartItems.length > 0 ? cartItems[0].currency : 'AED';

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    apt: '',
    building: '',
    landmark: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Package the payload for the backend
      const securePayload = {
        restaurantId: cartItems[0]?.restaurantId || cartItems[0]?.restaurantIds?.[0] || null, 
        customerDetails: formData,
        items: cartItems.map(item => ({ 
          menuItemId: item._id, 
          quantity: item.quantity,
          variantName: item.variant // Send as variantName to match the backend
        }))
      };

      // ✅ 1. Send the order directly to the database
      const response = await placeOrder(securePayload);

      // ✅ 2. Show the success screen using the newly generated Order ID
      setOrderSuccess(response.order.orderId);

      // ✅ 3. Clear the cart 
      clearCart();

    } catch (error) {
      console.error("Failed to process checkout:", error);
      alert("Checkout failed. Please try again.");
      setIsSubmitting(false); 
    } 
  };

  // SUCCESS SCREEN
  if (orderSuccess) {
    return (
      <div className="h-screen w-full bg-[#f8f9fb] flex flex-col items-center justify-center p-5 animate-in fade-in duration-500">
        <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl shadow-black/5 border border-gray-100 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Order Placed!</h2>
          <p className="text-slate-500 font-medium mb-4">
            Your order has been sent to the kitchen successfully.
          </p>

          {/* --- NEW: Hardcoded 30 Minute Delivery Text --- */}
          <div className="bg-blue-50 text-blue-700 w-full px-4 py-3 rounded-xl mb-6 text-sm font-semibold border border-blue-100">
            Your item will be delivered in exactly <span className="font-extrabold text-blue-800">30 minutes</span>.
          </div>
          
          {/* --- UPDATED: Highlighted Order ID Section --- */}
          <div className="bg-orange-50 w-full rounded-2xl p-5 mb-8 border-2 border-orange-200 shadow-sm">
            <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Order ID</p>
            <p className="text-2xl font-black text-[#ff6b35] tracking-wide">{orderSuccess}</p>
          </div>

          <button 
            onClick={() => navigate(-1)} 
            className="w-full bg-[#ff6b35] text-white py-4 rounded-full font-bold text-[16px] shadow-[0_8px_20px_-6px_rgba(255,107,53,0.4)] hover:bg-[#ff5a1f] active:scale-[0.98] transition-all"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] font-sans md:flex md:items-center md:justify-center">
      {/* CSS to hide the scrollbar cleanly */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="w-full bg-[#f8f9fb] md:max-w-[400px] md:h-[800px] md:rounded-[40px] md:shadow-2xl md:border-[8px] md:border-black flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#f8f9fb]/90 backdrop-blur-md px-5 py-5 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Checkout</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-5 pt-2 pb-32 hide-scrollbar">
          
          {/* Order Summary */}
          <div className="bg-white rounded-[24px] p-5 mb-6 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.04)] border border-gray-100/80">
            <h2 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#ff6b35]" /> Order Summary
            </h2>
            
            <div className="space-y-4 mb-5">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.image?.gcsPath || '/fallback-food.png'} 
                      alt={item.name} 
                      className="w-12 h-12 rounded-[14px] object-cover border border-gray-100/50 bg-gray-50"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 line-clamp-1">
                        {item.name} {item.variant && <span className="text-gray-500 font-medium text-xs">({item.variant})</span>}
                      </span>
                      <span className="text-xs text-gray-400 font-semibold">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">{cartCurrency} {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              
              {cartItems.length === 0 && (
                <p className="text-sm text-gray-400 font-medium italic">No items added yet.</p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="pt-4 border-t border-gray-100/80 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-semibold text-slate-800">{cartCurrency} {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">VAT (5%)</span>
                <span className="font-semibold text-slate-800">{cartCurrency} {vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-100/80">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-black text-[#ff6b35] text-lg">{cartCurrency} {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3 px-1">Delivery Details</h2>
            
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="w-full bg-white border border-gray-200/80 rounded-[20px] py-4 pl-12 pr-4 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#ff6b35]/10 focus:border-[#ff6b35] transition-all shadow-sm" />
            </div>

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className="w-full bg-white border border-gray-200/80 rounded-[20px] py-4 pl-12 pr-4 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#ff6b35]/10 focus:border-[#ff6b35] transition-all shadow-sm" />
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input required type="text" name="apt" value={formData.apt} onChange={handleChange} placeholder="Apt/Villa No." className="w-full bg-white border border-gray-200/80 rounded-[20px] py-4 pl-12 pr-4 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#ff6b35]/10 focus:border-[#ff6b35] transition-all shadow-sm" />
              </div>
            </div>

            <div className="relative">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input required type="text" name="building" value={formData.building} onChange={handleChange} placeholder="Building/Cluster Name" className="w-full bg-white border border-gray-200/80 rounded-[20px] py-4 pl-12 pr-4 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#ff6b35]/10 focus:border-[#ff6b35] transition-all shadow-sm" />
            </div>

            <div className="relative">
              <Map className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} placeholder="Landmark/Directions (Optional)" className="w-full bg-white border border-gray-200/80 rounded-[20px] py-4 pl-12 pr-4 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#ff6b35]/10 focus:border-[#ff6b35] transition-all shadow-sm" />
            </div>
          </form>

        </div>

        {/* Sticky Bottom Action */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-5 border-t border-gray-100/80 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <button 
            type="submit" 
            form="checkout-form"
            disabled={isSubmitting || cartItems.length === 0}
            className="w-full bg-[#ff6b35] text-white py-4 rounded-full font-bold text-[16px] shadow-[0_8px_20px_-6px_rgba(255,107,53,0.4)] hover:bg-[#ff5a1f] active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:active:scale-100"
          >
            {isSubmitting ? (
              "Processing..."
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Order</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
