import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";

export default function RecoverNotFound() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <View style={styles.container}>
        <Text style={[styles.message, { color: textColor }]}>
          The email is{"\n"}not registered
        </Text>

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
          <Text style={[styles.welcomeLink, { color: Colors.primary }]}>
            Welcome Screen
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
    backgroundColor: Colors.primary,
    opacity: 0.8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
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
    fontWeight: "700",
    fontSize: 13,
  },
});
