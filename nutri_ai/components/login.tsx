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
  useColorScheme,
  View,
} from "react-native";
import { Colors } from "../constants/theme";

const IOSStyleLoginScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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

      router.push("/screens/home-screen");
    } catch (err) {
      console.warn("login error", err);
      Alert.alert("Login error", "An unexpected error occurred. Try again.");
    }
  };

  // --- Dynamic colors for dark/light mode ---
  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const mainText = isDark ? "#FFFFFF" : "#000000"; // main text for subtitle, remember me
  const inputBg = isDark ? "#2a2a2a" : "#f5f5f5";
  const placeholderColor = isDark ? "#888" : "#9aa5a0";
  const checkboxBorder = isDark ? "#ccc" : "#000";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
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
            Please introduce your credentials
          </Text>

          <View style={styles.form}>
            <TextInput
              value={nameOrEmail}
              onChangeText={setNameOrEmail}
              placeholder="Username or Email"
              placeholderTextColor={placeholderColor}
              style={[
                styles.input,
                { backgroundColor: inputBg, color: mainText },
              ]}
              returnKeyType="next"
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={placeholderColor}
              secureTextEntry
              style={[
                styles.input,
                { backgroundColor: inputBg, color: mainText },
              ]}
              returnKeyType="done"
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
              style={styles.loginButton}
              activeOpacity={0.85}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>LOG IN</Text>
            </TouchableOpacity>

            <View style={styles.links}>
              <Text style={[styles.smallText, { color: mainText }]}>
                Forgot your password?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/screens/recover-screen")}
              >
                <Text style={styles.linkAccent}>Retrieve Password</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.links, { marginTop: 10 }]}>
              <Text style={[styles.smallText, { color: mainText }]}>
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
};

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

  loginButton: {
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
  smallText: { fontSize: 12 },
  linkAccent: { color: Colors.primary, fontSize: 12, fontWeight: "700" },
  welcomeLink: { fontWeight: "700", fontSize: 13 },
});

export default IOSStyleLoginScreen;
