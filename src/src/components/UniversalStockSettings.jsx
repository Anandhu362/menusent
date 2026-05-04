import React, { useState } from "react";
import { Package, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { setUniversalStock } from "../api/menuItem.api"; // We will add this to your API file next!

export const UniversalStockSettings = () => {
  const { user } = useAuth();
  const [stockNumber, setStockNumber] = useState(20);
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState("");

  const handleApplyStock = async () => {
    // Validate input
    if (stockNumber === "" || stockNumber < 0) {
      setStatus("error");
      setMessage("Please enter a valid number (0 or higher).");
      return;
    }

    const targetRestaurantId = user?.restaurantId || user?._id;

    if (!targetRestaurantId) {
      setStatus("error");
      setMessage("Authentication error. Please log in again.");
      return;
    }

    setStatus("loading");

    try {
      // Call our new backend route
      await setUniversalStock(targetRestaurantId, Number(stockNumber));
      
      setStatus("success");
      setMessage(`Successfully set universal stock to ${stockNumber} and unhidden all items!`);
      
      // Clear the success message after 4 seconds to keep the UI clean
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 4000);

    } catch (error) {
      console.error("Failed to update universal stock:", error);
      setStatus("error");
      setMessage(error.response?.data?.message || "Failed to update stock. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-4 lg:p-6 mb-6 lg:mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
        
        {/* Left Side: Text and Icon */}
        <div className="flex items-start gap-3 lg:gap-4 flex-1 min-w-0">
          <div className="h-8 w-8 lg:h-10 lg:w-10 bg-orange-50 rounded-full flex items-center justify-center text-[#ff6b35] shrink-0 mt-0.5 lg:mt-1">
            <Package className="h-4 w-4 lg:h-5 lg:w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base lg:text-lg font-bold text-slate-900 truncate">Universal Daily Stock</h3>
            <p className="text-[11px] lg:text-sm text-gray-500 mt-1 max-w-xl">
              Set a default inventory limit for all products. Items will auto-hide when they hit 0, and will automatically restock to this number every 24 hours.
            </p>
          </div>
        </div>

        {/* Right Side: Input and Button */}
        <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="relative">
              <input
                type="number"
                min="0"
                value={stockNumber}
                onChange={(e) => setStockNumber(e.target.value)}
                className="w-16 lg:w-24 pl-3 lg:pl-4 pr-2 lg:pr-3 py-2 lg:py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-slate-900 text-sm lg:text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] transition-all"
                placeholder="20"
              />
            </div>
            
            <button
              onClick={handleApplyStock}
              disabled={status === "loading"}
              className="px-4 lg:px-6 py-2 lg:py-2.5 bg-[#ff6b35] text-white text-xs lg:text-sm font-semibold rounded-xl hover:bg-[#e85d2c] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-1.5 lg:gap-2 shadow-sm whitespace-nowrap"
            >
              {status === "loading" ? (
                <><Loader2 className="h-3 w-3 lg:h-4 lg:w-4 animate-spin" /> Applying...</>
              ) : (
                "Apply to All"
              )}
            </button>
          </div>

          {/* Feedback Messages */}
          {message && (
            <div className={`flex items-center gap-1.5 text-[11px] lg:text-sm font-medium mt-1 ${status === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
              {status === 'success' ? <CheckCircle className="h-3.5 w-3.5 lg:h-4 lg:w-4" /> : <AlertCircle className="h-3.5 w-3.5 lg:h-4 lg:w-4" />}
              {message}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};