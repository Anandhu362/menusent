import React, { useState, useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";

// Components
import { UI } from "./components/UI";
import { MenuViewer } from "./components/MenuViewer"; 
import Home from "./pages/Home"; 
import Admin from "./pages/Admin"; 
import Login from "./pages/Login"; 
import { ProtectedRoute } from "./components/ProtectedRoute"; 

// Mobile-friendly menu and dashboard pages
import RestaurantMenu from "./pages/RestaurantMenu";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import MenuManagement from "./pages/MenuManagement";
import TableManagement from "./pages/TableManagement"; 
import Checkout from "./pages/Checkout"; 
import RestaurantSettings from "./pages/RestaurantSettings";
import OwnerProfile from "./pages/OwnerProfile"; 
import Orders from "./pages/Orders"; 

// ✅ NEW: Import the Order Tracking page
import OrderTracking from "./pages/OrderTracking"; 

// API
import apiClient from "./api/apiClient";

// Context Providers
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext"; 

// ✅ NEW: Import the Printer Provider
import { PrinterProvider } from "./context/PrinterContext"; 

const MenuExperience = () => {
  const { slug } = useParams(); 
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/restaurants/${slug}`);
        setRestaurant(response.data);
      } catch (err) {
        console.error("Failed to fetch menu:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug]);

  const menuImages = useMemo(() => {
    if (!restaurant || !restaurant.book) return [];

    const { coverUrl, backUrl, pages } = restaurant.book;
    const safePages = Array.isArray(pages) ? pages : [];
    
    const images = [];
    if (coverUrl) images.push(coverUrl);
    safePages.forEach(page => images.push(page));
    if (backUrl) images.push(backUrl);

    return images;
  }, [restaurant]);

  if (loading) return <div className="text-white text-center pt-20">Loading Menu...</div>;
  if (error || !restaurant) return <div className="text-white text-center pt-20">Menu not found.</div>;

  if (restaurant.isActive === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4 text-center">
        <h1 className="text-3xl font-bold mb-2">Menu Currently Unavailable</h1>
        <p className="text-gray-400">Please contact the restaurant for more information.</p>
      </div>
    );
  }

  return (
    <>
      <UI 
        logo={restaurant.logoUrl} 
        whatsapp={restaurant.whatsappNumber} 
        pages={menuImages} 
      />
      <MenuViewer pages={menuImages} />
    </>
  );
};

function App() {
  return (
    <div className="relative min-h-screen w-full bg-background">
      <AuthProvider>
        {/* ✅ Wrap the app with PrinterProvider here so hardware connection survives page reloads/routing */}
        <PrinterProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                {/* --- Public Landing --- */}
                <Route path="/" element={<Home />} />
                
                {/* --- Authentication --- */}
                <Route path="/login" element={<Login />} />
                
                {/* --- Protected Restaurant Owner Routes --- */}
                <Route 
                  path="/restaurant/dashboard" 
                  element={
                    <ProtectedRoute>
                      <RestaurantDashboard />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/restaurant/profile" 
                  element={
                    <ProtectedRoute>
                      <OwnerProfile />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/restaurant/orders" 
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/restaurant/menu-management" 
                  element={
                    <ProtectedRoute>
                      <MenuManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/restaurant/tables" 
                  element={
                    <ProtectedRoute>
                      <TableManagement />
                    </ProtectedRoute>
                  } 
                /> 
                
                <Route 
                  path="/restaurant/settings" 
                  element={
                    <ProtectedRoute>
                      <RestaurantSettings />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  } 
                />

                {/* --- Public Customer Experience Routes --- */}
                
                {/* ✅ NEW: Public Order Tracking route (Mobile Optimized) */}
                <Route path="/track/:orderId" element={<OrderTracking />} />

                <Route path="/checkout" element={<Checkout />} />

                <Route path="/:slug/menu" element={<RestaurantMenu />} />

                <Route path="/:slug" element={<MenuExperience />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </PrinterProvider>
      </AuthProvider>
    </div>
  );
}

export default App;