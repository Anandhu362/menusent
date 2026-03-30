import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Search, ArrowLeft } from "lucide-react";
import { CartPopup } from "../components/CartPopup";
import { MenuItemCard } from "../components/MenuItemCard";
import { MenuFilterPopup } from "../components/MenuFilterPopup"; 
import { useRestaurantMenu } from "../hooks/useRestaurantMenu"; 
import apiClient from "../api/apiClient"; 

// ✅ NEW: Import the global cart hook and the new variant bottom sheet
import { useCart } from "../context/CartContext";
import { VariantSelectionBottomSheet } from "../components/VariantSelectionBottomSheet";

const RestaurantMenu = () => {
  const navigate = useNavigate();
  const { slug } = useParams(); 
  const location = useLocation();
  
  // Pull cart state and actions directly from context
  const { cartItems, addToCart } = useCart();
  
  const [restaurantId, setRestaurantId] = useState(location.state?.restaurantId || null);
  const [restaurantData, setRestaurantData] = useState(null);
  
  const [isResolvingSlug, setIsResolvingSlug] = useState(true);

  // ✅ NEW: States for the Variant Selection Bottom Sheet
  const [isVariantSheetOpen, setIsVariantSheetOpen] = useState(false);
  const [selectedVariantItem, setSelectedVariantItem] = useState(null);

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        const response = await apiClient.get(`/api/restaurants/${slug}`);
        if (response.data) {
          setRestaurantId(response.data._id);
          setRestaurantData(response.data); 
        }
      } catch (error) {
        console.error("Failed to fetch restaurant details:", error);
      } finally {
        setIsResolvingSlug(false);
      }
    };

    if (slug && !restaurantData) {
      fetchRestaurantDetails();
    } else {
      setIsResolvingSlug(false);
    }
  }, [slug, restaurantData]);

  const { categories, menuItems, activeCategory, setActiveCategory, isLoading } = useRestaurantMenu(restaurantId);

  const [isSearchOpen, setIsSearchOpen] = useState(true); 
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({ dietary: 'all', maxPrice: null }); 
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Calculate total items from the global cart state
  const totalCartItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  const restaurantCurrency = menuItems?.length > 0 ? menuItems[0].currency : 'AED';

  const filteredItems = menuItems.filter(item => {
    // ✅ NEW: Check if the item is active (treat undefined as true for legacy items)
    const isItemActive = item.isActive !== false;

    const matchesCategory = !activeCategory || (item.categoryId?._id || item.categoryId) === activeCategory._id;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDietary = activeFilters.dietary === 'all' || 
      (item.dietaryPreference && item.dietaryPreference.toLowerCase() === activeFilters.dietary);
    const matchesPrice = !activeFilters.maxPrice || item.price <= activeFilters.maxPrice;
    
    // ✅ NEW: Add isItemActive to the return statement
    return isItemActive && matchesCategory && matchesSearch && matchesDietary && matchesPrice;
  });

  const handleApplyFilters = (filters) => setActiveFilters(filters);

  // ✅ NEW: Handler to open the variant bottom sheet for multi-price items
  const handleSelectVariant = (item) => {
    setSelectedVariantItem(item);
    setIsVariantSheetOpen(true);
  };

  // ✅ NEW: Handler to close the variant bottom sheet
  const handleCloseVariantSheet = () => {
    setIsVariantSheetOpen(false);
    setTimeout(() => setSelectedVariantItem(null), 300); // Wait for exit animation before clearing data
  };

  if (isLoading || isResolvingSlug) {
    return (
      <div className="absolute inset-0 z-50 flex justify-center items-center bg-[#f8f9fb] md:bg-slate-900">
        <div className="text-lg font-bold animate-pulse text-slate-500">Loading menu...</div>
      </div>
    );
  }

  const defaultFallbackLogo = "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=150&h=150";

  return (
    <div className="absolute inset-0 z-50 font-sans text-slate-900 bg-[#f8f9fb] md:bg-slate-900 md:flex md:items-center md:justify-center md:p-4 min-h-screen">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-in-from-bottom-full {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        .animate-in { animation: slide-in-from-bottom-full 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div className="w-full h-[100dvh] md:h-[800px] flex flex-col relative bg-[#ffffff] md:max-w-[400px] md:rounded-[40px] md:shadow-2xl md:overflow-hidden md:border-[8px] md:border-black">
        <div className="flex-1 overflow-y-auto hide-scrollbar relative pb-24">
          
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md pb-2">
            <div className="flex items-center justify-between px-4 py-4 relative h-[72px]">
              <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900 transition-colors flex items-center p-1 z-10">
                <ArrowLeft className="h-6 w-6" />
              </button>
              
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-white rounded-full pr-4 pl-1 py-1 shadow-sm border border-gray-100 z-0">
                <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 mr-2.5 bg-gray-50">
                  <img 
                    src={restaurantData?.logoUrl || defaultFallbackLogo} 
                    alt={restaurantData?.name || "Logo"} 
                    className="h-full w-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultFallbackLogo; }}
                  />
                </div>
                <h1 className="text-sm font-extrabold text-slate-900 tracking-tight max-w-[120px] truncate">
                  {restaurantData?.name || (slug ? slug.replace('-', ' ') : 'Restaurant')}
                </h1>
              </div>
              
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)} 
                className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm transition-all z-10 ${isSearchOpen ? 'bg-[#1e293b] text-white' : 'bg-white border border-gray-100 text-slate-700'}`}
              >
                <Search className="h-5 w-5" />
              </button>
            </div>

            {isSearchOpen && (
              <div className="px-4 pb-2 relative z-50">
                <div className="flex items-center bg-[#F3F4F6] rounded-[24px] p-1.5 border border-gray-100/50">
                  <div className="pl-3 pr-2 flex-shrink-0">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search menu..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent w-full focus:outline-none text-slate-700 placeholder-slate-400 text-[15px] font-medium py-2"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="flex-shrink-0 mr-2 text-slate-400 font-bold px-2">×</button>
                  )}
                  <MenuFilterPopup 
                    onApply={handleApplyFilters} 
                    currency={restaurantCurrency} 
                  />
                </div>
              </div>
            )}
          </header>

          <section className="mt-2 px-4">
            <div className="flex items-start gap-4 overflow-x-auto pb-4 hide-scrollbar pt-2">
              <button onClick={() => setActiveCategory(null)} className="flex flex-col items-center gap-2 flex-shrink-0 group outline-none">
                <div className={`w-[68px] h-[68px] rounded-[20px] flex items-center justify-center transition-all duration-300 ${activeCategory === null ? "bg-white border-2 border-[#ff6b35] shadow-md shadow-[#ff6b35]/20" : "bg-white border border-gray-100 shadow-sm"}`}>
                  <span className={`font-extrabold text-sm ${activeCategory === null ? "text-[#ff6b35]" : "text-gray-400"}`}>All</span>
                </div>
                <span className={`text-[12px] font-bold tracking-wide ${activeCategory === null ? "text-slate-900" : "text-gray-400"}`}>All Items</span>
              </button>

              {categories.map((category) => (
                <button key={category._id} onClick={() => setActiveCategory(category)} className="flex flex-col items-center gap-2 flex-shrink-0 group outline-none">
                  <div className={`w-[68px] h-[68px] rounded-[20px] flex items-center justify-center transition-all duration-300 ${activeCategory?._id === category._id ? "bg-white border-2 border-[#ff6b35] shadow-md shadow-[#ff6b35]/20" : "bg-white border border-gray-100 shadow-sm"}`}>
                    <img src={category.image?.gcsPath || '/fallback-image.png'} alt={category.name} className="w-[44px] h-[44px] object-contain" />
                  </div>
                  <span className={`text-[12px] font-bold tracking-wide ${activeCategory?._id === category._id ? "text-slate-900" : "text-gray-400"}`}>{category.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-4 px-4">
            <h2 className="text-[18px] font-extrabold text-slate-900 mb-4">{searchQuery ? `Searching for "${searchQuery}"` : (activeCategory ? `Popular ${activeCategory.name}` : "All Menu Items")}</h2>
            <div className="grid grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <MenuItemCard 
                  key={item._id} 
                  item={item} 
                  onAddToCart={addToCart} 
                  onSelectVariant={handleSelectVariant} 
                />
              ))}
              {filteredItems.length === 0 && <div className="col-span-2 text-center text-gray-400 py-6">No matching items found.</div>}
            </div>
          </section>
        </div>

        {cartItems.length > 0 && (
          <div className="fixed bottom-6 right-6 z-40 md:absolute md:bottom-8 md:right-8 animate-in">
            <button onClick={() => setIsCartOpen(true)} className="bg-[#111827] hover:bg-slate-800 text-white rounded-full p-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 relative group">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                 <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                 <line x1="3" y1="6" x2="21" y2="6" />
                 <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="absolute -top-2 -right-2 bg-[#ff6b35] text-white text-[12px] font-extrabold h-6 w-6 rounded-full flex items-center justify-center border-[3px] border-[#f8f9fb] shadow-sm">{totalCartItems}</span>
            </button>
          </div>
        )}

        <CartPopup 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
        />

        <VariantSelectionBottomSheet
          isOpen={isVariantSheetOpen}
          onClose={handleCloseVariantSheet}
          item={selectedVariantItem}
          onAddToCart={addToCart}
        />
      </div>
    </div>
  );
};

export default RestaurantMenu;