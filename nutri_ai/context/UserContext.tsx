import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
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
      if (!token) return;

      // Fetch profile
      const profileResponse = await fetch(`${API_BASE_URL}/profile`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const userObj = User.fromJSON(profileData);
        setUserState(userObj);
        await StorageService.saveUser(userObj);
      }

      // Fetch profile image
      const imageResponse = await fetch(`${API_BASE_URL}/profile/image`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (imageResponse.ok) {
        const blob = await imageResponse.blob();
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          setProfileImage(base64data);
          await StorageService.saveProfileImage(base64data);
        };
        reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const updateProfileImage = async (image: string | null) => {
    setProfileImage(image);
    if (image) {
      await StorageService.saveProfileImage(image);
      
      // Upload to server
      try {
        const token = await AsyncStorage.getItem("auth_token");
        if (token) {
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
              "Authorization": `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            body: formData,
          });
          
          if (!response.ok) {
            console.error("Failed to upload profile image:", response.status);
          }
        }
      } catch (error) {
        console.error("Error uploading profile image:", error);
      }
    } else {
      await StorageService.removeProfileImage();
    }
  };

  const saveUser = async (newUser: User) => {
    setUserState(newUser);
    await StorageService.saveUser(newUser);

    // Sync with server
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        const response = await fetch(`${API_BASE_URL}/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
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
          }),
        });
        
        if (!response.ok) {
          console.error("Failed to sync profile with server:", response.status);
        } else {
          console.log("Profile synced with server successfully");
        }
      }
    } catch (error) {
      console.error("Error syncing profile with server:", error);
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
