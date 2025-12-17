import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StorageService } from "../services/storage";
import { User } from "../types/user";
import { calculateGoals, NutritionGoals } from "../lib/utils/goals";
import { API_BASE_URL } from "../constants/values";

interface UserContextType {
  profileImage: string | null;
  setProfileImage: (image: string | null) => Promise<void>;
  user: User | null;
  setUser: (user: User | null) => void;
  saveUser: (user: User) => Promise<void>;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  goals: NutritionGoals | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [loadedImage, loadedUser] = await Promise.all([
        StorageService.loadProfileImage(),
        StorageService.loadUser(),
      ]);

      if (loadedImage) {
        setProfileImage(loadedImage);
      }
      if (loadedUser) {
        setUserState(loadedUser);
      }

      // Try to sync with server if we have a token
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        await fetchUser();
      }
    } catch (error) {
      console.error("Failed to load user data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        console.log("[UserContext] No auth token found, skipping fetchUser");
        return;
      }

      console.log("[UserContext] Fetching user profile from server...");
      // Fetch profile
      const profileResponse = await fetch(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(
        `[UserContext] Profile response status: ${profileResponse.status}`,
      );
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log("[UserContext] Profile data received:", profileData);
        const userObj = User.fromJSON(profileData);
        setUserState(userObj);
        await StorageService.saveUser(userObj);
        console.log("[UserContext] Profile saved locally");
      } else {
        console.error(
          `[UserContext] Failed to fetch profile: ${profileResponse.status}`,
        );
      }

      console.log("[UserContext] Fetching profile image from server...");
      // Fetch profile image
      const imageResponse = await fetch(`${API_BASE_URL}/profile/image`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(
        `[UserContext] Image response status: ${imageResponse.status}`,
      );
      if (imageResponse.ok) {
        const blob = await imageResponse.blob();
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          setProfileImage(base64data);
          await StorageService.saveProfileImage(base64data);
          console.log("[UserContext] Profile image saved locally");
        };
        reader.readAsDataURL(blob);
      } else {
        console.log(
          `[UserContext] Profile image not found (${imageResponse.status})`,
        );
      }
    } catch (error) {
      console.error("[UserContext] Error fetching user data:", error);
    }
  };

  const updateProfileImage = async (image: string | null) => {
    setProfileImage(image);
    if (image) {
      console.log("[UserContext] Saving profile image locally...");
      await StorageService.saveProfileImage(image);

      // Upload to server
      try {
        const token = await AsyncStorage.getItem("auth_token");
        if (token) {
          console.log("[UserContext] Uploading profile image to server...");
          const formData = new FormData();
          // @ts-ignore
          formData.append("image", {
            uri: image,
            name: "profile.jpg",
            type: "image/jpeg",
          });

          const response = await fetch(`${API_BASE_URL}/profile/image`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            body: formData,
          });

          console.log(
            `[UserContext] Profile image upload response: ${response.status}`,
          );
          if (!response.ok) {
            console.error(
              "[UserContext] Failed to upload profile image:",
              response.status,
            );
          } else {
            console.log("[UserContext] Profile image uploaded successfully");
          }
        } else {
          console.log("[UserContext] No auth token, skipping server upload");
        }
      } catch (error) {
        console.error("[UserContext] Error uploading profile image:", error);
      }
    } else {
      console.log("[UserContext] Removing profile image...");
      await StorageService.removeProfileImage();
    }
  };

  const saveUser = async (newUser: User) => {
    console.log("[UserContext] Saving user locally...");
    setUserState(newUser);
    await StorageService.saveUser(newUser);

    // Sync with server
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        console.log("[UserContext] Syncing profile with server...");
        const profileData = {
          name: newUser.name,
          age: newUser.age,
          gender: newUser.gender,
          height_cm: newUser.heightCm,
          activity_level: newUser.activityLevel,
          medical_condition: newUser.medicalCondition,
          weight_kg: newUser.weightKg,
          motivation: newUser.motivation,
          target_weight_kg: newUser.targetWeightKg,
          weight_goal_type: newUser.weightGoalType,
          weight_loss_rate: newUser.weightLossRate,
          target_date: newUser.targetDate,
          body_fat_percentage: newUser.bodyFatPercentage,
          protein_preference: newUser.proteinPreference,
          custom_calories: newUser.customCalories,
          custom_protein: newUser.customProtein,
          custom_carbs: newUser.customCarbs,
          custom_fat: newUser.customFat,
          is_custom_goals: newUser.isCustomGoals,
        };
        console.log("[UserContext] Profile data to sync:", profileData);

        const response = await fetch(`${API_BASE_URL}/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        });

        console.log(`[UserContext] Profile sync response: ${response.status}`);
        if (!response.ok) {
          console.error(
            "[UserContext] Failed to sync profile with server:",
            response.status,
          );
          const errorData = await response.json();
          console.error("[UserContext] Error details:", errorData);
        } else {
          console.log("[UserContext] Profile synced with server successfully");
        }
      } else {
        console.log("[UserContext] No auth token, skipping server sync");
      }
    } catch (error) {
      console.error("[UserContext] Error syncing profile with server:", error);
    }
  };

  const logout = async () => {
    setUserState(null);
    setProfileImage(null);
    await StorageService.clearUser();
    await StorageService.removeProfileImage();
    // Optionally clear meals too if they are user-specific and we want to wipe data on logout
    // await StorageService.clearAll();
  };

  const goals = useMemo(() => {
    if (!user) return null;
    return calculateGoals(user);
  }, [user]);

  return (
    <UserContext.Provider
      value={{
        profileImage,
        setProfileImage: updateProfileImage,
        user,
        setUser: setUserState,
        saveUser,
        fetchUser,
        logout,
        isLoading,
        goals,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
