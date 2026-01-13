import { Ionicons } from "@expo/vector-icons";
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
import { Colors, Spacing } from "../constants/theme";
import { useUser } from "../context/UserContext";

export default function SignUp() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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

    try {
      // Proceed to onboarding with credentials in params
      router.replace({
        pathname: "/screens/onboarding/gender-selection",
        params: {
          name: usernameTrim,
          email: emailTrim,
          password: password,
        },
      });
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
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";
  const inputBg = isDark ? "#2a2a2a" : "#f5f5f5";
  const placeholderColor = isDark ? "#888" : "#9aa5a0";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
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
            Create your account
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="person-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: secondaryText }]}>
                  Username
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                  placeholder="Enter your username"
                  placeholderTextColor={placeholderColor}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="mail-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: secondaryText }]}>
                  Email
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                  placeholder="Enter your email"
                  placeholderTextColor={placeholderColor}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                  style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                  placeholder="Enter your password"
                  placeholderTextColor={placeholderColor}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: secondaryText }]}>
                  Confirm Password
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                  placeholder="Confirm your password"
                  placeholderTextColor={placeholderColor}
                  secureTextEntry
                  value={confirm}
                  onChangeText={setConfirm}
                />
              </View>
            </View>
          </View>

          <View style={styles.loginLinkContainer}>
            <Text style={[styles.loginLinkText, { color: textColor }]}>
              Already have an account?{" "}
              <Text
                style={{ color: Colors.primary, fontWeight: "700" }}
                onPress={() => router.push("/screens/login-screen")}
              >
                Log In
              </Text>
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              (!username || !email || !password || !confirm) && styles.nextButtonDisabled,
            ]}
            onPress={handleSignUp}
            disabled={!username || !email || !password || !confirm}
          >
            <Text style={styles.nextButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
  loginLinkContainer: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  loginLinkText: {
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
