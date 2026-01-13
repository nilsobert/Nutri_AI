import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing } from "../../../constants/theme";

// NOTE: This screen is no longer used. Weight-goal functionality was removed.
export default function TargetWeight() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const currentWeight = parseFloat(params.weight as string) || 70;
  const [targetWeight, setTargetWeight] = useState(currentWeight.toString());
  const [error, setError] = useState("");
  const progressAnim = useRef(new Animated.Value(0.42)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.56,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";

  const validate = () => {
    const num = parseFloat(targetWeight);
    if (isNaN(num) || num < 20 || num > 500) {
      setError("Weight must be between 20 and 500 kg");
      return false;
    }
    setError("");
    return true;
  };

  const handleNext = () => {
    // Weight goal removed; keep this screen as a no-op fallback.
    router.replace({
      pathname: "/screens/onboarding/activity-level",
      params: { ...params },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>
          {"Let's set the goal you are going to crush!"}
        </Text>

        {/* Weight Display */}
        <View style={styles.weightDisplay}>
          <Text style={[styles.weightLabel, { color: secondaryText }]}>
            Target weight
          </Text>
          <TextInput
            style={[
              styles.weightInput,
              { color: textColor },
              error ? styles.inputError : null,
            ]}
            value={targetWeight}
            onChangeText={(text) => {
              setTargetWeight(text);
              if (error) setError("");
            }}
            keyboardType="decimal-pad"
            placeholder={currentWeight.toString()}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Text style={[styles.unitLabel, { color: secondaryText }]}>kg</Text>
        </View>

        {/* Weight adjustment buttons */}
        <View style={styles.adjustButtons}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => {
              const val = parseFloat(targetWeight) || currentWeight;
              setTargetWeight(Math.max(20, val - 1).toString());
              if (error) setError("");
            }}
          >
            <Ionicons name="remove" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => {
              const val = parseFloat(targetWeight) || currentWeight;
              setTargetWeight(Math.min(500, val + 1).toString());
              if (error) setError("");
            }}
          >
            <Ionicons name="add" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
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
    gap: Spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  skipText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl * 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xl * 2,
  },
  unitToggle: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 4,
    alignSelf: "flex-start",
    marginBottom: Spacing.xl * 2,
  },
  unitButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  unitButtonActive: {
    backgroundColor: Colors.primary,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  weightDisplay: {
    alignItems: "center",
    marginBottom: Spacing.xl * 2,
  },
  weightLabel: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  weightInput: {
    fontSize: 56,
    fontWeight: "700",
    textAlign: "center",
    minWidth: 150,
  },
  inputError: {
    color: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  unitLabel: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  adjustButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xl * 3,
    marginBottom: Spacing.xl * 2,
  },
  adjustButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
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
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
