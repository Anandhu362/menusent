import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import { 
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Package,
  ChevronDown,
  ShoppingBag,
  Loader2
} from "lucide-react";

import { AdminSidebar } from "../components/AdminSidebar";
import { SalesSummary } from "../components/SalesSummary";
import { OrderToast } from "../components/OrderToast";
import { SalesChartWidget } from "../components/SalesChartWidget"; // ✅ IMPORTED NEW WIDGET
import { fetchDashboardStats } from "../api/order.api";
import { useAuth } from "../context/AuthContext";

// Import apiClient to handle the toggle request and fetch profile status
import apiClient from "../api/apiClient";

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onChildAdded, query, limitToLast } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const timeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / 60000);
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffInHours / 24)} day${Math.floor(diffInHours / 24) > 1 ? 's' : ''} ago`;
};

const MetricCard = ({ title, value, icon: Icon, trend = 0 }) => {
  const safeTrend = Number(trend) || 0;
  const isPositive = safeTrend > 0;
  const isNegative = safeTrend < 0;
  const trendColor = isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-gray-400";
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const formattedTrend = isPositive ? `+${safeTrend.toFixed(1)}%` : `${safeTrend.toFixed(1)}%`;

  return (
    // Reduced padding and added gap to prevent overlap on tablets
    <div className="bg-white p-4 lg:p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between gap-3 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <h3 className="text-xs lg:text-sm font-medium text-gray-500 mb-1 truncate">{title}</h3>
        <div className="text-xl lg:text-2xl font-bold text-slate-900 truncate">{value}</div>
        {/* Added whitespace-nowrap to prevent the text from breaking into 2 lines */}
        <div className={`flex items-center gap-1 mt-1 lg:mt-2 text-[10px] lg:text-sm font-medium opacity-90 ${trendColor} whitespace-nowrap`}>
          <TrendIcon className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
          <span>{safeTrend === 0 ? "Same as yesterday" : `${formattedTrend} vs yesterday`}</span> 
        </div>
      </div>
      <div className="h-10 w-10 lg:h-12 lg:w-12 flex-shrink-0 bg-orange-50 rounded-full flex items-center justify-center text-[#ff6b35]">
        <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-gray-100 text-gray-800",
    Accepted: "bg-blue-100 text-blue-800",
    Preparing: "bg-yellow-100 text-yellow-800",
    "Out for Delivery": "bg-purple-100 text-purple-800",
    Delivered: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-1 rounded text-[9px] lg:text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${styles[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
};

const RestaurantDashboard = () => {
  const navigate = useNavigate(); 
  const [metrics, setMetrics] = useState({ 
    totalSales: 0, 
    totalOrders: 0, 
    avgOrderValue: 0,
    salesTrend: 0,
    ordersTrend: 0,
    avgValueTrend: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [currency, setCurrency] = useState('AED');
  const [isLoading, setIsLoading] = useState(true);
  const [newOrderToast, setNewOrderToast] = useState(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const processedOrders = useRef(new Set());
  const { user } = useAuth();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const targetId = user?.restaurantId || user?._id;
        if (!targetId) return;
        
        // Fetch dashboard stats
        const data = await fetchDashboardStats(targetId);
        if (data && data.metrics) {
          setMetrics({
            totalSales: data.metrics.totalSales || 0,
            totalOrders: data.metrics.totalOrders || 0,
            avgOrderValue: data.metrics.avgOrderValue || 0,
            salesTrend: data.metrics.salesTrend || 0,
            ordersTrend: data.metrics.ordersTrend || 0,
            avgValueTrend: data.metrics.avgValueTrend || 0
          });
          setCurrency(data.metrics.currency || 'AED');
          setTopItems(data.topItems || []);
          setRecentOrders(data.recentOrders || []);
          data.recentOrders?.forEach(order => processedOrders.current.add(order.orderId));
        }

        // Fetch current profile to get the live 'isActive' status
        try {
          const profileRes = await apiClient.get('/api/restaurants/owner/profile');
          if (profileRes.data && profileRes.data.isActive !== undefined) {
            setIsAcceptingOrders(profileRes.data.isActive);
          }
        } catch (profileErr) {
          console.error("Failed to load restaurant status", profileErr);
        }

      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setIsLoading(false);
        setIsApiLoaded(true);
      }
    };
    if (user) loadDashboardData();
  }, [user]);

  // Firebase Live Orders
  useEffect(() => {
    if (!user || !isApiLoaded) return;
    const targetId = user?.restaurantId || user?._id;
    const ordersRef = ref(db, `live-orders/${targetId}`);
    const newOrdersQuery = query(ordersRef, limitToLast(1));

    const unsubscribe = onChildAdded(newOrdersQuery, (snapshot) => {
      const newOrder = snapshot.val();
      if (!newOrder || processedOrders.current.has(newOrder.orderId)) return;
      
      // ✅ FIX: Check if the order is actually new (e.g., placed within the last 3 minutes)
      const orderTimestamp = newOrder.timestamp || new Date(newOrder.createdAt).getTime();
      const isActuallyNew = (Date.now() - orderTimestamp) < (3 * 60 * 1000); // 3 minutes in milliseconds

      if (isActuallyNew) {
        // It's a real new order, trigger UI and sound
        processedOrders.current.add(newOrder.orderId);
        new Audio('/notification.mp3').play().catch(() => {});
        setNewOrderToast({ orderId: newOrder.orderId, time: 'Just now' });

        setMetrics((prev) => {
          const nOrders = (prev.totalOrders || 0) + 1;
          const nSales = (prev.totalSales || 0) + (newOrder.totalAmount || 0);
          return { ...prev, totalSales: nSales, totalOrders: nOrders, avgOrderValue: nSales / nOrders };
        });

        setRecentOrders((prev) => [newOrder, ...prev].slice(0, 5));
      } else {
        // It's an old order loaded on mount. Silently mark as processed so it doesn't trigger again.
        processedOrders.current.add(newOrder.orderId);
      }
    });
    
    return () => unsubscribe();
  }, [user, isApiLoaded]);

  // Handle flipping the switch
  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      const newStatus = !isAcceptingOrders;
      await apiClient.patch('/api/restaurants/owner/toggle-status', {
        isAcceptingOrders: newStatus
      });
      setIsAcceptingOrders(newStatus);
    } catch (error) {
      console.error("Failed to toggle status", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8f9fb] font-sans relative">
      <AdminSidebar />
      <main className="flex-1 h-full overflow-y-auto pl-0">
        
        {/* Responsive Header Paddings */}
        <header className="h-20 bg-white border-b border-gray-100 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center min-w-0">
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 truncate">Dashboard Overview</h2>
          </div>

          <div className="hidden md:flex items-center gap-2 lg:gap-3 bg-slate-50 px-3 lg:px-4 py-1.5 rounded-full border border-gray-200 shadow-inner flex-shrink-0">
            <span className={`text-[10px] lg:text-[11px] font-black uppercase tracking-wider whitespace-nowrap ${isAcceptingOrders ? 'text-green-600' : 'text-slate-400'}`}>
              {isAcceptingOrders ? 'Accepting Orders' : 'Paused (Busy)'}
            </span>
            <button 
              onClick={handleToggleStatus}
              disabled={isToggling}
              className={`relative inline-flex h-5 w-9 lg:h-6 lg:w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:ring-offset-2 ${
                isAcceptingOrders ? 'bg-green-500' : 'bg-slate-300'
              } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span 
                className={`inline-block h-3.5 w-3.5 lg:h-4 lg:w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                  isAcceptingOrders ? 'translate-x-5 lg:translate-x-6' : 'translate-x-1'
                }`} 
              />
            </button>
          </div>
        </header>

        <div className="md:hidden bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isAcceptingOrders ? 'text-green-600' : 'text-slate-400'}`}>
            {isAcceptingOrders ? 'Accepting Orders' : 'Paused (Busy)'}
          </span>
          <button 
            onClick={handleToggleStatus}
            disabled={isToggling}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
              isAcceptingOrders ? 'bg-green-500' : 'bg-slate-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${isAcceptingOrders ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Responsive Container Paddings & Grid Gaps */}
        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto pb-12">
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-[#ff6b35] animate-spin" /></div>
          ) : (
            <>
              <section className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-6 mb-6">
                <MetricCard 
                  title="Today's Total Sales" 
                  value={`${currency} ${(metrics.totalSales || 0).toFixed(2)}`} 
                  icon={DollarSign} 
                  trend={metrics.salesTrend} 
                />
                <MetricCard 
                  title="Total Orders" 
                  value={metrics.totalOrders || 0} 
                  icon={ShoppingBag} 
                  trend={metrics.ordersTrend} 
                />
                <MetricCard 
                  title="Avg. Order Value" 
                  value={`${currency} ${(metrics.avgOrderValue || 0).toFixed(2)}`} 
                  icon={Package} 
                  trend={metrics.avgValueTrend} 
                />
              </section>

              <div className="mb-6 h-[500px] flex flex-col w-full">
                <section className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full w-full">
                  <div className="px-5 lg:px-8 py-4 lg:py-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-base lg:text-lg font-bold text-slate-900">Recent Orders</h3>
                    <button 
                      onClick={() => navigate('/restaurant/orders')}
                      className="text-xs lg:text-sm font-medium text-[#ff6b35] hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="overflow-x-auto flex-1 hide-scrollbar">
                    {/* Replaced min-w-[700px] with min-w-[500px] for better tablet fit */}
                    <table className="w-full text-left min-w-[500px]">
                      <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                        <tr className="text-[9px] lg:text-[10px] uppercase tracking-widest font-bold text-gray-400 border-b border-gray-100">
                          {/* Adjusted horizontal padding for tighter columns */}
                          <th className="px-4 lg:px-8 py-3">Order ID</th>
                          <th className="px-3 lg:px-6 py-3">Items Summary</th>
                          <th className="px-3 lg:px-6 py-3">Amount</th>
                          <th className="px-3 lg:px-6 py-3">Status</th>
                          <th className="px-4 lg:px-6 py-3 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {recentOrders.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-8 text-gray-500 text-sm">No recent orders found.</td></tr>
                        ) : (
                          recentOrders.map((order) => (
                            <tr key={order._id || order.orderId} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-4 lg:px-8 py-3 font-bold text-[#ff6b35] text-[10px] lg:text-xs">{order.orderId}</td>
                              <td className="px-3 lg:px-6 py-3">
                                <div className="flex flex-col gap-1 max-w-[120px] lg:max-w-[200px]">
                                  {order.items?.slice(0, 2).map((item, index) => (
                                    <div key={index} className="flex items-center gap-1.5 lg:gap-2">
                                      <div className="h-4 w-4 lg:h-5 lg:w-5 rounded bg-gray-50 flex flex-shrink-0 items-center justify-center text-gray-400 text-[9px] lg:text-[10px] font-bold border border-gray-100 uppercase">
                                        {item.name?.charAt(0) || '-'}
                                      </div>
                                      {/* Truncate prevents long item names from expanding the column */}
                                      <p className="text-[10px] lg:text-xs font-medium text-slate-600 leading-none truncate">{item.name}</p>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-3 lg:px-6 py-3 font-bold text-slate-800 text-[10px] lg:text-xs whitespace-nowrap">
                                {currency} {(order.totalAmount || 0).toFixed(2)}
                              </td>
                              <td className="px-3 lg:px-6 py-3">
                                <StatusBadge status={order.orderStatus || 'Pending'} />
                              </td>
                              <td className="px-4 lg:px-6 py-3 text-right text-[9px] lg:text-[11px] text-gray-400 font-medium whitespace-nowrap">
                                {timeAgo(order.createdAt)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <SalesSummary topItems={topItems} restaurantId={user?.restaurantId || user?._id} />
                
                {/* ✅ The new Premium Chart Widget replacing the empty box */}
                <div className="min-h-[300px]">
                  <SalesChartWidget restaurantId={user?.restaurantId || user?._id} currency={currency} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {newOrderToast && (
        <OrderToast 
          orderId={newOrderToast.orderId} 
          time={newOrderToast.time} 
          onClose={() => setNewOrderToast(null)} 
        />
      )}
    </div>
  );
};

export default RestaurantDashboard;