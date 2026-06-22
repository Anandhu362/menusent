import React, { useState, useEffect } from 'react';
import WifiManager from '../utils/WifiManager';

const OfflineOverlay = () => {
  // Check initial network status
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Listeners to automatically update state when connection changes
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleOpenWifiSettings = async () => {
    try {
      // This triggers the Java code and opens the Android bottom sheet!
      await WifiManager.openWifiPanel();
    } catch (error) {
      console.error('Failed to open Wi-Fi panel:', error);
    }
  };

  // If online, render nothing
  if (!isOffline) return null;

  // If offline, render a full-screen overlay (z-index 9999 ensures it's on top of everything)
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">No Internet Connection</h1>
      <p className="mb-8 text-center text-lg px-6">
        MenuSent POS requires an active network connection to process orders.
      </p>
      
      <button 
        onClick={handleOpenWifiSettings}
        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-xl transition-colors"
      >
        Select Wi-Fi Network
      </button>
    </div>
  );
};

export default OfflineOverlay;