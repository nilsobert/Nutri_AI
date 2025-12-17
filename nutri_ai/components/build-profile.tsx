import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "../constants/theme";
import { API_BASE_URL } from "../constants/values";
import { useUser } from "../context/UserContext";
import {
  ActivityLevel,
  Gender,
  MedicalCondition,
  MotivationToTrackCalories,
  User,
  WeightGoalType,
  WeightLossRate,
} from "../types/user";

export default function BuildProfile() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user, saveUser } = useUser();

  // Signup credentials from previous page
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Load signup credentials when component mounts
  useEffect(() => {
    const loadSignupData = async () => {
      try {
        const name = await AsyncStorage.getItem("temp_signup_name");
        const email = await AsyncStorage.getItem("temp_signup_email");
        const password = await AsyncStorage.getItem("temp_signup_password");

        if (name && email && password) {
          setSignupName(name);
          setSignupEmail(email);
          setSignupPassword(password);
          console.log("[BuildProfile] Loaded signup credentials:", {
            name,
            email,
          });
        } else {
          console.warn("[BuildProfile] No signup credentials found");
        }
      } catch (error) {
        console.error("[BuildProfile] Error loading signup data:", error);
      }
    };
    loadSignupData();
  }, []);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [medicalConditions, setMedicalConditions] = useState<
    MedicalCondition[]
  >([]);
  const [otherMedicalConditions, setOtherMedicalConditions] = useState("");

  // Weight goal tracking
  const [targetWeight, setTargetWeight] = useState("");
  const [weightGoalType, setWeightGoalType] = useState<WeightGoalType | null>(
    null,
  );
  const [weightLossRate, setWeightLossRate] = useState<WeightLossRate | null>(
    null,
  );

  // Body composition
  const [bodyFatPercentage, setBodyFatPercentage] = useState("");

  // Activity & Motivation
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(
    null,
  );
  const [motivation, setMotivation] =
    useState<MotivationToTrackCalories | null>(null);

  // Dietary preferences
  const [proteinPreference, setProteinPreference] = useState<
    "low" | "moderate" | "high" | null
  >(null);

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark
    ? Colors.secondaryText.dark
    : Colors.secondaryText.light;
  const inputBg = isDark ? "#2a2a2a" : "#f5f5f5";
  const placeholderColor = isDark ? "#888" : "#9aa5a0";

  const takePhoto = async () => {
    try {
      console.log("[BuildProfile] Requesting camera permissions...");
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log("[BuildProfile] Camera permission status:", status);

      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Por favor, conceda permissões de câmera para tirar uma foto.",
        );
        return;
      }

      console.log("[BuildProfile] Launching camera...");
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log("[BuildProfile] Camera result:", result);
      if (!result.canceled && result.assets && result.assets[0]) {
        console.log(
          "[BuildProfile] Setting profile image:",
          result.assets[0].uri,
        );
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("[BuildProfile] Error taking photo:", error);
      Alert.alert("Erro", "Não foi possível tirar a foto. Tente novamente.");
    }
  };

  const pickImage = async () => {
    try {
      console.log("[BuildProfile] Requesting media library permissions...");
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("[BuildProfile] Media library permission status:", status);

      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Por favor, conceda permissões de galeria para escolher uma foto.",
        );
        return;
      }

      console.log("[BuildProfile] Launching image library...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log("[BuildProfile] Image library result:", result);
      if (!result.canceled && result.assets && result.assets[0]) {
        console.log(
          "[BuildProfile] Setting profile image:",
          result.assets[0].uri,
        );
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("[BuildProfile] Error picking image:", error);
      Alert.alert("Erro", "Não foi possível escolher a foto. Tente novamente.");
    }
  };

  const showImageOptions = () => {
    console.log("[BuildProfile] Showing image options");
    Alert.alert(
      "Foto de Perfil",
      "Escolha uma opção",
      [
        {
          text: "Tirar Foto",
          onPress: () => {
            console.log("[BuildProfile] User selected: Take Photo");
            takePhoto();
          },
        },
        {
          text: "Escolher da Galeria",
          onPress: () => {
            console.log("[BuildProfile] User selected: Choose from Gallery");
            pickImage();
          },
        },
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () =>
            console.log("[BuildProfile] User cancelled image selection"),
        },
      ],
      { cancelable: true },
    );
  };

  const toggleMedicalCondition = (condition: MedicalCondition) => {
    setMedicalConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition],
    );
  };

  const handleContinue = async () => {
    console.log("[BuildProfile] Continue button pressed");

    if (
      !age ||
      !weight ||
      !height ||
      !gender ||
      !activityLevel ||
      !motivation
    ) {
      Alert.alert(
        "Informação em falta",
        "Por favor, preencha todos os campos obrigatórios (idade, peso, altura, género, nível de atividade e motivação).",
      );
      return;
    }

    if (!signupName || !signupEmail || !signupPassword) {
      Alert.alert(
        "Erro",
        "Dados de registo não encontrados. Por favor, volte e faça o registo novamente.",
      );
      router.push("/screens/signup-screen");
      return;
    }

    try {
      console.log(
        "[BuildProfile] Preparing complete signup with profile data...",
      );

      // Prepare complete signup payload with profile information
      const signupPayload = {
        email: signupEmail,
        password: signupPassword,
        name: signupName,
        age: parseInt(age),
        height_cm: parseFloat(height),
        weight_kg: parseFloat(weight),
        gender: gender,
        activity_level: activityLevel,
        medical_condition:
          medicalConditions.length > 0
            ? medicalConditions[0]
            : MedicalCondition.None,
        motivation: motivation,
      };

      console.log("[BuildProfile] Sending signup request to server...");
      const url = `${API_BASE_URL}/signup`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupPayload),
      });

      console.log(`[BuildProfile] Response status: ${response.status}`);
      const data = await response.json();

      if (!response.ok) {
        console.error("[BuildProfile] Signup failed:", data.detail);
        Alert.alert(
          "Erro no registo",
          data.detail || "Ocorreu um erro ao criar a conta",
        );
        return;
      }

      console.log("[BuildProfile] Signup successful, storing token...");
      await AsyncStorage.setItem("auth_token", data.access_token);

      // Clear temporary signup data
      await AsyncStorage.removeItem("temp_signup_name");
      await AsyncStorage.removeItem("temp_signup_email");
      await AsyncStorage.removeItem("temp_signup_password");
      console.log("[BuildProfile] Temporary credentials cleared");

      // Create complete user object with all profile data
      const passwordHash = CryptoJS.SHA256(signupPassword).toString();
      const updatedUser = new User({
        name: signupName,
        email: signupEmail,
        password: passwordHash,
        age: parseInt(age),
        weightKg: parseFloat(weight),
        heightCm: parseFloat(height),
        gender: gender,
        activityLevel: activityLevel,
        motivation: motivation,
        medicalCondition:
          medicalConditions.length > 0
            ? medicalConditions[0]
            : MedicalCondition.None,
        targetWeightKg: targetWeight ? parseFloat(targetWeight) : undefined,
        weightGoalType: weightGoalType || undefined,
        weightLossRate: weightLossRate || undefined,
        bodyFatPercentage: bodyFatPercentage
          ? parseFloat(bodyFatPercentage)
          : undefined,
        proteinPreference: proteinPreference || undefined,
      });

      console.log("[BuildProfile] Saving user data locally...");
      await saveUser(updatedUser);
      console.log("[BuildProfile] User saved successfully!");

      // TODO: Upload profile image if provided
      if (profileImage) {
        console.log("[BuildProfile] Profile image to upload:", profileImage);
        // Implement image upload logic here
      }

      Alert.alert("Sucesso!", "Perfil criado com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            console.log("[BuildProfile] Navigating to home...");
            router.push("/(tabs)");
          },
        },
      ]);
    } catch (error: any) {
      console.error("[BuildProfile] Error:", error);
      console.error("[BuildProfile] Error message:", error.message);
      Alert.alert(
        "Erro",
        `Não foi possível guardar o perfil. ${error.message || "Por favor, tente novamente."}`,
      );
    }
  };

  const handleSkip = () => {
    router.push("/(tabs)");
  };

  const genderOptions = [
    { label: "Male", value: Gender.Male },
    { label: "Female", value: Gender.Female },
    { label: "Other", value: Gender.Other },
    { label: "Don't Want to Say", value: Gender.PreferNotToSay },
  ];

  const medicalOptions = [
    { label: "Diabetes", value: MedicalCondition.Diabetes },
    { label: "Hypertension", value: MedicalCondition.Hypertension },
    { label: "Heart Disease", value: MedicalCondition.HeartDisease },
    { label: "None", value: MedicalCondition.None },
  ];

  const activityOptions = [
    {
      label: "Sedentary",
      value: ActivityLevel.Sedentary,
      description: "Little to no exercise",
    },
    {
      label: "Moderate",
      value: ActivityLevel.Moderate,
      description: "Exercise 3-5 days/week",
    },
    {
      label: "Active",
      value: ActivityLevel.Active,
      description: "Intense exercise 6-7 days/week",
    },
  ];

  const motivationOptions = [
    { label: "Gain Muscle", value: MotivationToTrackCalories.GainMuscle },
    {
      label: "Lead a Healthy Life",
      value: MotivationToTrackCalories.LeadAHealthyLife,
    },
    {
      label: "Track Medical Condition",
      value: MotivationToTrackCalories.TrackMedicalCondition,
    },
    {
      label: "Improve Athletics",
      value: MotivationToTrackCalories.ImproveAthletics,
    },
  ];

  const weightGoalOptions = [
    { label: "Lose Weight", value: WeightGoalType.Lose },
    { label: "Gain Weight", value: WeightGoalType.Gain },
    { label: "Maintain Weight", value: WeightGoalType.Maintain },
  ];

  const weightLossRateOptions = [
    { label: "Slow (0.25 kg/week)", value: WeightLossRate.Slow },
    { label: "Moderate (0.5 kg/week)", value: WeightLossRate.Moderate },
    { label: "Aggressive (0.75-1 kg/week)", value: WeightLossRate.Aggressive },
  ];

  const proteinOptions = [
    { label: "Low", value: "low" as const },
    { label: "Moderate", value: "moderate" as const },
    { label: "High", value: "high" as const },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            BUILD YOUR PROFILE
          </Text>
          <Text style={[styles.subtitle, { color: secondaryText }]}>
            Help us personalize your experience
          </Text>
        </View>

        {/* Profile Picture */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Profile Picture{" "}
            <Text style={{ color: secondaryText }}>(Optional)</Text>
          </Text>
          <TouchableOpacity
            style={[styles.imagePickerButton, { backgroundColor: cardBg }]}
            onPress={showImageOptions}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color={Colors.primary} />
                <Text
                  style={[
                    styles.imagePlaceholderText,
                    { color: secondaryText },
                  ]}
                >
                  Tap to add photo
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Basic Information
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Age *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: textColor },
              ]}
              placeholder="Enter your age"
              placeholderTextColor={placeholderColor}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.row}>
            <View
              style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}
            >
              <Text style={[styles.label, { color: textColor }]}>
                Weight (kg) *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: inputBg, color: textColor },
                ]}
                placeholder="kg"
                placeholderTextColor={placeholderColor}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
            </View>

            <View
              style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}
            >
              <Text style={[styles.label, { color: textColor }]}>
                Height (cm) *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: inputBg, color: textColor },
                ]}
                placeholder="cm"
                placeholderTextColor={placeholderColor}
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* Gender */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Gender *
          </Text>
          <View style={styles.optionsGrid}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      gender === option.value ? Colors.primary : cardBg,
                    borderColor:
                      gender === option.value
                        ? Colors.primary
                        : isDark
                          ? "#444"
                          : "#ddd",
                  },
                ]}
                onPress={() => setGender(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: gender === option.value ? "#fff" : textColor },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Medical Information{" "}
            <Text style={{ color: secondaryText }}>(Optional)</Text>
          </Text>
          <Text style={[styles.helperText, { color: secondaryText }]}>
            Select any that apply
          </Text>
          <View style={styles.medicalOptions}>
            {medicalOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.checkboxContainer, { backgroundColor: cardBg }]}
                onPress={() => toggleMedicalCondition(option.value)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: medicalConditions.includes(option.value)
                        ? Colors.primary
                        : isDark
                          ? "#666"
                          : "#ccc",
                      backgroundColor: medicalConditions.includes(option.value)
                        ? Colors.primary
                        : "transparent",
                    },
                  ]}
                >
                  {medicalConditions.includes(option.value) && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { color: textColor }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.inputGroup, { marginTop: Spacing.md }]}>
            <Text style={[styles.label, { color: textColor }]}>
              Other Medical Conditions
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: textColor },
              ]}
              placeholder="Describe any other medical conditions"
              placeholderTextColor={placeholderColor}
              value={otherMedicalConditions}
              onChangeText={setOtherMedicalConditions}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Activity Level *
          </Text>
          <View style={styles.optionsGrid}>
            {activityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      activityLevel === option.value ? Colors.primary : cardBg,
                    borderColor:
                      activityLevel === option.value
                        ? Colors.primary
                        : isDark
                          ? "#444"
                          : "#ddd",
                  },
                ]}
                onPress={() => setActivityLevel(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        activityLevel === option.value ? "#fff" : textColor,
                    },
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    {
                      color:
                        activityLevel === option.value ? "#fff" : secondaryText,
                    },
                  ]}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Motivation */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            What's Your Goal? *
          </Text>
          <View style={styles.optionsGrid}>
            {motivationOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      motivation === option.value ? Colors.primary : cardBg,
                    borderColor:
                      motivation === option.value
                        ? Colors.primary
                        : isDark
                          ? "#444"
                          : "#ddd",
                  },
                ]}
                onPress={() => setMotivation(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: motivation === option.value ? "#fff" : textColor },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weight Goal (Optional) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Weight Goal <Text style={{ color: secondaryText }}>(Optional)</Text>
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>
              Target Weight (kg)
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: textColor },
              ]}
              placeholder="Target weight"
              placeholderTextColor={placeholderColor}
              value={targetWeight}
              onChangeText={setTargetWeight}
              keyboardType="decimal-pad"
            />
          </View>

          <Text style={[styles.label, { color: textColor }]}>Weight Goal</Text>
          <View style={styles.optionsGrid}>
            {weightGoalOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      weightGoalType === option.value ? Colors.primary : cardBg,
                    borderColor:
                      weightGoalType === option.value
                        ? Colors.primary
                        : isDark
                          ? "#444"
                          : "#ddd",
                  },
                ]}
                onPress={() => setWeightGoalType(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        weightGoalType === option.value ? "#fff" : textColor,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {(weightGoalType === WeightGoalType.Lose ||
            weightGoalType === WeightGoalType.Gain) && (
            <>
              <Text
                style={[
                  styles.label,
                  { color: textColor, marginTop: Spacing.md },
                ]}
              >
                Rate of Change
              </Text>
              <View style={styles.optionsGrid}>
                {weightLossRateOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor:
                          weightLossRate === option.value
                            ? Colors.primary
                            : cardBg,
                        borderColor:
                          weightLossRate === option.value
                            ? Colors.primary
                            : isDark
                              ? "#444"
                              : "#ddd",
                      },
                    ]}
                    onPress={() => setWeightLossRate(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color:
                            weightLossRate === option.value
                              ? "#fff"
                              : textColor,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Body Composition (Optional) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Body Composition{" "}
            <Text style={{ color: secondaryText }}>(Optional)</Text>
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>
              Body Fat Percentage (%)
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: textColor },
              ]}
              placeholder="e.g., 20"
              placeholderTextColor={placeholderColor}
              value={bodyFatPercentage}
              onChangeText={setBodyFatPercentage}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Protein Preference (Optional) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Protein Preference{" "}
            <Text style={{ color: secondaryText }}>(Optional)</Text>
          </Text>
          <Text style={[styles.helperText, { color: secondaryText }]}>
            Affects your macro nutrient split
          </Text>
          <View style={styles.optionsGrid}>
            {proteinOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      proteinPreference === option.value
                        ? Colors.primary
                        : cardBg,
                    borderColor:
                      proteinPreference === option.value
                        ? Colors.primary
                        : isDark
                          ? "#444"
                          : "#ddd",
                  },
                ]}
                onPress={() => setProteinPreference(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        proteinPreference === option.value ? "#fff" : textColor,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: Colors.primary }]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={[styles.skipButtonText, { color: Colors.primary }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing["4xl"],
  },
  header: {
    marginBottom: Spacing["3xl"],
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing["3xl"],
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.md,
  },
  helperText: {
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.md,
  },
  imagePickerButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignSelf: "center",
    overflow: "hidden",
    ...Shadows.medium,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
  },
  imagePlaceholderText: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: "row",
  },
  label: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.sm,
  },
  input: {
    height: 50,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.base,
  },
  optionsGrid: {
    gap: Spacing.md,
  },
  optionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: "center",
  },
  optionText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  optionDescription: {
    fontSize: Typography.sizes.sm,
    marginTop: 4,
  },
  medicalOptions: {
    gap: Spacing.sm,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  checkboxLabel: {
    fontSize: Typography.sizes.base,
    flex: 1,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  continueButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    ...Shadows.medium,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  skipButton: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
});
