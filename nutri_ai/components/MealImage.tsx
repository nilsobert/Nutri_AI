import React, { useState, useEffect } from "react";
import { Image, View, StyleSheet, StyleProp, ImageStyle } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface MealImageProps {
  uri?: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
  showPlaceholder?: boolean;
}

export const MealImage: React.FC<MealImageProps> = ({
  uri,
  style,
  resizeMode = "cover",
  showPlaceholder = true,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [error, setError] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem("auth_token")
      .then((t) => {
        if (!isMounted) return;
        setToken(t);
        setTokenLoaded(true);
        if (__DEV__) console.log(`[MealImage] auth_token loaded: ${!!t}`);
      })
      .catch((e) => {
        if (!isMounted) return;
        setTokenLoaded(true);
        console.warn("[MealImage] Failed to load auth_token", e);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // If URI or token changes, retry (prevents a failed unauthenticated first request
  // from permanently turning into a placeholder once the token arrives).
  useEffect(() => {
    setError(false);
  }, [uri, token]);

  if (!uri || error) {
    if (!showPlaceholder) return null;
    return (
      <View
        style={[
          style,
          styles.placeholder,
          { backgroundColor: isDark ? "#333" : "#e1e1e1" },
        ]}
      >
        <Ionicons
          name="restaurant"
          size={24}
          color={isDark ? "#555" : "#ccc"}
        />
      </View>
    );
  }

  // If it's a local file, we don't need headers
  const isLocal = uri.startsWith("file://");

  // Our backend protects /static/* with Bearer auth. If we render a remote image
  // before the token is loaded, the first request can 401 and the Image will
  // error out. So we wait until we've loaded the token.
  if (!isLocal && !tokenLoaded) {
    if (__DEV__) console.log(`[MealImage] Waiting for token before rendering remote image: ${uri}`);
    if (!showPlaceholder) return null;
    return (
      <View
        style={[
          style,
          styles.placeholder,
          { backgroundColor: isDark ? "#333" : "#e1e1e1" },
        ]}
      >
        <Ionicons
          name="restaurant"
          size={24}
          color={isDark ? "#555" : "#ccc"}
        />
      </View>
    );
  }

  const source = isLocal
    ? { uri }
    : {
        uri,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      };

  if (__DEV__) {
    console.log(
      `[MealImage] Rendering image: ${uri}, isLocal: ${isLocal}, tokenLoaded: ${tokenLoaded}, hasToken: ${!!token}`
    );
  }

  return (
    <Image
      key={`${uri}-${token || "no-token"}`}
      source={source}
      style={style}
      resizeMode={resizeMode}
      onLoadStart={() => {
        if (__DEV__) console.log(`[MealImage] onLoadStart: ${uri}`);
      }}
      onLoadEnd={() => {
        if (__DEV__) console.log(`[MealImage] onLoadEnd: ${uri}`);
      }}
      onError={(e) => {
        console.warn(`[MealImage] Error loading image: ${uri}`, e.nativeEvent);
        setError(true);
      }}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
});
