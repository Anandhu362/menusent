import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Circle } from "lucide-react";

export const VariantSelectionBottomSheet = ({ isOpen, onClose, item, onAddToCart }) => {
  // State to track which variant the user has selected (default to the first one)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Reset selection when the modal opens with a new item
  useEffect(() => {
    if (isOpen) {
      setSelectedVariantIndex(0);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  // Helper function to safely extract the image URL
  const getImageUrl = (imageField) => {
    if (!imageField) return '/fallback-food.png';
    if (typeof imageField === 'string') return imageField;
    if (imageField.gcsPath) return imageField.gcsPath;
    return '/fallback-food.png';
  };

  // Helper function for currency symbol
  const getCurrencySymbol = (currency) => {
    if (currency === 'INR') return '₹';
    if (currency === 'AED') return 'AED ';
    return '$'; // Default to USD
  };

  const imageUrl = getImageUrl(item.image);
  const currencySymbol = getCurrencySymbol(item.currency);
  
  // Safely get the currently selected variant
  const selectedVariant = item.variants && item.variants.length > 0 
    ? item.variants[selectedVariantIndex] 
    : null;

  const handleAddToCart = () => {
    // ✅ This logic was already correct! It passes the variant to the context.
    // Added a small fallback just in case an item without variants opens this modal.
    if (selectedVariant) {
      onAddToCart(item, selectedVariant);
    } else {
      onAddToCart(item, null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center">
      {/* Dark blurry backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Slide-up Modal */}
      <div className="bg-white w-full max-h-[90vh] md:max-h-[80vh] md:max-w-[400px] rounded-t-[32px] md:rounded-[32px] shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-full duration-300 z-10 pb-[env(safe-area-inset-bottom)]">
        
        {/* Header / Item Info */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-100 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-gray-200 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          <img 
            src={imageUrl} 
            alt={item.name} 
            className="w-20 h-20 rounded-2xl object-cover bg-gray-50 border border-gray-100" 
          />
          
          <div className="flex flex-col flex-1 pr-8">
            <h2 className="text-lg font-bold text-slate-900 leading-tight mb-1">{item.name}</h2>
            {item.arabicName && (
              <p dir="rtl" className="text-sm font-bold text-orange-600/90 leading-tight mb-2 font-sans">
                {item.arabicName}
              </p>
            )}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Select Size
            </p>
          </div>
        </div>

        {/* Scrollable Variants List */}
        <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
          <div className="flex flex-col gap-3">
            {item.variants && item.variants.map((variant, index) => {
              const isSelected = selectedVariantIndex === index;
              const price = parseFloat(variant.price);
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedVariantIndex(index)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    isSelected 
                      ? 'border-[#ff6b35] bg-orange-50/50 shadow-sm shadow-orange-100' 
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  {/* Radio Icon & Name */}
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="h-6 w-6 text-[#ff6b35] fill-orange-100" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className={`font-bold text-[15px] ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                        {variant.name}
                      </span>
                      {variant.arabicName && (
                        <span dir="rtl" className={`text-[13px] font-bold ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}>
                          {variant.arabicName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <span className={`font-extrabold text-[15px] ${isSelected ? 'text-[#ff6b35]' : 'text-slate-900'}`}>
                    {currencySymbol}{price.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer / Add Button */}
        <div className="p-6 bg-white border-t border-gray-100 rounded-b-[32px]">
          {/* ✅ Small defensive tweak to disable the button if no variants exist */}
          <button 
            onClick={handleAddToCart}
            disabled={!item.variants || item.variants.length === 0} 
            className="w-full bg-[#ff6b35] hover:bg-[#ff5a1f] disabled:bg-gray-300 text-white font-bold text-[16px] h-[56px] rounded-full transition-all shadow-[0_8px_20px_-6px_rgba(255,107,53,0.4)] active:scale-[0.98] flex items-center justify-between px-6"
          >
            <span>Add to Cart</span>
            {selectedVariant && (
              <span className="font-extrabold bg-white/20 px-3 py-1 rounded-full text-sm">
                {currencySymbol}{parseFloat(selectedVariant.price).toFixed(2)}
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default VariantSelectionBottomSheet;