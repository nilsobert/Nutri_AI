import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing } from "../../../constants/theme";
import { API_BASE_URL } from "../../../constants/values";
import { useUser } from "../../../context/UserContext";
import type { User } from "../../../types/user";
import {
  ActivityLevel,
  Gender,
  MedicalCondition,
  MotivationToTrackCalories,
} from "../../../types/user";

export default function ActivityLevelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { saveUser } = useUser();

  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";
  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;

  const activities = [
    {
      label: "Sedentary",
      value: ActivityLevel.Sedentary,
      icon: "bed" as const,
      description: "Little to no exercise",
      color: "#9E9E9E",
    },
    {
      label: "Moderate",
      value: ActivityLevel.Moderate,
      icon: "walk" as const,
      description: "Exercise 3-5 days/week",
      color: "#4CAF50",
    },
    {
      label: "Active",
      value: ActivityLevel.Active,
      icon: "bicycle" as const,
      description: "Intense exercise 6-7 days/week",
      color: "#FF9800",
    },
  ];

  const handleNext = () => {
    if (!activityLevel) return;
    router.push({
      pathname: "/screens/onboarding/profile-picture",
      params: { ...params, activityLevel: activityLevel.toString() },
    });
  };

  const handleFinish = async () => {
    if (!activityLevel) return;

    setIsLoading(true);
    try {
      // Get signup credentials
      const signupName = await AsyncStorage.getItem("temp_signup_name");
      const signupEmail = await AsyncStorage.getItem("temp_signup_email");
      const signupPassword = await AsyncStorage.getItem("temp_signup_password");

      if (!signupName || !signupEmail || !signupPassword) {
        Alert.alert(
          "Erro",
          "Dados de registo não encontrados. Por favor, tente novamente.",
        );
        router.push("/screens/signup-screen");
        return;
      }

      // Prepare complete signup payload
      const signupPayload = {
        email: signupEmail,
        password: signupPassword,
        name: signupName,
        age: parseInt(params.age as string),
        height_cm: parseFloat(params.height as string),
        weight_kg: parseFloat(params.weight as string),
        gender: params.gender as Gender,
        activity_level: activityLevel,
        medical_condition: MedicalCondition.None,
        motivation: params.goal as MotivationToTrackCalories,
      };

      console.log("[ActivityLevel] Sending complete signup...");
      const url = `${API_BASE_URL}/signup`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[ActivityLevel] Signup failed:", data.detail);
        Alert.alert("Erro no registo", data.detail || "Ocorreu um erro");
        return;
      }

      console.log("[ActivityLevel] Signup successful!");
      await AsyncStorage.setItem("auth_token", data.access_token);

      // Clear temporary credentials
      await AsyncStorage.removeItem("temp_signup_name");
      await AsyncStorage.removeItem("temp_signup_email");
      await AsyncStorage.removeItem("temp_signup_password");

      // Create user object
      const passwordHash = CryptoJS.SHA256(signupPassword).toString();
      const userObj: User = {
        name: signupName,
        email: signupEmail,
        password: passwordHash,
        age: parseInt(params.age as string),
        heightCm: parseFloat(params.height as string),
        weightKg: parseFloat(params.weight as string),
        gender: params.gender as Gender,
        activityLevel: activityLevel,
        medicalCondition: MedicalCondition.None,
        motivation: params.goal as MotivationToTrackCalories,
        targetWeightKg: params.targetWeight
          ? parseFloat(params.targetWeight as string)
          : undefined,
      };

      await saveUser(userObj);

      Alert.alert("Sucesso!", "Perfil criado com sucesso!", [
        {
          text: "OK",
          onPress: () => router.push("/(tabs)"),
        },
      ]);
    } catch (error: any) {
      console.error("[ActivityLevel] Error:", error);
      Alert.alert(
        "Erro",
        `Não foi possível criar o perfil. ${error.message || ""}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>
          {"What's your activity level?"}
        </Text>

        <View style={styles.activitiesGrid}>
          {activities.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.activityCard,
                { backgroundColor: cardBg },
                activityLevel === item.value && styles.activityCardSelected,
              ]}
              onPress={() => setActivityLevel(item.value)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: item.color + "20" },
                ]}
              >
                <Ionicons name={item.icon} size={32} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activityLabel, { color: textColor }]}>
                  {item.label}
                </Text>
                <Text
                  style={[styles.activityDescription, { color: secondaryText }]}
                >
                  {item.description}
                </Text>
              </View>
              {activityLevel === item.value && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={Colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.finishButton,
            !activityLevel && styles.finishButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!activityLevel}
        >
          <Text style={styles.finishButtonText}>Next</Text>
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
  activitiesGrid: {
    gap: Spacing.md,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    gap: Spacing.md,
  },
  activityCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  activityLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  finishButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  finishButtonDisabled: {
    opacity: 0.5,
  },
  finishButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
