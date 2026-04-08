import React, { useState, useEffect, useRef } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { useAuth } from "../context/AuthContext";
import { Clock, CheckCircle, Phone, MapPin, Truck, Check, Printer } from "lucide-react";

// Print Utilities
import { useReactToPrint } from "react-to-print";
import { ReceiptPrinter } from "../components/ReceiptPrinter";

// Firebase
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onChildAdded, query, orderByChild, startAt } from "firebase/database";
import { getRestaurantOrders, updateOrderStatus } from "../api/order.api.js";

// ✅ Import Capacitor Native Tools
import { Capacitor } from '@capacitor/core';
import { TcpSocket } from 'capacitor-tcp-socket';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const Orders = () => {
  const { user } = useAuth();
  const restaurantId = user?.restaurantId;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  // ==========================================
  // 🖨️ HYBRID PRINTING LOGIC (Web + Native)
  // ==========================================
  const [orderToPrint, setOrderToPrint] = useState(null);
  const printComponentRef = useRef(null);

  // 1. Web Fallback Printer
  const handleWebPrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: "Order_Receipt",
    onAfterPrint: () => setOrderToPrint(null),
  });

  useEffect(() => {
    if (orderToPrint && !Capacitor.isNativePlatform()) {
      const timer = setTimeout(() => handleWebPrint(), 300);
      return () => clearTimeout(timer);
    }
  }, [orderToPrint, handleWebPrint]);

  // 2. ✅ NATIVE SILENT TCP PRINTER (For Android Tablet)
  const printSilentlyOverWiFi = async (order) => {
    try {
      // Connect to the printer
      const connection = await TcpSocket.connect({
        ipAddress: '192.168.1.100', // Your printer's IP
        port: 9100
      });
      const clientId = connection.client;

      // Format standard thermal ESC/POS text
      let receiptText = "\x1B\x40"; // Initialize printer
      receiptText += "\x1B\x61\x01"; // Center align
      receiptText += `${user?.name?.toUpperCase() || "RESTAURANT"}\x0A`;
      receiptText += "--------------------------------\x0A";
      receiptText += "\x1B\x61\x00"; // Left align
      receiptText += `Order ID: ${order.orderId}\x0A`;
      receiptText += `Customer: ${order.customerName}\x0A`;
      receiptText += `Phone: ${order.customerPhone}\x0A`;
      receiptText += "--------------------------------\x0A";
      
      order.items?.forEach(item => {
        receiptText += `${item.quantity}x ${item.name}\x0A`;
        receiptText += `   AED ${(item.price * item.quantity).toFixed(2)}\x0A`;
      });
      
      receiptText += "--------------------------------\x0A";
      receiptText += `TOTAL: AED ${order.totalAmount?.toFixed(2)}\x0A\x0A\x0A\x0A`;
      receiptText += "\x1D\x56\x41\x10"; // Cut paper command

      // Send the raw bytes to the printer silently
      await TcpSocket.send({ 
        client: clientId, 
        data: receiptText 
      });
      
      // Close the connection
      await TcpSocket.disconnect({ client: clientId });
      console.log("Native Silent Print Success!");

    } catch (error) {
      console.error("Native Print Error:", error);
      alert("Printer connection failed. Is it turned on and on the same Wi-Fi?");
    }
  };

  // 3. Main trigger function
  const triggerPrint = (order) => {
    if (Capacitor.isNativePlatform()) {
      printSilentlyOverWiFi(order); // 🔥 Native Tablet App
    } else {
      setOrderToPrint(order); // 🌐 PC Web Browser Fallback
    }
  };
  // ==========================================

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

    const ordersRef = ref(db, `live-orders/${restaurantId}`);
    const now = Date.now();
    const newOrdersQuery = query(ordersRef, orderByChild('timestamp'), startAt(now));

    const unsubscribe = onChildAdded(newOrdersQuery, (snapshot) => {
      const newOrder = snapshot.val();
      if (typeof newOrder._id === 'object' || typeof newOrder._id === 'undefined') return;

      setOrders((prevOrders) => {
        if (prevOrders.some(o => o._id === newOrder._id)) return prevOrders;

        // ✅ REMOVED: Auto-print when new order arrives
        // The order will now sit in "New Orders" waiting for acceptance

        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }

        return [newOrder, ...prevOrders];
      });
    });

    return () => unsubscribe();
  }, [restaurantId]);

  // ✅ UPDATED: Now receives the full order object instead of just the ID
  const handleStatusChange = async (order, newStatus) => {
    const orderId = order._id;
    try {
      setOrders(prevOrders => 
        prevOrders.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o)
      );
      await updateOrderStatus(orderId, newStatus);

      // ✅ ADDED: Trigger print automatically ONLY when the owner clicks "Accept"
      if (newStatus === "Accepted") {
        triggerPrint({ ...order, orderStatus: newStatus });
      }

    } catch (error) {
      console.error("Failed to update status:", error);
      const data = await getRestaurantOrders(restaurantId);
      setOrders(data);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const columns = [
    { status: "Pending", title: "New Orders", icon: Clock, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
    { status: "Accepted", title: "Preparing", icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", border: "border-green-200" },
    { status: "Out for Delivery", title: "Shipping", icon: Truck, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" },
    { status: "Delivered", title: "History", icon: Check, color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200" }
  ];

  return (
    <div className="flex h-screen bg-[#f8f9fb] font-sans">
      
      {/* INVISIBLE WEB PRINTER COMPONENT (Only used on PC) */}
      <ReceiptPrinter ref={printComponentRef} order={orderToPrint} restaurant={user} />

      <audio ref={audioRef} src="/notification.mp3" preload="auto" className="hidden" />
      <AdminSidebar />
      <main className="flex-1 h-full overflow-y-auto relative z-10">
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Live Orders</h2>
        </header>

        <div className="p-4 md:p-6 max-w-full mx-auto h-[calc(100vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full pb-4">
            
            {columns.map((col) => {
              const columnOrders = orders.filter(o => o.orderStatus === col.status);

              return (
                <div key={col.status} className="flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100 h-full overflow-hidden">
                  <div className={`p-3 border-b ${col.border} ${col.bg} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <col.icon className={`h-4 w-4 ${col.color}`} />
                      <h3 className="font-bold text-sm text-slate-800">{col.title}</h3>
                    </div>
                    <span className="bg-white text-slate-800 text-xs font-black px-2 py-0.5 rounded-full shadow-sm">{columnOrders.length}</span>
                  </div>

                  <div className="p-3 flex-1 overflow-y-auto space-y-3">
                    {columnOrders.map((order) => (
                      <div key={order._id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">#{order.orderId}</span>
                          <span className="text-[10px] font-bold text-slate-600 bg-gray-100 px-1.5 py-0.5 rounded">{formatTime(order.createdAt)}</span>
                        </div>

                        <div className="mb-2">
                          <h4 className="font-bold text-slate-800 text-sm">{order.customerName}</h4>
                          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium mt-1">
                            <Phone className="h-3 w-3 text-slate-400" /> 
                            <span>{order.customerPhone}</span>
                          </div>
                        </div>

                        <div className="space-y-1 mb-3 border-t pt-2 flex-1">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-[11px]">
                              <span className="text-slate-600 font-medium">{item.quantity}x {item.name}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                          <span className="font-black text-sm text-slate-900">
                            {order.items && order.items.length > 0 ? order.items[0].currency : 'AED'} {(order.totalAmount || 0).toFixed(2)}
                          </span>
                          
                          <div className="flex gap-1 items-center">
                            
                            {/* ✅ MANUAL PRINT BUTTON */}
                            <button 
                              onClick={() => triggerPrint(order)}
                              title="Print Receipt"
                              className="p-1.5 rounded-lg text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors mr-1"
                            >
                              <Printer className="h-4 w-4" />
                            </button>

                            {/* ✅ UPDATED BUTTONS to pass the full 'order' object */}
                            {col.status === "Pending" && (
                              <>
                                <button onClick={() => handleStatusChange(order, "Cancelled")} className="p-1.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100"><Check className="h-4 w-4 rotate-45" /></button>
                                <button onClick={() => handleStatusChange(order, "Accepted")} className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-white bg-green-500 hover:bg-green-600">Accept</button>
                              </>
                            )}

                            {col.status === "Accepted" && (
                              <button onClick={() => handleStatusChange(order, "Out for Delivery")} className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg text-white bg-blue-500 hover:bg-blue-600"><Truck className="h-3 w-3" /> Dispatch</button>
                            )}

                            {col.status === "Out for Delivery" && (
                              <button onClick={() => handleStatusChange(order, "Delivered")} className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg text-white bg-slate-700 hover:bg-slate-800"><Check className="h-3 w-3" /> Delivered</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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