import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';

export const RestaurantList = ({ refreshTrigger }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch restaurants
  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      // Fetching from backend (now sorted by newest first)
      const response = await apiClient.get('/api/restaurants');
      setRestaurants(response.data);
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to Toggle Status
  const handleToggleStatus = async (slug, currentStatus) => {
    try {
      // Optimistic UI Update: Change the UI immediately before the API responds
      // This makes the button feel instant
      setRestaurants(prev => prev.map(r => 
        r.slug === slug ? { ...r, isActive: !currentStatus } : r
      ));

      // Call API to actually update the database
      await apiClient.put(`/api/restaurants/${slug}/toggle-status`);
      
    } catch (error) {
      console.error("Failed to toggle status:", error);
      // If the API fails, revert the change by re-fetching the real data
      fetchRestaurants(); 
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [refreshTrigger]);

  return (
    <>
      {/* CSS TRICK TO HIDE SCROLLBAR */}
      <style>{`
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
        .hide-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Added 'hide-scroll' class here */}
      <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/50 h-full max-h-[800px] overflow-y-auto hide-scroll">
        
        <h3 className="text-2xl font-bold mb-6 sticky top-0 bg-white pb-4 border-b border-gray-100 z-10">
          Existing Menus <span className="text-orange-500">({restaurants.length})</span>
        </h3>

        {loading ? (
          <div className="text-center text-gray-400 py-10">Loading...</div>
        ) : (
          <div className="space-y-4">
            {restaurants.map((rest) => {
              // Determine if active. Default to true if the field is missing (for old records).
              const isActive = rest.isActive !== false; 

              return (
                <div 
                  key={rest._id} 
                  className={`group border rounded-2xl p-4 transition-all ${
                    isActive 
                      ? 'border-gray-100 hover:border-orange-200 hover:bg-orange-50/30' 
                      : 'border-red-100 bg-gray-50 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    
                    {/* TOGGLE BUTTON */}
                    <button
                      onClick={() => handleToggleStatus(rest.slug, isActive)}
                      title={isActive ? "Pause Hosting" : "Resume Hosting"}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm shrink-0 ${
                        isActive 
                          ? 'bg-green-100 text-green-600 hover:bg-red-100 hover:text-red-600' 
                          : 'bg-gray-200 text-gray-500 hover:bg-green-100 hover:text-green-600'
                      }`}
                    >
                      {isActive ? (
                        // PAUSE ICON (Shows when currently active, turns to pause on hover)
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                        </svg>
                      ) : (
                        // PLAY ICON (Shows when currently paused)
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1">
                          <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    {/* DETAILS */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold truncate transition-colors ${isActive ? 'text-gray-800' : 'text-gray-500 line-through'}`}>
                          {rest.name}
                        </h4>
                        {!isActive && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            PAUSED
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 flex flex-col gap-1 mt-1">
                        <span className="flex items-center gap-1 font-medium">
                          📞 {rest.whatsappNumber ? rest.whatsappNumber : "No Number"}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          📄 {rest.pageCount || 0} Pages
                        </span>
                      </div>
                    </div>

                    {/* LINK ARROW (Only clickable if active) */}
                    {isActive ? (
                      <a 
                        href={`/${rest.slug}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-orange-500 group-hover:text-white transition-colors"
                      >
                        ➝
                      </a>
                    ) : (
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-300 cursor-not-allowed">
                        ✕
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
            
            {restaurants.length === 0 && (
              <p className="text-center text-gray-400 py-4">No restaurants found.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
};