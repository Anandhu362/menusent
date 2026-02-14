import React, { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import apiClient from '../api/apiClient'; 
import { BannerDisplay } from './BannerDisplay';
// NEW: Import the API function to fetch the list
import { getAllRestaurants } from '../api/restaurant.api';

// --- UTILITY: Pixel to Blob (Required for cropping) ---
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); 
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.95); // High quality JPEG
  });
}

// --- MAIN COMPONENT ---
const BannerEditor = () => {
  // 1. Data State
  const [restaurants, setRestaurants] = useState([]); // NEW: Store list of restaurants
  const [selectedSlug, setSelectedSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  // 2. Banner State (Visual Data for Preview)
  const [banners, setBanners] = useState({
    main: { title: '', subtitle: '', bgColor: '#EAB308', image: null },
    sideTop: { title: '', subtitle: '', price: '', bgColor: '#D97746', image: null },
    sideBottom: { title: '', subtitle: '', bgColor: '#2D1A16', image: null },
  });

  // 3. File State (Actual Blobs to upload)
  const [uploadFiles, setUploadFiles] = useState({
    mainImage: null,
    sideTopImage: null,
    sideBottomImage: null,
  });

  // 4. Cropper State
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [currentCropField, setCurrentCropField] = useState(null); 

  // --- INITIAL LOAD: FETCH RESTAURANT LIST ---
  useEffect(() => {
    const fetchList = async () => {
      try {
        const list = await getAllRestaurants();
        setRestaurants(list);
      } catch (err) {
        console.error("Failed to load restaurant list", err);
      }
    };
    fetchList();
  }, []);

  // --- FETCH DETAILS WHEN SELECTED ---
  const handleRestaurantSelect = async (e) => {
    const slug = e.target.value;
    setSelectedSlug(slug);
    
    // Reset if "Select a Restaurant" (empty value) is chosen
    if (!slug) {
        setBanners({
            main: { title: '', subtitle: '', bgColor: '#EAB308', image: null },
            sideTop: { title: '', subtitle: '', price: '', bgColor: '#D97746', image: null },
            sideBottom: { title: '', subtitle: '', bgColor: '#2D1A16', image: null },
        });
        return;
    }

    setLoading(true);
    try {
      const res = await apiClient.get(`/restaurants/${slug}`);
      const data = res.data.banners || {};
      
      // Merge with defaults to prevent crashes
      setBanners({
        main: { title: '', subtitle: '', bgColor: '#EAB308', ...data.main },
        sideTop: { title: '', subtitle: '', price: '', bgColor: '#D97746', ...data.sideTop },
        sideBottom: { title: '', subtitle: '', bgColor: '#2D1A16', ...data.sideBottom },
      });
      // Clear old upload files when switching restaurants
      setUploadFiles({ mainImage: null, sideTopImage: null, sideBottomImage: null });
    } catch (err) {
      console.error("Failed to fetch", err);
    } finally {
      setLoading(false);
    }
  };

  // --- INPUT HANDLERS ---
  const handleTextChange = (section, field, value) => {
    setBanners((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  // --- CROPPER HANDLERS ---
  const onFileChange = async (e, fieldName) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImageSrc(reader.result);
        setCurrentCropField(fieldName);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const saveCroppedImage = async () => {
    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const previewUrl = URL.createObjectURL(croppedBlob);

      // 1. Update Preview State
      setBanners((prev) => ({
        ...prev,
        [currentCropField]: { ...prev[currentCropField], image: previewUrl }
      }));

      // 2. Update Upload State
      const uploadKey = `${currentCropField}Image`; 
      setUploadFiles((prev) => ({ ...prev, [uploadKey]: croppedBlob }));

      // 3. Reset Cropper
      setCropImageSrc(null);
      setZoom(1);
    } catch (e) {
      console.error(e);
    }
  };

  // --- SUBMIT ---
  const handleSave = async () => {
    if (!selectedSlug) return alert("Please select a restaurant");
    setSaving(true);
    setStatus(null);

    const formData = new FormData();
    
    // Append Text Data
    formData.append('mainTitle', banners.main.title);
    formData.append('mainSubtitle', banners.main.subtitle);
    formData.append('mainBg', banners.main.bgColor);

    formData.append('sideTopTitle', banners.sideTop.title);
    formData.append('sideTopSubtitle', banners.sideTop.subtitle);
    formData.append('sideTopPrice', banners.sideTop.price);
    formData.append('sideTopBg', banners.sideTop.bgColor);

    formData.append('sideBottomTitle', banners.sideBottom.title);
    formData.append('sideBottomSubtitle', banners.sideBottom.subtitle);
    formData.append('sideBottomBg', banners.sideBottom.bgColor);

    // Append Files (if new ones exist)
    if (uploadFiles.mainImage) formData.append('mainImage', uploadFiles.mainImage, 'main.jpg');
    if (uploadFiles.sideTopImage) formData.append('sideTopImage', uploadFiles.sideTopImage, 'top.jpg');
    if (uploadFiles.sideBottomImage) formData.append('sideBottomImage', uploadFiles.sideBottomImage, 'bottom.jpg');

    try {
      await apiClient.put(`/restaurants/update-banners/${selectedSlug}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus({ type: 'success', msg: 'Banners updated successfully! 🎉' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', msg: 'Failed to update banners.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-800">Banner Editor 🎨</h1>
          
          {/* --- UPDATED: RESTAURANT DROPDOWN --- */}
          <div className="relative w-72">
            <select 
              value={selectedSlug}
              onChange={handleRestaurantSelect}
              className="w-full appearance-none bg-white border border-gray-300 hover:border-orange-500 px-4 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-700 cursor-pointer"
            >
              <option value="">-- Select a Restaurant --</option>
              {restaurants.map((rest) => (
                <option key={rest.slug} value={rest.slug}>
                  {rest.name}
                </option>
              ))}
            </select>
            {/* Custom Arrow Icon */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading Data...</div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: EDITING FORMS */}
            <div className="lg:col-span-1 space-y-6 h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
              
              {/* --- MAIN BANNER FORM --- */}
              <EditorSection title="Main Banner (Left)" color="blue">
                <TextInput label="Title" value={banners.main.title} onChange={(v) => handleTextChange('main', 'title', v)} isTextArea />
                <TextInput label="Subtitle" value={banners.main.subtitle} onChange={(v) => handleTextChange('main', 'subtitle', v)} />
                <ColorPicker label="Background Color" value={banners.main.bgColor} onChange={(v) => handleTextChange('main', 'bgColor', v)} />
                <ImageInput label="Upload Image" onChange={(e) => onFileChange(e, 'main')} />
              </EditorSection>

              {/* --- TOP SIDE FORM --- */}
              <EditorSection title="Top Side Card" color="orange">
                <TextInput label="Title" value={banners.sideTop.title} onChange={(v) => handleTextChange('sideTop', 'title', v)} />
                <TextInput label="Subtitle" value={banners.sideTop.subtitle} onChange={(v) => handleTextChange('sideTop', 'subtitle', v)} />
                <TextInput label="Price" value={banners.sideTop.price} onChange={(v) => handleTextChange('sideTop', 'price', v)} />
                <ColorPicker label="Background Color" value={banners.sideTop.bgColor} onChange={(v) => handleTextChange('sideTop', 'bgColor', v)} />
                <ImageInput label="Upload Image" onChange={(e) => onFileChange(e, 'sideTop')} />
              </EditorSection>

              {/* --- BOTTOM SIDE FORM --- */}
              <EditorSection title="Bottom Side Card" color="green">
                <TextInput label="Title" value={banners.sideBottom.title} onChange={(v) => handleTextChange('sideBottom', 'title', v)} />
                <TextInput label="Highlighted Subtitle" value={banners.sideBottom.subtitle} onChange={(v) => handleTextChange('sideBottom', 'subtitle', v)} />
                <ColorPicker label="Background Color" value={banners.sideBottom.bgColor} onChange={(v) => handleTextChange('sideBottom', 'bgColor', v)} />
                <ImageInput label="Upload Image" onChange={(e) => onFileChange(e, 'sideBottom')} />
              </EditorSection>

              <button 
                onClick={handleSave}
                disabled={saving || !selectedSlug}
                className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all disabled:opacity-50 sticky bottom-0 shadow-xl"
              >
                {saving ? 'Saving...' : 'Save Updates 💾'}
              </button>
              
              {status && (
                <div className={`p-3 rounded-lg text-center font-bold ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {status.msg}
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: LIVE PREVIEW */}
            <div className="lg:col-span-2">
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-200 sticky top-4">
                <h2 className="text-gray-400 font-bold uppercase text-xs tracking-wider mb-4 border-b pb-2">Live Preview</h2>
                {/* This uses the Shared Component */}
                <BannerDisplay banners={banners} />
              </div>
            </div>

          </div>
        )}
      </div>

      {/* --- CROPPER MODAL --- */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden relative flex flex-col h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Crop Image</h3>
              <button onClick={() => setCropImageSrc(null)} className="text-gray-500 hover:text-red-500">✕</button>
            </div>
            
            <div className="relative flex-1 bg-gray-900">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={currentCropField === 'main' ? 16 / 9 : 4 / 3} // Adjust aspect ratios per section
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-6 bg-white flex items-center gap-4">
              <span className="text-sm font-bold text-gray-500">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                className="flex-1"
              />
              <button 
                onClick={saveCroppedImage}
                className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// --- SUB-COMPONENTS for cleaner code ---

const EditorSection = ({ title, color, children }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border-l-4 border-${color}-500`}>
    <h3 className="font-bold text-lg mb-4 text-gray-800">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const TextInput = ({ label, value, onChange, isTextArea }) => (
  <div>
    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{label}</label>
    {isTextArea ? (
      <textarea 
        className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 outline-none resize-none h-20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <input 
        type="text" 
        className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    )}
  </div>
);

const ColorPicker = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between border border-gray-200 rounded-lg p-2">
    <label className="text-xs font-bold text-gray-400 uppercase">{label}</label>
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono">{value}</span>
      <input 
        type="color" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border-none"
      />
    </div>
  </div>
);

const ImageInput = ({ label, onChange }) => (
  <div className="pt-2">
    <label className="block w-full cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold py-3 px-4 rounded-lg text-center transition-colors border border-dashed border-gray-300">
      {label}
      <input type="file" className="hidden" accept="image/*" onChange={onChange} />
    </label>
  </div>
);

export default BannerEditor;