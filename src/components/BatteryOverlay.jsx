import React, { useEffect, useState } from 'react';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Toast } from '@capacitor/toast';

const BatteryOverlay = () => {
  const [batteryInfo, setBatteryInfo] = useState({ level: 1, isCharging: true });
  const [showWarning, setShowWarning] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [hasTriggeredNative, setHasTriggeredNative] = useState(false);

  // 1. Fetch Battery Data Every 30 Seconds
  useEffect(() => {
    let isMounted = true;

    const checkBattery = async () => {
      if (!Capacitor.isNativePlatform()) {
        if (isMounted) setBatteryInfo({ level: 1, isCharging: true }); 
        return; 
      }

      try {
        const info = await Device.getBatteryInfo();
        if (isMounted) {
          setBatteryInfo({
            level: info.batteryLevel || 1, 
            isCharging: info.isCharging || false,
          });
        }
      } catch (error) {
        console.error("Failed to read battery info:", error);
      }
    };

    checkBattery();
    const intervalId = setInterval(checkBattery, 30000); 

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // 2. Handle Notification Logic (UI vs Native)
  useEffect(() => {
    const percentage = Math.round(batteryInfo.level * 100);
    const isCharging = batteryInfo.isCharging;

    // CRITICAL LEVEL: <= 20%
    if (percentage <= 20 && !isCharging) {
      setShowWarning(false); // Hide the UI modal to let Native take over
      
      // Fire Native Alerts exactly once per drain cycle
      if (!hasTriggeredNative && Capacitor.isNativePlatform()) {
        
        // 1. Native Toast Notification
        Toast.show({
          text: `CRITICAL: Tablet battery is at ${percentage}%. Plug in now!`,
          duration: 'long',
          position: 'top'
        }).catch(err => console.error(err));

        // 2. Native System Dropdown Notification
        LocalNotifications.schedule({
          notifications: [
            {
              title: "⚠️ KIOSK BATTERY CRITICAL",
              body: `Tablet battery is at ${percentage}%. Please plug in the charger immediately!`,
              id: 999, 
              schedule: { at: new Date(Date.now() + 1000) }, 
              sound: null,
            }
          ]
        }).catch(err => console.error(err));

        setHasTriggeredNative(true);
      }
    } 
    // WARNING LEVEL: 21% to 30%
    else if (percentage <= 30 && percentage > 20 && !isCharging) {
      if (!hasAcknowledged) setShowWarning(true);
      setHasTriggeredNative(false); // Reset native trigger in case it charged up a bit
    } 
    // SAFE LEVEL: Plugged in or > 30%
    else {
      setShowWarning(false);
      setHasAcknowledged(false);
      setHasTriggeredNative(false);
    }
  }, [batteryInfo, hasAcknowledged, hasTriggeredNative]);


  if (!Capacitor.isNativePlatform()) return null; 

  const percentage = Math.round(batteryInfo.level * 100);
  const isCritical = percentage <= 30 && !batteryInfo.isCharging;

  const getBatteryFillColor = () => {
    if (batteryInfo.isCharging) return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]';
    if (isCritical) return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]';
    return 'bg-slate-700'; 
  };

  return (
    <>
      {/* --- BOTTOM RIGHT FLOATING INDICATOR --- */}
      <div className="fixed bottom-6 right-6 z-[9900] flex items-center gap-3 px-4 py-2 bg-white/70 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-sm transition-all duration-300 hover:opacity-10 opacity-80">
        <span className={`font-semibold text-sm tracking-wide ${isCritical ? 'text-rose-600' : 'text-slate-800'}`}>
          {percentage}%
        </span>
        
        <div className="relative flex items-center">
          <div className="w-8 h-4 border-2 border-slate-400 rounded-[4px] p-[2px] flex items-center relative z-10">
            <div 
              className={`h-full rounded-[1px] transition-all duration-500 ease-out ${getBatteryFillColor()}`}
              style={{ width: `${percentage}%` }}
            />
            {batteryInfo.isCharging && (
              <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-emerald-900 drop-shadow-md z-20" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="w-1 h-2 bg-slate-400 rounded-r-sm ml-[1px]" />
        </div>
      </div>

      {/* --- 30% WARNING UI MODAL --- */}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 w-[400px] rounded-3xl shadow-2xl p-8 transform transition-all duration-300 scale-100">
            
            <div className="flex flex-col items-center text-center">
              <div className="relative flex justify-center items-center w-16 h-16 mb-6">
                <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-20 animate-ping"></span>
                <div className="relative flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full">
                  <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                Battery Low ({percentage}%)
              </h2>
              
              <p className="text-slate-600 mb-8 leading-relaxed">
                The kiosk is running low on power. Please connect the charger immediately to prevent disruption to operations.
              </p>

              <button 
                onClick={() => setHasAcknowledged(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3.5 px-4 rounded-xl transition-colors duration-200 shadow-md active:scale-[0.98]"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BatteryOverlay;