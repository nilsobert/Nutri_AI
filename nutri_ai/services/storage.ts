import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system';
import { User, parseUser } from "../types/user";
import { MealEntry, parseMealEntry } from "../types/mealEntry";

const STORAGE_KEYS = {
  USER: "user_data",
  MEALS: "meal_entries",
  PROFILE_IMAGE: "profileImage",
};

export const StorageService = {
  async saveUser(user: User): Promise<void> {
    try {
      const json = JSON.stringify(user);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, json);
    } catch (e) {
      console.error("Failed to save user", e);
      throw e;
    }
  },

  async loadUser(): Promise<User | null> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (!json) return null;
      const data = JSON.parse(json);
      return parseUser(data);
    } catch (e) {
      console.error("Failed to load user", e);
      return null;
    }
  },

  async clearUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    } catch (e) {
      console.error("Failed to clear user", e);
    }
  },

  async saveMeals(meals: MealEntry[]): Promise<void> {
    try {
      const json = JSON.stringify(meals);
      await AsyncStorage.setItem(STORAGE_KEYS.MEALS, json);
    } catch (e) {
      console.error("Failed to save meals", e);
      throw e;
    }
  },

  async loadMeals(): Promise<MealEntry[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.MEALS);
      if (!json) return [];
      const data = JSON.parse(json);
      if (!Array.isArray(data)) return [];
      return data.map((item: any) => parseMealEntry(item));
    } catch (e) {
      console.error("Failed to load meals", e);
      return [];
    }
  },

  async addMeal(meal: MealEntry): Promise<void> {
    const meals = await this.loadMeals();
    meals.push(meal);
    await this.saveMeals(meals);
  },

  async updateMeal(meal: MealEntry): Promise<void> {
    const meals = await this.loadMeals();
    const index = meals.findIndex((m) => m.id === meal.id);
    if (index !== -1) {
      meals[index] = meal;
      await this.saveMeals(meals);
    }
  },

  async deleteMeal(mealId: string): Promise<void> {
    const meals = await this.loadMeals();
    const newMeals = meals.filter((m) => m.id !== mealId);
    await this.saveMeals(newMeals);
  },

  async saveProfileImage(image: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_IMAGE, image);
    } catch (e) {
      console.error("Failed to save profile image", e);
    }
  },

  async loadProfileImage(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE);
    } catch (e) {
      console.error("Failed to load profile image", e);
      return null;
    }
  },

  async removeProfileImage(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_IMAGE);
    } catch (e) {
      console.error("Failed to remove profile image", e);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.MEALS,
        STORAGE_KEYS.PROFILE_IMAGE,
      ]);
    } catch (e) {
      console.error("Failed to clear all data", e);
    }
  },

  async moveFileToPermanentStorage(uri: string): Promise<string> {
    try {
      if (!uri) return uri;
      // If already in document directory, return as is
      // @ts-ignore
      if (FileSystem.documentDirectory && uri.includes(FileSystem.documentDirectory)) return uri;

      const filename = uri.split('/').pop();
      // @ts-ignore
      const newPath = `${FileSystem.documentDirectory}meals/${filename}`;
      
      // Ensure directory exists
      // @ts-ignore
      const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}meals/`);
      if (!dirInfo.exists) {
        // @ts-ignore
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}meals/`, { intermediates: true });
      }

      await FileSystem.moveAsync({
        from: uri,
        to: newPath
      });
      
      return newPath;
    } catch (e) {
      console.error("Failed to move file", e);
      return uri; // Fallback to original URI if move fails
    }
  },
};
