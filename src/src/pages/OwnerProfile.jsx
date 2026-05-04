import React, { useState, useEffect } from "react";
import { Store, MapPin, Phone, Upload, Lock, Save, Camera, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AdminSidebar } from "../components/AdminSidebar"; 

// ✅ NEW: Import the Delivery Settings Panel
import DeliverySettingsPanel from "../components/DeliverySettingsPanel";

// Import apiClient directly to force the required multipart headers
import apiClient from "../api/apiClient";

const OwnerProfile = () => {
  const { user } = useAuth(); 
  
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  // ✅ NEW: State for the Delivery Settings saving status
  const [savingDelivery, setSavingDelivery] = useState(false);
  
  const [message, setMessage] = useState({ type: "", text: "" });

  // ✅ NEW: Holds the full raw restaurant object to pass to the Delivery component
  const [restaurantData, setRestaurantData] = useState(null);

  const [profileData, setProfileData] = useState({
    name: "",
    location: "",
    whatsappNumber: "",
    printerIp: "", // ✅ ADDED PRINTER IP STATE
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch real data from the database
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/restaurants/owner/profile');
        const data = response.data;

        // ✅ Store the full data object so DeliverySettingsPanel can read data.location and data.deliverySettings
        setRestaurantData(data);

        setProfileData({
          name: data.name || "",
          location: data.fullAddress || "", // Text address
          whatsappNumber: data.whatsappNumber || "",
          printerIp: data.printerIp || "192.168.1.220", // ✅ FETCH PRINTER IP
        });
        
        if (data.logoAssetId?.gcsPath) {
          setLogoPreview(data.logoAssetId.gcsPath);
        }
      } catch (error) {
        showMessage("error", "Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file)); 
    }
  };

  // Save Public Profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    
    try {
      const formData = new FormData();
      formData.append("name", profileData.name);
      formData.append("location", profileData.location);
      formData.append("whatsappNumber", profileData.whatsappNumber);
      formData.append("printerIp", profileData.printerIp); // ✅ SEND PRINTER IP TO BACKEND
      
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      await apiClient.put('/api/restaurants/owner/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      showMessage("success", "Profile updated successfully!");
    } catch (error) {
      showMessage("error", "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // ✅ NEW: Save Delivery Settings (Map Pin & Rules)
  const handleSaveDeliverySettings = async (deliveryData) => {
    setSavingDelivery(true);
    try {
      // Sends { location: {lat, lng}, deliverySettings: {...} }
      await apiClient.put('/api/restaurants/owner/delivery-settings', deliveryData);
      showMessage("success", "Delivery configurations saved successfully!");
    } catch (error) {
      showMessage("error", "Failed to save delivery settings.");
    } finally {
      setSavingDelivery(false);
    }
  };

  // Secure password change via API
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showMessage("error", "New passwords do not match!");
    }
    
    if (passwordData.newPassword.length < 6) {
      return showMessage("error", "Password must be at least 6 characters long.");
    }

    setSavingPassword(true);
    try {
      await apiClient.put('/api/restaurants/owner/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      showMessage("success", "Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      showMessage("error", error.response?.data?.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F2F4F6]">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto p-6 md:p-8 hide-scrollbar">
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Store Profile</h1>
            <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-wider">Manage your public profile and account security</p>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl mb-8 flex items-center gap-3 font-bold ${
              message.type === "success" ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
            }`}>
              {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          {loading ? (
             <div className="flex items-center justify-center h-64">
               <div className="w-8 h-8 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT COLUMN: Takes up 2/3 of the space */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* 1. Public Details Form */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold mb-8 flex items-center gap-2 text-slate-900">
                    <Store className="w-6 h-6 text-[#ff6b35]" />
                    Public Details
                  </h2>

                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="mb-8">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-4">Restaurant Logo</label>
                      <div className="flex items-center gap-6">
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-[#ff6b35] group-hover:bg-orange-50">
                            {logoPreview ? (
                              <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                            ) : (
                              <Camera className="w-8 h-8 text-gray-300 group-hover:text-orange-400 transition-colors" />
                            )}
                          </div>
                          <label className="absolute -bottom-2 -right-2 bg-white rounded-full p-2.5 shadow-lg cursor-pointer border border-gray-100 hover:scale-110 transition-transform">
                            <Upload className="w-4 h-4 text-slate-700" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                          </label>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-700">Upload a new logo</p>
                          <p className="text-xs font-medium text-gray-400 mt-1">Recommended size: 512x512px.<br/>PNG or JPG only.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Restaurant Name</label>
                        <div className="relative">
                          <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input 
                            type="text" 
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl pl-12 pr-4 py-3 outline-none font-bold text-slate-700 transition-all text-sm"
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location / Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input 
                            type="text" 
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl pl-12 pr-4 py-3 outline-none font-bold text-slate-700 transition-all text-sm"
                            value={profileData.location}
                            onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">WhatsApp Number</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input 
                            type="text" 
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl pl-12 pr-4 py-3 outline-none font-bold text-slate-700 transition-all text-sm"
                            value={profileData.whatsappNumber}
                            onChange={(e) => setProfileData({...profileData, whatsappNumber: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      {/* ✅ PRINTER IP SETTINGS BLOCK */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Local Printer IP Address
                        </label>
                        <div className="relative">
                          {/* Generic network/wifi icon style */}
                          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          <input 
                            type="text" 
                            placeholder="e.g., 192.168.1.220"
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl pl-12 pr-4 py-3 outline-none font-bold text-slate-700 transition-all text-sm"
                            value={profileData.printerIp}
                            onChange={(e) => setProfileData({...profileData, printerIp: e.target.value})}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium mt-1 ml-1">
                          Must match the exact IP of your thermal printer.
                        </p>
                      </div>

                    </div>

                    <div className="pt-6 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={savingProfile}
                        className="bg-black text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#ff6b35] transition-colors shadow-lg shadow-black/10 disabled:opacity-50 flex items-center gap-2"
                      >
                        {savingProfile ? (
                           <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : <Save className="w-4 h-4" />}
                        {savingProfile ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* ✅ 2. Interactive Delivery Settings Component */}
                <DeliverySettingsPanel 
                  initialData={restaurantData}
                  onSave={handleSaveDeliverySettings}
                  isSaving={savingDelivery}
                />

              </div>

              {/* RIGHT COLUMN: Takes up 1/3 of the space */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
                    <Lock className="w-5 h-5 text-slate-400" />
                    Security
                  </h2>

                  <form onSubmit={handlePasswordSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-slate-800 focus:bg-white rounded-2xl px-4 py-3 outline-none font-bold text-slate-700 transition-all text-sm"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-slate-800 focus:bg-white rounded-2xl px-4 py-3 outline-none font-bold text-slate-700 transition-all text-sm"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Confirm New Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-slate-800 focus:bg-white rounded-2xl px-4 py-3 outline-none font-bold text-slate-700 transition-all text-sm"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        required
                      />
                    </div>

                    <div className="pt-4">
                      <button 
                        type="submit" 
                        disabled={savingPassword}
                        className="w-full bg-slate-100 text-slate-900 px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {savingPassword ? (
                           <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-800 rounded-full animate-spin"></div>
                        ) : "Update Password"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerProfile;