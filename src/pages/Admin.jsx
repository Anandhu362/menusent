import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { Navbar } from '../components/Navbar';
import apiClient from '../api/apiClient'; 
import BannerEditor from '../components/BannerEditor'; 
import RatioSelector from '../components/RatioSelector';
import { RestaurantList } from '../components/RestaurantList';
import MetaDataSetup from '../components/MetaDataSetup'; // <--- NEW IMPORT

const Admin = () => {
  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); 
  const [refreshList, setRefreshList] = useState(0);
  const [ratio, setRatio] = useState(917 / 2048);

  // Hook for redirection
  const navigate = useNavigate(); 

  const [formData, setFormData] = useState({
    name: '',
    whatsappNumber: '',
  });

  const [files, setFiles] = useState({
    logo: null,
    front: null,
    back: null,
    pages: []
  });

  // --- HANDLERS ---
  
  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem("authToken"); // Clear the token
    navigate("/login"); // Redirect to Login page
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, type) => {
    if (type === 'pages') {
      setFiles({ ...files, pages: e.target.files });
    } else {
      setFiles({ ...files, [type]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('whatsappNumber', formData.whatsappNumber);
    data.append('ratio', ratio);
    
    if (files.logo) data.append('logo', files.logo);
    if (files.front) data.append('front', files.front);
    if (files.back) data.append('back', files.back);
    
    if (files.pages && files.pages.length > 0) {
      for (let i = 0; i < files.pages.length; i++) {
        data.append('pages', files.pages[i]);
      }
    }

    try {
      await apiClient.post('/api/restaurants/create', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setStatus({ type: 'success', message: 'Restaurant Created Successfully! 🚀' });
      setRefreshList(prev => prev + 1);
      
    } catch (error) {
      console.error("Upload failed:", error);
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to upload. Check console for details.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // --- STYLES ---
  const colors = {
    bg: '#F2F4F6',      
    black: '#111318',   
    orange: '#f97316', 
  };

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: colors.bg, color: colors.black }}>
      <Navbar />

      {/* Logout Button (Fixed Top Right) */}
      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={handleLogout}
          className="bg-black text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-red-600 transition-colors shadow-lg cursor-pointer border border-white/10"
        >
          Logout
        </button>
      </div>

      <div className="pt-32 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 text-xs font-bold uppercase tracking-wider mb-4">
              Admin Access
            </div>
            <h1 className="text-5xl font-black tracking-tight mb-4">
              Create New <span className="text-orange-500">Menu.</span>
            </h1>
            <p className="text-gray-500 text-lg font-medium">
              Upload assets to generate a 3D digital experience.
            </p>
          </div>

          {/* GRID LAYOUT START */}
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT COLUMN: Create Form */}
            <div className="lg:col-span-2 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-gray-200/50">
              
              {status && (
                <div className={`mb-8 p-4 rounded-2xl text-center font-bold ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {status.message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* SECTION 1: Details */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold border-b pb-2 border-gray-100">Details</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-500 uppercase tracking-wide">Restaurant Name</label>
                      <input 
                        type="text" 
                        name="name"
                        required
                        placeholder="e.g. Grill Town"
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-lg transition-all"
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-500 uppercase tracking-wide">WhatsApp / Phone</label>
                      <input 
                        type="text" 
                        name="whatsappNumber"
                        required
                        placeholder="+91 98765 43210"
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-lg transition-all"
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <RatioSelector selectedRatio={ratio} onRatioChange={setRatio} />
                </div>

                {/* SECTION 2: Branding */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold border-b pb-2 border-gray-100">Branding & Covers</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <FileUploadBox 
                      label="Logo" 
                      name="logo" 
                      onChange={(e) => handleFileChange(e, 'logo')} 
                      file={files.logo}
                    />
                    <FileUploadBox 
                      label="Front Cover" 
                      name="front" 
                      onChange={(e) => handleFileChange(e, 'front')} 
                      file={files.front}
                    />
                    <FileUploadBox 
                      label="Back Cover" 
                      name="back" 
                      onChange={(e) => handleFileChange(e, 'back')} 
                      file={files.back}
                    />
                  </div>
                </div>

                {/* SECTION 3: Menu Pages */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold border-b pb-2 border-gray-100">Menu Pages</h3>
                  <div className="relative group">
                    <input 
                      type="file" 
                      multiple 
                      name="pages"
                      onChange={(e) => handleFileChange(e, 'pages')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-3 border-dashed border-gray-200 group-hover:border-orange-500 rounded-3xl p-10 text-center transition-all bg-gray-50 group-hover:bg-orange-50">
                      <div className="text-4xl mb-2">📄</div>
                      <p className="font-bold text-gray-700 text-lg">
                        {files.pages && files.pages.length > 0 
                          ? `${files.pages.length} Files Selected` 
                          : "Click to upload Menu Pages"}
                      </p>
                      <p className="text-gray-400 text-sm mt-2">Supports multiple files (JPG, PNG)</p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white h-16 rounded-2xl text-xl font-black transition-transform hover:-translate-y-1 shadow-xl shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Uploading Assets...' : 'Launch Restaurant 🚀'}
                </button>

              </form>
            </div>

            {/* RIGHT COLUMN: Existing Restaurants List */}
            <div className="lg:col-span-1 h-full">
              <RestaurantList refreshTrigger={refreshList} />
            </div>

          </div>
          {/* GRID LAYOUT END */}

        </div>
      </div>

      {/* --- DIVIDER --- */}
      <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto my-8 opacity-50 px-6">
        <div className="h-px bg-gray-300 w-full"></div>
        <span className="text-gray-400 font-bold uppercase text-sm whitespace-nowrap">Or Update Existing</span>
        <div className="h-px bg-gray-300 w-full"></div>
      </div>

      {/* --- NEW: META DATA SETUP SECTION --- */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
         <MetaDataSetup />
      </div>

      {/* --- EXISTING: BANNER EDITOR SECTION --- */}
      <div className="pb-20">
         <BannerEditor />
      </div>

    </div>
  );
};

const FileUploadBox = ({ label, onChange, file }) => (
  <div className="relative group h-40">
    <input 
      type="file" 
      onChange={onChange}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
    />
    <div className={`h-full border-2 ${file ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-gray-50'} border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center transition-all group-hover:border-orange-400`}>
      <span className="text-2xl mb-2">{file ? '✅' : '📷'}</span>
      <span className="font-bold text-sm text-gray-600">{label}</span>
      {file && <span className="text-xs text-orange-600 mt-1 truncate w-full px-2">{file.name}</span>}
    </div>
  </div>
);

export default Admin;
