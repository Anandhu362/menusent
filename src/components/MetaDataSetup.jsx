import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient'; 

// Helper Component for consistent input styling
const InputGroup = ({ label, name, value, onChange, placeholder, type = "text", textarea = false }) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-xs font-bold mb-2 uppercase tracking-wide">{label}</label>
    {textarea ? (
      <textarea
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="shadow-sm appearance-none border border-gray-200 bg-gray-50 rounded-xl w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all h-24"
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="shadow-sm appearance-none border border-gray-200 bg-gray-50 rounded-xl w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
      />
    )}
  </div>
);

const MetaDataSetup = () => {
  // --- STATE ---
  const [restaurants, setRestaurants] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Controls Custom UI
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  // Ref for closing custom dropdown when clicking outside
  const dropdownRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '', slug: '', shortDescription: '', city: '', area: '', cuisine: '',
    whatsappNumber: '', fullAddress: '', googleMapsLink: '', status: 'Active',
    seoOverrides: { metaTitle: '', metaDescription: '' }
  });

  // --- EFFECTS ---
  
  // 1. Fetch Restaurants on Load
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // FIXED ENDPOINT: Added /api/ prefix to fix the 404 error
        const res = await apiClient.get('/api/restaurants'); 
        setRestaurants(res.data);
      } catch (err) {
        console.error("Failed to load restaurants", err);
      }
    };
    fetchRestaurants();
  }, []);

  // 2. Click outside handler to close custom dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS ---

  // Custom Selection Handler
  const handleSelectRestaurant = (restaurant) => {
    setSelectedId(restaurant._id);
    setIsDropdownOpen(false); // Close the custom dropdown
    setMsg({ type: '', text: '' });

    setFormData({
      name: restaurant.name || '',
      slug: restaurant.slug || '',
      shortDescription: restaurant.shortDescription || '',
      city: restaurant.city || '',
      area: restaurant.area || '',
      cuisine: restaurant.cuisine || '',
      whatsappNumber: restaurant.whatsappNumber || '',
      fullAddress: restaurant.fullAddress || '',
      googleMapsLink: restaurant.googleMapsLink || '',
      status: restaurant.status || 'Active',
      seoOverrides: {
        metaTitle: restaurant.seoOverrides?.metaTitle || '',
        metaDescription: restaurant.seoOverrides?.metaDescription || ''
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('seo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        seoOverrides: { ...prev.seoOverrides, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      // Ensure the PUT endpoint also matches your backend routes
      await apiClient.put(`/api/restaurants/update-details/${selectedId}`, formData);
      setMsg({ type: 'success', text: '✅ Settings updated successfully!' });
      
      setRestaurants(prev => prev.map(r => (r._id === selectedId ? { ...r, ...formData } : r)));
    } catch (error) {
      console.error(error);
      setMsg({ type: 'error', text: '❌ Failed to save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Find the selected restaurant object to display its name in the custom UI
  const selectedRestaurant = restaurants.find(r => r._id === selectedId);

  return (
    <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
      
      <div className="mb-8 border-b border-gray-100 pb-6">
         <h2 className="text-3xl font-black text-gray-800 tracking-tight">⚙️ Dynamic Meta & SEO</h2>
         <p className="text-gray-500 mt-2 font-medium">Manage restaurant details, search engine tags, and operational status.</p>
      </div>

      {/* --- CUSTOM DROPDOWN UI --- */}
      <div className="mb-10 bg-orange-50 p-6 rounded-2xl border border-orange-100" ref={dropdownRef}>
        <label className="block text-orange-800 font-bold mb-3 uppercase text-xs tracking-wider">
          Select Restaurant to Edit
        </label>
        
        <div className="relative">
          {/* Custom Selector Trigger */}
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full p-4 border-2 border-orange-200 rounded-xl font-bold text-gray-800 bg-white cursor-pointer flex justify-between items-center hover:border-orange-400 transition-colors shadow-sm"
          >
            <span>{selectedRestaurant ? selectedRestaurant.name : "-- Choose a Restaurant --"}</span>
            <svg className={`fill-current h-5 w-5 text-orange-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>

          {/* Custom Dropdown Options List */}
          {isDropdownOpen && (
            <div className="absolute z-50 mt-2 w-full bg-white border-2 border-orange-100 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-fade-in">
              {restaurants.length === 0 ? (
                <div className="p-4 text-gray-500 text-center text-sm font-medium">No restaurants found.</div>
              ) : (
                restaurants.map((restaurant) => (
                  <div 
                    key={restaurant._id}
                    onClick={() => handleSelectRestaurant(restaurant)}
                    className={`p-4 cursor-pointer font-bold border-b border-gray-50 last:border-0 hover:bg-orange-50 transition-colors flex items-center justify-between
                      ${selectedId === restaurant._id ? 'bg-orange-500 text-white hover:bg-orange-600' : 'text-gray-700'}
                    `}
                  >
                    <span>{restaurant.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-md ${selectedId === restaurant._id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                      {restaurant.slug}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedId && (
        <div className="animate-fade-in space-y-10">
          
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Column 1: Basic & Location */}
            <div className="space-y-6">
              <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <span className="bg-gray-100 p-2 rounded-lg text-lg">📍</span> Basic Info
              </h3>
              <InputGroup label="Restaurant Name" name="name" value={formData.name} onChange={handleChange} />
              <InputGroup label="Slug (URL Path)" name="slug" value={formData.slug} onChange={handleChange} placeholder="e.g. grill-town" />
              
              <div className="grid grid-cols-2 gap-4">
                 <InputGroup label="City" name="city" value={formData.city} onChange={handleChange} placeholder="Dubai" />
                 <InputGroup label="Area" name="area" value={formData.area} onChange={handleChange} placeholder="Downtown" />
              </div>
              
              <InputGroup label="Cuisine Type" name="cuisine" value={formData.cuisine} onChange={handleChange} placeholder="e.g. Burgers, American" />
              <InputGroup label="Full Address" name="fullAddress" value={formData.fullAddress} onChange={handleChange} textarea placeholder="Building, Street, PO Box..." />
            </div>

            {/* Column 2: Contact & Status */}
            <div className="space-y-6">
               <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <span className="bg-gray-100 p-2 rounded-lg text-lg">📞</span> Contact & Status
               </h3>
               <InputGroup label="WhatsApp Number" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} placeholder="97150xxxxxxx" />
               <InputGroup label="Google Maps Link" name="googleMapsLink" value={formData.googleMapsLink} onChange={handleChange} placeholder="https://maps.app.goo.gl/..." />
               
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 mt-4">
                  <label className="block text-gray-700 text-xs font-bold mb-3 uppercase tracking-wide">Current Status</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange} 
                    className="w-full border-2 border-gray-200 p-3 rounded-xl font-bold text-gray-700 focus:border-black focus:outline-none bg-white"
                  >
                    <option value="Active">🟢 Active (Public)</option>
                    <option value="Trial">🟡 Trial Mode</option>
                    <option value="Paused">🔴 Paused (Hidden)</option>
                    <option value="Expired">⚫ Expired</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-2">Controls whether the menu is accessible to customers.</p>
               </div>
            </div>
          </div>

          {/* SEO Section (Full Width) */}
          <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-200">
            <h3 className="font-bold text-xl text-gray-800 mb-6 flex items-center gap-2">
              <span className="bg-white p-2 rounded-lg text-lg border">🔍</span> SEO Overrides
            </h3>
            <div className="grid lg:grid-cols-2 gap-6">
               <div className="lg:col-span-2">
                  <InputGroup 
                    label="Short Description (For Listings)" 
                    name="shortDescription" 
                    value={formData.shortDescription} 
                    onChange={handleChange} 
                    placeholder="Tasty burgers in the heart of Dubai..."
                  />
               </div>
               <InputGroup 
                  label="Meta Title (Optional)" 
                  name="seo.metaTitle" 
                  value={formData.seoOverrides.metaTitle} 
                  onChange={handleChange} 
                  placeholder="Custom Browser Title" 
               />
               <InputGroup 
                  label="Meta Description (Optional)" 
                  name="seo.metaDescription" 
                  value={formData.seoOverrides.metaDescription} 
                  onChange={handleChange} 
                  textarea 
                  placeholder="Custom description for Google search results..." 
               />
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4">
            <button 
              onClick={handleSave} 
              disabled={loading}
              className={`w-full h-16 rounded-2xl text-xl font-black transition-all shadow-lg flex items-center justify-center gap-3
                ${loading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-800 hover:-translate-y-1 shadow-black/20'
                }`}
            >
              {loading ? (
                <>Saving Changes...</>
              ) : (
                <>💾 Save Settings</>
              )}
            </button>
            
            {msg.text && (
              <div className={`mt-4 p-4 rounded-xl text-center font-bold ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {msg.text}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default MetaDataSetup;