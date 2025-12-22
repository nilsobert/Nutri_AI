import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing } from "../constants/theme";
import { useUser } from "../context/UserContext";
import { API_BASE_URL } from "../constants/values";

const IOSStyleLoginScreen = () => {
  const router = useRouter();
  const { fetchUser } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const emailTrim = (email || "").trim().toLowerCase();

    if (!emailTrim || !password) {
      Alert.alert("Missing fields", "Please enter email and password");
      return;
    }

    console.log(`[Login] Attempting to login user: ${emailTrim}`);
    console.log(`[Login] Server URL: ${API_BASE_URL}/login`);

    setIsLoading(true);
    try {
      console.log("[Login] Sending login request...");
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailTrim,
          password: password,
        }),
      });

      console.log(`[Login] Response status: ${response.status}`);
      const data = await response.json();
      console.log(`[Login] Response data:`, data);

      if (!response.ok) {
        console.error("[Login] Login failed:", data.detail);
        Alert.alert(
          "Login Failed",
          data.detail || "Incorrect email or password",
        );
        return;
      }

      // Store token
      console.log("[Login] Storing auth token...");
      await AsyncStorage.setItem("auth_token", data.access_token);
      console.log("[Login] Auth token stored successfully");

      // Fetch user profile from server
      console.log("[Login] Fetching user profile from server...");
      await fetchUser();
      console.log("[Login] User profile fetched successfully");

      console.log("[Login] Login successful, navigating to home...");
      router.push("/(tabs)");
    } catch (err: any) {
      console.error("[Login] Error:", err);
      console.error("[Login] Error message:", err.message);
      console.error("[Login] Error stack:", err.stack);
      Alert.alert(
        "Connection Error",
        `Could not connect to the server. ${err.message || "Please check your internet connection."}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- Dynamic colors for dark/light mode ---
  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";
  const inputBg = isDark ? "#2a2a2a" : "#f5f5f5";
  const placeholderColor = isDark ? "#888" : "#9aa5a0";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <Modal transparent={true} animationType="fade" visible={isLoading}>
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: isDark ? "#333" : "white" },
            ]}
          >
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.loadingText, { color: textColor }]}>
              Logging in...
            </Text>
          </View>
        </View>
      </Modal>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: textColor }]}>
            Welcome back!
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="mail-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: secondaryText }]}>
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={placeholderColor}
                  style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: secondaryText }]}>
                  Password
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={placeholderColor}
                  secureTextEntry
                  style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>

          <View style={styles.signupLinkContainer}>
            <Text style={[styles.signupLinkText, { color: textColor }]}>
              Don't have an account?{" "}
              <Text
                style={{ color: Colors.primary, fontWeight: "700" }}
                onPress={() => router.push("/screens/signup-screen")}
              >
                Sign Up
              </Text>
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.loginButton,
              (!email || !password) && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!email || !password}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xl * 1.5,
  },
  form: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    fontWeight: "600",
  },
  signupLinkContainer: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  signupLinkText: {
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default IOSStyleLoginScreen;
