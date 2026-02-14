import React, { useState, useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";

// Components
import { UI } from "./components/UI";
import { MenuViewer } from "./components/MenuViewer"; 
import Home from "./pages/Home"; 
import Admin from "./pages/Admin"; 
import Login from "./pages/Login"; 
// IMPORT THE GATEKEEPER
import { ProtectedRoute } from "./components/ProtectedRoute"; 

// API
import apiClient from "./api/apiClient";

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

  // If paused, block access
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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* LOGIN ROUTE */}
          <Route path="/login" element={<Login />} />

          {/* PROTECTED ADMIN ROUTE */}
          {/* This logic says: "Try to show Admin. But first, run ProtectedRoute." */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } 
          />

          <Route path="/:slug" element={<MenuExperience />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;