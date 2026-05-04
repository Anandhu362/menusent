import React from "react";

export const MenuCategoryList = ({ 
  categories = [], 
  activeCategory, 
  onCategorySelect 
}) => {
  return (
    <section className="mt-6 px-6">
      <div 
        className="flex items-center gap-3 overflow-x-auto pb-2" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategorySelect(category)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeCategory === category
                ? "bg-[#111827] text-white shadow-md" // Dark background for active
                : "bg-white text-gray-500 shadow-sm hover:bg-gray-50"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </section>
  );
};

export default MenuCategoryList;