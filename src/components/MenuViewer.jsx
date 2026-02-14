import React, { useEffect, useRef } from "react";
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
// Import Swiper styles
import 'swiper/css';

import { useAtom } from "jotai";
import { pageAtom } from "./atoms";

export const MenuViewer = ({ pages }) => {
  const [page, setPage] = useAtom(pageAtom);
  const swiperRef = useRef(null);

  // SYNC LOGIC: 
  // Watch for changes in the 'page' atom (from the UI buttons at the bottom)
  // and slide the Carousel to match.
  useEffect(() => {
    if (swiperRef.current && swiperRef.current.activeIndex !== page) {
      swiperRef.current.slideTo(page);
    }
  }, [page]);

  if (!pages || pages.length === 0) return null;

  return (
    // OUTER CONTAINER
    // Keeps the dark background and fixed positioning
    <div className="fixed inset-0 z-0 flex items-center justify-center bg-gray-900 h-[100dvh]">
      
      {/* SLIDER CONTAINER */}
      {/* UPDATED FOR MAXIMUM VISIBILITY:
         1. pt-[60px]: Pushes image higher up (closer to logo).
         2. pb-[80px]: Pushes image lower down (closer to buttons).
         3. max-w-[1200px]: Allows image to be wider on large screens.
      */}
      <div className="w-full h-full max-w-[1200px] flex items-center justify-center pt-[80px] pb-[80px] md:py-4">
        
        <Swiper
          spaceBetween={10} // Reduced gap between pages
          slidesPerView={1}
          className="w-full h-full"
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          onSlideChange={(swiper) => setPage(swiper.activeIndex)} // Update the UI buttons when user swipes
        >
          {pages.map((imgUrl, index) => (
            <SwiperSlide key={index} className="flex items-center justify-center">
               {/* slide container: 
                  Use relative positioning to contain the image.
                  p-0 removes any inner padding so image touches edges.
               */}
               <div className="relative w-full h-full flex items-center justify-center p-0">
                  <img
                    src={imgUrl}
                    alt={`Page ${index + 1}`}
                    // object-contain: ensures the whole menu page is visible (no cropping)
                    // max-h-full: prevents it from overflowing vertically
                    className="max-h-full max-w-full object-contain shadow-2xl rounded-lg select-none"
                  />
               </div>
            </SwiperSlide>
          ))}
        </Swiper>

      </div>
    </div>
  );
};