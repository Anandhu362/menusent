import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ NEW: Imported useNavigate
import { 
  Search, 
  Plus, 
  ChevronDown, 
  Filter, 
  Users, 
  Clock, 
  ConciergeBell,
  Edit3,
  Trash2,
  MoreVertical,
  LayoutGrid,
  Loader2
} from "lucide-react";
import { AdminSidebar } from "../components/AdminSidebar";
import { useAuth } from "../context/AuthContext";
import { useTables } from "../hooks/useTables";
import { initializeTables } from "../api/table.api";

// Helper: Calculate time elapsed since status change
const getTimeElapsed = (dateString, status) => {
  if (!dateString || status === 'Available') return "-";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m`;
};

export const TableManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // ✅ NEW: Initialized navigate
  
  // Resolve the correct restaurant ID depending on your auth payload structure
  const restaurantId = user?.restaurantId || user?._id; 
  
  // Poll backend every 5 seconds for live status updates
  const { tables, isLoading, refreshTables } = useTables(restaurantId, 5000);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [initCount, setInitCount] = useState(15);
  const [isInitializing, setIsInitializing] = useState(false);

  // Handlers
  const handleInitSubmit = async () => {
    try {
      setIsInitializing(true);
      await initializeTables(restaurantId, parseInt(initCount, 10));
      await refreshTables();
    } catch (error) {
      console.error("Initialization failed:", error);
      alert("Failed to initialize tables. Please try again.");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to remove this table? (This API needs to be linked)")) {
      console.log("Delete table:", id);
      // TODO: Connect to deleteTable API when created
    }
  };

  // Map backend MongoDB data to the UI format
  const mappedTables = tables.map(t => ({
    id: t._id,
    number: t.number,
    status: t.status,
    capacity: t.capacity,
    orders: t.activeOrderId ? 1 : 0, 
    time: getTimeElapsed(t.statusUpdatedAt, t.status)
  }));

  const filteredTables = mappedTables.filter(table => 
    `table ${table.number}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sleek Fintech Theme Mapping
  const getStatusTheme = (status) => {
    switch (status) {
      case "Occupied": return { text: "text-[#ff6b35]", bg: "bg-[#ff6b35]/10", accent: "bg-[#ff6b35]", shadow: "shadow-[#ff6b35]/20" };
      case "Available": return { text: "text-emerald-500", bg: "bg-emerald-50", accent: "bg-emerald-500", shadow: "shadow-emerald-500/20" };
      case "Reserved": return { text: "text-blue-500", bg: "bg-blue-50", accent: "bg-blue-500", shadow: "shadow-blue-500/20" };
      case "Cleaning": return { text: "text-slate-500", bg: "bg-slate-100", accent: "bg-slate-400", shadow: "shadow-slate-400/20" };
      default: return { text: "text-slate-500", bg: "bg-slate-50", accent: "bg-slate-400", shadow: "shadow-slate-400/20" };
    }
  };

  // Metrics calculation
  const totalTables = tables.length;
  const occupiedCount = tables.filter(t => t.status === "Occupied").length;
  const availableCount = tables.filter(t => t.status === "Available").length;

  return (
    <div className="flex h-screen bg-[#f4f6f9] font-sans overflow-hidden selection:bg-[#ff6b35]/20 relative">
      
      {/* Custom Transparent Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(148, 163, 184, 0.3); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(148, 163, 184, 0.5); }
      `}</style>

      {/* SIDEBAR */}
      <AdminSidebar />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-y-auto custom-scrollbar relative z-10 focus:outline-none">
        
        {/* Sleek Frosted Header */}
        <header className="h-[88px] bg-white/80 backdrop-blur-md border-b border-slate-100/80 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-[16px] shadow-[0_4px_12px_rgba(15,23,42,0.15)]">
              <LayoutGrid className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-[24px] font-black tracking-tight text-slate-900">Table Management</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={2.5} />
               <input 
                 type="text" 
                 placeholder="Search tables..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-11 pr-5 py-3 bg-white border border-slate-100 rounded-full text-[14px] font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#ff6b35]/10 focus:border-[#ff6b35]/30 w-72 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.02)]" 
               />
            </div>
            
            <button className="flex items-center gap-2 bg-white border border-slate-100 text-slate-600 px-5 py-3 rounded-full text-[14px] font-bold hover:bg-slate-50 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <Filter className="h-4 w-4" strokeWidth={2.5} />
              <span>Filter</span>
            </button>

            <button className="flex items-center gap-2 bg-[#ff6b35] hover:bg-[#e05a2b] text-white px-6 py-3 rounded-full text-[14px] font-black transition-all shadow-[0_8px_20px_rgba(255,107,53,0.25)] hover:shadow-[0_10px_25px_rgba(255,107,53,0.35)] hover:-translate-y-0.5 active:scale-95">
              <Plus className="h-5 w-5" strokeWidth={3} />
              <span>Add New Table</span>
            </button>

            <div className="flex items-center gap-3 pl-5 ml-2 border-l border-slate-200/60 cursor-pointer group">
               <img src={user?.logo || "https://i.pravatar.cc/150?img=12"} alt="Admin" className="h-11 w-11 rounded-full object-cover shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:ring-4 ring-[#ff6b35]/20 transition-all" />
               <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-800 transition-colors" strokeWidth={3} />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 max-w-[1600px] mx-auto pb-12">
          
          {isLoading && tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-[#ff6b35]" />
              <p className="font-bold tracking-wide">Syncing floor plan...</p>
            </div>
          ) : (
            <>
              {/* Top Metrics Row - Fintech Style */}
              <div className="flex items-center gap-5 mb-8">
                <div className="bg-white px-6 py-5 rounded-[28px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-5 min-w-[220px]">
                  <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-900 shadow-inner">
                    <Users className="h-6 w-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Tables</p>
                    <p className="text-[28px] font-black text-slate-900 leading-none mt-1 tracking-tight">{totalTables}</p>
                  </div>
                </div>
                
                <div className="bg-white px-6 py-5 rounded-[28px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-5 min-w-[220px]">
                  <div className="h-12 w-12 bg-[#ff6b35]/10 rounded-full flex items-center justify-center text-[#ff6b35]">
                    <ConciergeBell className="h-6 w-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Occupied</p>
                    <p className="text-[28px] font-black text-slate-900 leading-none mt-1 tracking-tight">{occupiedCount}</p>
                  </div>
                </div>
                
                <div className="bg-white px-6 py-5 rounded-[28px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-5 min-w-[220px]">
                  <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                    <div className="h-4 w-4 bg-emerald-500 rounded-full shadow-[0_2px_8px_rgba(16,185,129,0.4)]"></div>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Available</p>
                    <p className="text-[28px] font-black text-slate-900 leading-none mt-1 tracking-tight">{availableCount}</p>
                  </div>
                </div>
              </div>

              {/* TABLES GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredTables.map((table) => {
                  const theme = getStatusTheme(table.status);
                  
                  return (
                    <div 
                      key={table.id} 
                      onClick={() => navigate(`/restaurant/tables/${table.id}/order`)} // ✅ NEW: Navigation added
                      className="cursor-pointer bg-white rounded-[32px] p-6 border border-slate-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[220px] relative overflow-hidden group" // ✅ NEW: cursor-pointer added
                    >
                      {/* Premium Accent Top Border */}
                      <div className={`absolute top-0 left-0 w-full h-1.5 ${theme.accent} opacity-80`} />

                      {/* Header: Table Number & Menu */}
                      <div className="flex items-start justify-between mb-5 mt-1">
                        <div className="flex flex-col gap-2">
                          <h3 className="text-[32px] font-black text-slate-900 tracking-tighter leading-none">
                            T{table.number}
                          </h3>
                          {/* Sleek Pill Badge */}
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit ${theme.bg} ${theme.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${theme.accent} shadow-sm ${theme.shadow}`}></span>
                            {table.status}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => e.stopPropagation()} // ✅ NEW: Prevent row click
                          className="text-slate-300 hover:text-slate-800 bg-white hover:bg-slate-50 p-2 rounded-full transition-colors h-10 w-10 flex items-center justify-center -mr-2"
                        >
                          <MoreVertical className="h-5 w-5" strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Details: Capacity & Time */}
                      <div className="flex flex-col gap-2.5 mb-6 mt-2">
                        <div className="flex items-center gap-3 text-[14px] font-bold text-slate-500">
                          <div className="p-1.5 bg-slate-50 rounded-xl"><Users className="h-4 w-4" /></div>
                          <span>{table.capacity} Seats</span>
                        </div>
                        {table.time !== "-" && (
                          <div className="flex items-center gap-3 text-[14px] font-bold text-slate-500">
                            <div className="p-1.5 bg-slate-50 rounded-xl"><Clock className="h-4 w-4" /></div>
                            <span>{table.time}</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom: Orders & Actions */}
                      <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Active Orders</span>
                          <div className="flex items-center gap-1.5 text-slate-900">
                            <ConciergeBell className={`h-4 w-4 ${table.orders > 0 ? theme.text : 'text-slate-300'}`} strokeWidth={2.5} />
                            <span className="text-[20px] font-black leading-none">{table.orders}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => e.stopPropagation()} // ✅ NEW: Prevent row click
                            className="h-10 w-10 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-full flex items-center justify-center transition-colors active:scale-95"
                          >
                            <Edit3 className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); // ✅ NEW: Prevent row click
                              handleDelete(table.id);
                            }}
                            className="h-10 w-10 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full flex items-center justify-center transition-colors active:scale-95"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* NEW: FINTECH INITIALIZATION MODAL */}
      {!isLoading && tables.length === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white rounded-[36px] p-8 w-full max-w-md shadow-[0_24px_80px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-300 border border-white/50">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="h-20 w-20 bg-[#ff6b35]/10 text-[#ff6b35] rounded-[24px] flex items-center justify-center mb-6 shadow-inner">
                <LayoutGrid className="h-10 w-10" strokeWidth={2} />
              </div>
              <h2 className="text-[28px] font-black tracking-tight text-slate-900 leading-tight">Configure Your<br/>Floor Plan</h2>
              <p className="text-[15px] font-medium text-slate-500 mt-3 leading-snug">
                How many tables does your restaurant have? We'll instantly generate a secure, sync-ready floor plan.
              </p>
            </div>
            
            <div className="mb-8">
              <label className="block text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2.5 ml-2">Number of Tables</label>
              <input 
                type="number" 
                min="1"
                max="200"
                value={initCount}
                onChange={(e) => setInitCount(e.target.value)}
                className="w-full bg-[#f4f6f9] border-2 border-slate-100 rounded-[24px] py-4 px-6 text-[22px] font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#ff6b35]/10 focus:border-[#ff6b35]/40 transition-all text-center shadow-inner"
              />
            </div>

            <button 
              onClick={handleInitSubmit}
              disabled={isInitializing || initCount < 1}
              className="w-full bg-[#ff6b35] disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none text-white font-black text-[18px] tracking-wide py-5 rounded-[24px] shadow-[0_12px_28px_rgba(255,107,53,0.3)] flex items-center justify-center gap-3 transition-all hover:shadow-[0_16px_32px_rgba(255,107,53,0.4)] hover:-translate-y-0.5 active:scale-95"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Tables"
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default TableManagement;