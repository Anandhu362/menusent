import { registerPlugin } from '@capacitor/core';

// Register it with Capacitor using the exact name from your Java class
const WifiManager = registerPlugin('WifiManagerPlugin');

export default WifiManager;