import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  DollarSign,
  Package,
  ChevronDown,
  Search,
  ShoppingBag,
  Loader2
} from "lucide-react";

// 1. IMPORT SIDEBAR AND WIDGET COMPONENTS
import { AdminSidebar } from "../components/AdminSidebar";
import { SalesSummary } from "../components/SalesSummary";

// 2. IMPORT API AND AUTH CONTEXT
import { fetchDashboardStats } from "../api/order.api";
import { useAuth } from "../context/AuthContext";

// 3. IMPORT FIREBASE FOR REAL-TIME UPDATES (Replaced Socket.io)
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onChildAdded, query, orderByChild, startAt } from "firebase/database";

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- HELPERS ---
const timeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / 60000);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffInHours / 24)} day${Math.floor(diffInHours / 24) > 1 ? 's' : ''} ago`;
};

// --- COMPONENTS ---
const MetricCard = ({ title, value, icon: Icon, trend }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="flex items-center gap-1 mt-2 text-sm text-green-600 font-medium opacity-50">
        <TrendingUp className="h-4 w-4" />
        <span>+0% from yesterday</span> 
      </div>
    </div>
    <div className="h-12 w-12 bg-orange-50 rounded-full flex items-center justify-center text-[#ff6b35]">
      <Icon className="h-6 w-6" />
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-gray-100 text-gray-800",
    Preparing: "bg-yellow-100 text-yellow-800",
    Completed: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase ${styles[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
};

// --- MAIN PAGE COMPONENT ---
const RestaurantDashboard = () => {
  // --- STATE MANAGEMENT ---
  const [metrics, setMetrics] = useState({ totalSales: 0, totalOrders: 0, avgOrderValue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [currency, setCurrency] = useState('AED');
  const [isLoading, setIsLoading] = useState(true);

  // Extract the user from AuthContext
  const { user } = useAuth();

  // --- 1. DATA FETCHING (Runs on load) ---
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const targetRestaurantId = user?.restaurantId || user?._id;
        
        if (!targetRestaurantId) {
          console.warn("No restaurant ID found in Auth Context.");
          setIsLoading(false);
          return;
        }

        const data = await fetchDashboardStats(targetRestaurantId);

        setMetrics(data.metrics);
        setCurrency(data.metrics.currency || 'AED');
        setTopItems(data.topItems);
        setRecentOrders(data.recentOrders);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // --- 2. REAL-TIME FIREBASE CONNECTION (Replaced Socket.io) ---
  useEffect(() => {
    if (!user) return;

    const targetRestaurantId = user?.restaurantId || user?._id;
    if (!targetRestaurantId) return;

    console.log("✅ Dashboard listening to Firebase...");

    // Create a reference to this specific restaurant's live-orders node
    const ordersRef = ref(db, `live-orders/${targetRestaurantId}`);
    
    // Listen for NEW orders that happen AFTER this exact moment
    const now = Date.now();
    const newOrdersQuery = query(ordersRef, orderByChild('timestamp'), startAt(now));

    // Firebase listener triggers when a new order is pushed
    const unsubscribe = onChildAdded(newOrdersQuery, (snapshot) => {
      const newOrder = snapshot.val();
      console.log("🔥 Real-time order received via Firebase (Dashboard):", newOrder);

      // Update Top Metrics
      setMetrics((prev) => {
        const newTotalOrders = prev.totalOrders + 1;
        const newTotalSales = prev.totalSales + (newOrder.totalAmount || 0);
        const newAvgValue = newTotalSales / newTotalOrders;

        return {
          totalSales: newTotalSales,
          totalOrders: newTotalOrders,
          avgOrderValue: newAvgValue,
          currency: prev.currency || currency 
        };
      });

      // Update Recent Orders Table (Keep top 5, prevent duplicates)
      setRecentOrders((prev) => {
        if (prev.some(o => o.orderId === newOrder.orderId || o._id === newOrder._id)) {
          return prev;
        }
        const updated = [newOrder, ...prev];
        return updated.slice(0, 5);
      });
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
      console.log("❌ Firebase listener detached from Dashboard");
    };
  }, [user]);

  return (
    <div className="flex h-screen bg-[#f8f9fb] font-sans">
      <AdminSidebar />
      <main className="flex-1 h-full overflow-y-auto relative z-10 focus:outline-none pl-0">
        
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pl-6 border-l border-gray-100 cursor-pointer group">
               <img src="https://i.pravatar.cc/150?img=12" alt="Admin" className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm" />
               <div className="hidden md:block text-sm">
                 <p className="font-bold text-slate-900 leading-none">Grill House Owner</p>
                 <p className="text-gray-400 mt-1 leading-none">Admin</p>
               </div>
               <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-[1600px] mx-auto pb-12">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 text-[#ff6b35] animate-spin" />
            </div>
          ) : (
            <>
              {/* ANALYTICS METRICS */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <MetricCard 
                  title="Today's Total Sales" 
                  value={`${currency} ${metrics.totalSales.toFixed(2)}`} 
                  icon={DollarSign} 
                />
                <MetricCard 
                  title="Total Orders" 
                  value={metrics.totalOrders} 
                  icon={ShoppingBag} 
                />
                <MetricCard 
                  title="Avg. Order Value" 
                  value={`${currency} ${metrics.avgOrderValue.toFixed(2)}`} 
                  icon={Package} 
                />
              </section>

              {/* FULL WIDTH RECENT ORDERS LAYOUT */}
              <div className="mb-6 h-[500px] flex flex-col w-full">
                <section className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full w-full">
                  <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <h3 className="text-lg font-bold text-slate-900">Recent Orders</h3>
                    <button className="text-sm font-medium text-[#ff6b35] hover:underline">View All</button>
                  </div>

                  <div className="overflow-auto flex-1 hide-scrollbar">
                    <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      
                      <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                        <tr className="text-[10px] uppercase tracking-widest font-bold text-gray-400 border-b border-gray-100">
                          <th className="px-8 py-3">Order ID</th>
                          <th className="px-6 py-3">Items Summary</th>
                          <th className="px-6 py-3">Amount</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3 text-right">Time</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-50">
                        {recentOrders.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center py-8 text-gray-500 text-sm">No recent orders found.</td>
                          </tr>
                        ) : (
                          recentOrders.map((order) => (
                            <tr key={order._id} className="hover:bg-gray-50/50 transition-colors group">
                              
                              <td className="px-8 py-3 font-bold text-[#ff6b35] whitespace-nowrap text-xs">
                                {order.orderId}
                              </td>
                              
                              <td className="px-6 py-3">
                                <div className="flex flex-col gap-1 min-w-[200px]">
                                  {order.items.slice(0, 2).map((item, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <div className="h-5 w-5 rounded bg-gray-50 flex items-center justify-center text-gray-400 text-[10px] font-bold border border-gray-100 uppercase group-hover:border-gray-200 transition-colors">
                                        {item.name.charAt(0)}
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-slate-600 leading-none">{item.name}</p>
                                      </div>
                                    </div>
                                  ))}
                                  {order.items.length > 2 && (
                                    <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest ml-7 mt-0.5">
                                      +{order.items.length - 2} more items
                                    </span>
                                  )}
                                </div>
                              </td>
                              
                              <td className="px-6 py-3 font-bold text-slate-800 whitespace-nowrap text-xs">
                                {currency} {order.totalAmount.toFixed(2)}
                              </td>
                              
                              <td className="px-6 py-3 whitespace-nowrap">
                                <StatusBadge status={order.orderStatus} />
                              </td>
                              
                              <td className="px-6 py-3 text-right text-[11px] text-gray-400 whitespace-nowrap font-medium">
                                {timeAgo(order.createdAt || new Date())}
                              </td>

                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* BOTTOM SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SalesSummary topItems={topItems} />
                <div className="bg-transparent border-2 border-dashed border-gray-200 rounded-[20px] flex items-center justify-center p-6 min-h-[250px] text-gray-400 font-medium">
                  + Add New Widget
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default RestaurantDashboard;
