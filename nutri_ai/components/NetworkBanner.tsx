import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNetwork } from "../context/NetworkContext";
import { Colors } from "../constants/theme";

const NetworkBanner = () => {
  const { isInternetReachable, isServerReachable } = useNetwork();

  if (isInternetReachable && isServerReachable) {
    return null;
  }

  const message = !isInternetReachable ? "Offline mode" : "Server unreachable";

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "black",
    padding: 10,
    alignItems: "center",
    paddingBottom: 20, // Move text up
  },
  bannerText: {
    color: "white",
    fontWeight: "500", // Less bold
  },
});

export default NetworkBanner;
