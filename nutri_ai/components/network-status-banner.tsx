import React from "react";
import { View, Text, StyleSheet, useColorScheme, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetwork } from "../context/NetworkContext";
import { Colors, Spacing, Typography } from "../constants/theme";

interface NetworkStatusBannerProps {
  visible?: boolean;
}

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({
  visible = true,
}) => {
  const { isConnected, isServerReachable } = useNetwork();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  // Determine banner state
  const isOffline = !isConnected;
  const isServerUnreachable = isConnected && !isServerReachable;

  // Don't show banner if everything is fine
  if (!isOffline && !isServerUnreachable) {
    return null;
  }

  const bannerBg = isOffline ? "#FF3B30" : "#ffc800ff"; // Red for offline, orange for server unreachable
  const message = isOffline ? "Offline Mode" : "Server Unreachable";

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: bannerBg,
          paddingTop: insets.top + Spacing.sm,
        },
      ]}
    >
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: {
    color: "white",
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    textAlign: "center",
  },
});
