import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { StorageService } from "../services/storage";
import { QueueService } from "../services/queue";
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

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        processQueue();
      }
    });
    return () => unsubscribe();
  }, []);

  const processQueue = async () => {
    const queue = await QueueService.getQueue();
    if (queue.length === 0) return;

    console.log(`[SyncQueue] Processing queue, length: ${queue.length}`);
    const token = await AsyncStorage.getItem("auth_token");
    if (!token) return;

    for (const item of queue) {
      try {
        console.log(`[SyncQueue] Processing item ${item.id} (${item.type})`);
        if (item.type === 'CREATE_MEAL') {
           await syncMeal(item.payload, token);
        } else if (item.type === 'UPDATE_MEAL') {
           await syncMeal(item.payload, token);
        } else if (item.type === 'DELETE_MEAL') {
           await fetch(`${API_BASE_URL}/meals/${item.payload}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${token}` },
           });
        }
        
        await QueueService.removeFromQueue(item.id);
        console.log(`[SyncQueue] Item ${item.id} processed successfully`);
      } catch (e) {
        console.error(`[SyncQueue] Failed to process item ${item.id}`, e);
        item.retryCount = (item.retryCount || 0) + 1;
        await QueueService.updateItem(item);
      }
    }
  };

  const syncMeal = async (meal: MealEntry, token: string) => {
      let serverImagePath = undefined;
      let serverAudioPath = undefined;

      // Upload image if it's a local file
      if (meal.image && meal.image?.startsWith("file://")) {
        console.log("[SyncQueue] Uploading meal image...");
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
        } else {
            throw new Error(`Image upload failed: ${uploadResponse.status}`);
        }
      } else if (meal.image && !meal.image.startsWith("file://")) {
          // Already a server path or remote URL
          if (meal.image.includes("/static/")) {
              serverImagePath = meal.image.split("/static/")[1];
          } else {
              serverImagePath = meal.image;
          }
      }

      // Upload audio if it's a local file
      if (meal.audio && meal.audio?.startsWith("file://")) {
        console.log("[SyncQueue] Uploading meal audio...");
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
        } else {
            throw new Error(`Audio upload failed: ${uploadResponse.status}`);
        }
      } else if (meal.audio && !meal.audio.startsWith("file://")) {
          if (meal.audio.includes("/static/")) {
              serverAudioPath = meal.audio.split("/static/")[1];
          } else {
              serverAudioPath = meal.audio;
          }
      }

      const mealData = { ...meal };
      if (serverImagePath) mealData.image = serverImagePath;
      if (serverAudioPath) mealData.audio = serverAudioPath;

      console.log("[SyncQueue] Posting meal data...");
      const syncResponse = await fetch(`${API_BASE_URL}/meals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(mealData),
      });
      
      if (!syncResponse.ok) {
        throw new Error(`Meal sync failed: ${syncResponse.status}`);
      }
  };

  const refreshMeals = async () => {
    setIsLoading(true);
    try {
      if (!user) {
        setMeals([]);
        setLastSyncedUserId(null);
        setIsLoading(false);
        return;
      }

      const token = await AsyncStorage.getItem("auth_token");
      const currentUserId = await AsyncStorage.getItem("user_id");

      if (!token || !currentUserId) {
        setMeals([]);
        await StorageService.saveMeals([]);
        setLastSyncedUserId(currentUserId);
        return;
      }

      if (currentUserId !== lastSyncedUserId) {
        setMeals([]);
        await StorageService.saveMeals([]);
        setLastSyncedUserId(currentUserId);
      }

      if (currentUserId === lastSyncedUserId) {
        const loadedMeals = await StorageService.loadMeals();
        setMeals(loadedMeals);
      }

      const response = await fetch(`${API_BASE_URL}/meals`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (response.ok) {
        const serverMealsData = await response.json();
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
      } else if (response.status === 401) {
        setMeals([]);
        await StorageService.saveMeals([]);
      }
    } catch (error) {
      console.error("[MealContext] Failed to load meals", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMeal = async (meal: MealEntry) => {
    try {
      console.log(`[MealContext] Adding meal ${meal.id} (Optimistic)`);
      await StorageService.addMeal(meal);
      setMeals(prev => [...prev, meal]);
      
      await QueueService.addToQueue({
          id: meal.id,
          type: 'CREATE_MEAL',
          payload: meal
      });
      
      const state = await NetInfo.fetch();
      if (state.isConnected) {
          processQueue();
      }
    } catch (error) {
      console.error("[MealContext] Failed to add meal", error);
    }
  };

  const updateMeal = async (meal: MealEntry) => {
    try {
      await StorageService.updateMeal(meal);
      setMeals((prev) => prev.map((m) => (m.id === meal.id ? meal : m)));

      await QueueService.addToQueue({
          id: meal.id,
          type: 'UPDATE_MEAL',
          payload: meal
      });

      const state = await NetInfo.fetch();
      if (state.isConnected) {
          processQueue();
      }
    } catch (error) {
      console.error("Failed to update meal", error);
    }
  };

  const deleteMeal = async (mealId: string) => {
    try {
      await StorageService.deleteMeal(mealId);
      setMeals(prev => prev.filter(m => m.id !== mealId));

      await QueueService.addToQueue({
          id: Math.random().toString(36).substring(7),
          type: 'DELETE_MEAL',
          payload: mealId
      });

      const state = await NetInfo.fetch();
      if (state.isConnected) {
          processQueue();
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
