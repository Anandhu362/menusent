import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, CheckCircle2, UploadCloud, Loader2, Search, Languages, Plus, Trash2 } from "lucide-react";

// Import the new search API
import { searchGlobalMenuItems } from "../api/menuItem.api.js";
// ✅ IMPORT THE NEW COMPONENT
import { ProductDescriptionInput } from "./ProductDescriptionInput.jsx";

export const AddProductModal = ({ isOpen, onClose, onAddProduct, categories = [] }) => {
  // Form State
  const [productName, setProductName] = useState("");
  const [arabicName, setArabicName] = useState("");
  const [showArabic, setShowArabic] = useState(false);
  
  // ✅ NEW: Description State
  const [hasDescription, setHasDescription] = useState(false);
  const [description, setDescription] = useState("");

  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD"); 
  const [categoryId, setCategoryId] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(""); 

  // Variants State
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([{ name: "", arabicName: "", price: "" }]);
  
  // Search & Autocomplete State
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // UI State
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const categoryDropdownRef = useRef(null);
  const currencyDropdownRef = useRef(null); 
  const suggestionsRef = useRef(null);

  const CURRENCY_OPTIONS = [
    { label: "USD ($)", value: "USD" },
    { label: "INR (₹)", value: "INR" },
    { label: "AED", value: "AED" }
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setProductName("");
      setArabicName("");
      setShowArabic(false);
      setHasDescription(false); // ✅ Reset
      setDescription("");       // ✅ Reset
      setPrice("");
      setCurrency("USD"); 
      setCategoryId("");
      setImagePreview(null);
      setImageFile(null);
      setExistingImageUrl("");
      setHasVariants(false);
      setVariants([{ name: "", arabicName: "", price: "" }]);
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setIsCategoryDropdownOpen(false);
      setIsCurrencyDropdownOpen(false); 
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle outside clicks for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
        setIsCurrencyDropdownOpen(false);
      }
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- AUTOCOMPLETE DEBOUNCE LOGIC ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (productName.trim() && showSuggestions) {
        setIsSearching(true);
        try {
          const results = await searchGlobalMenuItems(productName);
          setSearchSuggestions(results);
        } catch (error) {
          console.error("Failed to fetch product suggestions:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [productName, showSuggestions]);

  // Handle selecting a product from the autocomplete list
  const handleSelectSuggestion = (product) => {
    setProductName(product.name);
    
    if (product.arabicName) {
      setArabicName(product.arabicName);
      setShowArabic(true);
    }
    
    // ✅ Load description if it exists
    if (product.description) {
      setHasDescription(true);
      setDescription(product.description);
    }

    setCurrency(product.currency || "USD"); 
    
    // Load existing variants if the suggested product has them
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      setHasVariants(true);
      setVariants(product.variants);
      setPrice(product.price ? product.price.toString() : ""); 
    } else {
      setHasVariants(false);
      setVariants([{ name: "", arabicName: "", price: "" }]);
      setPrice(product.price ? product.price.toString() : "");
    }

    if (product.categoryId?.name) {
      const matchedCategory = categories.find(
        c => c.name.toLowerCase() === product.categoryId.name.toLowerCase()
      );
      if (matchedCategory) {
        setCategoryId(matchedCategory.id);
      }
    }

    if (product.image?.gcsPath) {
      setImagePreview(product.image.gcsPath);
      setExistingImageUrl(product.image.gcsPath);
      setImageFile(null); 
    }

    setShowSuggestions(false);
  };

  // Handle manual image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setExistingImageUrl(""); 
      const tempUrl = URL.createObjectURL(file);
      setImagePreview(tempUrl);
    }
  };

  // Variant Handlers
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

  // Handle Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);

    try {
      // Calculate base price based on lowest variant (acts as "Starting From" price)
      let finalBasePrice = price;
      if (hasVariants) {
        const validVariantPrices = variants
          .map(v => parseFloat(v.price))
          .filter(p => !isNaN(p) && p > 0);
          
        if (validVariantPrices.length > 0) {
          finalBasePrice = Math.min(...validVariantPrices).toString();
        }
      }

      const formData = new FormData();
      formData.append("name", productName);
      formData.append("arabicName", arabicName);
      
      // ✅ Append new description data
      formData.append("description", hasDescription ? description : "");
      
      formData.append("price", finalBasePrice);
      formData.append("currency", currency); 
      formData.append("categoryId", categoryId);
      
      // Append variant data
      formData.append("hasVariants", hasVariants);
      if (hasVariants) {
        formData.append("variants", JSON.stringify(variants));
      }
      
      if (imageFile) {
        formData.append("image", imageFile);
      } else if (existingImageUrl) {
        formData.append("predefinedImage", existingImageUrl); 
      }

      await onAddProduct(formData);
      handleClose();
    } catch (error) {
      console.error("Failed to add product:", error);
      alert("Failed to add product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; 
    setProductName("");
    setArabicName("");
    setHasDescription(false); // ✅ Reset
    setDescription("");       // ✅ Reset
    setPrice("");
    setCurrency("USD");
    setCategoryId("");
    setImagePreview(null);
    setImageFile(null);
    setExistingImageUrl("");
    setHasVariants(false);
    setVariants([{ name: "", arabicName: "", price: "" }]);
    setIsCategoryDropdownOpen(false);
    setIsCurrencyDropdownOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  const selectedCategory = categories.find(cat => cat.id === categoryId);
  const categoryLabel = selectedCategory ? selectedCategory.name : "Select a category";
  const selectedCurrencyLabel = CURRENCY_OPTIONS.find(c => c.value === currency)?.label || "USD ($)";

  // Validation checking base fields AND variants if toggled
  const isBaseValid = productName.trim() && categoryId && (imageFile || existingImageUrl);
  const isPriceValid = hasVariants 
    ? variants.length > 0 && variants.every(v => v.name.trim() && v.price && parseFloat(v.price) > 0)
    : price && parseFloat(price) > 0;
  
  const isFormValid = isBaseValid && isPriceValid;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      ></div>

      <div className="bg-white w-full max-w-[500px] rounded-[28px] shadow-2xl relative flex flex-col animate-in fade-in zoom-in-95 duration-200 z-10 font-sans max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Add New Product</h2>
          <button 
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-8 w-8 bg-gray-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* 1. PRODUCT NAME WITH AUTOCOMPLETE & ARABIC TOGGLE */}
          <div className="relative z-40" ref={suggestionsRef}>
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
            
            <div className="relative">
              <input 
                type="text" 
                placeholder="e.g., Margherita Pizza" 
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  setShowSuggestions(true);
                }}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-slate-900 focus:outline-none focus:border-[#ff6b35] focus:shadow-[0_0_0_4px_rgba(255,107,53,0.1)] transition-all font-medium disabled:opacity-60"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                </div>
              )}
            </div>

            {showArabic && (
              <div className="mt-3 animate-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <input 
                    type="text" 
                    dir="rtl"
                    placeholder="اسم المنتج باللغة العربية" 
                    value={arabicName}
                    onChange={(e) => setArabicName(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-orange-50/30 border border-orange-200 rounded-2xl text-slate-900 focus:outline-none focus:border-[#ff6b35] focus:bg-white transition-all font-bold text-right"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-[10px] font-black text-orange-300 uppercase">AR</span>
                  </div>
                </div>
              </div>
            )}

            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden z-50">
                <div className="p-2 bg-gray-50/50 border-b border-gray-50 flex items-center gap-2">
                  <Search className="h-3 w-3 text-gray-400 ml-1" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Suggestions from database</span>
                </div>
                <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-2">
                  {searchSuggestions.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => handleSelectSuggestion(product)}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-orange-50 transition-colors text-left group"
                    >
                      <img 
                        src={product.image?.gcsPath || "https://via.placeholder.com/40"} 
                        alt={product.name} 
                        className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0 group-hover:border-orange-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#ff6b35] transition-colors">{product.name}</p>
                        <p className="text-xs font-medium text-gray-500 truncate">{product.categoryId?.name || "No Category"} • {product.currency === 'INR' ? '₹' : (product.currency === 'AED' ? 'AED ' : '$')}{product.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ✅ 1.5. NEW: ITEM DESCRIPTION COMPONENT */}
          <ProductDescriptionInput 
            hasDescription={hasDescription}
            setHasDescription={setHasDescription}
            description={description}
            setDescription={setDescription}
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-2 gap-4 relative z-20">
            {/* 2. CATEGORY DROPDOWN */}
            <div className="relative" ref={categoryDropdownRef}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
              <button 
                type="button"
                onClick={() => !isSubmitting && setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                disabled={isSubmitting || categories.length === 0}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-2xl transition-all disabled:opacity-60 disabled:bg-gray-50 ${
                  isCategoryDropdownOpen 
                    ? "border-[#ff6b35] shadow-[0_0_0_4px_rgba(255,107,53,0.1)]" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className={`font-medium truncate ${!selectedCategory ? 'text-gray-400' : 'text-slate-900'}`}>
                  {categories.length === 0 ? "No categories" : categoryLabel}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryDropdownOpen && categories.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
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

            {/* 3. CURRENCY DROPDOWN */}
            <div className="relative" ref={currencyDropdownRef}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Currency</label>
              <button 
                type="button"
                onClick={() => !isSubmitting && setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                disabled={isSubmitting}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-2xl transition-all disabled:opacity-60 disabled:bg-gray-50 ${
                  isCurrencyDropdownOpen 
                    ? "border-[#ff6b35] shadow-[0_0_0_4px_rgba(255,107,53,0.1)]" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="font-bold text-slate-700 text-sm truncate">
                  {selectedCurrencyLabel}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCurrencyDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
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

          {/* 4. PRICING SECTION & VARIANTS TOGGLE */}
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

            {/* CONDITIONAL PRICING UI */}
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
                  disabled={isSubmitting}
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

          {/* 5. IMAGE UPLOAD / PREVIEW */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">
                Product Image (PNG/JPG)
              </label>
              {existingImageUrl && !imageFile && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-[#ff6b35] px-2 py-1 rounded-md">Auto-filled</span>
              )}
            </div>
            
            <div className={`relative border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 transition-colors group ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100 hover:border-gray-400'}`}>
              <input 
                type="file" 
                accept="image/png, image/jpeg"
                onChange={handleImageChange}
                disabled={isSubmitting}
                className={`absolute inset-0 w-full h-full opacity-0 z-10 ${isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              />
              
              <div className="flex flex-col items-center justify-center p-6 h-40">
                {imagePreview ? (
                  <div className="relative w-28 h-28 rounded-2xl bg-white shadow-sm border border-gray-200 p-2 flex items-center justify-center">
                    <img src={imagePreview} alt="Preview" className="max-w-full max-h-full object-cover rounded-xl" />
                  </div>
                ) : (
                  <>
                    <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-gray-400 group-hover:text-[#ff6b35] transition-colors">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">Click to upload new image</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                  </>
                )}
              </div>
            </div>
          </div>
          
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-50 flex justify-end gap-3 bg-gray-50/30 rounded-b-[28px] flex-shrink-0">
          <button 
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm flex items-center gap-2 ${
                isFormValid && !isSubmitting
                ? 'bg-[#ff6b35] hover:bg-[#ff5a1f] active:scale-95 shadow-[#ff6b35]/20' 
                : 'bg-slate-200 cursor-not-allowed text-slate-400'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Add to Menu"
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddProductModal;