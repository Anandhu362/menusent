import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getRestaurantBySlug } from '../api/restaurant.api';
import { BannerDisplay } from '../components/BannerDisplay';
import { Dishes } from '../components/Dishes'; 

const Menu = ({ onClose }) => {
  // 1. Get the restaurant slug from the URL
  const { slug } = useParams();
  
  // 2. State for banners and loading
  const [banners, setBanners] = useState(null);
  const [loading, setLoading] = useState(true);

  // 3. Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await getRestaurantBySlug(slug);
        setBanners(data.banners);
      } catch (error) {
        console.error("Failed to fetch menu data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  return (
    // THEME: White background
    <div className="fixed inset-0 z-50 bg-white animate-fade-in flex justify-center">
      
      {/* GLOBAL STYLES (Swiper styles removed, kept scrollbar utility) */}
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 md:top-8 md:right-8 text-gray-800 hover:text-[#FF4F18] transition-colors z-[60] bg-gray-100 rounded-full p-2 shadow-sm"
        aria-label="Close Menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* SCROLLABLE WRAPPER */}
      <div className="w-full max-w-7xl h-full overflow-y-auto no-scrollbar px-4 md:px-0">
        
        {/* =========================================
            SECTION 1: HERO BANNER (Dynamic)
           ========================================= */}
        <div className="w-full min-h-[50vh] flex flex-col justify-center py-6 md:py-10">
          
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 text-center mb-6 md:mb-10 tracking-wider uppercase">
            Special <span className="text-[#FF4F18]">Offers</span>
          </h2>
          
          {/* Replaces both the Swiper (Mobile) and Grid (Desktop) */}
          <div className="w-full">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4F18]"></div>
              </div>
            ) : (
              // Banners prop is passed directly from API response
              <BannerDisplay banners={banners} />
            )}
          </div>

        </div>

        {/* =========================================
            SECTION 2: POPULAR DISHES
           ========================================= */}
        <Dishes />

      </div>
    </div>
  );
};

export default Menu;