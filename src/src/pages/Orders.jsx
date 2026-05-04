import React, { useState, useEffect, useRef } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { useAuth } from "../context/AuthContext";
import { Clock, CheckCircle, Phone, MapPin, Truck, Check, Printer, Bluetooth, BluetoothConnected, BluetoothOff, X, RefreshCw } from "lucide-react";

// API & Firebase
import apiClient from "../api/apiClient";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onChildAdded, query, orderByChild, startAt } from "firebase/database";
import { getRestaurantOrders, updateOrderStatus } from "../api/order.api.js";

// Print Utilities
import { useReactToPrint } from "react-to-print";
import { ReceiptPrinter } from "../components/ReceiptPrinter";

// Native Tools
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// ✅ Import the new Printer Context
import { usePrinter } from "../context/PrinterContext";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Smart Address Formatter (Kept for UI display)
const formatAddress = (addr) => {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    const parts = [];
    if (addr.building) parts.push(addr.building);
    if (addr.apt) parts.push(`Apt/Villa ${addr.apt}`);
    if (addr.landmark) parts.push(`Near ${addr.landmark}`);
    if (parts.length === 0) return Object.values(addr).filter(Boolean).join(", ");
    return parts.join(", ");
  }
  return String(addr);
};

const Orders = () => {
  const { user } = useAuth();
  const restaurantId = user?.restaurantId;

  // ✅ Consume Printer Context variables and functions
  const { 
    btConnectionStatus, 
    pairedDevices, 
    showDeviceModal, 
    setShowDeviceModal, 
    scanForPrinters, 
    connectToSelectedPrinter, 
    disconnectPrinter, 
    triggerPrint 
  } = usePrinter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);
  
  // ✅ Removed hardcoded IP. It will now fetch dynamically from DB.
  const [livePrinterIp, setLivePrinterIp] = useState('');
  const [restaurantPhone, setRestaurantPhone] = useState(user?.phone || '');
  const [restaurantAddress, setRestaurantAddress] = useState(user?.address || '');

  const [orderToPrint, setOrderToPrint] = useState(null);
  const printComponentRef = useRef(null);

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

  // ✅ Centralized Print Handler interacting with Context
  const handlePrintRequest = async (order) => {
    const printMethod = await triggerPrint(order, {
      user,
      restaurantAddress,
      restaurantPhone,
      livePrinterIp
    });

    // Fallback to web print (react-to-print) if not on a native device
    if (printMethod === "WEB") {
      setOrderToPrint(order);
    }
  };

  useEffect(() => {
    if (!restaurantId) return;

    // Fetch dynamic printer IP and restaurant details
    const fetchRestaurantDetails = async () => {
      try {
        const res = await apiClient.get('/api/restaurants/owner/profile'); 
        if (res.data) {
          if (res.data.printerIp) setLivePrinterIp(res.data.printerIp);
          if (res.data.phone) setRestaurantPhone(res.data.phone);
          if (res.data.fullAddress) setRestaurantAddress(res.data.fullAddress);
        }
      } catch (error) {
        console.error("Failed to fetch profile info:", error);
      }
    };

    fetchRestaurantDetails();

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

        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }

        if (Capacitor.isNativePlatform()) {
          LocalNotifications.schedule({
            notifications: [
              {
                title: "🚨 New Order Received!",
                body: `${newOrder.customerName} just placed an order for AED ${(newOrder.totalAmount || 0).toFixed(2)}`,
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

      if (newStatus === "Accepted") {
        console.log(`👉 Order ${order.orderId} Accepted! Triggering print...`);
        handlePrintRequest({ ...order, orderStatus: newStatus });
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
    <div className="flex h-screen bg-[#f8f9fb] font-sans relative">
      
      <ReceiptPrinter ref={printComponentRef} order={orderToPrint} restaurant={user} />
      <audio ref={audioRef} src="/notification.mp3" preload="auto" className="hidden" />
      <AdminSidebar />
      
      <main className="flex-1 h-full overflow-y-auto relative z-10">
        
        {/* HEADER WITH DYNAMIC BLUETOOTH BUTTON */}
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Live Orders</h2>
          
          {Capacitor.isNativePlatform() && (
            <button 
              onClick={btConnectionStatus === "Connected" ? disconnectPrinter : scanForPrinters}
              disabled={btConnectionStatus === "Scanning..." || btConnectionStatus === "Connecting"}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                btConnectionStatus === "Connected" 
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                  : btConnectionStatus.includes("ing")
                  ? "bg-yellow-100 text-yellow-700 cursor-wait"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {btConnectionStatus === "Connected" && <BluetoothConnected className="h-5 w-5" />}
              {btConnectionStatus.includes("ing") && <RefreshCw className="h-5 w-5 animate-spin" />}
              {btConnectionStatus === "Disconnected" && <BluetoothOff className="h-5 w-5" />}
              
              <span>
                {btConnectionStatus === "Connected" ? "Disconnect Printer" : 
                 btConnectionStatus === "Scanning..." ? "Scanning..." : 
                 btConnectionStatus === "Connecting" ? "Connecting..." : 
                 "Connect Printer"}
              </span>
            </button>
          )}
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
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                              <Phone className="h-3 w-3 text-slate-400 shrink-0" /> 
                              <span>{order.customerPhone}</span>
                            </div>
                            {order.deliveryAddress && (
                              <div className="flex items-start gap-1 text-[11px] text-gray-500 font-medium">
                                <MapPin className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" /> 
                                <span className="line-clamp-2 leading-tight">{formatAddress(order.deliveryAddress)}</span>
                              </div>
                            )}
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
                            <button 
                              onClick={() => handlePrintRequest(order)}
                              title="Print Receipt"
                              className="p-1.5 rounded-lg text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors mr-1"
                            >
                              <Printer className="h-4 w-4" />
                            </button>

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

      {/* 📱 BLUETOOTH DEVICE SELECTOR MODAL */}
      {showDeviceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Bluetooth className="h-5 w-5 text-blue-500" />
                Select Printer
              </h3>
              <button onClick={() => setShowDeviceModal(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-2 overflow-y-auto flex-1">
              {pairedDevices.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <p>No paired devices found.</p>
                  <p className="text-xs mt-2">Go to Android Settings &gt; Bluetooth to pair your printer first.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {pairedDevices.map((device, index) => (
                    <button
                      key={index}
                      onClick={() => connectToSelectedPrinter(device.address || device.id)}
                      className="w-full text-left p-3 rounded-xl hover:bg-blue-50 flex flex-col transition-colors border border-transparent hover:border-blue-100"
                    >
                      <span className="font-bold text-slate-800">{device.name || "Unknown Device"}</span>
                      <span className="text-xs text-slate-500 font-mono">{device.address || device.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-slate-50 flex justify-between items-center text-xs text-slate-500">
              <span>Ensure printer is turned on</span>
              <button onClick={scanForPrinters} className="font-semibold text-blue-600 hover:text-blue-800">Refresh List</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;