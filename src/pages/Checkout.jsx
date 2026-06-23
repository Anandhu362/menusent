import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// ✅ NEW: Imported Copy and ArrowRight for the fintech UI
import { ArrowLeft, MapPin, Phone, User, Building, Map, Receipt, CheckCircle2, Truck, AlertCircle, Tag, Info, Copy, ArrowRight } from 'lucide-react';

import { placeOrder, fetchDeliveryFee, validatePromo } from '../api/order.api';
import LocationPickerMap from '../components/LocationPickerMap';
import { useCart } from '../context/CartContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart, discountData, applyPromo, removePromo } = useCart();

  const [orderSuccess, setOrderSuccess] = useState(null);
  const [fallbackSlug, setFallbackSlug] = useState(null);
  const [copied, setCopied] = useState(false); // ✅ Added state for the copy utility

  // Delivery Fee States
  const [customerLocation, setCustomerLocation] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryError, setDeliveryError] = useState("");
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  // Promo Code Local States
  const [promoInput, setPromoInput] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    apt: '',
    building: '',
    landmark: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // EXACT FINANCIAL BREAKDOWN & MATH
  // ==========================================
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Calculate discount dynamically if a promo is applied via context
  let discountAmount = 0;
  if (discountData && discountData.percentage) {
    discountAmount = (subtotal * discountData.percentage) / 100;
  }

  const vatAmount = subtotal * 0.05; 
  // Grand Total subtracts discount before adding delivery and VAT
  const grandTotal = (subtotal - discountAmount) + vatAmount + deliveryFee;
  const cartCurrency = cartItems.length > 0 ? cartItems[0].currency : 'AED';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationSelect = async (coords) => {
    if (customerLocation) {
      const dist = Math.sqrt(
        Math.pow(coords.lat - customerLocation.lat, 2) + 
        Math.pow(coords.lng - customerLocation.lng, 2)
      );
      if (dist < 0.0001) return; 
    }

    setCustomerLocation(coords);
    setDeliveryError("");
    setDeliveryFee(0);
    setIsCalculatingFee(true);

    try {
      const restaurantId = cartItems[0]?.restaurantId || cartItems[0]?.restaurantIds?.[0];
      
      const response = await fetchDeliveryFee({
        restaurantId,
        customerLat: coords.lat,
        customerLng: coords.lng
      });

      if (response.isDeliverable) {
        setDeliveryFee(response.fee);
      } else {
        setDeliveryError(response.message || "Sorry, we do not deliver to this area.");
      }
    } catch (error) {
      setDeliveryError(error.response?.data?.message || "Failed to calculate delivery fee.");
    } finally {
      setIsCalculatingFee(false);
    }
  };

  // ==========================================
  // PROMO CODE VALIDATION LOGIC
  // ==========================================
  const handleApplyPromo = async () => {
    if (!formData.phone || formData.phone.trim() === "") {
      setPromoMessage({ type: "info", text: "Please enter your phone number in the Delivery Details below first." });
      return;
    }

    if (!promoInput) return;

    setIsApplyingPromo(true);
    setPromoMessage({ type: "", text: "" });

    try {
      const restaurantId = cartItems[0]?.restaurantId || cartItems[0]?.restaurantIds?.[0];
      const response = await validatePromo({
        restaurantId,
        promoCode: promoInput,
        subtotal,
        phone: formData.phone
      });

      // Save to global context so it persists
      applyPromo({ code: response.code, percentage: response.discountPercentage });
      setPromoInput("");
      setPromoMessage({ type: "success", text: response.message || "Promo applied successfully!" });
    } catch (error) {
      setPromoMessage({ type: "error", text: error.response?.data?.message || "Invalid or expired promo code." });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    removePromo();
    setPromoMessage({ type: "", text: "" });
  };

  // ==========================================
  // SUBMIT ORDER LOGIC
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!customerLocation || deliveryError) return;
    
    setIsSubmitting(true);

    const currentSlug = cartItems[0]?.restaurantSlug || null;
    setFallbackSlug(currentSlug);

    // Payload includes the applied promo code
    const securePayload = {
      restaurantId: cartItems[0]?.restaurantId || cartItems[0]?.restaurantIds?.[0] || null, 
      promoCode: discountData ? discountData.code : "", 
      customerDetails: {
        ...formData,
        lat: customerLocation.lat,
        lng: customerLocation.lng
      },
      items: cartItems.map(item => ({ 
        menuItemId: item._id, 
        quantity: item.quantity,
        variantName: item.variant 
      }))
    };

    try {
      const response = await placeOrder(securePayload);

      if (response && response.order) {
        setOrderSuccess(response.order);
        clearCart(); 
      } else {
        throw new Error("Invalid response format from server");
      }

    } catch (error) {
      alert(`Order Failed: ${error.response?.data?.message || error.message}`);
      setIsSubmitting(false); 
    } 
  };

  // ✅ Added utility to copy the transaction ID
  const handleCopyId = () => {
    if (orderSuccess?.orderId) {
      navigator.clipboard.writeText(orderSuccess.orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ==========================================
  // PREMIUM FINTECH UI: SUCCESS STATE
  // ==========================================
  if (orderSuccess) {
    const targetSlug = orderSuccess.restaurantId?.slug || fallbackSlug;

    return (
      <div className="min-h-screen bg-white md:bg-gray-50 font-sans md:flex md:items-center md:justify-center md:p-5">
        <div className="w-full min-h-screen md:min-h-0 md:h-[750px] bg-white md:max-w-[400px] md:rounded-[32px] md:shadow-xl md:border md:border-gray-100 flex flex-col items-center justify-center text-center p-8 relative overflow-hidden animate-in fade-in zoom-in duration-500">
          
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Order Confirmed</h2>
          <p className="text-gray-500 font-medium mb-10 px-2 leading-relaxed text-sm">
            Your transaction was successful. The kitchen is securely processing your request.
          </p>

          <div className="bg-gray-50 w-full rounded-2xl p-5 mb-10 border border-gray-200 flex flex-col items-center relative">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Transaction Ref</p>
            <div className="flex items-center gap-3">
              <p className="text-xl font-mono font-bold text-gray-900 tracking-wider">{orderSuccess.orderId}</p>
              <button 
                onClick={handleCopyId} 
                className="text-gray-400 hover:text-gray-700 transition-colors p-1"
                aria-label="Copy Reference ID"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="w-full space-y-3 px-2">
            <button 
              onClick={() => navigate(`/track/${orderSuccess._id}`)} 
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-[15px] shadow-sm hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Track Order Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button 
              onClick={() => {
                if (targetSlug) {
                  navigate(`/${targetSlug}/menu`);
                } else {
                  navigate(-1); 
                }
              }}
              className="w-full py-4 text-gray-400 font-bold text-[14px] hover:text-gray-800 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CHECKOUT FORM UI
  // ==========================================
  return (
    <div className="min-h-screen bg-[#f8f9fb] font-sans md:flex md:items-center md:justify-center">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="w-full bg-[#f8f9fb] md:max-w-[400px] md:h-[800px] md:rounded-[40px] md:shadow-2xl md:border-[8px] md:border-black flex flex-col relative overflow-hidden">
        
        <header className="sticky top-0 z-40 bg-[#f8f9fb]/90 backdrop-blur-md px-5 py-5 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Checkout</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-5 pt-2 pb-32 hide-scrollbar">
          
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
            </div>

            <div className="pt-4 border-t border-gray-100/80 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-semibold text-slate-800">{cartCurrency} {subtotal.toFixed(2)}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-sm text-green-600">
                  <span className="font-bold flex items-center gap-1"><Tag className="w-3 h-3"/> Discount ({discountData.code})</span>
                  <span className="font-bold">- {cartCurrency} {discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">VAT (5%)</span>
                <span className="font-semibold text-slate-800">{cartCurrency} {vatAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Delivery Fee</span>
                <span className="font-semibold text-slate-800">
                  {isCalculatingFee ? (
                    <span className="text-gray-400 animate-pulse text-xs">Calculating...</span>
                  ) : (
                    `${cartCurrency} ${deliveryFee.toFixed(2)}`
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-100/80">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-black text-[#ff6b35] text-lg">{cartCurrency} {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-5 mb-6 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.04)] border border-gray-100/80">
             <h2 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#ff6b35]" /> Apply Promo Code
             </h2>
             
             {discountData ? (
                <div className="flex items-center justify-between bg-green-50 p-3.5 rounded-xl border border-green-100">
                   <div className="flex items-center gap-2">
                     <CheckCircle2 className="w-5 h-5 text-green-600" />
                     <span className="text-sm font-bold text-green-700">{discountData.code} Applied</span>
                   </div>
                   <button 
                     type="button" 
                     onClick={handleRemovePromo} 
                     className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                </div>
             ) : (
                <div className="flex w-full gap-2">
                  <input 
                    type="text" 
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Enter code" 
                    className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#ff6b35] transition-colors placeholder-slate-400 uppercase"
                  />
                  <button 
                    type="button" 
                    onClick={handleApplyPromo}
                    disabled={isApplyingPromo || !promoInput}
                    className="shrink-0 bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#ff6b35] transition-colors disabled:opacity-50"
                  >
                    {isApplyingPromo ? "..." : "Apply"}
                  </button>
                </div>
             )}
             
             {promoMessage.text && (
                <div className={`mt-3 flex items-start gap-2 p-3 rounded-xl text-xs font-bold 
                  ${promoMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 
                    promoMessage.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 
                    'bg-green-50 text-green-700 border border-green-100'}`}>
                  {promoMessage.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : 
                   promoMessage.type === 'info' ? <Info className="w-4 h-4 shrink-0 mt-0.5" /> :
                   <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                  <p>{promoMessage.text}</p>
                </div>
             )}
          </div>

          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-3 mb-6">
              <h2 className="text-sm font-extrabold text-slate-900 px-1">1. Set Delivery Location</h2>
              <LocationPickerMap onLocationSelect={handleLocationSelect} />
              
              {deliveryError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{deliveryError}</p>
                </div>
              )}
              
              {customerLocation && !deliveryError && !isCalculatingFee && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-xs font-bold border border-green-100">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <p>Location confirmed. Delivery fee: {cartCurrency} {deliveryFee.toFixed(2)}</p>
                </div>
              )}
            </div>

            <h2 className="text-sm font-extrabold text-slate-900 mb-3 px-1">2. Delivery Details</h2>
            
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

        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-5 border-t border-gray-100/80 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <button 
            type="submit" 
            form="checkout-form"
            disabled={isSubmitting || cartItems.length === 0 || !customerLocation || !!deliveryError || isCalculatingFee}
            className="w-full bg-[#ff6b35] text-white py-4 rounded-full font-bold text-[16px] shadow-[0_8px_20px_-6px_rgba(255,107,53,0.4)] hover:bg-[#ff5a1f] active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:bg-slate-300 disabled:shadow-none disabled:active:scale-100"
          >
            {isSubmitting ? (
              "Processing..."
            ) : !customerLocation ? (
              "Please Set Location"
            ) : deliveryError ? (
              "Delivery Unavailable"
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Pay {cartCurrency} {grandTotal.toFixed(2)}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Checkout;