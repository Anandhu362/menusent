import React from "react";
import { Clock, ConciergeBell } from "lucide-react";

export const TableStatus = ({ tables = [] }) => {
  // Helper to determine premium styling based on status
  const getStatusStyles = (status) => {
    switch (status) {
      case "Occupied":
        return "bg-orange-50/50 border-orange-100 text-[#ff6b35]";
      case "Available":
        return "bg-emerald-50/50 border-emerald-100 text-emerald-600";
      case "Reserved":
        return "bg-blue-50/50 border-blue-100 text-blue-600";
      case "Cleaning":
        return "bg-slate-50 border-slate-200 text-slate-500";
      default:
        return "bg-white border-gray-100 text-gray-500";
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case "Occupied": return "bg-[#ff6b35]";
      case "Available": return "bg-emerald-500";
      case "Reserved": return "bg-blue-500";
      case "Cleaning": return "bg-slate-400";
      default: return "bg-gray-300";
    }
  };

  // Dynamic calculations for the header
  const totalTables = tables.length;
  const occupiedTables = tables.filter(t => t.status === "Occupied").length;

  return (
    <section className="bg-white rounded-[20px] shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Live Tables</h3>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {totalTables > 0 ? `${occupiedTables}/${totalTables} Occupied` : "No tables configured"}
          </p>
        </div>
        <button className="text-sm font-medium text-[#ff6b35] hover:underline">
          Manage
        </button>
      </div>

      {/* Scrollable Grid Area */}
      <div className="flex-1 overflow-y-auto p-5 hide-scrollbar bg-gray-50/30">
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        
        {tables.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400 font-medium">
            No live table data available.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {tables.map((table) => (
              <div 
                // Using table._id to match MongoDB, fallback to table.id
                key={table._id || table.id} 
                className={`relative p-4 rounded-2xl border flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md cursor-pointer ${getStatusStyles(table.status)}`}
              >
                {/* Top Row: Table Name & Status Dot */}
                <div className="flex justify-between items-start">
                  <span className="font-extrabold text-xl text-slate-800 tracking-tight">
                    T{table.number || table.tableNumber}
                  </span>
                  <span className={`h-2.5 w-2.5 rounded-full shadow-sm ${getStatusDot(table.status)}`} />
                </div>

                {/* Middle string: Status text */}
                <div className="text-xs font-bold uppercase tracking-wider mt-1 mb-3 opacity-80">
                  {table.status || "Unknown"}
                </div>

                {/* Bottom Row: Metrics (Orders/Time) */}
                <div className="flex items-center justify-between text-slate-600 mt-auto">
                  <div className="flex items-center gap-1.5" title="Active Orders">
                    <ConciergeBell className="h-4 w-4 opacity-70" />
                    <span className="text-sm font-semibold">{table.orders || 0}</span>
                  </div>
                  
                  {table.time && table.time !== "-" && (
                    <div className="flex items-center gap-1.5 opacity-70 text-xs font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{table.time}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TableStatus;