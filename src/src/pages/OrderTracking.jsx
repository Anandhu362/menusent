import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Phone, MapPin, Package, Truck, CheckCircle, ChevronLeft, Receipt } from "lucide-react";

// ✅ 1. Import safe initialization methods
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { trackOrder } from "../api/order.api";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

// ✅ 2. Safe Singleton Initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const fetchAndListen = async () => {
      try {
        console.log("📡 1. Fetching initial order from MongoDB:", orderId);
        const data = await trackOrder(orderId);
        setOrder(data);

        const restaurantId = data.restaurantId?._id || data.restaurantId;
        console.log("🏢 2. Target Restaurant ID for Firebase:", restaurantId);

        if (restaurantId) {
          const statusRef = ref(db, `live-orders/${restaurantId}`);
          
          unsubscribe = onValue(
            statusRef, 
            (snapshot) => {
              const liveData = snapshot.val();
              if (liveData) {
                const remoteOrder = Object.values(liveData).find(o => o._id === orderId);
                if (remoteOrder) {
                  setOrder(prev => ({ 
                    ...prev, 
                    orderStatus: remoteOrder.orderStatus 
                  }));
                }
              }
            },
            (error) => {
              console.error("🚨 FIREBASE LISTENER ERROR:", error);
            }
          );
        }
      } catch (error) {
        console.error("🚨 Tracking Error:", error);
      }
    };

    fetchAndListen();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [orderId]);

  if (!order) return (
    <div className="h-screen flex items-center justify-center bg-[#f8f9fb]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-[#ff6d33] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold">Syncing with kitchen...</p>
      </div>
    </div>
  );

  const statuses = ["Pending", "Accepted", "Preparing", "Out for Delivery", "Delivered"];
  const currentIdx = statuses.indexOf(order.orderStatus);
  
  const subtotal = order.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;
  const vat = subtotal * 0.05;

  return (
    <div className="min-h-screen bg-[#f8f9fb] font-sans md:flex md:items-center md:justify-center">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="w-full bg-white md:max-w-[400px] md:h-[800px] md:rounded-[40px] md:shadow-2xl md:border-[8px] md:border-black flex flex-col relative overflow-hidden">
        
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-5 py-5 flex items-center justify-between border-b border-gray-50">
          <button 
            onClick={() => navigate(`/${order.restaurantId?.slug || ""}/menu`)} 
            className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 active:bg-slate-200 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-black text-slate-900 text-lg tracking-tight">Order Status</h1>
          <div className="px-3 py-1 bg-orange-50 text-[#ff6d33] rounded-full font-black text-xs">
            {order.items?.[0]?.currency || "AED"} {order.totalAmount?.toFixed(2)}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="p-6 space-y-8">
            
            <div className="text-center py-2">
              <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                {order.restaurantId?.name || "Restaurant"}
              </p>
              <p className="text-[11px] text-slate-300 font-bold mt-1">ID: {order.orderId}</p>
            </div>

            <div className="relative pl-8 space-y-10 py-2">
              <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="w-full bg-[#ff6d33] transition-all duration-1000 ease-in-out" 
                  style={{ height: `${(currentIdx / (statuses.length - 1)) * 100}%` }}
                />
              </div>

              {statuses.slice(1).map((s, i) => {
                const isCompleted = i + 1 < currentIdx;
                const isActive = i + 1 === currentIdx;

                return (
                  <div key={s} className={`relative flex items-center gap-5 transition-opacity duration-500 ${isCompleted || isActive ? "opacity-100" : "opacity-20"}`}>
                    <div className={`absolute -left-[23px] w-[14px] h-[14px] rounded-full border-[3px] border-white z-10 transition-colors duration-500 ${isCompleted || isActive ? "bg-[#ff6d33]" : "bg-slate-300"}`} />
                    <div className={`p-3 rounded-2xl transition-all duration-500 ${isActive ? "bg-orange-50 scale-110" : "bg-slate-50"}`}>
                      {s === "Accepted" && <CheckCircle size={20} className={isActive || isCompleted ? "text-[#ff6d33]" : ""} />}
                      {s === "Preparing" && <Package size={20} className={isActive || isCompleted ? "text-[#ff6d33]" : ""} />}
                      {s === "Out for Delivery" && <Truck size={20} className={isActive || isCompleted ? "text-[#ff6d33]" : ""} />}
                      {s === "Delivered" && <CheckCircle size={20} className={isActive || isCompleted ? "text-[#ff6d33]" : ""} />}
                    </div>
                    <div>
                      <p className="font-black text-sm text-slate-900">{s}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">
                        {isActive ? "In Progress" : isCompleted ? "Completed" : "Waiting"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Delivery Address Section */}
            <div className="bg-slate-50 rounded-[24px] p-5 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                  <MapPin size={18} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Delivery to</p>
                  <p className="text-sm font-black text-slate-800">{order.customerName}</p>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">
                    {order.deliveryAddress?.apt ? `${order.deliveryAddress.apt}, ` : ""}
                    {order.deliveryAddress?.building}
                    {order.deliveryAddress?.landmark ? ` (Near ${order.deliveryAddress.landmark})` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Summary Section */}
            <div className="bg-white border border-gray-100 rounded-[24px] p-5 space-y-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt size={16} className="text-[#ff6d33]" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Summary</h3>
              </div>
              
              <div className="space-y-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-start text-sm">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{item.quantity}x {item.name}</span>
                      {item.variantName && <span className="text-[10px] text-gray-400">{item.variantName}</span>}
                    </div>
                    <span className="font-black text-slate-700">
                      {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-dashed border-gray-200 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>Subtotal</span>
                  <span>{subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>Delivery Fee</span>
                  <span>{(order.deliveryFee || 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>VAT (5%)</span>
                  <span>{vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-black text-slate-900">Total Amount</span>
                  <span className="font-black text-lg text-[#ff6d33]">
                    {order.items?.[0]?.currency || "AED"} {order.totalAmount?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ FIXED: Dynamic Call Restaurant Button */}
        <div className="p-6 bg-white border-t border-gray-50">
          <a 
            href={`tel:${order.restaurantId?.whatsappNumber || ""}`} 
            className="w-full py-4 bg-slate-900 text-white rounded-[20px] font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-slate-200 active:scale-95 transition-transform"
          >
            <Phone size={18} /> 
            <span>Call Restaurant</span>
          </a>
        </div>

      </div>
    </div>
  );
};

export default OrderTracking;