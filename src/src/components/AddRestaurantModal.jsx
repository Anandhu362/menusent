import React, { useState } from 'react';
import { createRestaurant } from "../api/restaurant.api"; 
import toast from 'react-hot-toast'; 
import { UploadCloud, Store, MapPin, X, Image as ImageIcon, Mail, Lock } from 'lucide-react'; // Added Mail and Lock icons

const AddRestaurantModal = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setLogoFile(e.target.files[0]);
    }
  };

  const clearFile = (e) => {
    e.preventDefault();
    setLogoFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !location || !email || !password || !logoFile) {
      toast.error("Please fill in all fields and upload a logo.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('location', location);
      formData.append('email', email);       // Send email to backend
      formData.append('password', password); // Send password to backend
      formData.append('logo', logoFile);

      const result = await createRestaurant(formData);

      toast.success("Restaurant created successfully!");
      
      // Reset form
      setName('');
      setLocation('');
      setEmail('');
      setPassword('');
      setLogoFile(null);
      
      onSuccess(result.restaurant); 
      onClose();
    } catch (error) {
      console.error("Creation error:", error);
      toast.error(error.response?.data?.message || "Failed to create restaurant.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Add New Restaurant</h2>
            <p className="text-sm font-medium text-gray-400 mt-1">Fill in the details below</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-50 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Made scrollable for smaller screens */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5 max-h-[75vh] overflow-y-auto hide-scrollbar">
          
          {/* Custom Name Input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Restaurant Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Store className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Momothikana"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-orange-500 rounded-xl text-slate-700 font-medium placeholder-gray-400 outline-none transition-all shadow-sm"
                required
              />
            </div>
          </div>

          {/* Custom Location Input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Location
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Karnataka India"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-orange-500 rounded-xl text-slate-700 font-medium placeholder-gray-400 outline-none transition-all shadow-sm"
                required
              />
            </div>
          </div>

          {/* NEW: Custom Email Input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Login Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., admin@restaurant.com"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-orange-500 rounded-xl text-slate-700 font-medium placeholder-gray-400 outline-none transition-all shadow-sm"
                required
              />
            </div>
          </div>

          {/* NEW: Custom Password Input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Login Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                minLength={6}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-orange-500 rounded-xl text-slate-700 font-medium placeholder-gray-400 outline-none transition-all shadow-sm"
                required
              />
            </div>
          </div>

          {/* Custom File Upload Area */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Restaurant Logo
            </label>
            <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              logoFile ? 'border-orange-500 bg-orange-50/50' : 'border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50/30'
            }`}>
              
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                required={!logoFile}
                title=""
              />

              {logoFile ? (
                <div className="flex flex-col items-center justify-center space-y-2 relative z-20 pointer-events-none">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-500">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-700 truncate max-w-[200px]">
                    {logoFile.name}
                  </div>
                  <div className="text-xs font-medium text-orange-500">
                    Click to change file
                  </div>
                  <button 
                    type="button" 
                    onClick={clearFile}
                    className="absolute -top-4 -right-4 p-1.5 bg-white shadow-sm rounded-full text-gray-400 hover:text-red-500 pointer-events-auto transition-colors border border-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-1 text-gray-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    Click or drag to upload logo
                  </div>
                  <div className="text-xs font-medium text-gray-400">
                    SVG, PNG, JPG or GIF (max. 5MB)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-6 flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-lg shadow-orange-500/30 disabled:opacity-70 disabled:shadow-none flex items-center justify-center"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : "Add Restaurant"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddRestaurantModal;