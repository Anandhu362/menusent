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
import { LocalNotifications } from '@capacitor/local-notifications';

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

  // 2. ✅ PREMIUM NATIVE ESC/POS PRINTER
  const printSilentlyOverWiFi = async (order) => {
    try {
      const connection = await TcpSocket.connect({
        ipAddress: '192.168.1.100', // Your printer's IP
        port: 9100
      });
      const clientId = connection.client;

      // --- HELPER FUNCTIONS FOR PERFECT 48-COLUMN ALIGNMENT ---
      const padRight = (text, length) => String(text).padEnd(length, ' ').substring(0, length);
      const formatLine = (label, value) => {
        const valStr = String(value);
        const spaces = 48 - label.length - valStr.length;
        return spaces > 0 ? label + " ".repeat(spaces) + valStr + "\x0A" : label + " " + valStr + "\x0A";
      };

      let receiptText = "\x1B\x40"; // Initialize printer

      // --- HEADER SECTION ---
      receiptText += "\x1B\x61\x01"; // Center align
      receiptText += "\x1B\x45\x01"; // Bold ON
      receiptText += "\x1D\x21\x11"; // Double height & width (Premium look)
      receiptText += `${user?.name || "Grill Town Resturant"}\x0A`;
      receiptText += "\x1D\x21\x00"; // Reset text size
      receiptText += "\x1B\x45\x00"; // Bold OFF
      receiptText += "\x0A"; // Small gap
      
      if (user?.trn) receiptText += `TRN: ${user.trn}\x0A`;
      if (user?.address) receiptText += `${user.address}\x0A`;
      receiptText += `Tel: ${user?.phone || ""}\x0A`;
      receiptText += "------------------------------------------------\x0A";

      // --- ORDER DETAILS SECTION ---
      receiptText += "\x1B\x61\x00"; // Left align
      receiptText += "\x1B\x45\x01"; // Bold ON
      receiptText += `Order ID: ${order.orderId}\x0A`;
      receiptText += "\x1B\x45\x00"; // Bold OFF
      receiptText += `Date: ${new Date(order.createdAt).toLocaleString()}\x0A`;
      receiptText += `Customer: ${order.customerName}\x0A`;
      receiptText += `Phone: ${order.customerPhone}\x0A`;
      if (order.deliveryAddress) {
        receiptText += `Address: ${order.deliveryAddress}\x0A`;
      }
      receiptText += "------------------------------------------------\x0A";

      // --- ITEMS TABLE HEADER ---
      receiptText += "\x1B\x45\x01"; // Bold ON
      // Exact alignment: Qty (5 chars) + Item (35 chars) + Amt (8 chars) = 48 chars
      receiptText += "Qty  Item                                    Amt\x0A"; 
      receiptText += "\x1B\x45\x00"; // Bold OFF
      receiptText += "------------------------------------------------\x0A";

      // --- ITEMS LOOP ---
      order.items?.forEach(item => {
        const qtyStr = padRight(`${item.quantity}x`, 5);
        // Truncate long names to 31 chars so they don't break the layout
        const itemName = item.name.length > 34 ? item.name.substring(0, 31) + "..." : item.name;
        const itemStr = padRight(itemName, 35);
        const priceStr = String((item.price * item.quantity).toFixed(2)).padStart(8, ' ');
        
        receiptText += `${qtyStr}${itemStr}${priceStr}\x0A`;
      });
      receiptText += "------------------------------------------------\x0A";

      // --- FINANCIALS SECTION ---
      const subtotal = order.subtotal || order.totalAmount; 
      const vat = order.vat || 0;
      const delivery = order.deliveryCharge || order.deliveryFee || 0;

      receiptText += formatLine("Subtotal:", subtotal.toFixed(2));
      if (vat > 0) receiptText += formatLine("VAT (5%):", vat.toFixed(2));
      if (delivery > 0) receiptText += formatLine("Delivery:", delivery.toFixed(2));

      receiptText += "------------------------------------------------\x0A";
      receiptText += "\x1B\x45\x01"; // Bold ON
      receiptText += formatLine("TOTAL:", `AED ${order.totalAmount?.toFixed(2)}`);
      receiptText += "\x1B\x45\x00"; // Bold OFF
      receiptText += "------------------------------------------------\x0A";

      // --- FOOTER SECTION ---
      receiptText += "\x1B\x61\x01"; // Center align
      receiptText += "\x1B\x45\x01"; // Bold ON
      receiptText += "Thank you for your order!\x0A\x0A";
      receiptText += "\x1B\x45\x00"; // Bold OFF
      
      // ✅ ADSPRO WATERMARK (Using ESC/POS Font B for minimal professional look)
      receiptText += "\x1B\x4D\x01"; // Switch to Mini Font
      receiptText += "Powered by MenuSent\x0A";
      receiptText += "System by Adspro Technologies\x0A";
      receiptText += "\x1B\x4D\x00"; // Reset back to Standard Font
      
      receiptText += "\x0A\x0A\x0A\x0A\x0A"; // Feed paper forward before cutting
      receiptText += "\x1D\x56\x41\x10"; // Cut paper command

      // Send the raw bytes to the printer silently
      await TcpSocket.send({ 
        client: clientId, 
        data: receiptText 
      });
      
      // Close the connection
      await TcpSocket.disconnect({ client: clientId });
      console.log("Premium Print Success!");

    } catch (error) {
      console.error("Native Print Error:", error);
      alert("Printer connection failed. Is it turned on and on the same Wi-Fi?");
    }
  };

  // 3. Main trigger function
  const triggerPrint = (order) => {
    if (Capacitor.isNativePlatform()) {
      printSilentlyOverWiFi(order); 
    } else {
      setOrderToPrint(order); 
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

    const unsubscribe = onChildAdded(newOrdersQuery, async (snapshot) => {
      const newOrder = snapshot.val();
      if (typeof newOrder._id === 'object' || typeof newOrder._id === 'undefined') return;

      setOrders((prevOrders) => {
        if (prevOrders.some(o => o._id === newOrder._id)) return prevOrders;

        // Play the audio sound
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }

        // Trigger Native Android Notification
        if (Capacitor.isNativePlatform()) {
          LocalNotifications.schedule({
            notifications: [
              {
                title: "🚨 New Order Received!",
                body: `${newOrder.customerName} just placed an order for AED ${newOrder.totalAmount}`,
                id: Math.floor(Date.now() / 1000), 
                schedule: { at: new Date(Date.now() + 1000) }, 
                sound: null, 
                actionTypeId: "",
                extra: null
              }
            ]
          });
        }

        return [newOrder, ...prevOrders];
      });
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const handleStatusChange = async (order, newStatus) => {
    const orderId = order._id;
    try {
      setOrders(prevOrders => 
        prevOrders.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o)
      );
      await updateOrderStatus(orderId, newStatus);

      // Trigger print automatically ONLY when the owner clicks "Accept"
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
                            
                            {/* MANUAL PRINT BUTTON */}
                            <button 
                              onClick={() => triggerPrint(order)}
                              title="Print Receipt"
                              className="p-1.5 rounded-lg text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors mr-1"
                            >
                              <Printer className="h-4 w-4" />
                            </button>

                            {/* ACTION BUTTONS */}
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
