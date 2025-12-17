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

const RecoverComponent = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const isEmailRegistered = async (emailToCheck: string): Promise<boolean> => {
    try {
      // replace with your real API endpoint if needed
      const res = await fetch("https://example.com/api/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToCheck }),
      });
      if (!res.ok) throw new Error("network");
      const json = await res.json();
      return !!json.registered;
    } catch (err) {
      // fallback mock
      const mockRegistered = ["test@example.com", "you@domain.com"];
      return mockRegistered.includes(emailToCheck.toLowerCase());
    }
  };

  const handleRecover = async () => {
    const addr = email.trim();
    if (!addr) {
      Alert.alert(
        "Enter email",
        "Please enter your email address or username.",
      );
      return;
    }

    const registered = await isEmailRegistered(addr);
    if (registered) {
      router.push("/screens/sent-screen");
    } else {
      router.push("/screens/notfound-screen");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.wrapper}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Forgot your{"\n"}password?</Text>
            <Text style={styles.subtitle}>Nothing to worry about!</Text>
          </View>

          <Text style={styles.instruction}>
            Please enter your email{"\n"}or username:
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Username or Email"
              placeholderTextColor="#bfc9b2"
              style={styles.input}
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
            <Text style={styles.welcomeLink}>Welcome Screen</Text>
          </TouchableOpacity>

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#c9e09a" },
  wrapper: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === "ios" ? 48 : 36,
    alignItems: "stretch",
  },
  header: { marginBottom: 18 },
  title: {
    color: "#000000",
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    marginBottom: 6,
  },
  subtitle: {
    color: "#1E8E3E",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 18,
  },
  instruction: { color: "#000000", fontSize: 14, marginBottom: 12 },
  inputRow: {
    position: "relative",
    marginBottom: 18,
    justifyContent: "center",
  },
  input: {
    backgroundColor: "#ffffff",
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 56,
    fontSize: 15,
    color: "#2a2a2a",
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
    backgroundColor: "#1E8E3E",
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
  welcomeLink: { color: "#ffd34d", fontWeight: "700", fontSize: 13 },
});

export default RecoverComponent;
