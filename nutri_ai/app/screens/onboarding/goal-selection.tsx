import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing } from "../../../constants/theme";
import { MotivationToTrackCalories } from "../../../types/user";

export default function GoalSelection() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [goal, setGoal] = useState<MotivationToTrackCalories | null>(null);
  const progressAnim = useRef(new Animated.Value(0.14)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.28,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;

  const goals = [
    {
      label: "Gain Muscle",
      value: MotivationToTrackCalories.GainMuscle,
      icon: "barbell" as const,
      color: "#FF6B6B",
    },
    {
      label: "Lead a Healthy Life",
      value: MotivationToTrackCalories.LeadAHealthyLife,
      icon: "heart" as const,
      color: "#4ECDC4",
    },
    {
      label: "Track Medical Condition",
      value: MotivationToTrackCalories.TrackMedicalCondition,
      icon: "medical" as const,
      color: "#95E1D3",
    },
    {
      label: "Lose Weight",
      value: MotivationToTrackCalories.LoseWeight,
      icon: "trending-down" as const,
      color: "#F38181",
    },
  ];

  const handleNext = () => {
    if (!goal) return;
    router.push({
      pathname: "/screens/onboarding/basic-info",
      params: { ...params, goal: goal.toString() },
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
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: textColor }]}>
          What is your main goal?
        </Text>

        <View style={styles.goalsGrid}>
          {goals.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.goalCard,
                { backgroundColor: cardBg },
                goal === item.value && styles.goalCardSelected,
              ]}
              onPress={() => setGoal(item.value)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: item.color + "20" },
                ]}
              >
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text style={[styles.goalLabel, { color: textColor }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !goal && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!goal}
        >
          <Text style={styles.nextButtonText}>Next</Text>
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
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl * 2,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xl * 2,
  },
  goalsGrid: {
    gap: Spacing.md,
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    gap: Spacing.md,
  },
  goalCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
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
