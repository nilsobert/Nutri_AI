import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing } from "../../../constants/theme";
import { Gender } from "../../../types/user";

export default function GenderSelection() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [gender, setGender] = useState<Gender | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.14,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;

  const handleNext = () => {
    if (!gender) return;
    router.push({
      pathname: "/screens/onboarding/goal-selection",
      params: { ...params, gender: gender.toString() },
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
          Slect your gender
        </Text>

          <View style={styles.genderOptions}>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[
                  styles.genderCard,
                  { backgroundColor: cardBg },
                  gender === Gender.Male && styles.genderCardSelected,
                ]}
                onPress={() => setGender(Gender.Male)}
              >
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor:
                      gender === Gender.Male ? Colors.primary : "#E3F2FD",
                  },
                ]}
              >
                <Ionicons
                  name="male"
                  size={40}
                  color={gender === Gender.Male ? "#fff" : Colors.primary}
                />
              </View>
              <Text style={[styles.genderLabel, { color: textColor }]}>
                Male
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderCard,
                { backgroundColor: cardBg },
                gender === Gender.Female && styles.genderCardSelected,
              ]}
              onPress={() => setGender(Gender.Female)}
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor:
                      gender === Gender.Female ? "#E91E63" : "#FCE4EC",
                  },
                ]}
              >
                <Ionicons
                  name="female"
                  size={40}
                  color={gender === Gender.Female ? "#fff" : "#E91E63"}
                />
              </View>
              <Text style={[styles.genderLabel, { color: textColor }]}>
                Female
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !gender && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!gender}
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl * 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xl * 2,
  },
  genderOptions: {
    gap: Spacing.lg,
  },
  genderRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  genderCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.xl * 1.5,
    paddingHorizontal: Spacing.md,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  genderCardSelected: {
    borderColor: Colors.primary,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
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
