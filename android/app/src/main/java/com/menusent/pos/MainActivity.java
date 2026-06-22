package com.menusent.pos;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;

// ADDED IMPORTS FOR THE NATIVE BRIDGE
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register the custom Wi-Fi plugin so the React frontend can trigger the connection panel
        registerPlugin(WifiManagerPlugin.class);
    }

    @Override
    public void onResume() {
        super.onResume();

        DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName adminName = new ComponentName(this, AdminReceiver.class);

        try {
            // Check if MenuSent is the Device Owner
            if (dpm.isDeviceOwnerApp(getPackageName())) {

                // 1. Whitelist our app AND the Android Settings app for TRUE Lock Task Mode
                // This allows the full-screen Wi-Fi settings to open and permits the keyboard to render.
                dpm.setLockTaskPackages(adminName, new String[]{
                        getPackageName(),
                        "com.android.settings"
                });

                // 2. Force this app to be the default Home Screen automatically
                IntentFilter intentFilter = new IntentFilter(Intent.ACTION_MAIN);
                intentFilter.addCategory(Intent.CATEGORY_HOME);
                intentFilter.addCategory(Intent.CATEGORY_DEFAULT);
                dpm.addPersistentPreferredActivity(adminName, intentFilter, new ComponentName(this, MainActivity.class));
            }

            // Start Lock Task Mode (Kiosk Mode)
            startLockTask();

        } catch (Exception e) {
            e.printStackTrace();
        }

        // ==========================================
        // NEW: BULLETPROOF NATIVE OFFLINE BRIDGE
        // ==========================================
        try {
            // Grab the native Android WebView that Capacitor is running inside
            WebView webView = this.bridge.getWebView();
            if (webView != null) {
                // Forcefully inject a raw Java object into the HTML's window object
                webView.addJavascriptInterface(new Object() {

                    @JavascriptInterface
                    public void openWifi() {
                        // This fires directly from the HTML button, bypassing Capacitor entirely!
                        Intent intent = new Intent(Settings.ACTION_WIFI_SETTINGS);
                        MainActivity.this.startActivity(intent);
                    }

                }, "NativeKiosk");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}