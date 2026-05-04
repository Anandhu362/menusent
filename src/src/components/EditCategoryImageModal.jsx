import React, { useState, useEffect, useRef } from "react";
import { X, UploadCloud, Edit3, Image as ImageIcon } from "lucide-react";

export const EditCategoryImageModal = ({ isOpen, onClose, category, onUpdateImage }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Pre-fill the current image whenever the modal opens or the category changes
  useEffect(() => {
    if (category && isOpen) {
      const currentImageUrl = category.image?.gcsPath || category.image || '/fallback-category.png';
      setPreviewUrl(currentImageUrl);
      setFile(null); // Reset the selected file
    }
  }, [category, isOpen]);

  if (!isOpen || !category) return null;

  // --- Image Handling Logic ---
  const handleFileChange = (selectedFile) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      alert("Please upload a valid image file.");
    }
  };

  const onFileSelect = (e) => {
    handleFileChange(e.target.files[0]);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  const handleSave = () => {
    if (!file) {
      alert("Please select a new image first.");
      return;
    }
    const formData = new FormData();
    formData.append('image', file);
    
    onUpdateImage(formData); // Pass the FormData back to MenuManagement
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Dark blurry backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="bg-white w-full max-w-[440px] rounded-[28px] shadow-2xl relative flex flex-col animate-in fade-in zoom-in-95 duration-200 z-10 font-sans overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-[#ff6b35]" />
            Edit Category Image
          </h2>
          <button 
            onClick={onClose}
            className="h-8 w-8 bg-gray-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-5 flex items-center gap-3">
             <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-100 overflow-hidden">
                <img src={category.image?.gcsPath || category.image || "/fallback-category.png"} alt={category.name} className="h-full w-full object-cover"/>
             </div>
             <div>
                <p className="text-xs font-semibold text-gray-400">Editing image for</p>
                <p className="text-base font-extrabold text-slate-900 truncate max-w-[280px]">{category.name}</p>
             </div>
          </div>
          
          {/* Custom File Upload Area */}
          <div 
            className={`relative rounded-2xl border-2 border-dashed transition-colors duration-200 group flex flex-col items-center justify-center p-6 text-center h-[200px] overflow-hidden ${
              isDragging ? "border-[#ff6b35] bg-orange-50" : "border-gray-200 bg-slate-50 hover:border-[#ff6b35]/50 hover:bg-orange-50/20"
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {previewUrl ? (
              <div className="absolute inset-0 h-full w-full">
                <img src={previewUrl} alt="New Preview" className="h-full w-full object-cover" />
                {/* Overlay to hint upload on hover */}
                <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <UploadCloud className="h-8 w-8 mb-2" />
                    <span className="text-sm font-bold">Drop new image or Click to replace</span>
                </div>
              </div>
            ) : (
              <>
                <UploadCloud className={`h-10 w-10 mb-3 transition-colors ${isDragging ? "text-[#ff6b35]" : "text-gray-400 group-hover:text-[#ff6b35]"}`} />
                <p className="text-sm font-semibold text-slate-700 mb-1.5">Drag & Drop new category image</p>
                <p className="text-xs text-gray-400">Supported formats: JPG, PNG, WEBP</p>
              </>
            )}
            
            {/* Hidden Input & Overlay Click Area */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={onFileSelect} 
              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            />
          </div>
          
          {file && (
            <div className="mt-4 flex items-center gap-2 bg-white/90 rounded-full px-3 py-1.5 shadow-sm border border-gray-100 text-slate-700 animate-in fade-in slide-in-from-top-2">
                <ImageIcon className="w-3.5 h-3.5 text-[#ff6b35]" />
                <span className="text-xs font-bold truncate pr-1">New Image: {file.name}</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-50 flex justify-end gap-3 bg-gray-50/30">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!file}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm ${
                file 
                ? 'bg-[#ff6b35] hover:bg-[#ff5a1f] active:scale-95 shadow-[#ff6b35]/20' 
                : 'bg-slate-200 cursor-not-allowed text-slate-400'
            }`}
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditCategoryImageModal;