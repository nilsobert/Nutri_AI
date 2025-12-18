import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Colors } from "../constants/theme";
import { API_BASE_URL } from "../constants/values";

const RecoverComponent = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [email, setEmail] = useState("");

  const isEmailOrUsernameRegistered = async (
    input: string,
  ): Promise<boolean> => {
    try {
      // Check if it's an email (contains @) or username
      const isEmail = input.includes("@");

      const queryParam = isEmail
        ? `email=${encodeURIComponent(input)}`
        : `name=${encodeURIComponent(input)}`;

      const res = await fetch(
        `${API_BASE_URL}/check-availability?${queryParam}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!res.ok) throw new Error("network");
      const json = await res.json();

      // If email/name_available is false, it means it IS registered
      if (isEmail) {
        return !json.email_available;
      } else {
        return !json.name_available;
      }
    } catch (err) {
      console.error("Error checking email/username availability:", err);
      return false;
    }
  };

  const handleRecover = async () => {
    const addr = email.trim();
    if (!addr) {
      Alert.alert(
        "Enter email or username",
        "Please enter your email address or username.",
      );
      return;
    }

    const registered = await isEmailOrUsernameRegistered(addr);
    if (registered) {
      // Email/username is registered - show alert and stay on page
      Alert.alert(
        "Password Reset",
        "Please check your email to reset your password.",
        [{ text: "OK", style: "default" }],
      );
    } else {
      // Email/username not registered - redirect to not found page
      router.push("/screens/notfound-screen");
    }
  };

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;
  const placeholderColor = isDark ? "#666" : "#bfc9b2";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.wrapper}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              Forgot your{"\n"}password?
            </Text>
            <Text style={[styles.subtitle, { color: Colors.primary }]}>
              Nothing to worry about!
            </Text>
          </View>

          <Text style={[styles.instruction, { color: textColor }]}>
            Please enter your email{"\n"}or username:
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Username or Email"
              placeholderTextColor={placeholderColor}
              style={[
                styles.input,
                { backgroundColor: cardBg, color: textColor },
              ]}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleRecover}
            />

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleRecover}
              accessibilityLabel="Send reset"
            >
              <Text style={styles.sendIcon}>›</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.welcomeRow}
            onPress={() => router.push("/")}
          >
            <Text style={[styles.welcomeLink, { color: Colors.primary }]}>
              Welcome Screen
            </Text>
          </TouchableOpacity>

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  wrapper: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === "ios" ? 48 : 36,
    alignItems: "stretch",
  },
  header: { marginBottom: 18 },
  title: {
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 18,
  },
  instruction: { fontSize: 14, marginBottom: 12 },
  inputRow: {
    position: "relative",
    marginBottom: 18,
    justifyContent: "center",
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 56,
    fontSize: 15,
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  sendButton: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "rgba(0,0,0,0.18)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  sendIcon: {
    color: "#ffffff",
    fontSize: 22,
    lineHeight: 22,
    transform: [{ translateX: 1 }],
  },
  welcomeRow: { alignItems: "center", marginTop: 12 },
  welcomeLink: { fontWeight: "700", fontSize: 13 },
});

export default RecoverComponent;
