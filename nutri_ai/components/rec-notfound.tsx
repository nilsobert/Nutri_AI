import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RecoverNotFound() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.message}>The email is{"\n"}not registered</Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => router.push("/screens/recover-screen")}
          activeOpacity={0.85}
        >
          <Text style={styles.actionText}>Try a different email address</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => router.push("/screens/signup-screen")}
          activeOpacity={0.85}
        >
          <Text style={[styles.actionText, styles.primaryText]}>SIGN UP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/")}
          style={styles.welcomeWrap}
        >
          <Text style={styles.welcomeLink}>Welcome Screen</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#c9e09a",
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === "ios" ? 48 : 36,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  message: {
    marginTop: 24,
    color: "#000",
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 36,
  },
  actionButton: {
    width: "70%",
    minWidth: 220,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    shadowColor: "rgba(0,0,0,0.18)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
  secondaryButton: {
    backgroundColor: "#2f8d3a",
  },
  primaryButton: {
    backgroundColor: "#1E8E3E",
  },
  actionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  primaryText: {
    color: "#ffffff",
  },
  welcomeWrap: {
    marginTop: 18,
    alignItems: "center",
  },
  welcomeLink: {
    color: "#ffd34d",
    fontWeight: "700",
    fontSize: 13,
  },
});
