import React, { useState, useEffect } from "react";
import { Tag, Plus, Trash2, Save, Percent } from "lucide-react";

const OfferSettingsPanel = ({ initialData, onSave, isSaving }) => {
  const [isOffersEnabled, setIsOffersEnabled] = useState(false);
  const [offers, setOffers] = useState([]);

  // Populate state when initialData is loaded
  useEffect(() => {
    if (initialData) {
      setIsOffersEnabled(initialData.isOffersEnabled || false);
      // Ensure we have an array to map over, even if empty
      setOffers(initialData.offers || []);
    }
  }, [initialData]);

  const handleAddOffer = () => {
    setOffers([
      ...offers,
      { code: "", minAmount: "", discountPercentage: "" }
    ]);
  };

  const handleRemoveOffer = (indexToRemove) => {
    setOffers(offers.filter((_, index) => index !== indexToRemove));
  };

  const handleOfferChange = (index, field, value) => {
    const updatedOffers = [...offers];
    
    // Auto-uppercase the promo code for consistency
    if (field === "code") {
      updatedOffers[index][field] = value.toUpperCase();
    } else {
      updatedOffers[index][field] = value;
    }
    
    setOffers(updatedOffers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      isOffersEnabled,
      offers
    });
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 mt-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
          <Tag className="w-6 h-6 text-[#ff6b35]" />
          Promo Codes & Offers
        </h2>
        
        {/* Master Toggle */}
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={isOffersEnabled}
              onChange={(e) => setIsOffersEnabled(e.target.checked)}
            />
            <div className={`block w-14 h-8 rounded-full transition-colors ${isOffersEnabled ? 'bg-[#ff6b35]' : 'bg-gray-200'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isOffersEnabled ? 'transform translate-x-6' : ''}`}></div>
          </div>
          <div className="ml-3 text-sm font-bold text-slate-700">
            {isOffersEnabled ? "Offers Enabled" : "Offers Disabled"}
          </div>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Dynamic List of Offers */}
        <div className={`space-y-4 ${!isOffersEnabled ? 'opacity-50 pointer-events-none transition-opacity' : ''}`}>
          {offers.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-sm font-bold text-gray-400">No active promo codes. Click below to add one.</p>
            </div>
          ) : (
            offers.map((offer, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                
                {/* Promo Code Input */}
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Promo Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. OFFER50"
                    required
                    value={offer.code}
                    onChange={(e) => handleOfferChange(index, 'code', e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-orange-500 rounded-xl px-3 py-2 outline-none font-bold text-slate-700 transition-all text-sm uppercase"
                  />
                </div>

                {/* Min Amount Input */}
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Min. Amount (AED)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 100"
                    required
                    min="0"
                    value={offer.minAmount}
                    onChange={(e) => handleOfferChange(index, 'minAmount', e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-orange-500 rounded-xl px-3 py-2 outline-none font-bold text-slate-700 transition-all text-sm"
                  />
                </div>

                {/* Discount % Input */}
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Discount (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="e.g. 50"
                      required
                      min="1"
                      max="100"
                      value={offer.discountPercentage}
                      onChange={(e) => handleOfferChange(index, 'discountPercentage', e.target.value)}
                      className="w-full bg-white border border-gray-200 focus:border-orange-500 rounded-xl pl-3 pr-8 py-2 outline-none font-bold text-slate-700 transition-all text-sm"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Delete Button */}
                <div className="md:col-span-2 flex justify-end md:mt-5">
                  <button 
                    type="button" 
                    onClick={() => handleRemoveOffer(index)}
                    className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Add New Offer Button */}
          <button 
            type="button" 
            onClick={handleAddOffer}
            className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-sm font-bold text-gray-500 hover:text-[#ff6b35] hover:border-[#ff6b35] hover:bg-orange-50 transition-all gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Promo Code
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-6 flex justify-end border-t border-gray-100">
          <button 
            type="submit" 
            disabled={isSaving}
            className="bg-black text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#ff6b35] transition-colors shadow-lg shadow-black/10 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : <Save className="w-4 h-4" />}
            {isSaving ? "Saving..." : "Save Offers"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OfferSettingsPanel;