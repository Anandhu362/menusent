import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Edit3, CheckCircle2, Languages, Plus, Trash2 } from "lucide-react";

export const EditProductModal = ({ isOpen, onClose, product, onUpdateProduct, categories = [] }) => {
  const [name, setName] = useState("");
  const [arabicName, setArabicName] = useState("");
  const [showArabic, setShowArabic] = useState(false);
  
  const [price, setPrice] = useState("");
  
  const [categoryId, setCategoryId] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  
  const [currency, setCurrency] = useState("USD");
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const currencyDropdownRef = useRef(null);

  // ✅ NEW: Variants State
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([{ name: "", arabicName: "", price: "" }]);

  const CURRENCY_OPTIONS = [
    { label: "USD ($)", value: "USD" },
    { label: "INR (₹)", value: "INR" },
    { label: "AED", value: "AED" }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
        setIsCurrencyDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (product && isOpen) {
      setName(product.name || "");
      
      const existingArabic = product.arabicName || "";
      setArabicName(existingArabic);
      setShowArabic(existingArabic !== ""); 
      
      setPrice(product.price ? product.price.toString() : "");
      setCurrency(product.currency || "USD");

      // ✅ Load existing variants if they exist
      if (product.hasVariants && product.variants && product.variants.length > 0) {
        setHasVariants(true);
        setVariants(product.variants);
      } else {
        setHasVariants(false);
        setVariants([{ name: "", arabicName: "", price: "" }]);
      }
      
      const existingCatId = product.categoryId?._id || product.categoryId;
      if (existingCatId && categories.find(c => c.id === existingCatId)) {
        setCategoryId(existingCatId);
      } else {
        const fallbackCat = categories.find(c => c.name === product.category);
        setCategoryId(fallbackCat ? fallbackCat.id : "");
      }
      
      setIsCurrencyDropdownOpen(false);
      setIsCategoryDropdownOpen(false);
    }
  }, [product, isOpen, categories]);

  // ✅ Variant Handlers
  const handleAddVariant = () => {
    setVariants([...variants, { name: "", arabicName: "", price: "" }]);
  };

  const handleRemoveVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index][field] = value;
    setVariants(updatedVariants);
  };

  const handleSubmit = () => {
    // Determine the base price to act as the "Starting From" price
    let finalBasePrice = price;
    if (hasVariants) {
      const validVariantPrices = variants
        .map(v => parseFloat(v.price))
        .filter(p => !isNaN(p) && p > 0);
        
      if (validVariantPrices.length > 0) {
        finalBasePrice = Math.min(...validVariantPrices).toString();
      }
    }

    const updatedProductData = {
      ...product,
      name: name,
      arabicName: arabicName,
      price: parseFloat(finalBasePrice),
      hasVariants: hasVariants,
      variants: hasVariants ? variants : [],
      currency: currency, 
      categoryId: categoryId, 
    };
    
    onUpdateProduct(updatedProductData);
    onClose();
  };

  if (!isOpen || !product) return null;

  // Validation Logic
  const isBaseValid = name.trim() !== "" && categoryId !== "";
  const isPriceValid = hasVariants 
    ? variants.length > 0 && variants.every(v => v.name.trim() && v.price && parseFloat(v.price) > 0)
    : price !== "" && parseFloat(price) > 0;
  
  const isFormValid = isBaseValid && isPriceValid;
  
  const imageUrl = product?.image?.gcsPath || product?.image || '/fallback-food.png';
  const selectedCurrencyLabel = CURRENCY_OPTIONS.find(c => c.value === currency)?.label || "USD ($)";
  const selectedCategoryLabel = categories.find(c => c.id === categoryId)?.name || "Select a category";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Dark blurry backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Global CSS to hide the scrollbar cleanly across browsers */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Modal Container */}
      <div className="bg-white w-full max-w-[500px] rounded-[28px] shadow-2xl relative flex flex-col animate-in fade-in zoom-in-95 duration-200 z-10 font-sans max-h-[90vh]">
        
        {/* Header (Sticky) */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 z-20 bg-white rounded-t-[28px]">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-[#ff6b35]" />
            Edit Product
          </h2>
          <button 
            onClick={onClose}
            className="h-8 w-8 bg-gray-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 pb-64 space-y-6 overflow-y-auto hide-scrollbar relative z-10 flex-1">
          
          {/* Image Preview */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-gray-100">
            <img 
              src={imageUrl} 
              alt={name} 
              className="w-16 h-16 rounded-xl object-cover shadow-sm bg-white" 
              onError={(e) => { e.target.src = '/fallback-food.png' }}
            />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Image</p>
              <p className="text-sm font-medium text-slate-600 leading-tight">Image updates are managed by the master database admin.</p>
            </div>
          </div>

          {/* PRODUCT NAME & ARABIC TOGGLE */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">Product Name</label>
              <button
                type="button"
                onClick={() => setShowArabic(!showArabic)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                  showArabic 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Languages className="w-3 h-3" />
                {showArabic ? "Arabic Active" : "Add Arabic"}
              </button>
            </div>
            
            <input 
              type="text" 
              placeholder="e.g., Margherita Pizza" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-slate-900 focus:outline-none focus:border-[#ff6b35] focus:shadow-[0_0_0_4px_rgba(255,107,53,0.1)] transition-all font-medium"
            />

            {showArabic && (
              <div className="mt-3 animate-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <input 
                    type="text" 
                    dir="rtl"
                    placeholder="اسم المنتج باللغة العربية" 
                    value={arabicName}
                    onChange={(e) => setArabicName(e.target.value)}
                    className="w-full px-4 py-3 bg-orange-50/30 border border-orange-200 rounded-2xl text-slate-900 focus:outline-none focus:border-[#ff6b35] focus:bg-white transition-all font-bold text-right"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-[10px] font-black text-orange-300 uppercase">AR</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GRID: CATEGORY & CURRENCY DROPDOWNS */}
          <div className="grid grid-cols-2 gap-4 relative z-50">
            
            <div className="relative z-[100]" ref={categoryDropdownRef}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
              <button 
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                disabled={categories.length === 0}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-2xl transition-all disabled:opacity-60 disabled:bg-gray-50 ${
                  isCategoryDropdownOpen 
                    ? "border-[#ff6b35] shadow-[0_0_0_4px_rgba(255,107,53,0.1)]" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className={`font-medium truncate ${!categoryId ? 'text-gray-400' : 'text-slate-900'}`}>
                  {categories.length === 0 ? "No categories" : selectedCategoryLabel}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryDropdownOpen && categories.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-[100] p-2 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[200px] overflow-y-auto hide-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategoryId(cat.id);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between group ${
                        categoryId === cat.id
                          ? "bg-[#ff6b35] text-white"
                          : "text-slate-700 hover:bg-orange-50 hover:text-[#ff6b35]"
                      }`}
                    >
                      <span className="truncate pr-2">{cat.name}</span>
                      {categoryId === cat.id && (
                        <CheckCircle2 className="h-4 w-4 text-white flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative z-[90]" ref={currencyDropdownRef}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Currency</label>
              <button 
                type="button"
                onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 bg-gray-50 border rounded-2xl transition-all ${
                  isCurrencyDropdownOpen 
                    ? "border-[#ff6b35] shadow-[0_0_0_4px_rgba(255,107,53,0.1)] bg-white" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="font-bold text-slate-700 text-sm truncate">
                  {selectedCurrencyLabel}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCurrencyDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-[100] p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {CURRENCY_OPTIONS.map(curr => (
                    <button
                      key={curr.value}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); 
                        setCurrency(curr.value);
                        setIsCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between group ${
                        currency === curr.value
                          ? "bg-[#ff6b35] text-white"
                          : "text-slate-700 hover:bg-orange-50 hover:text-[#ff6b35]"
                      }`}
                    >
                      <span className="truncate pr-2">{curr.label}</span>
                      {currency === curr.value && (
                        <CheckCircle2 className="h-4 w-4 text-white flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PRICING SECTION & VARIANTS TOGGLE */}
          <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-4">
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-slate-800">Multiple Sizes / Prices</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Enable if this item has variants (e.g., Half/Full)</p>
              </div>
              <button
                type="button"
                onClick={() => setHasVariants(!hasVariants)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${hasVariants ? 'bg-[#ff6b35]' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${hasVariants ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {!hasVariants ? (
              <div className="relative animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Standard Price</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35] transition-all font-bold placeholder:text-gray-300"
                />
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Product Variants</label>
                
                {variants.map((variant, index) => (
                  <div key={index} className="flex gap-2 items-start bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative group">
                    <div className="flex-1 space-y-2">
                      <input 
                        type="text"
                        placeholder="Size (e.g., Large)" 
                        value={variant.name}
                        onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium focus:outline-none focus:border-[#ff6b35] focus:bg-white"
                      />
                      {showArabic && (
                        <input 
                          type="text"
                          dir="rtl"
                          placeholder="الحجم (مثال: كبير)" 
                          value={variant.arabicName}
                          onChange={(e) => handleVariantChange(index, 'arabicName', e.target.value)}
                          className="w-full px-3 py-2 bg-orange-50/50 border border-orange-100 rounded-lg text-sm font-bold text-right focus:outline-none focus:border-[#ff6b35] focus:bg-white"
                        />
                      )}
                    </div>
                    
                    <div className="w-[100px]">
                      <input 
                        type="number" 
                        placeholder="Price" 
                        min="0"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold focus:outline-none focus:border-[#ff6b35] focus:bg-white"
                      />
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      disabled={variants.length === 1}
                      className="mt-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:text-gray-400"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                
                <button 
                  type="button"
                  onClick={handleAddVariant}
                  className="flex items-center gap-1 text-sm font-bold text-[#ff6b35] hover:text-[#ff5a1f] transition-colors mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add another size
                </button>
              </div>
            )}
          </div>
          
        </div>

        {/* Footer Actions (Sticky) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 flex justify-end gap-3 bg-white z-50 rounded-b-[28px] shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm ${
                isFormValid 
                ? 'bg-[#ff6b35] hover:bg-[#ff5a1f] active:scale-95 shadow-[#ff6b35]/20' 
                : 'bg-slate-200 cursor-not-allowed text-slate-400'
            }`}
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditProductModal;