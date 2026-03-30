import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft } from "lucide-react";

export const RestaurantMenuHeader = ({ 
  titleLine1 = "Daily", 
  titleLine2 = "Grocery Food",
  onSearchClick 
}) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-[#f8f9fb]/90 backdrop-blur-md px-6 pt-10 pb-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)} 
            className="mb-4 text-slate-500 hover:text-slate-900 transition-colors flex items-center focus:outline-none"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          {/* Page Title */}
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 max-w-[80%]">
            {titleLine1} <br /> {titleLine2}
          </h1>
        </div>
        
        {/* Search Button */}
        <button 
          onClick={onSearchClick}
          className="h-14 w-14 mt-8 bg-white rounded-full border border-gray-100 flex items-center justify-center text-slate-700 shadow-sm hover:shadow-md transition-all focus:outline-none"
          aria-label="Search menu"
        >
          <Search className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};

export default RestaurantMenuHeader;