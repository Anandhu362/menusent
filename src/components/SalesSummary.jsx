import React from "react";
import { ChevronDown } from "lucide-react";

// Predefined brand colors for the top 3 items to maintain the UI design
const CHART_COLORS = [
  { bg: "bg-[#ec4899]", stroke: "#ec4899" }, // Pink
  { bg: "bg-[#eab308]", stroke: "#eab308" }, // Yellow
  { bg: "bg-[#f97316]", stroke: "#f97316" }, // Orange
];

export const SalesSummary = ({ topItems = [] }) => {
  // SVG Calculations for the concentric circles
  const outerRadius = 80;
  const middleRadius = 60;
  const innerRadius = 40;
  
  const outerCircumference = 2 * Math.PI * outerRadius;
  const middleCircumference = 2 * Math.PI * middleRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;

  // 1. Ensure we always have exactly 3 items to prevent UI crashes, even if there are less than 3 sales
  const safeItems = [
    ...topItems, 
    { name: "N/A", orders: 0 }, 
    { name: "N/A", orders: 0 }, 
    { name: "N/A", orders: 0 }
  ].slice(0, 3);

  // 2. Find the highest order count to calculate the relative percentages
  const maxOrders = Math.max(...safeItems.map(item => item.orders), 1);

  // 3. Map the real data to the visual properties needed for the chart
  const mappedItems = safeItems.map((item, index) => {
    // We multiply by 0.75 so the highest item fills exactly 75% of the circle (matching your original design)
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
        
        {/* Dropdown Button */}
        <button className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors">
          Monthly
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Content Section: Legend & Chart */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 flex-1">
        
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