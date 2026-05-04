import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import apiClient from "../api/apiClient";

// Predefined brand colors for the top 3 items to maintain the UI design
const CHART_COLORS = [
  { bg: "bg-[#ec4899]", stroke: "#ec4899" }, // Pink
  { bg: "bg-[#eab308]", stroke: "#eab308" }, // Yellow
  { bg: "bg-[#f97316]", stroke: "#f97316" }, // Orange
];

export const SalesSummary = ({ topItems = [], restaurantId }) => {
  // Filter & Dropdown State
  const [filter, setFilter] = useState("Monthly");
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState(topItems);
  const [isLoading, setIsLoading] = useState(false);
  
  const dropdownRef = useRef(null);

  // SVG Calculations for the concentric circles
  const outerRadius = 80;
  const middleRadius = 60;
  const innerRadius = 40;
  
  const outerCircumference = 2 * Math.PI * outerRadius;
  const middleCircumference = 2 * Math.PI * middleRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;

  // Sync initial items from parent on first load
  useEffect(() => {
    if (topItems.length > 0 && filter === "Monthly") {
      setItems(topItems);
    }
  }, [topItems]);

  // Handle clicking outside the custom dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch new data when the filter changes
  useEffect(() => {
    const fetchFilteredData = async () => {
      if (!restaurantId) return;
      setIsLoading(true);
      
      try {
        // Adjust this endpoint path to match your backend analytics route
        const response = await apiClient.get(`/api/orders/top-items`, {
          params: { 
            restaurantId: restaurantId, 
            timeframe: filter.toLowerCase() // Sends 'daily', 'weekly', or 'monthly'
          }
        });
        
        if (response.data && response.data.topItems) {
          setItems(response.data.topItems);
        }
      } catch (error) {
        console.error(`Failed to fetch ${filter} top items:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if they change the filter to something else, or if we have no items
    if (filter !== "Monthly" || items.length === 0) {
      fetchFilteredData();
    }
  }, [filter, restaurantId]);

  // 1. Ensure we always have exactly 3 items to prevent UI crashes
  const safeItems = [
    ...items, 
    { name: "N/A", orders: 0 }, 
    { name: "N/A", orders: 0 }, 
    { name: "N/A", orders: 0 }
  ].slice(0, 3);

  // 2. Find the highest order count to calculate the relative percentages
  const maxOrders = Math.max(...safeItems.map(item => item.orders), 1);

  // 3. Map the real data to the visual properties needed for the chart
  const mappedItems = safeItems.map((item, index) => {
    const percent = item.orders === 0 ? 0 : (item.orders / maxOrders) * 0.75;
    
    return {
      name: item.name,
      orders: item.orders,
      color: CHART_COLORS[index].bg,
      stroke: CHART_COLORS[index].stroke,
      percent: percent
    };
  });

  return (
    <section className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col h-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-start">
          {/* Pink Decorator Pill */}
          <div className="w-1.5 h-6 bg-[#ec4899] rounded-full mr-3 mt-1"></div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Sales Summary</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Most ordered menu items</p>
          </div>
        </div>
        
        {/* ✅ NEW: Custom Functional Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
          >
            {filter}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-1.5 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {["Daily", "Weekly", "Monthly"].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFilter(option);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors hover:bg-orange-50 hover:text-[#ff6b35] ${
                    filter === option ? "text-[#ff6b35] bg-orange-50/50" : "text-slate-600"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Section: Legend & Chart */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 flex-1 relative">
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-xl">
            <Loader2 className="w-8 h-8 text-[#ff6b35] animate-spin" />
          </div>
        )}

        {/* Left: Top Items Legend */}
        <div className="flex flex-col gap-6 w-full md:w-auto">
          {mappedItems.map((item, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className={`w-4 h-4 mt-1 rounded-full shadow-sm ${item.color}`}></div>
              <div>
                <p className="text-xl font-extrabold text-slate-900 leading-none">
                  {item.orders.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 font-medium mt-1.5 uppercase tracking-wide">
                  {item.name}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right: SVG Concentric Chart */}
        <div className="relative w-48 h-48 md:w-56 md:h-56 flex-shrink-0">
          <svg 
            viewBox="0 0 200 200" 
            className="w-full h-full transform rotate-[135deg]"
          >
            {/* Background Tracks */}
            <circle cx="100" cy="100" r={outerRadius} fill="none" stroke="#f8f9fa" strokeWidth="12" />
            <circle cx="100" cy="100" r={middleRadius} fill="none" stroke="#f8f9fa" strokeWidth="12" />
            <circle cx="100" cy="100" r={innerRadius} fill="none" stroke="#f8f9fa" strokeWidth="12" />

            {/* Colored Arcs */}
            <circle 
              cx="100" cy="100" r={outerRadius} 
              fill="none" stroke={mappedItems[0].stroke} strokeWidth="12" strokeLinecap="round" 
              strokeDasharray={outerCircumference} 
              strokeDashoffset={outerCircumference * (1 - mappedItems[0].percent)} 
              className="transition-all duration-1000 ease-out"
            />
            <circle 
              cx="100" cy="100" r={middleRadius} 
              fill="none" stroke={mappedItems[1].stroke} strokeWidth="12" strokeLinecap="round" 
              strokeDasharray={middleCircumference} 
              strokeDashoffset={middleCircumference * (1 - mappedItems[1].percent)} 
              className="transition-all duration-1000 ease-out delay-100"
            />
            <circle 
              cx="100" cy="100" r={innerRadius} 
              fill="none" stroke={mappedItems[2].stroke} strokeWidth="12" strokeLinecap="round" 
              strokeDasharray={innerCircumference} 
              strokeDashoffset={innerCircumference * (1 - mappedItems[2].percent)} 
              className="transition-all duration-1000 ease-out delay-200"
            />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default SalesSummary;