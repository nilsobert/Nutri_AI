import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
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
import {
  ActivityLevel,
  Gender,
  MedicalCondition,
  MotivationToTrackCalories,
  User,
} from "../../../types/user";

export default function ProfilePicture() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const {
    saveUser,
    setProfileImage: setUserProfileImage,
    fetchUser,
  } = useUser();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark
    ? Colors.secondaryText.dark
    : Colors.secondaryText.light;
  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Por favor, conceda permissões de câmera.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível tirar a foto.");
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Por favor, conceda permissões de galeria.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível escolher a foto.");
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Foto de Perfil",
      "Escolha uma opção",
      [
        {
          text: "Tirar Foto",
          onPress: takePhoto,
        },
        {
          text: "Escolher da Galeria",
          onPress: pickImage,
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ],
      { cancelable: true },
    );
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      // Get signup credentials
      const signupName = await AsyncStorage.getItem("temp_signup_name");
      const signupEmail = await AsyncStorage.getItem("temp_signup_email");
      const signupPassword = await AsyncStorage.getItem("temp_signup_password");

      if (!signupName || !signupEmail || !signupPassword) {
        Alert.alert("Erro", "Dados de registo não encontrados.");
        router.push("/screens/signup-screen");
        return;
      }

      console.log("[ProfilePicture] Creating user profile locally (no backend required)...");
      
      // Create mock auth token for local development
      const mockToken = `local_auth_${signupEmail}_${Date.now()}`;
      await AsyncStorage.setItem("auth_token", mockToken);

      // Clear temporary credentials
      await AsyncStorage.removeItem("temp_signup_name");
      await AsyncStorage.removeItem("temp_signup_email");
      await AsyncStorage.removeItem("temp_signup_password");

      // Create user object
      const passwordHash = CryptoJS.SHA256(signupPassword).toString();
      const userObj = new User({
        name: signupName,
        email: signupEmail,
        password: passwordHash,
        age: parseInt(params.age as string),
        weightKg: parseFloat(params.weight as string),
        heightCm: parseFloat(params.height as string),
        gender: params.gender as Gender,
        activityLevel: params.activityLevel as ActivityLevel,
        motivation: params.goal as MotivationToTrackCalories,
        medicalCondition: MedicalCondition.None,
        targetWeightKg: params.targetWeight
          ? parseFloat(params.targetWeight as string)
          : undefined,
      });

      await saveUser(userObj);
      console.log("[ProfilePicture] User profile saved successfully!");

      // Save profile image locally if selected
      if (profileImage) {
        console.log("[ProfilePicture] Saving profile image locally...");
        await setUserProfileImage(profileImage);
      }

      // Navigate to main app
      console.log("[ProfilePicture] Navigating to home screen...");
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("[ProfilePicture] Error:", error);

      // Check if it's a network error
      if (error.name === "AbortError") {
        Alert.alert(
          "Connection Timeout",
          "The server is taking too long to respond. Please check if the backend server is running and try again.",
          [{ text: "OK" }],
        );
      } else if (
        error.message?.includes("Network") ||
        error.message?.includes("fetch")
      ) {
        Alert.alert(
          "Connection Error",
          "Cannot connect to server. Please make sure the backend is running at " +
            API_BASE_URL,
          [{ text: "OK" }],
        );
      } else {
        Alert.alert(
          "Erro",
          `Não foi possível criar o perfil. ${error.message || ""}`,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    handleFinish();
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
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skipText, { color: secondaryText }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>
          Add your profile picture
        </Text>
        <Text style={[styles.subtitle, { color: secondaryText }]}>
          Help others recognize you
        </Text>

        <TouchableOpacity
          style={[styles.imageContainer, { backgroundColor: cardBg }]}
          onPress={showImageOptions}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderContainer}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: Colors.primary + "20" },
                ]}
              >
                <Ionicons name="camera" size={40} color={Colors.primary} />
              </View>
              <Text style={[styles.placeholderText, { color: secondaryText }]}>
                Tap to add photo
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.finishButton,
            isLoading && styles.finishButtonDisabled,
          ]}
          onPress={handleFinish}
          disabled={isLoading}
        >
          <Text style={styles.finishButtonText}>
            {isLoading ? "Creating profile..." : "Continue"}
          </Text>
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
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: Spacing.xl * 2,
    textAlign: "center",
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  placeholderText: {
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
