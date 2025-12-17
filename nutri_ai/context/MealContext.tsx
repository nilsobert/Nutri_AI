import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StorageService } from "../services/storage";
import { MealEntry, parseMealEntry } from "../types/mealEntry";
import { API_BASE_URL } from "../constants/values";
import { useUser } from "./UserContext";

interface MealContextType {
  meals: MealEntry[];
  addMeal: (meal: MealEntry) => Promise<void>;
  updateMeal: (meal: MealEntry) => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  refreshMeals: () => Promise<void>;
  isLoading: boolean;
}

const MealContext = createContext<MealContextType | undefined>(undefined);

export function MealProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncedUserId, setLastSyncedUserId] = useState<string | null>(null);

  useEffect(() => {
    refreshMeals();
  }, [user]);

  const refreshMeals = async () => {
    setIsLoading(true);
    try {
      if (!user) {
        console.log("[MealContext] User logged out (context), clearing meals");
        setMeals([]);
        setLastSyncedUserId(null);
        setIsLoading(false);
        return;
      }

      const token = await AsyncStorage.getItem("auth_token");
      const currentUserId = await AsyncStorage.getItem("user_id");

      // No auth => do not show any local cached meals (prevents user-to-user leakage)
      if (!token || !currentUserId) {
        console.log("[MealContext] No auth token or user_id, clearing meals");
        setMeals([]);
        await StorageService.saveMeals([]);
        setLastSyncedUserId(currentUserId);
        return;
      }

      // User changed => immediately clear local meals before doing anything else
      if (currentUserId !== lastSyncedUserId) {
        console.log("[MealContext] User changed, clearing local meals");
        setMeals([]);
        await StorageService.saveMeals([]);
        setLastSyncedUserId(currentUserId);
      }

      // Load from local storage first (only if same user)
      if (currentUserId === lastSyncedUserId) {
        const loadedMeals = await StorageService.loadMeals();
        setMeals(loadedMeals);
      }

      // Sync with server
      console.log("[MealContext] Fetching meals from server...");
      const response = await fetch(`${API_BASE_URL}/meals`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      console.log(`[MealContext] Meals fetch response: ${response.status}`);
      if (response.ok) {
        const serverMealsData = await response.json();
        console.log(`[MealContext] Received ${serverMealsData.length} meals from server`);
        const serverMeals = serverMealsData.map((m: any) => {
          const imageUrl = m.image ? `${API_BASE_URL}/static/${m.image}` : undefined;
          const audioUrl = m.audio ? `${API_BASE_URL}/static/${m.audio}` : undefined;
          return parseMealEntry({
            ...m,
            image: imageUrl,
            audio: audioUrl,
          });
        });
        setMeals(serverMeals);
        await StorageService.saveMeals(serverMeals);
        console.log("[MealContext] Meals synced and saved locally");
      } else if (response.status === 401) {
        console.warn("[MealContext] Unauthorized while fetching meals; clearing local meals");
        setMeals([]);
        await StorageService.saveMeals([]);
      } else {
        console.error(`[MealContext] Failed to fetch meals: ${response.status}`);
      }
    } catch (error) {
      console.error("[MealContext] Failed to load meals", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMeal = async (meal: MealEntry) => {
    try {
      console.log(`[MealContext] Adding meal ${meal.id}`);
      const token = await AsyncStorage.getItem("auth_token");
      let serverImagePath = undefined;
      let serverAudioPath = undefined;
      let displayImage = meal.image;
      let displayAudio = meal.audio;

      // Upload image if it's a local file
      if (token && meal.image && meal.image?.startsWith("file://")) {
        console.log("[MealContext] Uploading meal image to server...");
        const formData = new FormData();
        // @ts-ignore
        formData.append("image", {
          uri: meal.image,
          name: "meal.jpg",
          type: "image/jpeg",
        });
        
        const uploadResponse = await fetch(`${API_BASE_URL}/meals/image`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          serverImagePath = data.image_path;
          displayImage = `${API_BASE_URL}/static/${serverImagePath}`;
          console.log(`[MealContext] Image uploaded: ${serverImagePath}`);
        } else {
          console.error(`[MealContext] Image upload failed: ${uploadResponse.status}`);
        }
      }

      // Upload audio if it's a local file
      if (token && meal.audio && meal.audio?.startsWith("file://")) {
        console.log("[MealContext] Uploading meal audio to server...");
        const formData = new FormData();
        // @ts-ignore
        formData.append("audio", {
          uri: meal.audio,
          name: "meal.m4a",
          type: "audio/m4a",
        });

        const uploadResponse = await fetch(`${API_BASE_URL}/meals/audio`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          serverAudioPath = data.audio_path;
          displayAudio = `${API_BASE_URL}/static/${serverAudioPath}`;
          console.log(`[MealContext] Audio uploaded: ${serverAudioPath}`);
        } else {
          console.error(`[MealContext] Audio upload failed: ${uploadResponse.status}`);
        }
      }

      // Update meal with server URLs for local display/storage
      if (displayImage) {
          meal.image = displayImage;
      }
      if (displayAudio) {
          meal.audio = displayAudio;
      }

      // Save to local
      await StorageService.addMeal(meal);
      setMeals(prev => [...prev, meal]);
      console.log("[MealContext] Meal saved locally");

      // Send to server
      if (token) {
        console.log("[MealContext] Syncing meal to server...");
        const mealData = { ...meal };
        // Use relative path for server storage
        if (serverImagePath) {
            mealData.image = serverImagePath;
        } else if (mealData.image && mealData.image.startsWith(API_BASE_URL)) {
            // If it's already a server URL, extract relative path
            mealData.image = mealData.image.replace(`${API_BASE_URL}/static/`, "");
        }
        if (serverAudioPath) {
            mealData.audio = serverAudioPath;
        } else if (mealData.audio && mealData.audio.startsWith(API_BASE_URL)) {
            mealData.audio = mealData.audio.replace(`${API_BASE_URL}/static/`, "");
        }

        const syncResponse = await fetch(`${API_BASE_URL}/meals`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(mealData),
        });
        console.log(`[MealContext] Meal sync response: ${syncResponse.status}`);
        if (!syncResponse.ok) {
          console.error("[MealContext] Failed to sync meal to server");
        } else {
          console.log("[MealContext] Meal synced successfully");
        }
      }
    } catch (error) {
      console.error("[MealContext] Failed to add meal", error);
    }
  };

  const updateMeal = async (meal: MealEntry) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      let serverImagePath = undefined;
      let serverAudioPath = undefined;
      let displayImage = meal.image;
      let displayAudio = meal.audio;

      // Upload image if it's a local file
      if (token && meal.image && meal.image?.startsWith("file://")) {
        const formData = new FormData();
        // @ts-ignore
        formData.append("image", {
          uri: meal.image,
          name: "meal.jpg",
          type: "image/jpeg",
        });

        const uploadResponse = await fetch(`${API_BASE_URL}/meals/image`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          serverImagePath = data.image_path;
          displayImage = `${API_BASE_URL}/static/${serverImagePath}`;
        }
      }

      // Upload audio if it's a local file
      if (token && meal.audio && meal.audio?.startsWith("file://")) {
        const formData = new FormData();
        // @ts-ignore
        formData.append("audio", {
          uri: meal.audio,
          name: "meal.m4a",
          type: "audio/m4a",
        });

        const uploadResponse = await fetch(`${API_BASE_URL}/meals/audio`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          serverAudioPath = data.audio_path;
          displayAudio = `${API_BASE_URL}/static/${serverAudioPath}`;
        }
      }

      if (displayImage) {
        meal.image = displayImage;
      }
      if (displayAudio) {
        meal.audio = displayAudio;
      }

      await StorageService.updateMeal(meal);
      // Update state locally
      setMeals((prev) => prev.map((m) => (m.id === meal.id ? meal : m)));

      if (token) {
        const mealData = { ...meal };
        if (serverImagePath) {
          mealData.image = serverImagePath;
        } else if (mealData.image && mealData.image.startsWith(API_BASE_URL)) {
          mealData.image = mealData.image.replace(`${API_BASE_URL}/static/`, "");
        }
        if (serverAudioPath) {
          mealData.audio = serverAudioPath;
        } else if (mealData.audio && mealData.audio.startsWith(API_BASE_URL)) {
          mealData.audio = mealData.audio.replace(`${API_BASE_URL}/static/`, "");
        }

        await fetch(`${API_BASE_URL}/meals`, {
          method: "POST", // server upserts by ID
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(mealData),
        });
      }
    } catch (error) {
      console.error("Failed to update meal", error);
    }
  };

  const deleteMeal = async (mealId: string) => {
    try {
      await StorageService.deleteMeal(mealId);
      setMeals(prev => prev.filter(m => m.id !== mealId));

      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        await fetch(`${API_BASE_URL}/meals/${mealId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Failed to delete meal", error);
    }
  };

  return (
    <MealContext.Provider
      value={{
        meals,
        addMeal,
        updateMeal,
        deleteMeal,
        refreshMeals,
        isLoading,
      }}
    >
      {children}
    </MealContext.Provider>
  );
}

export function useMeals() {
  const context = useContext(MealContext);
  if (context === undefined) {
    throw new Error("useMeals must be used within a MealProvider");
  }
  return context;
}
