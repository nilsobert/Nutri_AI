import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Sent() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.message}>
          Please check{"\n"}
          your email to{"\n"}
          reset your{"\n"}
          password
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/")}
          style={styles.linkWrap}
        >
          <Text style={styles.link}>Welcome Screen</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#c9e09a",
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === "ios" ? 48 : 36,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    color: "#000",
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 44,
    marginBottom: 28,
  },
  linkWrap: {
    alignItems: "center",
  },
  link: {
    color: "#ffd34d",
    fontWeight: "700",
    fontSize: 13,
  },
});
