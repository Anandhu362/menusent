import React, { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";

export const RemoveProductModal = ({ isOpen, onClose, onConfirm, productName }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      // Await the API call passed from the parent component
      await onConfirm();
    } catch (error) {
      console.error("Failed to remove:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Dark blurry backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={!isDeleting ? onClose : undefined}
      ></div>

      {/* Modal Container */}
      <div className="bg-white w-full max-w-[400px] rounded-[28px] shadow-2xl relative flex flex-col animate-in fade-in zoom-in-95 duration-200 z-10 overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Remove Product
          </h2>
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="h-8 w-8 bg-gray-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm font-medium text-slate-600 leading-relaxed">
            Are you sure you want to remove <span className="font-bold text-slate-900">"{productName}"</span> from your menu? 
            This action will immediately hide it from your customers.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-50 flex justify-end gap-3 bg-gray-50/30">
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all shadow-sm shadow-red-500/20 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center min-w-[130px]"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Removing...
              </span>
            ) : (
              "Yes, Remove"
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default RemoveProductModal;