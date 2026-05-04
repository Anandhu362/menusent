import React, { useState, useEffect } from "react";
import { Search, Plus, Edit3, Trash2, Filter, UtensilsCrossed, Store, X, Eye, EyeOff } from "lucide-react";

import { AdminSidebar } from "../components/AdminSidebar";
import { AddProductModal } from "../components/AddProductModal";
import { EditProductModal } from "../components/EditProductModal";
import { RemoveProductModal } from "../components/RemoveProductModal";
import { CategoryManagement } from "../components/CategoryManagement";
import { AddCategoryModal } from "../components/AddCategoryModal";
import { EditCategoryImageModal } from "../components/EditCategoryImageModal";

// Import the Universal Stock Settings component
import { UniversalStockSettings } from "../components/UniversalStockSettings";

// --- GLOBAL AUTHENTICATION ---
import { useAuth } from "../context/AuthContext";

// --- API IMPORTS ---
import { removeMenuItemFromRestaurant } from "../api/restaurant.api.js";
import {
  addCategory,
  getCategoriesByRestaurant,
  updateCategoryOrder,
  updateCategoryImage,
  getGlobalCategories,
} from "../api/category.api.js";
import { 
  addMenuItem, 
  getMenuItemsByRestaurant, 
  updateMenuItem,
  toggleItemActiveStatus
} from "../api/menuItem.api.js";

const MenuManagement = () => {
  const { user } = useAuth();
  const selectedRestaurantId = user?.restaurantId;

  // Global Categories State
  const [globalCategories, setGlobalCategories] = useState([]);

  // Real DB States for THIS Restaurant
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [productToRemove, setProductToRemove] = useState(null);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  // State for the Edit Category Image Flow
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [categoryToEditImage, setCategoryToEditImage] = useState(null);

  // Helper function for dynamic currency symbols
  const getCurrencySymbol = (currency) => {
    if (currency === "INR") return "₹";
    if (currency === "AED") return "AED ";
    return "$"; // Default to USD
  };

  // --- 1. FETCH DATA STRICTLY FOR THE LOGGED-IN RESTAURANT ---
  useEffect(() => {
    const fetchRestaurantData = async () => {
      // Prevent fetching if no restaurant is linked to this account
      if (!selectedRestaurantId) return; 

      try {
        const [globalCatsData, categoriesData, menuItemsData] = await Promise.all([
          getGlobalCategories(),
          getCategoriesByRestaurant(selectedRestaurantId),
          getMenuItemsByRestaurant(selectedRestaurantId),
        ]);
        
        setGlobalCategories(globalCatsData || []);
        setCategories(categoriesData || []);
        setMenuItems(menuItemsData || []);
      } catch (error) {
        console.error("Failed to fetch restaurant data:", error);
      }
    };
    fetchRestaurantData();
  }, [selectedRestaurantId]); // Re-run if the user changes/logs in

  // --- 2. DRAG & DROP HANDLER WITH ROLLBACK ---
  const handleCategoryOrderChange = async (newOrderedCategories) => {
    const originalCategories = [...categories];
    setCategories(newOrderedCategories);

    try {
      const orderedIds = newOrderedCategories.map((cat) => cat._id || cat.id);
      await updateCategoryOrder({ orderedIds });
      console.log("Category order synced with DB");
    } catch (error) {
      console.error("Failed to sync category order:", error);
      setCategories(originalCategories);
      alert("Could not save new order. Please ensure the backend /reorder route is implemented.");
    }
  };

  // --- FORMATTING ---
  const formattedCategories = categories.map((c) => ({
    _id: c._id,
    id: c._id,
    name: c.name,
    image: c.image?.gcsPath || c.image || "",
  }));

  const filteredItems = menuItems.filter((item) => {
    const categoryName = item.categoryId?.name || "";
    return (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // --- CATEGORY HANDLERS ---
  const handleSaveNewCategory = async (formData) => {
    try {
      formData.append("restaurantId", selectedRestaurantId);
      const response = await addCategory(formData);
      setCategories((prev) => [...prev, response.category]);
      setIsAddCategoryModalOpen(false);
      
      const freshGlobalCats = await getGlobalCategories();
      setGlobalCategories(freshGlobalCats);
      
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleOpenEditCategoryModal = (category) => {
    setCategoryToEditImage(category); 
    setIsEditCategoryModalOpen(true);
  };

  const handleUpdateCategoryImage = async (formData) => {
    if (!categoryToEditImage) return;

    try {
      const categoryId = categoryToEditImage._id || categoryToEditImage.id;
      const response = await updateCategoryImage(categoryId, formData);

      setCategories((prevItems) =>
        prevItems.map((item) =>
          (item._id === categoryId || item.id === categoryId) ? response.category : item
        )
      );

      const freshGlobalCats = await getGlobalCategories();
      setGlobalCategories(freshGlobalCats);

      setIsEditCategoryModalOpen(false);
      setCategoryToEditImage(null);
    } catch (error) {
      console.error("Error updating category image:", error);
      alert("Failed to update category image.");
    }
  };

  // --- ITEM HANDLERS ---
  const handleAddNewItem = async (formData) => {
    try {
      formData.append("restaurantId", selectedRestaurantId);
      const response = await addMenuItem(formData);
      setMenuItems((prev) => [response.menuItem, ...prev]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error saving menu item:", error);
    }
  };

  const handleUpdateItem = async (updatedProductData) => {
    try {
      const selectedCat = categories.find(
        (c) =>
          c.name === updatedProductData.category ||
          c._id === (updatedProductData.categoryId?._id || updatedProductData.categoryId)
      );

      if (!selectedCat) {
        console.error("Category not found for update");
        return;
      }

      // ✅ FIX: Added the description field to the payload being sent to the API
      const payload = {
        name: updatedProductData.name,
        arabicName: updatedProductData.arabicName || "",
        description: updatedProductData.description || "", 
        price: parseFloat(updatedProductData.price),
        hasVariants: updatedProductData.hasVariants,
        variants: updatedProductData.hasVariants ? JSON.stringify(updatedProductData.variants) : "[]",
        currency: updatedProductData.currency,
        categoryId: selectedCat._id || selectedCat.id,
      };

      const response = await updateMenuItem(updatedProductData._id, payload);

      setMenuItems((prevItems) =>
        prevItems.map((item) => (item._id === updatedProductData._id ? response.menuItem : item))
      );

      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating menu item:", error);
      alert("Failed to update item.");
    }
  };

  const confirmRemove = async () => {
    if (!productToRemove || !selectedRestaurantId) return;

    try {
      await removeMenuItemFromRestaurant(selectedRestaurantId, productToRemove._id);
      setMenuItems((prevItems) => prevItems.filter((item) => item._id !== productToRemove._id));
      setIsRemoveModalOpen(false);
      setProductToRemove(null);
    } catch (error) {
      console.error("Error removing item from restaurant:", error);
      alert("Failed to remove the product.");
    }
  };

  // --- TOGGLE ACTIVE STATUS HANDLER ---
  const handleToggleActive = async (item) => {
    const newActiveState = item.isActive !== false ? false : true;

    try {
      await toggleItemActiveStatus(item._id);

      // Instantly update the local state to trigger the UI changes
      setMenuItems((prevItems) =>
        prevItems.map((mItem) =>
          mItem._id === item._id ? { ...mItem, isActive: newActiveState } : mItem
        )
      );
    } catch (error) {
      console.error("Error toggling item visibility:", error);
      alert("Failed to update item visibility.");
    }
  };

  return (
    <div className="flex h-screen bg-[#f8f9fb] font-sans">
      <AdminSidebar />
      <main className="flex-1 h-full overflow-y-auto relative z-10 pl-0">
        
        {/* Responsive Header */}
        <header className="h-20 bg-white border-b border-gray-100 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3 lg:gap-6 min-w-0">
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 truncate">Menu Management</h2>
            
            <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 lg:px-4 py-2 lg:py-2.5 flex-shrink-0">
              <Store className="h-3.5 w-3.5 text-[#ff6b35]" />
              <span className="text-xs lg:text-sm font-extrabold text-slate-800 whitespace-nowrap">
                My Menu
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 lg:gap-2 bg-[#ff6b35] text-white px-3 lg:px-5 py-2 lg:py-2.5 rounded-full text-xs lg:text-sm font-bold shadow-md"
            >
              <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="hidden sm:inline whitespace-nowrap">Add New Product</span>
            </button>
          </div>
        </header>

        {/* Responsive Main Container Paddings */}
        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto pb-12">
          
          {/* Universal Stock Settings Panel Added Here */}
          <UniversalStockSettings />

          <CategoryManagement
            categories={formattedCategories}
            onAddCategory={() => setIsAddCategoryModalOpen(true)}
            onOrderChange={handleCategoryOrderChange}
            onEditCategory={handleOpenEditCategoryModal} 
          />

          {/* Responsive Search and Title Layout */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h3 className="text-base lg:text-lg font-bold text-slate-900 whitespace-nowrap">
              All Food Items <span className="text-gray-400 font-medium ml-1 lg:ml-2">({filteredItems.length})</span>
            </h3>
            
            <div className="relative w-full sm:w-64 lg:w-80 flex-shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search food items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 lg:py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35] transition-all shadow-sm font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {filteredItems.length === 0 ? (
             <div className="text-center py-12 lg:py-16 bg-white rounded-[24px] border border-gray-100 shadow-sm mt-4">
               <UtensilsCrossed className="mx-auto h-10 w-10 lg:h-12 lg:w-12 text-gray-300 mb-4" />
               <p className="text-lg lg:text-xl font-bold text-slate-700">No food items found</p>
               <p className="text-slate-400 text-xs lg:text-sm mt-2 font-medium">Try adjusting your search criteria or add a new product.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {filteredItems.map((item) => {
                let displayPrice = item.price;
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

                // Treat undefined isActive as true for legacy items
                const isItemActive = item.isActive !== false;

                return (
                  <div
                    key={item._id}
                    className={`bg-white rounded-[20px] p-4 lg:p-5 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-all relative ${!isItemActive ? 'bg-gray-50' : ''}`}
                  >
                    {item.hasVariants && item.variants && item.variants.length > 0 && (
                      <div className="absolute top-2 lg:top-3 right-2 lg:right-3 bg-orange-100 text-[#ff6b35] text-[9px] lg:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md z-10">
                        {item.variants.length} Sizes
                      </div>
                    )}

                    <div className="flex items-start gap-3 lg:gap-4 mb-3 lg:mb-4">
                      {/* Scaled down image on tablets for more text room */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.image?.gcsPath}
                          alt={item.name}
                          className={`w-20 h-20 lg:w-24 lg:h-24 rounded-2xl object-cover border border-gray-100 bg-gray-50 transition-all duration-300 ${!isItemActive ? 'opacity-40 grayscale' : ''}`}
                        />
                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleToggleActive(item)}
                          className="absolute -top-2 -left-2 bg-white border border-gray-200 p-1 lg:p-1.5 rounded-full z-10 hover:bg-gray-100 transition-colors shadow-sm"
                          title={isItemActive ? "Hide from Menu" : "Show on Menu"}
                        >
                          {isItemActive ? (
                            <Eye className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-slate-600" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-400" />
                          )}
                        </button>
                      </div>

                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className={`text-base lg:text-lg font-bold truncate pr-6 ${!isItemActive ? 'text-slate-500' : 'text-slate-900'}`}>
                            {item.name}
                          </h4>
                        </div>
                        
                        {item.description && (
                          <p className="text-[11px] lg:text-xs text-gray-500 font-medium line-clamp-1 mb-0.5 mt-0.5">
                            {item.description}
                          </p>
                        )}

                        {item.arabicName && (
                          <p
                            dir="rtl"
                            className={`text-xs lg:text-sm font-bold leading-tight mb-1 truncate ${!isItemActive ? 'text-orange-600/50' : 'text-orange-600/90'}`}
                          >
                            {item.arabicName}
                          </p>
                        )}

                        <p className="text-[11px] lg:text-sm text-gray-500 font-medium mb-1 mt-1 truncate">{item.categoryId?.name}</p>
                        
                        <p className={`text-lg lg:text-xl font-extrabold ${!isItemActive ? 'text-gray-400' : 'text-[#ff6b35]'}`}>
                          {isFrom && <span className="text-[10px] lg:text-xs font-bold text-gray-400 mr-1 uppercase">From</span>}
                          {getCurrencySymbol(item.currency)}{Number(displayPrice).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 lg:gap-3 pt-3 lg:pt-4 border-t border-gray-50">
                      <button
                        onClick={() => {
                          setProductToEdit(item);
                          setIsEditModalOpen(true);
                        }}
                        className="flex-1 bg-slate-50 text-slate-600 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold hover:bg-slate-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setProductToRemove(item);
                          setIsRemoveModalOpen(true);
                        }}
                        className="flex-1 bg-red-50 text-red-500 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold hover:bg-red-100 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleAddNewItem}
        categories={formattedCategories}
      />
      
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onAddCategory={handleSaveNewCategory}
        globalCategories={globalCategories} 
      />
      
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={productToEdit}
        onUpdateProduct={handleUpdateItem}
        categories={formattedCategories}
      />
      
      <RemoveProductModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={confirmRemove}
        productName={productToRemove?.name}
      />
      
      <EditCategoryImageModal
        isOpen={isEditCategoryModalOpen}
        onClose={() => setIsEditCategoryModalOpen(false)}
        category={categoryToEditImage} 
        onUpdateImage={handleUpdateCategoryImage} 
      />

    </div>
  );
};

export default MenuManagement;