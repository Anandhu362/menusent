import React from 'react';

// This component expects a 'banners' prop with the structure defined in the model
export const BannerDisplay = ({ banners }) => {
  // Fallback defaults in case data is missing (prevents crashes)
  const main = banners?.main || {};
  const sideTop = banners?.sideTop || {};
  const sideBottom = banners?.sideBottom || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[500px] w-full px-4">
      
      {/* 1. LEFT LARGE BANNER */}
      <div 
        className="col-span-1 md:col-span-2 rounded-[2.5rem] relative overflow-hidden shadow-xl group flex items-center transition-colors duration-300 min-h-[300px]"
        style={{ backgroundColor: main.bgColor || '#EAB308' }}
      >
        <div className="relative z-10 p-8 md:p-12 flex flex-col items-start justify-center h-full w-1/2">
          <span className="text-red-600 font-bold text-lg mb-2">{main.subtitle || 'Subtitle'}</span>
          <h3 className="text-4xl md:text-6xl font-black text-white uppercase leading-[0.9] mb-4 drop-shadow-sm whitespace-pre-line">
            {main.title || 'Main Title Here'}
          </h3>
          <button className="bg-[#FF4F18] text-white font-bold py-3 px-8 md:py-4 md:px-10 rounded-full shadow-lg uppercase mt-4 hover:bg-white hover:text-[#FF4F18] transition-colors">
            Shop Now
          </button>
        </div>
        <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[60%] h-[80%] transition-transform duration-500 group-hover:scale-105">
           {main.image ? (
             <img src={main.image} alt="Main Banner" className="w-full h-full object-contain drop-shadow-2xl" />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-white/20 font-black text-4xl border-2 border-dashed border-white/20 rounded-xl">NO IMAGE</div>
           )}
        </div>
      </div>

      {/* 2. RIGHT COLUMN */}
      <div className="col-span-1 flex flex-col gap-6 h-full">
        
        {/* Top Side */}
        <div 
          className="flex-1 rounded-[2.5rem] relative overflow-hidden shadow-lg group p-6 flex items-center transition-colors min-h-[200px]"
          style={{ backgroundColor: sideTop.bgColor || '#D97746' }}
        >
           <div className="w-1/2 z-10">
              <span className="text-white/80 text-xs font-bold uppercase mb-1">{sideTop.subtitle || 'Subtitle'}</span>
              <h4 className="text-2xl font-black text-white leading-tight mb-4">{sideTop.title || 'Title'}</h4>
              <span className="text-[#FFD700] font-black text-2xl">{sideTop.price || '$0.00'}</span>
           </div>
           <div className="absolute right-[-20px] bottom-[-20px] w-[60%] transition-transform duration-500 group-hover:rotate-6">
              {sideTop.image ? (
                <img src={sideTop.image} alt="Side Top" className="w-full object-contain drop-shadow-xl" />
              ) : (
                <div className="w-full h-24 flex items-center justify-center text-white/20 font-bold border-2 border-dashed border-white/20 rounded-lg">NO IMAGE</div>
              )}
           </div>
        </div>

        {/* Bottom Side */}
        <div 
          className="flex-1 rounded-[2.5rem] relative overflow-hidden shadow-lg group p-8 flex flex-col justify-center transition-colors min-h-[200px]"
          style={{ backgroundColor: sideBottom.bgColor || '#2D1A16' }}
        >
           <div className="relative z-10">
              <h4 className="text-3xl font-black text-[#FFE4C4] leading-tight whitespace-pre-line">
                {sideBottom.title || 'Delicious Food'}
              </h4>
              <span className="text-[#FF4F18] font-bold mt-2 block">{sideBottom.subtitle}</span>
           </div>
           <div className="absolute bottom-[-40px] right-[-20px] w-[60%] transition-transform duration-500 group-hover:scale-110">
             {sideBottom.image ? (
               <img src={sideBottom.image} alt="Side Bottom" className="w-full object-contain opacity-90 drop-shadow-lg" />
             ) : (
               <div className="w-full h-24 flex items-center justify-center text-white/20 font-bold border-2 border-dashed border-white/20 rounded-lg">NO IMAGE</div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};