import React from "react";
import { Plus, Star } from "lucide-react";
import { getOptimizedImageUrl } from "../utils/imageHelpers"; // ✅ IMPORT THE NEW HELPER

export const MenuItemCard = ({ item, onAddToCart, onSelectVariant }) => {
  
  // Helper function to safely extract the image URL from MongoDB
  const getImageUrl = (imageField) => {
    if (!imageField) return '/fallback-food.png';
    if (typeof imageField === 'string') return imageField;
    if (imageField.gcsPath) return imageField.gcsPath;
    return '/fallback-food.png';
  };

  // Helper function to dynamically set the currency symbol
  const getCurrencySymbol = (currency) => {
    if (currency === 'INR') return '₹';
    if (currency === 'AED') return 'AED ';
    return '$'; // Default to USD
  };

  const imageUrl = getImageUrl(item.image);
  
  // Calculate display price based on variants
  let displayPrice = Number(item.price) || 0;
  let isFrom = false;
  
  if (item.hasVariants && item.variants && item.variants.length > 0) {
    const prices = item.variants.map(v => parseFloat(v.price)).filter(p => !isNaN(p));
    if (prices.length > 0) {
      displayPrice = Math.min(...prices);
      if (new Set(prices).size > 1) {
        isFrom = true;
      }
    }
  }

  // Determine Stock Status
  // If currentStock is undefined, it assumes legacy item (in stock)
  const stockAmount = item.currentStock;
  const hasStockData = stockAmount !== undefined;
  const isOutOfStock = item.isActive === false || (hasStockData && stockAmount <= 0);

  // Mock rating data for the premium UI feel
  const mockRating = "4.8";
  const mockReviewCount = "(120+)";

  return (
    <div className={`bg-white rounded-[20px] p-2 flex flex-col relative shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] border border-gray-100/80 transition-all duration-300 ${!isOutOfStock ? 'hover:shadow-lg hover:border-orange-100' : 'opacity-80'}`}>
      
      {/* Premium Image Container */}
      <div className="relative w-full h-[110px] rounded-[14px] overflow-hidden mb-2 bg-gray-50">
        <img 
          // ✅ USE THE OPTIMIZER HELPER HERE (Shrink to 400px width WebP)
          src={getOptimizedImageUrl(imageUrl, 400)} 
          alt={item.name || "Menu item"} 
          loading="lazy" // ✅ CRITICAL FOR PERFORMANCE: Only load when visible
          // Grayscale the image if it is out of stock
          className={`w-full h-full object-cover transition-transform duration-500 ${isOutOfStock ? 'grayscale opacity-60' : 'hover:scale-110'}`}
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = '/fallback-food.png'; 
          }}
        />
        
        {/* Dynamic Stock Badge / Sold Out Overlay */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
          {isOutOfStock && (
            <span className="bg-red-500/90 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm backdrop-blur-sm">
              Sold Out
            </span>
          )}
        </div>
        
        {/* Rating Overlay */}
        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded-[8px] flex items-center gap-1 shadow-sm">
          <Star className="w-3 h-3 fill-[#ffc107] text-[#ffc107]" />
          <span className="text-[11px] font-bold text-slate-800">{mockRating}</span>
          <span className="text-[9px] font-medium text-gray-500">{mockReviewCount}</span>
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-grow px-1 pb-0.5">
        
        {/* Title (English) */}
        <h3 className={`font-bold text-[14px] leading-tight line-clamp-1 ${isOutOfStock ? 'text-gray-500' : 'text-slate-800'}`}>
          {item.name}
        </h3>

        {/* Item Description Display */}
        {item.description && (
          <p className={`text-[11px] font-medium mt-1 line-clamp-2 leading-tight ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`}>
            {item.description}
          </p>
        )}

        {/* Arabic Name Display */}
        {item.arabicName && (
          <p 
            dir="rtl" 
            className={`text-[13px] font-bold leading-tight mt-0.5 font-sans ${isOutOfStock ? 'text-gray-400' : 'text-orange-600/90'}`}
          >
            {item.arabicName}
          </p>
        )}
        
        {/* Price and Add Button Container */}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-0.5">
            <span className={`font-extrabold text-[16px] ${isOutOfStock ? 'text-gray-400' : 'text-slate-900'}`}>
              {isFrom && <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">From</span>}
              {getCurrencySymbol(item.currency)}{displayPrice.toFixed(2)}
            </span>
          </div>

          {/* Disabled Add to Cart Button if out of stock */}
          <button 
            disabled={isOutOfStock}
            onClick={() => {
              if (isOutOfStock) return;
              if (item.hasVariants) {
                if(onSelectVariant) onSelectVariant(item);
              } else {
                onAddToCart(item);
              }
            }}
            className={`h-[32px] w-[32px] rounded-[10px] flex items-center justify-center transition-transform shadow-md ${
              isOutOfStock 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200' 
                : 'bg-[#ff6b35] hover:bg-[#ff5a1f] text-white active:scale-90 shadow-orange-500/20'
            }`}
            aria-label={item.hasVariants ? `Select options for ${item.name}` : `Add ${item.name} to cart`}
          >
            <Plus className="h-[16px] w-[16px]" strokeWidth={3} />
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default MenuItemCard;