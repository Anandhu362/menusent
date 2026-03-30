import React, { useState, useEffect, useRef } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { useAuth } from "../context/AuthContext";
import { Clock, CheckCircle, Phone, MapPin } from "lucide-react";
import { io } from "socket.io-client"; 

import { getRestaurantOrders, updateOrderStatus } from "../api/order.api.js";

const Orders = () => {
  const { user } = useAuth();
  const restaurantId = user?.restaurantId;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIX 1: Change to an empty ref, we will attach it to an HTML element instead
  const audioRef = useRef(null);

  // --- 1. INITIAL FETCH & REAL-TIME SOCKET CONNECTION ---
  useEffect(() => {
  if (!restaurantId) return;

  const fetchInitialOrders = async () => {
    try {
      const data = await getRestaurantOrders(restaurantId);
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };
  fetchInitialOrders();

  // ✅ FIXED: Use correct env variable
  const SOCKET_URL = import.meta.env.VITE_API_BASE_URL.replace("/api", "");

  const socket = io(SOCKET_URL, {
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("✅ Connected to socket:", socket.id);
  });

  socket.on("receiveNewOrder", (newOrder) => {
    if (newOrder.restaurantId === restaurantId) {

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.warn("Audio blocked until user interaction", err);
        });
      }

      setOrders((prevOrders) => [newOrder, ...prevOrders]);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
  });

  return () => {
    socket.disconnect();
  };

}, [restaurantId]);

  // --- 2. UPDATE STATUS HANDLER ---
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? { ...order, orderStatus: newStatus } : order
        )
      );
      
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update order status.");
      
      const data = await getRestaurantOrders(restaurantId);
      setOrders(data);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const columns = [
    { 
      status: "Pending", 
      title: "New Orders", 
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-50",
      border: "border-orange-200",
      nextStatus: "Completed",
      nextLabel: "Accept"
    },
    { 
      status: "Completed", 
      title: "Accepted", 
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-50",
      border: "border-green-200",
      nextStatus: null, 
      nextLabel: ""
    }
  ];

  return (
    <div className="flex h-screen bg-[#f8f9fb] font-sans">
      
      {/* ✅ FIX 3: Add a hidden native HTML audio element */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" className="hidden" />

      <AdminSidebar />
      <main className="flex-1 h-full overflow-y-auto relative z-10 pl-0">
        
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold text-slate-900">Live Orders</h2>
            {loading && <span className="text-sm font-medium text-gray-400">Loading...</span>}
          </div>
        </header>

        {/* Board Container */}
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto h-[calc(100vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full pb-4">
            
            {columns.map((col) => {
              const columnOrders = orders.filter(o => o.orderStatus === col.status);

              return (
                <div key={col.status} className="flex-1 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col h-full">
                  
                  <div className={`p-4 border-b ${col.border} ${col.bg} rounded-t-2xl flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <col.icon className={`h-5 w-5 ${col.color}`} />
                      <h3 className="font-bold text-slate-800">{col.title}</h3>
                    </div>
                    <span className="bg-white text-slate-800 text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
                      {columnOrders.length}
                    </span>
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto space-y-4">
                    {columnOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm font-medium">
                        No {col.title.toLowerCase()} orders
                      </div>
                    ) : (
                      columnOrders.map((order) => (
                        <div key={order._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                          
                          {/* Order Header */}
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-sm font-black text-gray-400 uppercase tracking-wider">
                              {order.orderId ? `#${order.orderId}` : `#${order._id.substring(order._id.length - 6)}`}
                            </span>
                            <span className="text-xs font-bold text-slate-600 bg-gray-100 px-2 py-1 rounded-md">
                              {formatTime(order.createdAt)}
                            </span>
                          </div>

                          {/* Customer Details */}
                          <div className="mb-4 pb-4 border-b border-gray-50">
                            <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1">
                              {order.customerName || "Guest"}
                            </h4>
                            <div className="flex flex-col gap-1.5 mt-2">
                              {order.customerPhone && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                  <Phone className="h-4 w-4 shrink-0 text-slate-400" /> 
                                  <span>{order.customerPhone}</span>
                                </div>
                              )}
                              
                              {order.tableNumber ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" /> 
                                  <span>Table: {order.tableNumber}</span>
                                </div>
                              ) : (
                                order.deliveryAddress && (order.deliveryAddress.apt || order.deliveryAddress.building) && (
                                  <div className="flex items-start gap-2 text-sm text-gray-500 font-medium">
                                    <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" /> 
                                    <div className="flex flex-col">
                                      <span>
                                        {order.deliveryAddress.apt && `${order.deliveryAddress.apt}, `}
                                        {order.deliveryAddress.building}
                                      </span>
                                      {order.deliveryAddress.landmark && (
                                        <span className="text-xs text-gray-400 mt-0.5">
                                          Landmark: {order.deliveryAddress.landmark}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="space-y-2 mb-4">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-start text-sm">
                                <div className="flex gap-2">
                                  <span className="font-bold text-slate-800">{item.quantity}x</span>
                                  <span className="text-slate-600 font-medium">
                                    {item.name}
                                    {item.variantName && <span className="text-gray-400 text-xs ml-1">({item.variantName})</span>}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                            <span className="font-black text-lg text-slate-900">
                              {(order.totalAmount || 0).toFixed(2)}
                            </span>
                            
                            <div className="flex gap-2">
                              {col.status === "Pending" && (
                                <button 
                                  onClick={() => handleStatusChange(order._id, "Cancelled")}
                                  className="text-xs font-bold px-4 py-2.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                                >
                                  Cancel
                                </button>
                              )}

                              {col.nextStatus && (
                                <button 
                                  onClick={() => handleStatusChange(order._id, col.nextStatus)}
                                  className="bg-[#22c55e] text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-[#16a34a] transition-colors shadow-md shadow-green-500/20"
                                >
                                  {col.nextLabel}
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      ))
                    )}
                  </div>

                </div>
              );
            })}
            
          </div>
        </div>
      </main>
    </div>
  );
};

export default Orders;
