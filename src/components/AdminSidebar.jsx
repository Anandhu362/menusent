import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Store
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const AdminSidebar = () => {
  // CHANGED: Default state is now 'false' so the sidebar starts collapsed
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation(); 
  const navigate = useNavigate();
  
  const { user, logout } = useAuth(); 

  // ==========================================
  // 1. DYNAMIC MAIN MENU
  // ==========================================
  const navItems = [
    { label: "Overview", icon: LayoutDashboard, path: "/restaurant/dashboard" },
  ];

  // Only show Orders to Restaurant Owners
  if (user?.role === 'restaurant') {
    navItems.push({ label: "Orders", icon: ShoppingBag, path: "/restaurant/orders" });
  }

  // Both Admin and Restaurant get Menu Management
  navItems.push({ label: "Menu Management", icon: UtensilsCrossed, path: "/restaurant/menu-management" });

  // ==========================================
  // 2. DYNAMIC SETUP MENU
  // ==========================================
  const setupItems = [];

  // Super Admin Setup Items
  if (user?.role === 'admin') {
    setupItems.push({ label: "Restaurants", icon: Store, path: "/restaurant/settings" });
    setupItems.push({ label: "Settings", icon: Settings, path: "#" });
  }

  // Restaurant Owner Setup Items
  if (user?.role === 'restaurant') {
    setupItems.push({ label: "Store Profile", icon: Settings, path: "/restaurant/profile" });
  }

  // Handle actual logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Reusable Item Component
  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link 
        to={item.path} 
        className={`flex items-center gap-3 py-3 rounded-xl transition-all font-medium no-underline ${
          isActive 
            ? 'bg-[#ff6b35] text-white shadow-lg shadow-[#ff6b35]/20' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        } ${isExpanded ? 'px-4' : 'justify-center px-0'}`}
        title={!isExpanded ? item.label : ""}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        {isExpanded && <span className="whitespace-nowrap animate-in fade-in duration-300">{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside 
      className={`${isExpanded ? 'w-72' : 'w-[88px]'} bg-[#111827] flex flex-col h-full flex-shrink-0 text-white transition-all duration-300 shadow-xl z-30 relative hidden md:flex`}
    >
      
      {/* Expand / Minimize Toggle Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-8 bg-white text-slate-800 rounded-full p-1.5 shadow-md border border-gray-100 hover:scale-110 transition-transform z-40"
      >
        {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {/* Dynamic Logo Area */}
      <div className={`h-20 flex items-center border-b border-slate-800/50 ${isExpanded ? 'px-8' : 'justify-center px-0'}`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#ff6b35] rounded-xl flex items-center justify-center shadow-lg shadow-[#ff6b35]/20 flex-shrink-0 overflow-hidden">
             {user?.logo ? (
               <img src={user.logo} alt={user?.name} className="w-full h-full object-cover" />
             ) : (
               <UtensilsCrossed className="h-6 w-6 text-white" />
             )}
          </div>
          {isExpanded && (
            <h1 className="text-xl font-bold tracking-tight whitespace-nowrap animate-in fade-in duration-300 truncate max-w-[160px]">
              {user?.name || "MenuSent"}
            </h1>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-8 flex flex-col gap-2 overflow-y-auto hide-scrollbar">
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        
        {isExpanded && <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4 animate-in fade-in duration-300">Main Menu</div>}
        {!isExpanded && <div className="h-6"></div>} {/* Spacer for collapsed state */}
        
        {navItems.map(item => <NavItem key={item.label} item={item} />)}
        
        <div className="mt-6"></div>
        {isExpanded && <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4 animate-in fade-in duration-300">Setup</div>}
        {!isExpanded && <div className="h-6"></div>}
        
        {setupItems.map(item => <NavItem key={item.label} item={item} />)}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800/50">
         <button 
           onClick={handleLogout} 
           className={`w-full flex items-center gap-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors font-medium ${isExpanded ? 'px-4' : 'justify-center px-0'}`}
           title={!isExpanded ? "Logout" : ""}
         >
           <LogOut className="h-5 w-5 flex-shrink-0" />
           {isExpanded && <span className="animate-in fade-in duration-300">Logout</span>}
         </button>
      </div>
    </aside>
  );
};