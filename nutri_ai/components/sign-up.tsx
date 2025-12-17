import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";
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
import { AppleStyleAlert } from "./ui/AppleStyleAlert";
import { Colors } from "../constants/theme";
import {
  ActivityLevel,
  Gender,
  MedicalCondition,
  MotivationToTrackCalories,
  User,
} from "../types/user";
import { useUser } from "../context/UserContext";
import { API_BASE_URL } from "../constants/values";

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
    const usernameTrim = username.trim();
    const emailTrim = email.trim().toLowerCase();

    if (!usernameTrim || !emailTrim || !password || !confirm) {
      Alert.alert("Missing fields", "Please fill in all fields");
      return;
    }

    if (!emailTrim.includes("@")) {
      router.push("/screens/signup-invalid-email-screen");
      return;
    }

    if (password !== confirm) {
      Alert.alert("Password mismatch", "Passwords do not match");
      return;
    }

    console.log(`[SignUp] Attempting to sign up user: ${emailTrim}`);
    const url = `${API_BASE_URL}/signup`;
    console.log(`[SignUp] URL: ${url}`);

    try {
      // Default values for new user
      const defaultAge = 25;
      const defaultHeight = 175;
      const defaultWeight = 70;
      const defaultGender = Gender.Male;
      const defaultActivityLevel = ActivityLevel.Sedentary;
      const defaultMedicalCondition = MedicalCondition.None;
      const defaultMotivation = MotivationToTrackCalories.LeadAHealthyLife;

      console.log(
        "[SignUp] Sending signup request with default profile data...",
      );
      const signupPayload = {
        email: emailTrim,
        password: password,
        name: usernameTrim,
        age: defaultAge,
        height_cm: defaultHeight,
        weight_kg: defaultWeight,
        gender: defaultGender,
        activity_level: defaultActivityLevel,
        medical_condition: defaultMedicalCondition,
        motivation: defaultMotivation,
      };
      console.log("[SignUp] Signup payload:", signupPayload);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupPayload),
      });

      console.log(`[SignUp] Response status: ${response.status}`);
      const data = await response.json();
      console.log(`[SignUp] Response data:`, data);

      if (!response.ok) {
        console.error("[SignUp] Signup failed:", data.detail);
        Alert.alert("Sign Up Failed", data.detail || "An error occurred");
        return;
      }

      // Store token
      console.log("[SignUp] Storing auth token...");
      await AsyncStorage.setItem("auth_token", data.access_token);
      console.log("[SignUp] Auth token stored successfully");

      // Create local user object (using hash for compatibility, though not used for auth anymore)
      const passwordHash = CryptoJS.SHA256(password).toString();
      const userObj: User = {
        name: usernameTrim,
        email: emailTrim,
        password: passwordHash,
        age: defaultAge,
        heightCm: defaultHeight,
        weightKg: defaultWeight,
        gender: defaultGender,
        activityLevel: defaultActivityLevel,
        medicalCondition: defaultMedicalCondition,
        motivation: defaultMotivation,
      };

      console.log("[SignUp] Saving user locally and syncing to server...");
      await saveUser(userObj);
      console.log("[SignUp] User saved and synced successfully");

      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
        console.log("[SignUp] Navigating to home...");
        router.push("/(tabs)");
      }, 2000);
    } catch (error: any) {
      console.error("[SignUp] Error:", error);
      console.error("[SignUp] Error message:", error.message);
      console.error("[SignUp] Error stack:", error.stack);
      Alert.alert(
        "Connection Error",
        `Could not connect to the server. ${error.message || "Please check your internet connection."}`,
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
      <AppleStyleAlert visible={showSuccessAlert} text="Sign-up successful" />
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
