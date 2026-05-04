import React from 'react';

export const Navbar = () => {
  // Smooth scroll function for single page navigation
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed w-full z-50 top-0 bg-[#F2F4F6]/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* 1. Logo Section (Left) */}
        <div className="flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="text-2xl font-black tracking-tighter flex items-center gap-1 text-[#111318]">
            Menu<span className="text-orange-500">Sent.</span>
          </div>
        </div>

        {/* 2. Center Navigation Links (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-10">
          {['Home', 'Features', 'Pricing', 'Contact'].map((item) => (
            <button
              key={item}
              onClick={() => scrollToSection(item.toLowerCase())}
              className="text-sm font-bold text-gray-500 hover:text-black transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
        
        {/* 3. "View Demo" Pill Button (Right) */}
        <div className="flex-shrink-0">
          <button 
            className="group flex items-center gap-3 pl-6 pr-2 py-2 bg-orange-500 text-white rounded-full font-bold text-sm hover:bg-black transition-all duration-300 shadow-lg shadow-orange-500/20"
            onClick={() => console.log("View Demo Clicked")}
          >
            <span>View Demo</span>
            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

      </div>
    </nav>
  );
};