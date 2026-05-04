import React, { createContext, useState, useEffect, useContext } from 'react';
import { Capacitor } from '@capacitor/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial';
import { TcpSocket } from 'capacitor-tcp-socket';

const PrinterContext = createContext();

// Helper to convert JS strings to raw bytes for thermal printers
const stringToBytes = (str) => {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i) & 0xFF; 
  }
  return bytes.buffer; 
};

// Smart Address Formatter
const formatAddress = (addr) => {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    const parts = [];
    if (addr.building) parts.push(addr.building);
    if (addr.apt) parts.push(`Apt/Villa ${addr.apt}`);
    if (addr.landmark) parts.push(`Near ${addr.landmark}`);
    if (parts.length === 0) return Object.values(addr).filter(Boolean).join(", ");
    return parts.join(", ");
  }
  return String(addr);
};

export const PrinterProvider = ({ children }) => {
  const [btConnectionStatus, setBtConnectionStatus] = useState("Disconnected"); 
  const [pairedDevices, setPairedDevices] = useState([]); 
  const [showDeviceModal, setShowDeviceModal] = useState(false); 
  const [activeMacAddress, setActiveMacAddress] = useState(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (Capacitor.isNativePlatform()) {
        BluetoothSerial.disconnect().catch(() => {});
      }
    };
  }, []);

  const scanForPrinters = async () => {
    if (!Capacitor.isNativePlatform()) {
      alert("Bluetooth is only available on the Android Tablet app.");
      return;
    }

    try {
      const isEnabled = await BluetoothSerial.isEnabled();
      if (!isEnabled) {
        alert("Please turn on Bluetooth in your tablet settings first!");
        return;
      }

      setBtConnectionStatus("Scanning...");
      const devices = await BluetoothSerial.list();
      setPairedDevices(devices);
      setShowDeviceModal(true);
      setBtConnectionStatus("Disconnected");

    } catch (error) {
      console.error("Failed to list devices:", error);
      alert("Failed to scan Bluetooth devices. Ensure permissions are granted.");
      setBtConnectionStatus("Disconnected");
    }
  };

  const connectToSelectedPrinter = async (macAddress) => {
    setShowDeviceModal(false);
    setActiveMacAddress(macAddress);
    setBtConnectionStatus("Connecting");

    try {
      try { await BluetoothSerial.disconnect(); } catch (e) {}

      setTimeout(() => {
        console.log(`Attempting connection to selected MAC: ${macAddress}...`);
        
        BluetoothSerial.connectInsecure(macAddress).subscribe(
          () => {
            console.log("🟢 Bluetooth Connected Successfully!");
            setBtConnectionStatus("Connected");
          },
          (err) => {
            console.error("🔴 Connection Error:", err);
            setBtConnectionStatus("Disconnected");
            setActiveMacAddress(null);
            alert("Connection failed. Please ensure the printer is turned on.");
          }
        );
      }, 800);

    } catch (error) {
      console.error("Bluetooth connection error:", error);
      setBtConnectionStatus("Disconnected");
    }
  };

  const disconnectPrinter = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await BluetoothSerial.disconnect();
      } catch (e) {}
    }
    setBtConnectionStatus("Disconnected");
    setActiveMacAddress(null);
  };

  const generateReceiptText = (order, isPortable, config) => {
    const { user, restaurantAddress, restaurantPhone } = config;
    const padRight = (text, length) => String(text).padEnd(length, ' ').substring(0, length);
    const formatLine = (label, value) => {
      const valStr = String(value);
      const spaces = 48 - label.length - valStr.length;
      return spaces > 0 ? label + " ".repeat(spaces) + valStr + "\x0A" : label + " " + valStr + "\x0A";
    };

    let receiptText = "\x1B\x40"; 
    receiptText += "\x1B\x61\x01\x1B\x45\x01\x1D\x21\x11"; 
    receiptText += `${user?.name || "MenuSent Restaurant"}\x0A`;
    receiptText += "\x1D\x21\x00\x1B\x45\x00\x0A"; 
    
    if (user?.trn) receiptText += `TRN: ${user.trn}\x0A`;
    if (restaurantAddress) receiptText += `${restaurantAddress}\x0A`;
    else if (user?.address) receiptText += `${user.address}\x0A`;
    
    receiptText += `Tel: ${restaurantPhone || ""}\x0A`;
    receiptText += "------------------------------------------------\x0A";

    receiptText += "\x1B\x61\x00\x1B\x45\x01"; 
    receiptText += `Order ID: ${order.orderId}\x0A`;
    receiptText += "\x1B\x45\x00"; 
    receiptText += `Date: ${new Date(order.createdAt).toLocaleString()}\x0A`;
    receiptText += `Customer: ${order.customerName}\x0A`;
    receiptText += `Phone: ${order.customerPhone}\x0A`;
    if (order.deliveryAddress) receiptText += `Address: ${formatAddress(order.deliveryAddress)}\x0A`;
    receiptText += "------------------------------------------------\x0A";

    receiptText += "\x1B\x45\x01"; 
    receiptText += "Qty  Item                                    Amt\x0A"; 
    receiptText += "\x1B\x45\x00"; 
    receiptText += "------------------------------------------------\x0A";

    order.items?.forEach(item => {
      const qtyStr = padRight(`${item.quantity}x`, 5);
      const itemName = item.name.length > 34 ? item.name.substring(0, 31) + "..." : item.name;
      const itemStr = padRight(itemName, 35);
      const priceStr = String((item.price * item.quantity).toFixed(2)).padStart(8, ' ');
      
      receiptText += `${qtyStr}${itemStr}${priceStr}\x0A`;
      if(item.variantName) receiptText += `     (${item.variantName})\x0A`; 
    });
    receiptText += "------------------------------------------------\x0A";

    const subtotal = order.subtotal || 0; 
    const vat = order.vat || 0;
    const delivery = order.deliveryCharge || order.deliveryFee || 0;

    receiptText += formatLine("Subtotal:", subtotal.toFixed(2));
    if (vat > 0) receiptText += formatLine("VAT (5%):", vat.toFixed(2));
    if (delivery > 0) receiptText += formatLine("Delivery:", delivery.toFixed(2));

    receiptText += "------------------------------------------------\x0A";
    receiptText += "\x1B\x45\x01"; 
    receiptText += formatLine("TOTAL:", `AED ${(order.totalAmount || 0).toFixed(2)}`);
    receiptText += "\x1B\x45\x00"; 
    receiptText += "------------------------------------------------\x0A";

    receiptText += "\x1B\x61\x01\x1B\x45\x01"; 
    receiptText += "Thank you for your order!\x0A\x0A";
    receiptText += "\x1B\x45\x00\x1B\x4D\x01"; 
    receiptText += "Powered by MenuSent\x0A";
    receiptText += "System by AdsPro Designing\x0A";
    receiptText += "\x1B\x4D\x00"; 
    
    if (isPortable) {
      receiptText += "\x1B\x64\x05"; 
    } else {
      receiptText += "\x0A\x0A\x0A\x0A\x0A\x1D\x56\x41\x10"; 
    }

    return receiptText;
  };

  const printSilentlyOverBluetooth = async (order, config) => {
    if (btConnectionStatus !== "Connected" || !activeMacAddress) return false;
    try {
      const receiptText = generateReceiptText(order, true, config); 
      const dataBuffer = stringToBytes(receiptText);
      await new Promise((resolve, reject) => {
        BluetoothSerial.write(dataBuffer).then(resolve).catch(reject);
      });
      return true;
    } catch (error) {
      console.error("❌ Bluetooth Print Error:", error);
      setBtConnectionStatus("Disconnected"); 
      setActiveMacAddress(null);
      return false; 
    }
  };

  const printSilentlyOverWiFi = async (order, config) => {
    let clientId = null;
    try {
      const receiptText = generateReceiptText(order, false, config); 
      const connection = await TcpSocket.connect({ ipAddress: config.livePrinterIp, port: 9100 });
      clientId = connection.client;
      await TcpSocket.send({ client: clientId, data: receiptText });
      console.log("✅ Wi-Fi Print Success!");
    } catch (error) {
      console.error("❌ Native Print Error:", error);
      alert("Wi-Fi Printer connection failed.");
    } finally {
      if (clientId !== null) {
        try { await TcpSocket.disconnect({ client: clientId }); } catch (e) {}
      }
    }
  };

  const triggerPrint = async (order, config) => {
    if (Capacitor.isNativePlatform()) {
      let printed = false;
      if (btConnectionStatus === "Connected") {
        printed = await printSilentlyOverBluetooth(order, config);
      }
      if (!printed && config.livePrinterIp) {
        console.log("⚠️ Using Wi-Fi Printer Fallback...");
        await printSilentlyOverWiFi(order, config); 
      }
      return "NATIVE";
    } else {
      return "WEB";
    }
  };

  return (
    <PrinterContext.Provider value={{
      btConnectionStatus,
      pairedDevices,
      showDeviceModal,
      setShowDeviceModal,
      scanForPrinters,
      connectToSelectedPrinter,
      disconnectPrinter,
      triggerPrint
    }}>
      {children}
    </PrinterContext.Provider>
  );
};

export const usePrinter = () => useContext(PrinterContext);