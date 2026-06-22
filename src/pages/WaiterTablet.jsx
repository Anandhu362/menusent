import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, UtensilsCrossed, Send, Plus, Minus, Trash2, MapPin, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRestaurantMenu } from "../hooks/useRestaurantMenu";
import { useTables } from "../hooks/useTables"; // ✅ NEW: Imported the custom polling hook
import apiClient from "../api/apiClient";
import POSMenuItemCard from "../components/POSMenuItemCard";

const WaiterTablet = () => {
  const { slug } = useParams();
  const navigate = useNavigate(); 
  
  const [restaurantId, setRestaurantId] = useState(null);
  const [activeTable, setActiveTable] = useState(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [ticketCart, setTicketCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Custom Toast State for Concurrency Errors & Success
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  
  useEffect(() => {
    const init = async () => {
      try {
        const res = await apiClient.get(`/api/restaurants/${slug}`);
        setRestaurantId(res.data._id);
      } catch (error) {
        console.error("Failed to load restaurant", error);
      }
    };
    init();
  }, [slug]);

  const { categories, menuItems, activeCategory, setActiveCategory, isLoading: isMenuLoading } = useRestaurantMenu(restaurantId);
  
  // ✅ NEW: Replace mock tables with the polling hook
  const { tables, refreshTables, isLoading: isTablesLoading } = useTables(restaurantId, 5000);

  const handleAddToTicket = (item) => {
    setTicketCart((prev) => {
      const existing = prev.find((cartItem) => cartItem._id === item._id);
      if (existing) {
        return prev.map((cartItem) =>
          cartItem._id === item._id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1, notes: "" }];
    });
  };

  const updateQuantity = (id, delta) => {
    setTicketCart((prev) => 
      prev.map(item => {
        if (item._id === id) {
          const newQ = item.quantity + delta;
          return newQ > 0 ? { ...item, quantity: newQ } : item;
        }
        return item;
      })
    );
  };

  const removeItem = (id) => {
    setTicketCart((prev) => prev.filter(item => item._id !== id));
  };

  // ✅ NEW: Production-Ready Dispatch with OCC (Optimistic Concurrency Control)
  const handleSendToKitchen = async () => {
    if (ticketCart.length === 0) return;
    if (!activeTable) {
      setIsTableModalOpen(true); 
      return;
    }
    
    const payload = {
      restaurantId,
      tableId: activeTable._id, // Use MongoDB _id
      items: ticketCart,
      status: 'pending_kitchen',
      total: ticketCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    try {
      // Assuming your backend route is set up as POST /api/orders/dispatch
      await apiClient.post('/api/orders/dispatch', payload);
      
      showToast(`Order sent for ${activeTable.name}!`, 'success');
      setTicketCart([]);
      setActiveTable(null);
      refreshTables(); // Instantly refresh table UI
      
    } catch (error) {
      // 🛡️ CATCH 409 CONFLICT: Another waiter took the table
      if (error.response && error.response.status === 409) {
        showToast("Table is no longer available. Please select another table.", "error");
        setActiveTable(null);
        refreshTables(); // Get the latest occupied states
        setIsTableModalOpen(true); // Force them to pick a new table
      } else {
        console.error("Failed to send order.", error);
        showToast(error.response?.data?.message || "Failed to send order to kitchen.", "error");
      }
    }
  };

  const filteredItems = menuItems?.filter(item => {
    const isItemActive = item.isActive !== false;
    const matchesCategory = !activeCategory || (item.categoryId?._id || item.categoryId) === activeCategory._id;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return isItemActive && matchesCategory && matchesSearch;
  });

  if (isMenuLoading) return <div className="flex h-screen items-center justify-center bg-[#f4f6f9]"><div className="animate-pulse font-bold text-slate-400 text-lg tracking-tight">Loading POS...</div></div>;

  return (
    <div className="flex h-screen w-full bg-[#f4f6f9] overflow-hidden font-sans text-slate-900 relative selection:bg-[#ff6b35]/20">
      
      {/* Premium Toast Notification */}
      {toast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-5 duration-300">
          <div className={`px-6 py-4 rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] border flex items-center gap-3 backdrop-blur-md ${toast.type === 'error' ? 'bg-red-50/95 border-red-100 text-red-600' : 'bg-emerald-50/95 border-emerald-100 text-emerald-600'}`}>
            {toast.type === 'error' ? <AlertCircle className="h-5 w-5" strokeWidth={2.5} /> : <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />}
            <span className="font-extrabold text-[15px] tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Custom Transparent Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(148, 163, 184, 0.3); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(148, 163, 184, 0.5); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, 0.3) transparent; }
      `}</style>

      {/* LEFT COLUMN: Main Menu Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden z-0">
        
        <header className="flex items-center justify-between p-6 bg-[#f4f6f9]">
          <div className="flex items-center">
            <h1 className="text-[22px] font-black tracking-tight text-slate-900">MenuSent POS</h1>
          </div>
          
          <div className="relative w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" strokeWidth={2.5} />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-full py-4 pl-14 pr-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100/80 outline-none focus:ring-4 focus:ring-[#ff6b35]/10 focus:border-[#ff6b35]/30 text-[15px] font-bold text-slate-700 placeholder-slate-400 transition-all duration-300"
            />
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden px-6 pb-6">
          {/* Category Pills */}
          <div className="flex gap-3 overflow-x-auto pb-5 custom-scrollbar pt-1 flex-shrink-0">
            <button 
              onClick={() => setActiveCategory(null)}
              className={`px-7 py-3.5 rounded-full font-extrabold text-[14px] whitespace-nowrap transition-all duration-300 ${activeCategory === null ? 'bg-slate-900 text-white shadow-[0_8px_20px_rgba(15,23,42,0.2)] transform -translate-y-0.5' : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100/80'}`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button 
                key={cat._id}
                onClick={() => setActiveCategory(cat)}
                className={`px-7 py-3.5 rounded-full font-extrabold text-[14px] whitespace-nowrap transition-all duration-300 ${activeCategory?._id === cat._id ? 'bg-slate-900 text-white shadow-[0_8px_20px_rgba(15,23,42,0.2)] transform -translate-y-0.5' : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100/80'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 pr-2">
            <div className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {filteredItems?.map(item => (
                <POSMenuItemCard key={item._id} item={item} onAdd={handleAddToTicket} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: The Ticket */}
      <div className="w-[400px] bg-white flex flex-col h-full shadow-[-20px_0_50px_-20px_rgba(0,0,0,0.05)] z-10 border-l border-slate-100/80 relative">
        
        {/* Ticket Header & Table Selector */}
        <div className="p-6 border-b border-slate-100/80 bg-white">
          <h2 className="text-[22px] font-black tracking-tight mb-4 text-slate-900">Current Ticket</h2>
          
          <button 
            onClick={() => setIsTableModalOpen(true)}
            className={`w-full flex items-center justify-between p-4 rounded-[20px] border-[1.5px] transition-all duration-300 group ${
              activeTable 
                ? 'bg-[#ff6b35]/[0.06] border-[#ff6b35]/20 text-[#ff6b35]' 
                : 'bg-white border-dashed border-slate-200 text-slate-400 hover:border-[#ff6b35]/50 hover:bg-[#ff6b35]/5 hover:text-[#ff6b35]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${activeTable ? 'bg-white shadow-sm' : 'bg-slate-50 group-hover:bg-white group-hover:shadow-sm transition-all'}`}>
                <MapPin className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-[16px] tracking-tight">
                {activeTable ? activeTable.name : "Assign Table"}
              </span>
            </div>
            {activeTable && (
              <span className="text-[11px] font-black uppercase tracking-widest bg-white text-[#ff6b35] px-3 py-1.5 rounded-full shadow-[0_2px_8px_rgba(255,107,53,0.12)]">
                Change
              </span>
            )}
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar bg-[#f8fafc] inset-shadow-sm">
          {ticketCart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mb-5 shadow-inner">
                <UtensilsCrossed className="h-10 w-10 opacity-40 text-slate-400" strokeWidth={2} />
              </div>
              <p className="font-bold text-[16px] text-slate-400 tracking-tight">Start adding items</p>
            </div>
          ) : (
            ticketCart.map((item) => (
              <div key={item._id} className="flex flex-col bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.02)] border border-slate-100/60 transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                
                {/* Image and Text Details */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-14 w-14 rounded-[14px] bg-slate-50 overflow-hidden flex-shrink-0 shadow-inner border border-slate-100/50">
                    <img 
                      src={item.image?.gcsPath || '/fallback.png'} 
                      alt={item.name} 
                      className="h-full w-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=150&h=150"; }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="font-bold text-[15px] text-slate-800 leading-snug line-clamp-2 mb-1">{item.name}</span>
                    <span className="font-black text-[15px] text-[#ff6b35] tracking-tight">{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Quantity Controls & Trash */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                  <div className="flex items-center bg-slate-50 rounded-full p-1 border border-slate-100/80 shadow-inner">
                    <button onClick={() => updateQuantity(item._id, -1)} className="p-2 text-slate-500 hover:text-slate-900 bg-white rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.04)] active:scale-95 transition-all">
                      <Minus className="h-4 w-4" strokeWidth={3} />
                    </button>
                    <span className="w-10 text-center font-black text-[15px] text-slate-800">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, 1)} className="p-2 text-slate-500 hover:text-slate-900 bg-white rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.04)] active:scale-95 transition-all">
                      <Plus className="h-4 w-4" strokeWidth={3} />
                    </button>
                  </div>
                  
                  <button onClick={() => removeItem(item._id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 active:scale-95">
                    <Trash2 className="h-5 w-5" strokeWidth={2.5} />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-slate-100/80 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.03)] relative z-20">
          <div className="flex justify-between items-end mb-6 px-1">
            <span className="text-[15px] font-extrabold text-slate-400 tracking-tight mb-1">Total Amount</span>
            <span className="text-[32px] font-black text-slate-900 tracking-tighter leading-none">
              <span className="text-[18px] mr-1 text-slate-400">AED</span>
              {ticketCart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
            </span>
          </div>
          <button 
            onClick={handleSendToKitchen}
            disabled={ticketCart.length === 0}
            className="w-full bg-[#ff6b35] disabled:bg-slate-100 disabled:text-slate-400 text-white font-black text-[16px] tracking-wide py-4.5 rounded-[24px] shadow-[0_12px_28px_rgba(255,107,53,0.3)] disabled:shadow-none flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_16px_32px_rgba(255,107,53,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            style={{ padding: '18px 0' }}
          >
            <Send className="h-5 w-5" strokeWidth={2.5} /> 
            {ticketCart.length > 0 && !activeTable ? "Select Table to Send" : "Send to Kitchen"}
          </button>
        </div>
      </div>

      {/* Table Selection Overlay Modal */}
      {isTableModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-md p-6 transition-all duration-300">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-3xl shadow-[0_24px_80px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200 border border-white/50">
            <div className="flex justify-between items-center mb-8 px-2">
              <h2 className="text-[26px] font-black tracking-tight text-slate-900">Select a Table</h2>
              <button 
                onClick={() => setIsTableModalOpen(false)} 
                className="text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full h-11 w-11 flex items-center justify-center transition-all duration-200"
              >
                <X className="h-5 w-5" strokeWidth={3} />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-5 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 pb-2">
              {isTablesLoading && tables.length === 0 ? (
                <div className="col-span-4 text-center py-10 text-slate-400 font-bold">Syncing tables...</div>
              ) : (
                tables.map(table => {
                  // Use MongoDB _id for active comparison
                  const isActive = activeTable?._id === table._id;
                  const isOccupied = table.status !== 'Available';
                  
                  return (
                    <button 
                      key={table._id} // MongoDB _id
                      onClick={() => {
                        if (!isOccupied) {
                          setActiveTable(table);
                          setIsTableModalOpen(false);
                        }
                      }}
                      disabled={isOccupied}
                      className={`h-36 rounded-[28px] flex flex-col items-center justify-center border-[2px] transition-all duration-300 relative overflow-hidden ${
                        isActive 
                          ? 'bg-gradient-to-br from-[#ff6b35] to-[#f55116] border-transparent text-white shadow-[0_12px_30px_rgba(255,107,53,0.35)] transform scale-[1.02]' 
                          : isOccupied 
                            ? 'bg-slate-50/50 border-slate-100 text-slate-400 cursor-not-allowed opacity-80' 
                            : 'bg-white border-slate-100 text-slate-800 hover:border-[#ff6b35]/40 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] hover:-translate-y-1'
                      }`}
                    >
                      <span className="text-[26px] font-black tracking-tight z-10">{table.name}</span>
                      <span className={`text-[11px] font-extrabold uppercase tracking-widest mt-2.5 z-10 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                        {table.status}
                      </span>
                      
                      {/* Subtle glow effect for active state */}
                      {isActive && (
                        <div className="absolute inset-0 bg-white opacity-10 bg-blend-overlay"></div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WaiterTablet;