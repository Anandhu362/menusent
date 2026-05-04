import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, Loader2 } from 'lucide-react';
import { fetchSalesChartData } from '../api/order.api';

export const SalesChartWidget = ({ restaurantId, currency = 'AED' }) => {
  const [timeframe, setTimeframe] = useState('weekly');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const loadChartData = async () => {
      if (!restaurantId) return;
      setIsLoading(true);
      const data = await fetchSalesChartData(restaurantId, timeframe);
      setChartData(data);
      setIsLoading(false);
    };
    loadChartData();
  }, [restaurantId, timeframe]);

  // Custom Tooltip for the Fintech Look
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700/50">
          <p className="text-xs font-bold text-slate-400 mb-1">{label}</p>
          <p className="text-sm font-black text-[#ff6b35]">
            {currency} {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-[20px] p-5 lg:p-6 shadow-sm border border-gray-100 flex flex-col h-full w-full min-h-[300px]">
      
      {/* Header & Dropdown */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base lg:text-lg font-bold text-slate-900">Revenue Overview</h3>
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 transition-colors"
          >
            {timeframe === 'weekly' ? 'This Week' : 'This Month'}
            <ChevronDown className="h-3 w-3" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-100 shadow-lg rounded-xl overflow-hidden z-10">
              <button 
                onClick={() => { setTimeframe('weekly'); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 ${timeframe === 'weekly' ? 'text-[#ff6b35] bg-orange-50/50' : 'text-slate-600'}`}
              >
                This Week
              </button>
              <button 
                onClick={() => { setTimeframe('monthly'); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 ${timeframe === 'monthly' ? 'text-[#ff6b35] bg-orange-50/50' : 'text-slate-600'}`}
              >
                This Month
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-gray-300 animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff6b35" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#ff6b35" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSales)" 
                activeDot={{ r: 6, fill: "#ff6b35", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};