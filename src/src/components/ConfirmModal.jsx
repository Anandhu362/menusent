import React from "react";
import { AlertTriangle } from "lucide-react";

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl shadow-black/10 border border-gray-100 scale-in-center">
        
        <div className="h-14 w-14 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        
        <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-12 rounded-xl font-bold text-slate-600 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-12 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};