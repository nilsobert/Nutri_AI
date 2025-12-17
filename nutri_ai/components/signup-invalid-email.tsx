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

export default function SignupInvalidEmail() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>The email does{"\n"}not exist</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.tryButton}
          onPress={() => router.push("/screens/signup-screen")}
        >
          <Text style={styles.tryButtonText}>TRY AGAIN</Text>
        </TouchableOpacity>

        <View style={styles.iconSpacer} />

        <TouchableOpacity
          onPress={() => router.push("/")}
          style={styles.homeWrap}
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
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: Platform.OS === "ios" ? 84 : 72,
  },
  title: {
    color: "#000000",
    fontSize: 34,
    lineHeight: 42,
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
  iconSpacer: {
    width: 28,
    height: 40,
    marginTop: 14,
    marginBottom: 8,
  },
  homeWrap: {
    marginTop: 24,
  },
  welcomeLink: {
    color: "#ffd34d",
    fontWeight: "700",
    fontSize: 13,
  },
});
