import React, { useState, useEffect } from 'react';
import { MapPin, Truck, Save, DollarSign, AlertCircle } from 'lucide-react';
import LocationPickerMap from './LocationPickerMap';

const DeliverySettingsPanel = ({ initialData, onSave, isSaving }) => {
  // Initialize state with the restaurant's existing data, or safe defaults
  const [location, setLocation] = useState(initialData?.location || null);
  const [settings, setSettings] = useState({
    freeRadiusKm: initialData?.deliverySettings?.freeRadiusKm || 3,
    feePerExtraKm: initialData?.deliverySettings?.feePerExtraKm || 2,
    maxDeliveryRadiusKm: initialData?.deliverySettings?.maxDeliveryRadiusKm || 10,
  });

  // Sync state if initialData is loaded asynchronously by the parent
  useEffect(() => {
    if (initialData) {
      if (initialData.location) setLocation(initialData.location);
      if (initialData.deliverySettings) setSettings(initialData.deliverySettings);
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0, // Ensure we store numbers, not strings
    }));
  };

  const handleSaveClick = () => {
    // Pass the combined data up to the parent page to handle the API call
    onSave({
      location,
      deliverySettings: settings
    });
  };

  return (
    <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-50 bg-slate-50 flex items-center gap-3">
        <div className="p-2 bg-white rounded-xl shadow-sm">
          <Truck className="h-5 w-5 text-slate-700" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Delivery Configuration</h2>
          <p className="text-xs font-bold text-slate-400">Set your kitchen location and pricing rules</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* SECTION 1: Kitchen Location (The Map) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#ff6d33]" />
            <h3 className="font-bold text-sm text-slate-800">1. Kitchen Pin Drop</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Drag and drop the pin to the exact location of your kitchen. This is used as the starting point (origin) for all Google Maps delivery calculations.
          </p>
          
          <LocationPickerMap 
            initialLocation={location} 
            onLocationSelect={(coords) => setLocation(coords)} 
          />
          
          {!location && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 text-xs font-bold">
              <AlertCircle className="h-4 w-4" />
              <p>You must set a location to enable dynamic delivery fees.</p>
            </div>
          )}
        </div>

        <hr className="border-dashed border-gray-200" />

        {/* SECTION 2: Pricing Rules */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#ff6d33]" />
            <h3 className="font-bold text-sm text-slate-800">2. Pricing Rules</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Rule 1: Free Radius */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Free Delivery Radius (KM)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="freeRadiusKm"
                  min="0"
                  step="0.1"
                  value={settings.freeRadiusKm}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#ff6d33] focus:ring-1 focus:ring-[#ff6d33] transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KM</span>
              </div>
            </div>

            {/* Rule 2: Cost Per Extra KM */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Fee per extra KM (AED)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="feePerExtraKm"
                  min="0"
                  step="0.5"
                  value={settings.feePerExtraKm}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#ff6d33] focus:ring-1 focus:ring-[#ff6d33] transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">AED</span>
              </div>
            </div>

            {/* Rule 3: Max Radius */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Max Delivery Range (KM)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="maxDeliveryRadiusKm"
                  min="0"
                  step="0.5"
                  value={settings.maxDeliveryRadiusKm}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#ff6d33] focus:ring-1 focus:ring-[#ff6d33] transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSaveClick}
            disabled={isSaving || !location}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${
              isSaving || !location 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white hover:bg-[#ff6d33] shadow-lg hover:shadow-xl hover:-translate-y-0.5'
            }`}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Saving Rules...' : 'Save Delivery Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliverySettingsPanel;