import React, { useState } from "react";
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
  MoreVertical
} from "lucide-react";
import { AdminSidebar } from "../components/AdminSidebar";

// --- MOCK DATA ---
const INITIAL_TABLES = [
  { id: "t1", number: 1, status: "Occupied", capacity: 4, orders: 3, time: "45m" },
  { id: "t2", number: 2, status: "Available", capacity: 2, orders: 0, time: "-" },
  { id: "t3", number: 3, status: "Reserved", capacity: 6, orders: 0, time: "in 30m" },
  { id: "t4", number: 4, status: "Occupied", capacity: 2, orders: 1, time: "12m" },
  { id: "t5", number: 5, status: "Available", capacity: 4, orders: 0, time: "-" },
  { id: "t6", number: 6, status: "Cleaning", capacity: 8, orders: 0, time: "5m" },
  { id: "t7", number: 7, status: "Occupied", capacity: 4, orders: 5, time: "1h 15m" },
  { id: "t8", number: 8, status: "Available", capacity: 2, orders: 0, time: "-" },
];

export const TableManagement = () => {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [searchQuery, setSearchQuery] = useState("");

  // Handlers
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to remove this table?")) {
      setTables(tables.filter(table => table.id !== id));
    }
  };

  const filteredTables = tables.filter(table => 
    `table ${table.number}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper for status styling
  const getStatusStyles = (status) => {
    switch (status) {
      case "Occupied": return "bg-orange-50/80 border-orange-200 text-[#ff6b35]";
      case "Available": return "bg-emerald-50/80 border-emerald-200 text-emerald-600";
      case "Reserved": return "bg-blue-50/80 border-blue-200 text-blue-600";
      case "Cleaning": return "bg-slate-100 border-slate-200 text-slate-500";
      default: return "bg-white border-gray-200 text-gray-500";
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case "Occupied": return "bg-[#ff6b35] shadow-[#ff6b35]/40";
      case "Available": return "bg-emerald-500 shadow-emerald-500/40";
      case "Reserved": return "bg-blue-500 shadow-blue-500/40";
      case "Cleaning": return "bg-slate-400 shadow-slate-400/40";
      default: return "bg-gray-300";
    }
  };

  // Metrics calculation
  const totalTables = tables.length;
  const occupiedCount = tables.filter(t => t.status === "Occupied").length;
  const availableCount = tables.filter(t => t.status === "Available").length;

  return (
    <div className="flex h-screen bg-[#f8f9fb] font-sans">
      
      {/* SIDEBAR INJECTED HERE */}
      <AdminSidebar />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-y-auto relative z-10 focus:outline-none pl-0">
        
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Table Management</h2>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search tables..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 w-64 transition-all" 
               />
            </div>
            
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-slate-600 px-4 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>

            <button 
              className="flex items-center gap-2 bg-[#ff6b35] hover:bg-[#ff5a1f] text-white px-5 py-2.5 rounded-full text-sm font-bold transition-colors shadow-md active:scale-95"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Table</span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-100 cursor-pointer group ml-2">
               <img src="https://i.pravatar.cc/150?img=12" alt="Admin" className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-[#ff6b35]/30 transition-colors" />
               <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto pb-12">
          
          {/* Top Metrics Row */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-slate-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Tables</p>
                  <p className="text-xl font-extrabold text-slate-900 leading-none mt-1">{totalTables}</p>
                </div>
              </div>
              <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 bg-orange-50 rounded-full flex items-center justify-center text-[#ff6b35]">
                  <ConciergeBell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Occupied</p>
                  <p className="text-xl font-extrabold text-slate-900 leading-none mt-1">{occupiedCount}</p>
                </div>
              </div>
              <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                  <span className="h-3 w-3 bg-emerald-500 rounded-full"></span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available</p>
                  <p className="text-xl font-extrabold text-slate-900 leading-none mt-1">{availableCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* TABLES GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTables.map((table) => (
              <div 
                key={table.id} 
                className={`relative rounded-[24px] p-6 border-2 flex flex-col justify-between min-h-[200px] transition-all hover:shadow-md ${getStatusStyles(table.status)}`}
              >
                {/* Header: Table Number & Menu/Dot */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                      T{table.number}
                    </h3>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/60 shadow-sm backdrop-blur-sm`}>
                      {table.status}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-700 bg-white/50 p-1.5 rounded-full transition-colors">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>

                {/* Middle: Details (Capacity & Time) */}
                <div className="flex items-center gap-4 text-sm font-medium opacity-80 mb-6">
                  <div className="flex items-center gap-1.5 bg-white/50 px-3 py-1.5 rounded-lg">
                    <Users className="h-4 w-4" />
                    <span>{table.capacity} Seats</span>
                  </div>
                  {table.time !== "-" && (
                    <div className="flex items-center gap-1.5 bg-white/50 px-3 py-1.5 rounded-lg">
                      <Clock className="h-4 w-4" />
                      <span>{table.time}</span>
                    </div>
                  )}
                </div>

                {/* Bottom: Orders & Actions */}
                <div className="mt-auto pt-5 border-t border-black/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">Active Orders</span>
                    <div className="flex items-center gap-2 mt-1">
                      <ConciergeBell className="h-5 w-5" />
                      <span className="text-lg font-extrabold text-slate-900 leading-none">{table.orders}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="h-10 w-10 bg-white hover:bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center shadow-sm transition-colors border border-black/5">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(table.id)}
                      className="h-10 w-10 bg-white hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-xl flex items-center justify-center shadow-sm transition-colors border border-black/5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
};

export default TableManagement;