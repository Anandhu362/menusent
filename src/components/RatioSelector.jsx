import React from 'react';

const ASPECT_RATIOS = [
  { label: 'Tall (Menu)', value: 917 / 2048, desc: 'Slim & Tall' },
  { label: 'Standard (A4)', value: 210 / 297, desc: 'Classic Paper' },
  { label: 'Square', value: 1, desc: '1:1 Box' },
];

const RatioSelector = ({ selectedRatio, onRatioChange }) => {
  return (
    <div className="space-y-4">
      <label className="text-sm font-bold text-gray-500 uppercase tracking-wide">
        Book Format (Ratio)
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ASPECT_RATIOS.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => onRatioChange(r.value)}
            className={`p-4 border-2 rounded-2xl flex flex-col items-center transition-all ${
              Math.abs(selectedRatio - r.value) < 0.01
                ? 'border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-200 ring-offset-1'
                : 'border-gray-200 hover:border-orange-200 text-gray-500 bg-white hover:bg-gray-50'
            }`}
          >
            <span className="font-bold text-lg">{r.label}</span>
            <span className="text-xs opacity-70 mt-1">{r.desc}</span>
          </button>
        ))}
      </div>
      
      {/* Optional: Custom Input for advanced users */}
      <div className="pt-2">
        <label className="text-xs text-gray-400 font-semibold uppercase">Or Custom Ratio value</label>
        <input 
            type="number"
            step="0.01"
            value={selectedRatio}
            onChange={(e) => onRatioChange(parseFloat(e.target.value))}
            className="mt-1 block w-full md:w-1/3 bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        />
      </div>
    </div>
  );
};

export default RatioSelector;