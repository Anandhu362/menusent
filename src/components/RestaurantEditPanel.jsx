import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Copy, Check, MapPin, Type, ExternalLink } from "lucide-react";
import apiClient from "../api/apiClient";

export const RestaurantEditPanel = ({ isOpen, onClose, restaurant, onUpdateSuccess }) => {
  const [name, setName] = useState("");
  // --- FIX: Rename state to fullAddress ---
  const [fullAddress, setFullAddress] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || "");
      // --- FIX: Pull from restaurant.fullAddress ---
      setFullAddress(restaurant.fullAddress || "");
      setLogoPreview(restaurant.logoAssetId?.gcsPath || "");
      setLogoFile(null);
    }
  }, [restaurant]);

  if (!restaurant) return null;

  const menuLink = `${window.location.origin}/${restaurant.slug}/menu`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const formData = new FormData();
      formData.append("name", name);
      // --- FIX: Append as fullAddress ---
      formData.append("fullAddress", fullAddress);
      
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const response = await apiClient.put(`/api/restaurants/${restaurant._id}/settings`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onUpdateSuccess(response.data.restaurant);
      onClose();
    } catch (error) {
      console.error("Failed to update settings:", error);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      <div className={`fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-black text-slate-900">Edit Details</h2>
          <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-slate-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          <div className="flex flex-col items-center justify-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="h-28 w-28 rounded-3xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center transition-all group-hover:border-orange-400 group-hover:bg-orange-50">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain p-2" />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400 group-hover:text-orange-500 transition-colors" />
                )}
              </div>
              <div className="absolute -bottom-3 bg-white border border-gray-100 shadow-sm px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 left-1/2 -translate-x-1/2 group-hover:text-orange-500 transition-colors">
                Change Logo
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Restaurant Name</label>
              <div className="relative">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-xl pl-11 pr-4 py-3 outline-none font-bold text-slate-700 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Location / Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                <textarea 
                  // --- FIX: Bind to fullAddress ---
                  value={fullAddress} 
                  onChange={(e) => setFullAddress(e.target.value)} 
                  rows={3}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-xl pl-11 pr-4 py-3 outline-none font-medium text-slate-700 transition-all text-sm resize-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Menu Link</label>
              <div className="flex items-center gap-2 bg-orange-50/50 border border-orange-100 p-2 rounded-xl">
                <div className="flex-1 truncate pl-2 text-sm font-medium text-orange-800">
                  {menuLink}
                </div>
                <button 
                  onClick={handleCopyLink}
                  className="h-9 w-9 flex items-center justify-center bg-white rounded-lg shadow-sm text-orange-500 hover:bg-orange-500 hover:text-white transition-all"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
                <a 
                  href={menuLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-9 w-9 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-400 hover:text-slate-800 transition-all"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 bg-[#111827] text-white rounded-xl font-bold hover:bg-orange-500 transition-colors shadow-lg shadow-black/5 disabled:opacity-50 flex items-center justify-center"
          >
            {isSaving ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
};