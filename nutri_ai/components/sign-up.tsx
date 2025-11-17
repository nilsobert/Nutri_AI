import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "../constants/theme";

export default function SignUp() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [remember, setRemember] = useState(false);

  const STORAGE_KEY = "registered_users";

  const saveRegisteredUser = async (user: {
    username: string;
    email: string;
    passwordHash: string;
  }) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const exists = list.some(
        (u: any) =>
          (u.email || "").toLowerCase() === user.email.toLowerCase() ||
          (u.username || "").toLowerCase() === user.username.toLowerCase(),
      );
      if (!exists) {
        list.push({
          username: user.username,
          email: user.email,
          passwordHash: user.passwordHash,
        });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    } catch (err) {
      console.warn("saveRegisteredUser error", err);
    }
  };

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

    const passwordHash = CryptoJS.SHA256(password).toString();

    await saveRegisteredUser({
      username: usernameTrim,
      email: emailTrim,
      passwordHash,
    });

    Alert.alert("Account created", "Your account has been saved.");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formWrap}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={Colors.text.light}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.text.light}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.text.light}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={Colors.text.light}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            returnKeyType="done"
          />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setRemember((s) => !s)}
            style={styles.rememberRow}
          >
            <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
              {remember ? <View style={styles.checkboxTick} /> : null}
            </View>
            <Text style={styles.rememberText}>Remember Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signButton}
            activeOpacity={0.85}
            onPress={handleSignUp}
          >
            <Text style={styles.signButtonText}>SIGN UP</Text>
          </TouchableOpacity>

          <View style={styles.bottomTextRow}>
            <Text style={styles.alreadyText}>Already Have an Account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/screens/login-screen")}
            >
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: "center", marginTop: Spacing.sm }}>
            <TouchableOpacity onPress={() => router.push("/")}>
              <Text style={styles.loginLink}>Welcome Screen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#144d1f", // light green background
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing["3xl"],
    paddingTop: Platform.OS === "ios" ? Spacing["3xl"] : Spacing["2xl"],
    paddingBottom: Spacing["3xl"],
  },
  formWrap: {
    flex: 1,
    paddingTop: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.cardBackground.light,
    height: 56,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.6,
    borderColor: Colors.text.light,
    marginRight: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.text.light,
  },
  checkboxTick: {
    width: 10,
    height: 10,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  rememberText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.base,
  },
  signButton: {
    alignSelf: "center",
    width: "56%",
    minWidth: 180,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  signButtonText: {
    color: Colors.cardBackground.light,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
    fontSize: Typography.sizes.lg,
  },
  bottomTextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xs,
  },
  alreadyText: {
    color: Colors.cardBackground.light,
    fontSize: Typography.sizes.sm,
  },
  loginLink: {
    color: "#ffd34d",
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.sm,
  },
});
