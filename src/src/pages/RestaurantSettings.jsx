import React, { useState, useEffect } from "react";
// NEW: Added Plus icon to your imports
import { Store, Search, MapPin, CheckCircle2, Trash2, Pause, Play, Plus } from "lucide-react";
import apiClient from "../api/apiClient"; 
import { AdminSidebar } from "../components/AdminSidebar";
import { ConfirmModal } from "../components/ConfirmModal";
import { RestaurantEditPanel } from "../components/RestaurantEditPanel"; 
// NEW: Import the Add Modal we just created
import AddRestaurantModal from "../components/AddRestaurantModal"; 

const RestaurantSettings = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal & Panel States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false); 
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // NEW: State for the Add Restaurant Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/api/restaurants"); 
      const data = response.data.restaurants || response.data;
      setRestaurants(data);
      if (data.length > 0) setSelectedRestaurant(data[0]);
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- DELETE LOGIC ---
  const handleDeleteClick = (e, resto) => {
    e.stopPropagation(); 
    setRestaurantToDelete(resto);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!restaurantToDelete) return;
    try {
      setIsDeleting(true);
      await apiClient.delete(`/api/restaurants/${restaurantToDelete._id}`);
      
      setRestaurants(prev => prev.filter(r => r._id !== restaurantToDelete._id));
      if (selectedRestaurant?._id === restaurantToDelete._id) {
        setSelectedRestaurant(null);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to delete restaurant:", error);
      alert("Could not delete the restaurant. Please try again.");
    } finally {
      setIsDeleting(false);
      setRestaurantToDelete(null);
    }
  };

  // --- PAUSE LOGIC ---
  const handleToggleStatus = async (e, resto) => {
    e.stopPropagation();
    const newStatus = resto.isActive === false ? true : false; 
    
    // Optimistic UI Update
    setRestaurants(prev => prev.map(r => 
      r._id === resto._id ? { ...r, isActive: newStatus } : r
    ));

    try {
      await apiClient.patch(`/api/restaurants/${resto._id}/toggle-status`, { 
        isActive: newStatus 
      });
    } catch (error) {
      console.error("Failed to toggle status:", error);
      setRestaurants(prev => prev.map(r => 
        r._id === resto._id ? { ...r, isActive: !newStatus } : r
      ));
      alert("Failed to update status.");
    }
  };

  const filteredRestaurants = restaurants.filter(resto => {
    const query = searchQuery.toLowerCase();
    const nameMatch = resto.name?.toLowerCase().includes(query);
    const addressMatch = resto.fullAddress?.toLowerCase().includes(query);
    return nameMatch || addressMatch;
  });

  return (
    <div className="flex h-screen bg-[#F2F4F6]">
      <AdminSidebar />
      
      <div className="flex-1 overflow-y-auto p-6 md:p-8 hide-scrollbar">
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Restaurant Settings</h1>
              <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-wider">Manage your restaurants</p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text"
                placeholder="Find a restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-transparent focus:border-orange-500 rounded-2xl pl-12 pr-4 py-3 outline-none font-bold text-slate-700 shadow-sm transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-600 font-bold">×</button>
              )}
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4].map(n => <div key={n} className="bg-white h-48 rounded-[2rem] border border-gray-100 shadow-sm"></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              
              {/* NEW: The "Add New" Card - Only shows if not currently searching */}
              {!searchQuery && (
                <div
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex flex-col items-center justify-center text-center p-6 rounded-[2rem] border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50/30 transition-all duration-300 h-full min-h-[190px] cursor-pointer group"
                >
                  <div className="h-16 w-16 rounded-3xl flex items-center justify-center mb-4 border-2 border-dashed border-gray-300 group-hover:border-orange-400 group-hover:bg-white transition-all duration-300">
                    <Plus className="h-8 w-8 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-500 group-hover:text-orange-600 transition-colors">
                    Add New
                  </h3>
                </div>
              )}

              {/* Existing Restaurant Mapped Cards */}
              {filteredRestaurants.length > 0 ? (
                filteredRestaurants.map((resto) => {
                  const isSelected = selectedRestaurant?._id === resto._id;
                  const isPaused = resto.isActive === false;

                  return (
                    <div
                      key={resto._id}
                      onClick={() => {
                        setSelectedRestaurant(resto);
                        setIsEditPanelOpen(true); 
                      }}
                      className={`text-left relative p-6 rounded-[2rem] border-2 transition-all duration-300 group flex flex-col h-full cursor-pointer ${
                        isSelected 
                          ? "bg-white border-orange-500 shadow-lg shadow-orange-500/10 scale-[1.02]" 
                          : "bg-white border-transparent shadow-sm hover:border-orange-200 hover:shadow-md hover:-translate-y-1"
                      } ${isPaused ? "opacity-75 grayscale-[50%]" : ""}`}
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                        <button 
                          onClick={(e) => handleToggleStatus(e, resto)}
                          className={`p-2 rounded-xl transition-colors ${isPaused ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-slate-600 hover:bg-orange-100 hover:text-orange-500'}`}
                          title={isPaused ? "Publish Restaurant" : "Pause Restaurant"}
                        >
                          {isPaused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4 fill-current" />}
                        </button>
                        <button 
                          onClick={(e) => handleDeleteClick(e, resto)}
                          className="p-2 rounded-xl bg-gray-100 text-slate-600 hover:bg-red-100 hover:text-red-500 transition-colors"
                          title="Delete Restaurant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {isSelected && (
                        <div className="absolute top-4 right-4 text-orange-500 animate-in zoom-in duration-200 group-hover:opacity-0 transition-opacity">
                          <CheckCircle2 className="h-6 w-6 fill-orange-50" />
                        </div>
                      )}

                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                        isSelected ? "bg-orange-50" : "bg-gray-50 group-hover:bg-orange-50/50"
                      }`}>
                        {resto.logoAssetId?.gcsPath ? (
                          <img src={resto.logoAssetId.gcsPath} alt="logo" className="h-full w-full object-contain p-2" />
                        ) : (
                          <Store className={`h-7 w-7 ${isSelected ? "text-orange-500" : "text-slate-400"}`} />
                        )}
                      </div>

                      <h3 className="text-lg font-black text-slate-900 mb-1 line-clamp-1">
                        {resto.name}
                      </h3>
                      
                      {isPaused && (
                         <span className="inline-block px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-md mb-2 w-max uppercase tracking-wider">
                           Paused
                         </span>
                      )}
                      
                      <div className="flex items-start gap-1.5 text-slate-500 mt-auto pt-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 opacity-70" />
                        <span className="text-sm font-medium leading-tight line-clamp-2">
                          {resto.fullAddress || "No address provided"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                // If searching and no results show up
                searchQuery && (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-dashed border-gray-200">
                    <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Store className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No restaurants found</h3>
                    <p className="text-gray-400 text-sm font-medium mt-1">
                      We couldn't find anything matching "{searchQuery}"
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete Restaurant?"
        message={`Are you sure you want to permanently delete "${restaurantToDelete?.name}"? This will erase all its associated menus, categories, and settings. This action cannot be undone.`}
      />

      <RestaurantEditPanel 
        isOpen={isEditPanelOpen}
        onClose={() => setIsEditPanelOpen(false)}
        restaurant={selectedRestaurant}
        onUpdateSuccess={(updatedResto) => {
          setRestaurants(prev => prev.map(r => r._id === updatedResto._id ? updatedResto : r));
          setSelectedRestaurant(updatedResto);
        }}
      />

      {/* NEW: Mount the Add Restaurant Modal */}
      <AddRestaurantModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={(newResto) => {
          // Add the newly created restaurant to the top of the list!
          setRestaurants(prev => [newResto, ...prev]);
        }} 
      />

    </div>
  );
};

export default RestaurantSettings;