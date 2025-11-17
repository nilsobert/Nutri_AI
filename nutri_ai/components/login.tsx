import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";
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
  View,
} from "react-native";

const IOSStyleLoginScreen = () => {
  const router = useRouter();
  const [nameOrEmail, setNameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleLogin = async () => {
    const keyRaw = (nameOrEmail || "").trim();
    const key = keyRaw.toLowerCase();

    if (!keyRaw || !password) {
      Alert.alert("Missing fields", "Please enter username/email and password");
      return;
    }

    try {
      const raw = await AsyncStorage.getItem("registered_users");
      const list = raw ? JSON.parse(raw) : [];

      // find user by email or username (case-insensitive)
      const user = list.find(
        (u: any) =>
          (u.email || "").toLowerCase() === key ||
          (u.username || "").toLowerCase() === key,
      );

      if (!user) {
        router.push("/screens/notfound-screen");
        return;
      }

      const passwordHash = CryptoJS.SHA256(password).toString();
      if (passwordHash !== user.passwordHash) {
        router.push("/screens/bad_credentials");
        return;
      }

      // Success
      router.push("/screens/home-screen"); // navigate to Home page
    } catch (err) {
      console.warn("login error", err);
      Alert.alert("Login error", "An unexpected error occurred. Try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <TextInput
              value={nameOrEmail}
              onChangeText={setNameOrEmail}
              placeholder="Username or Email"
              placeholderTextColor="#9aa5a0"
              style={styles.input}
              returnKeyType="next"
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#9aa5a0"
              secureTextEntry
              style={styles.input}
              returnKeyType="done"
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setRemember((s) => !s)}
              style={styles.rememberRow}
            >
              <View
                style={[styles.checkbox, remember && styles.checkboxChecked]}
              >
                {remember ? <View style={styles.checkboxTick} /> : null}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.85}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>LOG IN</Text>
            </TouchableOpacity>

            <View style={styles.links}>
              <Text style={styles.smallText}>Forgot your password? </Text>
              <TouchableOpacity
                onPress={() => router.push("/screens/recover-screen")}
              >
                <Text style={styles.linkAccent}>Retrieve Password</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.links, { marginTop: 10 }]}>
              <Text style={styles.smallText}>
                You don't have an account yet?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/")}>
                <Text style={styles.linkAccent}>Sign up</Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: "center", marginTop: 14 }}>
              <TouchableOpacity
                onPress={() => router.push("/screens/home-screen")}
              >
                <Text style={styles.welcomeLink}>Go to Home Page</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 48 : 36,
    alignItems: "stretch",
  },
  form: { marginTop: 18, paddingTop: 6 },
  input: {
    backgroundColor: "#E6F5D9",
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#2a2a2a",
    marginBottom: 22,
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 2, // Added border
    borderColor: "#144d1f", // Dark green contour
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
    borderColor: "#ffffff",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: { backgroundColor: "#ffffff" },
  checkboxTick: {
    width: 10,
    height: 10,
    backgroundColor: "#1E8E3E",
    borderRadius: 1,
  },
  rememberText: { color: "#ffffff", fontSize: 16 },
  loginButton: {
    alignSelf: "center",
    width: "56%",
    minWidth: 160,
    backgroundColor: "#144d1f",
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
  loginButtonText: {
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
  smallText: { color: "#000000", fontSize: 12 },
  linkAccent: { color: "#144d1f", fontSize: 12, fontWeight: "700" },
  welcomeLink: { color: "#144d1f", fontWeight: "700", fontSize: 13 },
});

export default IOSStyleLoginScreen;
