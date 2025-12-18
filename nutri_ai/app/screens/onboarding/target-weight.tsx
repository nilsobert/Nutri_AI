import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing } from "../../../constants/theme";

export default function TargetWeight() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const currentWeight = parseFloat(params.weight as string) || 70;
  const [targetWeight, setTargetWeight] = useState(currentWeight);
  const [unit, setUnit] = useState<"KG" | "LB">("KG");

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";

  const kgToLb = (kg: number) => Math.round(kg * 2.20462);
  const lbToKg = (lb: number) => Math.round(lb / 2.20462);

  const displayWeight = unit === "KG" ? targetWeight : kgToLb(targetWeight);

  const handleUnitToggle = (newUnit: "KG" | "LB") => {
    setUnit(newUnit);
  };

  const handleNext = () => {
    router.push({
      pathname: "/screens/onboarding/activity-level",
      params: { ...params, targetWeight: targetWeight.toString() },
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
          <View style={[styles.progressFill, { width: "56%" }]} />
        </View>
        <TouchableOpacity
          onPress={() => router.push("/screens/onboarding/activity-level")}
        >
          <Text style={[styles.skipText, { color: secondaryText }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>
          {"Let's set the goal you are going to crush!"}
        </Text>

        {/* Unit Toggle */}
        <View style={styles.unitToggle}>
          <TouchableOpacity
            style={[
              styles.unitButton,
              unit === "KG" && styles.unitButtonActive,
            ]}
            onPress={() => handleUnitToggle("KG")}
          >
            <Text
              style={[
                styles.unitButtonText,
                { color: unit === "KG" ? "#fff" : secondaryText },
              ]}
            >
              KG
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.unitButton,
              unit === "LB" && styles.unitButtonActive,
            ]}
            onPress={() => handleUnitToggle("LB")}
          >
            <Text
              style={[
                styles.unitButtonText,
                { color: unit === "LB" ? "#fff" : secondaryText },
              ]}
            >
              LB
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weight Display */}
        <View style={styles.weightDisplay}>
          <Text style={[styles.weightLabel, { color: secondaryText }]}>
            Target weight
          </Text>
          <TextInput
            style={[styles.weightInput, { color: textColor }]}
            value={displayWeight.toString()}
            onChangeText={(text) => {
              const num = parseFloat(text);
              if (!isNaN(num)) {
                const kgValue = unit === "KG" ? num : lbToKg(num);
                const minValue = unit === "KG" ? 30 : 66;
                const maxValue = unit === "KG" ? 200 : 440;

                if (num >= minValue && num <= maxValue) {
                  setTargetWeight(kgValue);
                }
              } else if (text === "") {
                setTargetWeight(currentWeight);
              }
            }}
            keyboardType="decimal-pad"
            placeholder={displayWeight.toString()}
          />
          <Text style={[styles.unitLabel, { color: secondaryText }]}>
            {unit === "KG" ? "kg" : "lb"}
          </Text>
        </View>

        {/* Weight adjustment buttons */}
        <View style={styles.adjustButtons}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => {
              if (unit === "KG") {
                setTargetWeight(Math.max(30, targetWeight - 1));
              } else {
                // Decrement by 1 LB (convert from current display)
                const currentLb = kgToLb(targetWeight);
                const newLb = Math.max(66, currentLb - 1);
                setTargetWeight(lbToKg(newLb));
              }
            }}
          >
            <Ionicons name="remove" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => {
              if (unit === "KG") {
                setTargetWeight(Math.min(200, targetWeight + 1));
              } else {
                // Increment by 1 LB (convert from current display)
                const currentLb = kgToLb(targetWeight);
                const newLb = Math.min(440, currentLb + 1);
                setTargetWeight(lbToKg(newLb));
              }
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
