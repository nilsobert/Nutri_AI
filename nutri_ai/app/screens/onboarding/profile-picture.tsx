import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
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
import type { User } from "../../../types/user";
import {
  ActivityLevel,
  Gender,
  MedicalCondition,
  MotivationToTrackCalories,
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
  const progressAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1.0,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const secondaryText = isDark ? "#999" : "#666";
  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please grant camera permissions.",
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
      Alert.alert("Error", "Could not take photo.");
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please grant gallery permissions.",
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
      Alert.alert("Error", "Could not choose photo.");
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Profile Picture",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: takePhoto,
        },
        {
          text: "Choose from Gallery",
          onPress: pickImage,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true },
    );
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      // Get signup credentials from params
      const signupName = params.name as string;
      const signupEmail = params.email as string;
      const signupPassword = params.password as string;

      if (!signupName || !signupEmail || !signupPassword) {
        Alert.alert(
          "Signup Information Missing",
          "Please start from the signup screen to create your account.",
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
        activity_level: params.activityLevel as ActivityLevel,
        medical_condition: MedicalCondition.None,
        motivation: params.goal as MotivationToTrackCalories,
      };

      console.log("[ProfilePicture] Sending complete signup...");
      const url = `${API_BASE_URL}/signup`;
      console.log("[ProfilePicture] API URL:", url);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      console.log("[ProfilePicture] Making fetch request...");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("[ProfilePicture] Response status:", response.status);
      const data = await response.json();
      console.log("[ProfilePicture] Response data received");

      if (!response.ok) {
        console.error("[ProfilePicture] Signup failed:", data.detail);
        Alert.alert("Registration Error", data.detail || "An error occurred");
        return;
      }

      console.log("[ProfilePicture] Signup successful!");
      await AsyncStorage.setItem("auth_token", data.access_token);

      // Upload profile image if selected and save it locally
      if (profileImage) {
        console.log("[ProfilePicture] Uploading profile image...");
        try {
          const formData = new FormData();
          // @ts-ignore
          formData.append("image", {
            uri: profileImage,
            name: "profile.jpg",
            type: "image/jpeg",
          });

          const imageResponse = await fetch(`${API_BASE_URL}/profile/image`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
            body: formData,
          });

          if (imageResponse.ok) {
            console.log("[ProfilePicture] Profile image uploaded successfully");
          } else {
            console.error(
              `[ProfilePicture] Failed to upload image: ${imageResponse.status}`,
            );
          }
        } catch (error) {
          console.error(
            "[ProfilePicture] Error uploading profile image:",
            error,
          );
        }
      }

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
        activityLevel: params.activityLevel as ActivityLevel,
        medicalCondition: MedicalCondition.None,
        motivation: params.goal as MotivationToTrackCalories,
      };

      await saveUser(userObj);

      // Save profile image locally if selected
      if (profileImage) {
        console.log("[ProfilePicture] Saving profile image to UserContext...");
        await setUserProfileImage(profileImage);
      }

      // Try to fetch user profile from server (non-blocking)
      console.log("[ProfilePicture] Attempting to sync with server...");
      try {
        await Promise.race([
          fetchUser(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Sync timeout")), 5000),
          ),
        ]);
        console.log("[ProfilePicture] Server sync successful");
      } catch (syncError) {
        console.log(
          "[ProfilePicture] Server sync failed or timed out, continuing anyway:",
          syncError,
        );
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
          "Error",
          `Could not create profile. ${error.message || ""}`,
        );
      }
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
