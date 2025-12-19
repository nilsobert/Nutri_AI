import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { useUser } from "../context/UserContext";

// Storage key for persistent user database (same as sign-up)
const USERS_STORAGE_KEY = "@nutri_ai_registered_users";

const IOSStyleLoginScreen = () => {
  const router = useRouter();
  const { saveUser, fetchUser } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<Array<{username: string, email: string, password?: string}>>([
    { username: "testuser", email: "test@example.com", password: "password123" },
    { username: "admin", email: "admin@nutri.ai", password: "admin123" },
    { username: "demo", email: "demo@test.com", password: "demo123" },
  ]);

  // Load registered users from storage on mount
  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        const storedUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
          const parsed = JSON.parse(storedUsers);
          console.log("[Login] Loaded", parsed.length, "registered users from storage");
          setRegisteredUsers(parsed);
        }
      } catch (error) {
        console.error("[Login] Error loading users:", error);
      }
    };
    loadUsers();
  }, []);

  const handleLogin = async () => {
    const inputTrim = (email || "").trim().toLowerCase();

    if (!inputTrim || !password) {
      Alert.alert("Missing fields", "Please enter email/username and password");
      return;
    }

    console.log(`[Login] Attempting to login user: ${inputTrim}`);
    console.log(`[Login] Using local database authentication`);

    setIsLoading(true);
    try {
      // Check if input is email or username
      const isEmail = inputTrim.includes("@");
      
      // Find user in local database
      const user = registeredUsers.find(u => 
        isEmail 
          ? u.email.toLowerCase() === inputTrim 
          : u.username.toLowerCase() === inputTrim
      );

      console.log(`[Login] Searching with ${isEmail ? "email" : "username"}: ${inputTrim}`);
      
      if (!user) {
        console.log("[Login] User not found in database");
        Alert.alert(
          "Account Not Found",
          "This email or username is not yet registered. Would you like to create an account?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Sign Up",
              onPress: () => router.push("/screens/signup-screen"),
            },
          ],
        );
        return;
      }

      // Check password if stored (for users registered after implementing password storage)
      if (user.password && user.password !== password) {
        console.log("[Login] Incorrect password");
        Alert.alert(
          "Incorrect Password",
          "The password you entered is wrong. Please try again.",
          [
            {
              text: "OK",
              style: "cancel",
            },
          ],
        );
        return;
      }

      // Login successful
      console.log("[Login] ✅ Login successful for user:", user.username);
      
      // Store auth token (mock token for local auth)
      const mockToken = `local_auth_${user.username}_${Date.now()}`;
      await AsyncStorage.setItem("auth_token", mockToken);
      console.log("[Login] Auth token stored");

      // Store user info
      const userData = {
        username: user.username,
        email: user.email,
      };
      await AsyncStorage.setItem("current_user", JSON.stringify(userData));
      saveUser(userData as any);
      console.log("[Login] User data stored");

      console.log("[Login] Navigating to home...");
      router.push("/(tabs)");
    } catch (err: any) {
      console.error("[Login] Error:", err);
      console.error("[Login] Error message:", err.message);
      Alert.alert(
        "Login Error",
        "An error occurred during login. Please try again.",
      );
    } finally {
      setIsLoading(false);
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
      <Modal transparent={true} animationType="fade" visible={isLoading}>
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: isDark ? "#333" : "white" },
            ]}
          >
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.loadingText, { color: mainText }]}>
              Logging in...
            </Text>
          </View>
        </View>
      </Modal>
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
              value={email}
              onChangeText={setEmail}
              placeholder="Email or Username"
              placeholderTextColor={placeholderColor}
              style={[
                styles.input,
                { backgroundColor: inputBg, color: mainText },
              ]}
              autoCapitalize="none"
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
              <TouchableOpacity
                onPress={() => router.push("/screens/signup-screen")}
              >
                <Text style={styles.linkAccent}>Sign up</Text>
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
