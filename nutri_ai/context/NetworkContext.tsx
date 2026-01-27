import React, { createContext, useContext, useEffect, useState } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { API_BASE_URL } from "../constants/values";

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean;
  isServerReachable: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  isServerReachable: true,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [isServerReachable, setIsServerReachable] = useState(true);

  // Check server connectivity every few seconds
  useEffect(() => {
    const checkServerConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${API_BASE_URL}/health`, {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        setIsServerReachable(response.ok);
      } catch (error) {
        setIsServerReachable(false);
      }
    };

    // Check immediately on mount
    checkServerConnectivity();

    // Set up interval to check every 5 seconds
    const interval = setInterval(checkServerConnectivity, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
      // isInternetReachable can be null initially, default to true to avoid flashing offline state
      setIsInternetReachable(state.isInternetReachable ?? true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NetworkContext.Provider
      value={{ isConnected, isInternetReachable, isServerReachable }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
