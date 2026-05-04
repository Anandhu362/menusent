import React from 'react';

// --- DATA: POPULAR DISHES ---
const DISHES = [
  {
    id: 101,
    name: "Classic Beef Burger",
    sub: "Double patty, cheese",
    price: "$12.99",
    discount: "20% off",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1599&auto=format&fit=crop"
  },
  {
    id: 102,
    name: "Crispy Chicken",
    sub: "Spicy wings bucket",
    price: "$18.50",
    discount: "15% off",
    image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=1470&auto=format&fit=crop"
  },
  {
    id: 103,
    name: "Pepperoni Pizza",
    sub: "Medium size, extra cheese",
    price: "$15.00",
    discount: "Hot",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=1480&auto=format&fit=crop"
  },
  {
    id: 104,
    name: "Fresh Salad Bowl",
    sub: "Organic greens, avocado",
    price: "$9.99",
    discount: "Healthy",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1470&auto=format&fit=crop"
  },
  {
    id: 105,
    name: "Pasta Alfredo",
    sub: "Creamy white sauce",
    price: "$13.50",
    discount: "New",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=1480&auto=format&fit=crop"
  },
];

export const Dishes = () => {
  return (
    <div className="w-full py-10 md:py-20 mb-20">
      
      {/* SECTION HEADER - THEME UPDATE: Dark Text */}
      <div className="flex items-center justify-center md:justify-start mb-8 px-2">
        <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-wide uppercase">
          Popular <span className="text-[#FF4F18]">Dishes</span>
        </h2>
      </div>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-8 px-4 md:px-0">
        {DISHES.map((dish) => (
          <div key={dish.id} className="h-full">
            
            {/* CARD DESIGN - Minimal White Style */}
            <div className="bg-white rounded-[1.2rem] md:rounded-[2rem] p-3 md:p-4 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative group h-full flex flex-col border border-gray-100 hover:border-[#FF4F18]">
              
              {/* Discount Badge */}
              <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-[#FFCC00] text-black text-[9px] md:text-xs font-bold px-2 py-1 rounded-full shadow-sm z-20">
                {dish.discount}
              </div>

              {/* Image Area */}
              <div className="w-full h-28 md:h-40 shrink-0 relative rounded-xl md:rounded-2xl overflow-hidden mb-2 md:mb-3">
                <img 
                  src={dish.image} 
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:rotate-2 transition-transform duration-500"
                />
              </div>

              {/* Content Area */}
              <div className="flex-1 flex flex-col justify-between text-left">
                <div className="mb-2">
                  <h3 className="text-gray-900 font-bold text-sm md:text-lg leading-tight mb-1 line-clamp-1">
                    {dish.name}
                  </h3>
                  <p className="text-gray-500 text-[10px] md:text-xs line-clamp-1">
                    {dish.sub}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[#FF4F18] font-black text-sm md:text-lg">
                    {dish.price}
                  </span>
                  
                  {/* Plus Button - Orange Accent */}
                  <button className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#FF4F18] transition-colors shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 md:w-4 md:h-4">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};