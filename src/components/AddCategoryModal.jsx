import React, { useState, useEffect, useRef } from "react";
import { X, UploadCloud, Loader2, Search, CheckCircle2 } from "lucide-react";

export const AddCategoryModal = ({ 
  isOpen, 
  onClose, 
  onAddCategory, 
  // ✅ NEW: Receive global categories from the database via props
  globalCategories = [] 
}) => {
  // Search & Predefined State
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPredefined, setSelectedPredefined] = useState(null);

  // Image & Upload State
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const searchDropdownRef = useRef(null);

  const handleClose = () => {
    if (isSubmitting) return; 
    setSearchTerm("");
    setImagePreview(null);
    setImageFile(null);
    setSelectedPredefined(null);
    onClose();
  };

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedPredefined(null);
      setImagePreview(null);
      setImageFile(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Close suggestions if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Typing in the Category Name field
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // If they edit the text after selecting a predefined category, unlink it
    if (selectedPredefined && value !== selectedPredefined.name) {
      setSelectedPredefined(null);
      setImagePreview(null);
      setImageFile(null);
    }

    if (value.trim().length > 0) {
      // ✅ UPDATED: Filter using the dynamic globalCategories from the database
      const filtered = globalCategories.filter(item => 
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle selecting a predefined category from the dropdown
  const handleSelectPredefined = (category) => {
    // Determine the image URL based on MongoDB structure
    const imageUrl = category.image?.gcsPath || category.image;

    setSelectedPredefined(category);
    setSearchTerm(category.name);
    setImagePreview(imageUrl);
    setImageFile(null); // Clear any manually uploaded file
    setShowSuggestions(false);
  };

  // Handle manual image file selection (for custom categories)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); 
      const tempUrl = URL.createObjectURL(file);
      setImagePreview(tempUrl);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      alert("Please enter a category name.");
      return;
    }

    if (!imageFile && !selectedPredefined) {
      alert("Please provide an image for the custom category.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create FormData object
      const formData = new FormData();
      formData.append("name", searchTerm);
      
      // ✅ UPDATED: Vastly simplified image handling based on backend capabilities
      if (selectedPredefined && !imageFile) {
         // Instead of fetching a Blob to bypass CORS, we just pass the URL string 
         // since your createCategoryController supports `req.body.predefinedImage`
         const imageUrl = selectedPredefined.image?.gcsPath || selectedPredefined.image;
         formData.append("predefinedImage", imageUrl);
      } else {
         // Pass the actual file for brand new manual uploads
         formData.append("image", imageFile);
      }
      
      // 2. Pass formData to the parent component
      await onAddCategory(formData);
      
      // 3. Close modal on success
      handleClose();
    } catch (error) {
      console.error("Failed to add category:", error);
      alert("Failed to save category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dark overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-900">Add New Category</h2>
          <button 
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-8 w-8 bg-gray-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          
          {/* 1. Category Name Autocomplete Input */}
          <div className="relative mb-6 z-20" ref={searchDropdownRef}>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Category Name
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="e.g. Breakfast, Desserts"
                disabled={isSubmitting}
                className={`w-full pl-12 pr-12 py-3 bg-white border ${selectedPredefined ? 'border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35] transition-all disabled:opacity-60`}
              />
              {selectedPredefined && (
                <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden max-h-[200px] overflow-y-auto">
                {suggestions.map((item) => {
                  const imageUrl = item.image?.gcsPath || item.image || "/fallback-category.png";
                  return (
                    <button
                      key={item._id || item.name}
                      type="button"
                      onClick={() => handleSelectPredefined(item)}
                      className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 transition-colors text-left border-b border-gray-50 last:border-0"
                    >
                      <img src={imageUrl} alt={item.name} className="w-8 h-8 rounded-lg object-contain bg-white border border-gray-100 p-1" />
                      <span className="font-semibold text-slate-800">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Image Upload Area */}
          <div className="mb-6 relative z-10">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Category Image (PNG/JPG)
            </label>
            
            {selectedPredefined ? (
              // Predefined Category Selected UI
              <div className="relative border border-emerald-200 bg-emerald-50/50 rounded-xl p-6 flex flex-col items-center justify-center h-40">
                <div className="relative w-20 h-20 rounded-2xl bg-white shadow-sm border border-emerald-100 p-2 flex items-center justify-center mb-3">
                  <img src={imagePreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                </div>
                <p className="text-sm font-bold text-emerald-700">Standard database image linked automatically</p>
              </div>
            ) : (
              // Custom Category Manual Upload UI
              <div className={`relative border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 transition-colors group ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100'}`}>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  className={`absolute inset-0 w-full h-full opacity-0 z-10 ${isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                />
                
                <div className="flex flex-col items-center justify-center p-6 h-40">
                  {imagePreview ? (
                    <div className="relative w-24 h-24 rounded-2xl bg-white shadow-sm border border-gray-200 p-2 flex items-center justify-center">
                      <img src={imagePreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <>
                      <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-gray-400 group-hover:text-[#ff6b35] transition-colors">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600">Click to upload image</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#ff6b35] hover:bg-[#ff5a1f] text-white font-bold rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Category"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;