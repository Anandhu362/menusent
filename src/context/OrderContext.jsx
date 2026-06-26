import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { useAuth } from './AuthContext';
import { getRestaurantOrders } from '../api/order.api.js';
import { ref, onChildAdded, query, orderByChild, startAt } from 'firebase/database';
import { database } from '../utils/firebase';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const { user } = useAuth();
  const restaurantId = user?.restaurantId;
  
  const [orders, setOrders] = useState([]);
  const audioRef = useRef(null);
  const beepIntervalRef = useRef(null);

  // 1. Fetch orders and listen to Firebase globally
  useEffect(() => {
    if (!restaurantId) return;

    const fetchInitialOrders = async () => {
      try {
        const data = await getRestaurantOrders(restaurantId);
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch global orders:", error);
      }
    };
    fetchInitialOrders();

    const ordersRef = ref(database, `live-orders/${restaurantId}`);
    const now = Date.now();
    const newOrdersQuery = query(ordersRef, orderByChild('timestamp'), startAt(now));

    const unsubscribe = onChildAdded(newOrdersQuery, async (snapshot) => {
      const newOrder = snapshot.val();
      if (typeof newOrder._id === 'object' || typeof newOrder._id === 'undefined') return;

      setOrders((prevOrders) => {
        if (prevOrders.some(o => o._id === newOrder._id)) return prevOrders;

        // Trigger native tablet notification globally
        if (Capacitor.isNativePlatform()) {
          LocalNotifications.schedule({
            notifications: [
              {
                title: "🚨 New Order Received!",
                body: `${newOrder.customerName} just placed an order.`,
                id: Math.floor(Date.now() / 1000), 
                schedule: { at: new Date(Date.now() + 1000) }
              }
            ]
          });
        }
        return [newOrder, ...prevOrders];
      });
    });

    return () => unsubscribe();
  }, [restaurantId]);

  // 2. Global Audio Looping Logic
  const pendingCount = orders.filter(o => o.orderStatus === "Pending").length;

  useEffect(() => {
    const playSound = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => console.log("Audio prevented:", err));
      }
    };

    if (pendingCount > 0) {
      if (!beepIntervalRef.current) {
        playSound(); 
        beepIntervalRef.current = setInterval(playSound, 60000); 
      }
    } else {
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
    }

    return () => {
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
    };
  }, [pendingCount]);

  return (
    <OrderContext.Provider value={{ orders, setOrders }}>
      <audio ref={audioRef} src="/notification.mp3" preload="auto" className="hidden" />
      {children}
    </OrderContext.Provider>
  );
};

export const useGlobalOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useGlobalOrders must be used within an OrderProvider");
  return context;
};