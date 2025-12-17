import Constants from "expo-constants";
import { Platform } from "react-native";

// Constants
export const MS_TO_S: number = 1_000;
export const DAILY_CALORIE_GOAL = 2500;

// API Configuration
// Dynamically determine the base URL based on platform
const getApiBaseUrl = () => {
  // For web/browser, use localhost
  if (Platform.OS === "web") {
    return "http://localhost:7770";
  }

  // For mobile devices, extract IP from Expo's manifest URL
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const host = debuggerHost.split(":")[0];
    return `http://${host}:7770`;
  }

  // Fallback to localhost (shouldn't normally reach here)
  return "http://localhost:7770";
};

export const API_BASE_URL = getApiBaseUrl();
