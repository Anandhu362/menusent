import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, Autocomplete } from '@react-google-maps/api';
import { Search } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '16px'
};

// Default center (Dubai)
const defaultCenter = { lat: 25.2048, lng: 55.2708 };

// ✅ CRITICAL OPTIMIZATION: Defined outside to prevent script re-injection on every render
const libraries = ['places']; 

// ✅ PREMIUM MINIMAL MAP STYLING
const minimalMapStyle = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", stylers: [{ color: "#f8f9fa" }] },
  { featureType: "water", stylers: [{ color: "#e9ecef" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffffff" }, { weight: 1.5 }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }, { weight: 1 }] },
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#ffffff" }, { weight: 0.5 }] },
  { featureType: "poi.park", stylers: [{ color: "#e5eedb" }] },
  { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] }
];

// ✅ Wrap the entire component in memo to prevent expensive re-renders 
// when parent form fields (Name, Phone, etc.) change in Checkout.jsx
const LocationPickerMap = memo(({ onLocationSelect, initialLocation }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries 
  });

  const [markerPos, setMarkerPos] = useState(initialLocation || null);
  const [mapCenter, setMapCenter] = useState(initialLocation || defaultCenter);
  const autocompleteRef = useRef(null);
  
  // Use a ref for the map instance to avoid triggering visual re-renders unnecessarily
  const mapRef = useRef(null);

  useEffect(() => {
    if (initialLocation) {
      setMapCenter(initialLocation);
      setMarkerPos(initialLocation);
    }
  }, [initialLocation]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    setMarkerPos({ lat, lng });
    
    if (onLocationSelect) {
      onLocationSelect({ lat, lng });
    }
  }, [onLocationSelect]);

  const onLoadAutocomplete = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      
      if (!place || !place.geometry || !place.geometry.location) {
        console.warn("Please select an exact location from the dropdown.");
        return; 
      }
      
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      const newPos = { lat, lng };
      setMapCenter(newPos);
      setMarkerPos(newPos);
      
      if (onLocationSelect) {
        onLocationSelect(newPos);
      }
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 font-bold">
        Loading Map...
      </div>
    );
  }

  return (
    <div className="relative border-4 border-slate-100 rounded-[20px] overflow-hidden shadow-sm">
      
      <style>{`
        /* Premium Search Dropdown Styling */
        .pac-container {
          border-radius: 16px !important;
          border: none !important;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15) !important;
          margin-top: 8px !important;
          font-family: inherit !important;
          padding: 8px !important;
        }
        .pac-item {
          padding: 12px 16px !important;
          cursor: pointer !important;
          font-size: 13px !important;
          color: #64748b !important;
          border: none !important;
          border-radius: 12px !important;
          transition: all 0.2s ease;
        }
        .pac-item:hover {
          background-color: #fff7ed !important; 
        }
        .pac-item-query {
          font-weight: 800 !important;
          color: #0f172a !important;
          font-size: 15px !important;
          padding-right: 4px;
        }
        .pac-matched { color: #ff6d33 !important; }
        .pac-icon { display: none !important; }
        .hdpi.pac-logo:after { margin: 12px 16px !important; }
      `}</style>

      <div className="absolute top-4 left-4 right-4 z-10">
        <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search your area or building..."
              className="w-full bg-white border-0 shadow-xl rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ff6d33] transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
            />
          </div>
        </Autocomplete>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={14}
        onLoad={onMapLoad}
        onClick={onMapClick}
        options={{
          disableDefaultUI: true, 
          zoomControl: false,       
          gestureHandling: 'greedy', 
          styles: minimalMapStyle   
        }}
      >
        {markerPos && (
          <MarkerF 
            position={markerPos} 
            animation={window.google.maps.Animation.DROP}
            draggable={true} 
            onDragEnd={onMapClick}
          />
        )}
      </GoogleMap>
      
      {!markerPos && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-black shadow-xl pointer-events-none whitespace-nowrap">
          Tap map to set delivery pin
        </div>
      )}
    </div>
  );
});

export default LocationPickerMap;