import React, { createContext, useContext, useState, useEffect } from "react";
import { StorageService } from "../services/storage";
import { MealEntry } from "../types/mealEntry";

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
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refreshMeals();
  }, []);

  const refreshMeals = async () => {
    setIsLoading(true);
    try {
      const loadedMeals = await StorageService.loadMeals();
      setMeals(loadedMeals);
    } catch (error) {
      console.error("Failed to load meals", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMeal = async (meal: MealEntry) => {
    try {
      await StorageService.addMeal(meal);
      await refreshMeals();
    } catch (error) {
      console.error("Failed to add meal", error);
    }
  };

  const updateMeal = async (meal: MealEntry) => {
    try {
      await StorageService.updateMeal(meal);
      await refreshMeals();
    } catch (error) {
      console.error("Failed to update meal", error);
    }
  };

  const deleteMeal = async (mealId: string) => {
    try {
      await StorageService.deleteMeal(mealId);
      await refreshMeals();
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
