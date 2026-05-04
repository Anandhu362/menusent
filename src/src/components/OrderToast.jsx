import React, { useEffect } from 'react';

export const OrderToast = ({ orderId, time, onClose }) => {
  // Automatically close the toast after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 5000);

    // Cleanup the timer if the component unmounts early
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-8 right-8 z-50 bg-white border-l-4 border-[#ff6b35] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl p-4 flex items-center gap-4 transition-all duration-500 animate-in slide-in-from-bottom-8 fade-in">
      <div className="bg-orange-50 h-10 w-10 rounded-full flex items-center justify-center">
        <span className="text-xl">🔔</span>
      </div>
      <div className="pr-4">
        <h4 className="text-slate-900 font-bold text-sm">New Order Arrived!</h4>
        <p className="text-slate-500 text-xs mt-1">
          Order ID: <span className="font-bold text-[#ff6b35]">{orderId}</span> • {time}
        </p>
      </div>
      
      {/* Optional manual close button */}
      <button 
        onClick={onClose} 
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    </div>
  );
};