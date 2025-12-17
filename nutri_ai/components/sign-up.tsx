import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
import { Colors } from "../constants/theme";
import { API_BASE_URL } from "../constants/values";
import { useUser } from "../context/UserContext";
import { AppleStyleAlert } from "./ui/AppleStyleAlert";

export default function SignUp() {
  const router = useRouter();
  const { saveUser } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [remember, setRemember] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const handleSignUp = async () => {
    try {
      console.log("[SignUp] ========== BUTTON CLICKED ==========");
      console.log("[SignUp] Username:", username);
      console.log("[SignUp] Email:", email);
      console.log("[SignUp] Password length:", password.length);
      console.log("[SignUp] Confirm length:", confirm.length);

      const usernameTrim = username.trim();
      const emailTrim = email.trim().toLowerCase();

      // Validate all fields are filled
      if (!usernameTrim || !emailTrim || !password || !confirm) {
        console.log("[SignUp] ❌ Missing fields validation failed");
        console.log("[SignUp] Username filled:", !!usernameTrim);
        console.log("[SignUp] Email filled:", !!emailTrim);
        console.log("[SignUp] Password filled:", !!password);
        console.log("[SignUp] Confirm filled:", !!confirm);
        Alert.alert("Required Fields", "Please fill in all fields");
        return;
      }

      // Validate email format (must contain @ and have text before and after it)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrim)) {
        console.log("[SignUp] ❌ Email validation failed:", emailTrim);
        Alert.alert(
          "Invalid Email",
          "Please enter a valid email (e.g., user@example.com)",
        );
        return;
      }

      // Validate password length (at least 6 characters)
      if (password.length < 6) {
        console.log("[SignUp] ❌ Password too short:", password.length);
        Alert.alert(
          "Password Too Short",
          "Password must be at least 6 characters",
        );
        return;
      }

      // Validate password confirmation matches
      if (password !== confirm) {
        console.log("[SignUp] ❌ Password mismatch validation failed");
        console.log("[SignUp] Password:", password);
        console.log("[SignUp] Confirm:", confirm);
        Alert.alert(
          "Passwords Don't Match",
          "The passwords entered are not the same",
        );
        return;
      }

      console.log(
        "[SignUp] ✅ All validations passed. Checking availability...",
      );

      // Check if email or username already exists
      try {
        console.log("[SignUp] Checking if email/username is available...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(
          `${API_BASE_URL}/check-availability?email=${encodeURIComponent(emailTrim)}&name=${encodeURIComponent(usernameTrim)}`,
          {
            method: "GET",
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(
            "[SignUp] ❌ Availability check failed:",
            response.status,
          );
          Alert.alert(
            "Connection Error",
            "Could not verify availability. Check your connection and try again.",
          );
          return;
        }

        const data = await response.json();
        console.log("[SignUp] Availability check result:", data);

        if (!data.email_available && !data.name_available) {
          // Both email and username are taken
          Alert.alert(
            "Email and Username Already Registered",
            "The email and username you entered are already registered. Please use different credentials or log in if you already have an account.",
            [
              { text: "Try Again", style: "cancel" },
              {
                text: "Go to Login",
                onPress: () => router.push("/screens/login-screen"),
                style: "default",
              },
            ],
          );
          return;
        } else if (!data.email_available) {
          // Email is taken
          Alert.alert(
            "Email Already Registered",
            "This email is already registered. Please use a different email or log in if you already have an account.",
            [
              { text: "Try Again", style: "cancel" },
              {
                text: "Go to Login",
                onPress: () => router.push("/screens/login-screen"),
                style: "default",
              },
            ],
          );
          return;
        } else if (!data.name_available) {
          // Username is taken
          Alert.alert(
            "Username Already Registered",
            "This username is already registered. Please choose a different name.",
            [{ text: "OK", style: "default" }],
          );
          return;
        }

        // Both are available, proceed with signup
        console.log(
          "[SignUp] ✅ Email and username are available. Proceeding to profile building...",
        );
      } catch (error: any) {
        console.error("[SignUp] ❌ Error checking availability:", error);

        if (error.name === "AbortError") {
          Alert.alert(
            "Connection Timeout",
            "The verification is taking too long. Check your internet connection and try again.",
          );
        } else {
          Alert.alert(
            "Connection Error",
            "Could not verify availability. Check your connection and try again.",
          );
        }
        return;
      }

      // Store signup credentials temporarily in AsyncStorage
      console.log("[SignUp] Storing signup credentials temporarily...");
      await AsyncStorage.setItem("temp_signup_name", usernameTrim);
      await AsyncStorage.setItem("temp_signup_email", emailTrim);
      await AsyncStorage.setItem("temp_signup_password", password);
      console.log("[SignUp] Credentials stored successfully");

      // Navigate to welcome page first
      console.log("[SignUp] Navigating to welcome page...");
      router.push("/screens/onboarding/welcome");
    } catch (error: any) {
      console.error("[SignUp] ❌ CRITICAL ERROR:", error);
      console.error("[SignUp] Error stack:", error.stack);
      Alert.alert(
        "Error",
        `Could not process registration. ${error.message || "Please try again."}`,
      );
    }
  };

  // --- Dynamic colors for dark/light mode ---
  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const mainText = isDark ? "#FFFFFF" : "#000000"; // main text for subtitle, remember me, links
  const inputBg = isDark ? "#2a2a2a" : "#f5f5f5";
  const placeholderColor = isDark ? "#888" : "#9aa5a0";
  const checkboxBorder = isDark ? "#ccc" : "#000";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      {showSuccessAlert && (
        <AppleStyleAlert visible={showSuccessAlert} text="Sign-up successful" />
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: Colors.primary }]}>
            Welcome to NutriAi!
          </Text>
          <Text style={[styles.subtitle, { color: mainText }]}>
            Please insert your information
          </Text>

          <View style={styles.form}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: mainText },
              ]}
              placeholder="Username"
              placeholderTextColor={placeholderColor}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: mainText },
              ]}
              placeholder="Email"
              placeholderTextColor={placeholderColor}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: mainText },
              ]}
              placeholder="Password"
              placeholderTextColor={placeholderColor}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: mainText },
              ]}
              placeholder="Confirm Password"
              placeholderTextColor={placeholderColor}
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setRemember((s) => !s)}
              style={styles.rememberRow}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: checkboxBorder },
                  remember && styles.checkboxChecked,
                ]}
              >
                {remember ? <View style={styles.checkboxTick} /> : null}
              </View>
              <Text style={[styles.rememberText, { color: mainText }]}>
                Remember me
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signButton}
              activeOpacity={0.85}
              onPress={handleSignUp}
            >
              <Text style={styles.signButtonText}>SIGN UP</Text>
            </TouchableOpacity>

            <View style={styles.links}>
              <Text style={[styles.smallText, { color: mainText }]}>
                Already have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/screens/login-screen")}
              >
                <Text style={styles.linkAccent}>Log In</Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: "center", marginTop: 14 }}>
              <TouchableOpacity onPress={() => router.push("/(tabs)")}>
                <Text style={[styles.welcomeLink, { color: Colors.primary }]}>
                  Go to Home Page
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 160 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "stretch",
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 60,
  },

  form: {
    marginTop: 10,
  },

  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 22,
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 18,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.6,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#ffffff" },
  checkboxTick: {
    width: 10,
    height: 10,
    backgroundColor: "#000000",
    borderRadius: 1,
  },
  rememberText: { fontSize: 16 },

  signButton: {
    alignSelf: "center",
    width: "56%",
    minWidth: 160,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 6,
    shadowColor: "rgba(0,0,0,0.18)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },

  signButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    letterSpacing: 1,
    fontSize: 14,
  },

  links: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  smallText: { fontSize: 12 },
  linkAccent: { color: Colors.primary, fontSize: 12, fontWeight: "700" },
  welcomeLink: { fontWeight: "700", fontSize: 13 },
});
