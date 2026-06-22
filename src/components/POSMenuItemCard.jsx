import React from 'react';
import { Plus } from 'lucide-react';

const POSMenuItemCard = ({ item, onAdd }) => {
  return (
    <div 
      onClick={() => onAdd(item)}
      className="flex flex-col bg-white rounded-[28px] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 border border-slate-100/80 active:scale-[0.98] group cursor-pointer h-full"
    >
      {/* Custom Transparent Scrollbar strictly for the card description */}
      <style>{`
        .card-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .card-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .card-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.2);
          border-radius: 10px;
        }
        .card-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(148, 163, 184, 0.4);
        }
        /* Firefox fallback */
        .card-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.2) transparent;
        }
      `}</style>

      {/* Image Container with smooth curve */}
      <div className="h-36 w-full rounded-[20px] bg-slate-50 mb-3 overflow-hidden relative flex-shrink-0">
        <img
          src={item.image?.gcsPath || '/fallback.png'}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400&h=300"; }}
        />
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 px-1 min-h-[90px]">
        <h3 className="font-extrabold text-[15px] text-slate-900 line-clamp-1 mb-1">
          {item.name}
        </h3>
        
        {/* Scrollable Description Container */}
        <div className="max-h-[38px] overflow-y-auto card-scrollbar mb-3 pr-1">
          <p className="text-[12px] font-medium text-slate-400 leading-snug">
            {item.description || "Delicious and freshly prepared for you."}
          </p>
        </div>

        {/* Bottom Row: Price & Pill Button */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-[16px] font-extrabold text-slate-900 tracking-tight">
            {item.currency || 'AED'} {item.price?.toFixed(2)}
          </span>
          
          {/* Fintech-style Pill Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd(item);
            }}
            className="flex items-center gap-1.5 bg-slate-900 group-hover:bg-[#ff6b35] text-white rounded-full px-4 py-1.5 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            <span className="text-[12px] font-bold tracking-wide">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSMenuItemCard;