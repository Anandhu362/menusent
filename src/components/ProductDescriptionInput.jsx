// src/components/ProductDescriptionInput.jsx
import React from 'react';

export const ProductDescriptionInput = ({ 
  hasDescription, 
  setHasDescription, 
  description, 
  setDescription,
  disabled 
}) => {
  return (
    <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-4 relative z-30">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-semibold text-slate-700">Item Description</label>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">Add ingredients or dietary info (Optional)</p>
        </div>
        
        {/* Toggle Switch */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setHasDescription(!hasDescription)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out disabled:opacity-50 ${hasDescription ? 'bg-[#ff6b35]' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${hasDescription ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Expandable Textarea */}
      {hasDescription && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={disabled}
            placeholder="e.g., Contains 2 Boiled Eggs, Onion Raitha, Sweet..."
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35] min-h-[80px] resize-y transition-all font-medium placeholder:text-gray-300 disabled:opacity-60"
          />
        </div>
      )}
    </div>
  );
};