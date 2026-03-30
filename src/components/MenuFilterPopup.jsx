import React, { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, Check } from "lucide-react"; // Removed DollarSign

export function MenuFilterPopup({ onApply, currency = "AED" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dietary, setDietary] = useState("all"); 
  const [maxPrice, setMaxPrice] = useState("");
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApply = () => {
    onApply({ dietary, maxPrice: maxPrice ? parseFloat(maxPrice) : null });
    setIsOpen(false);
  };

  const handleReset = () => {
    setDietary("all");
    setMaxPrice("");
    onApply({ dietary: "all", maxPrice: null });
    setIsOpen(false);
  };

  // Helper to format currency symbol just like in MenuItemCard
  const getCurrencySymbol = (curr) => {
    if (curr === 'INR') return '₹';
    if (curr === 'AED') return 'AED';
    return '$'; // Default
  };

  return (
    <div className="relative inline-block text-left" ref={popupRef}>
      {/* Premium White Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-[44px] w-[44px] flex flex-shrink-0 items-center justify-center rounded-[18px] bg-white shadow-sm hover:shadow-md transition-all active:scale-95 border border-gray-100"
      >
        <SlidersHorizontal 
          className={`h-5 w-5 ${dietary !== 'all' || maxPrice ? 'text-orange-500' : 'text-slate-600'}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 p-5 rounded-[2rem] shadow-2xl border border-gray-100 bg-white z-[100]">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="font-black text-lg text-gray-900">Filters</h4>
              <button onClick={handleReset} className="text-xs font-bold text-gray-400 hover:text-orange-500 uppercase">Reset</button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dietary</label>
              <div className="grid grid-cols-3 gap-2">
                {['All', 'Veg', 'Non-Veg'].map((opt) => {
                  const val = opt.toLowerCase();
                  const isActive = dietary === val;
                  return (
                    <button
                      key={opt}
                      onClick={() => setDietary(val)}
                      className={`relative h-10 rounded-xl text-xs font-bold transition-all border-2 ${isActive ? "bg-black text-white border-black shadow-md" : "bg-gray-50 text-gray-500 border-transparent hover:border-orange-500 hover:bg-white"}`}
                    >
                      {opt}
                      {isActive && <Check className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-50" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Max Price</label>
               <div className="relative flex items-center">
                  {/* Dynamic Currency Symbol Indicator */}
                  <span className="absolute left-4 text-sm font-extrabold text-gray-400">
                    {getCurrencySymbol(currency)}
                  </span>
                  
                  {/* Adjusted padding to accommodate the symbol text */}
                  <input 
                    type="number"
                    min="0"
                    placeholder="Enter amount..."
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-[#f8f9fb] border-2 border-transparent focus:border-black focus:bg-white rounded-xl pl-[3.5rem] pr-4 py-3 outline-none font-bold transition-all text-sm"
                  />
               </div>
            </div>

            <button onClick={handleApply} className="w-full bg-black text-white h-12 rounded-xl font-bold hover:bg-orange-500 shadow-lg flex items-center justify-center">
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}