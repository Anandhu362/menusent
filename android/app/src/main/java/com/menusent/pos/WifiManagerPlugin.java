package com.menusent.pos;

import android.content.Intent;
import android.provider.Settings;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WifiManagerPlugin")
public class WifiManagerPlugin extends Plugin {

    @PluginMethod
    public void openWifiPanel(PluginCall call) {
        // Use full-screen Wi-Fi settings so the keyboard can successfully appear in Kiosk Mode
        Intent intent = new Intent(Settings.ACTION_WIFI_SETTINGS);

        // Start the native Android Settings activity
        getActivity().startActivity(intent);

        // Resolve the Capacitor bridge call so the React frontend knows it executed
        call.resolve();
    }
}