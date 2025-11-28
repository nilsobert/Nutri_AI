import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BadCredentialsComponent = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Wrong{"\n"}Password</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.tryButton}
          onPress={() => router.push("/screens/login-screen")}
        >
          <Text style={styles.tryButtonText}>TRY AGAIN</Text>
        </TouchableOpacity>

        <View style={styles.forgotRow}>
          <Text style={styles.forgotText}>Forgot your password? </Text>
          <TouchableOpacity
            onPress={() => router.push("/screens/recover-screen")}
          >
            <Text style={styles.recoverLink}>Retrieve Password</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/screens/home-screen")}
          style={styles.homeWrap}
        >
          <Text style={styles.welcomeLink}>Welcome Screen</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#c9e09a" },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: Platform.OS === "ios" ? 84 : 72,
  },
  title: {
    color: "#000000",
    fontSize: 38,
    lineHeight: 46,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 32,
  },
  tryButton: {
    width: "86%",
    maxWidth: 460,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#1E8E3E",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: "rgba(0,0,0,0.18)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  tryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.6,
  },
  forgotRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    justifyContent: "center",
  },
  forgotText: { color: "#ffffff", fontSize: 12, opacity: 0.92 },
  recoverLink: {
    color: "#ffd34d",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  homeWrap: { marginTop: 34 },
  welcomeLink: { color: "#ffd34d", fontWeight: "700", fontSize: 13 },
});

export default BadCredentialsComponent;
