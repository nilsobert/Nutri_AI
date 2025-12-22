import { createMealEntry, MealCategory, type MealEntry } from "../types/mealEntry";
import type { NutritionInfo } from "../types/nutritionInfo";
import type { MealQuality } from "../types/mealQuality";
import { MS_TO_S } from "../constants/values";

const now = Math.floor(Date.now() / MS_TO_S);

export const mockMeals: MealEntry[] = [
  createMealEntry({
    category: MealCategory.Breakfast,
    mealQuality: {
      calorieDensity: 1.8,
      goalFitPercentage: 82,
      mealQualityScore: 7,
    },
    nutritionInfo: {
      calories: 320,
      carbs: 48,
      sugar: 12,
      protein: 18,
      fat: 12,
    },
    name: "Oatmeal with Banana",
    timestamp: now,
  }),
  createMealEntry({
    category: MealCategory.Lunch,
    mealQuality: {
      calorieDensity: 2.2,
      goalFitPercentage: 88,
      mealQualityScore: 6,
    },
    nutritionInfo: {
      calories: 650,
      carbs: 75,
      sugar: 15,
      protein: 35,
      fat: 25,
    },
    name: "Grilled Chicken with Rice",
    timestamp: now,
  }),
  createMealEntry({
    category: MealCategory.Snack,
    mealQuality: {
      calorieDensity: 1.4,
      goalFitPercentage: 70,
      mealQualityScore: 5,
    },
    nutritionInfo: {
      calories: 180,
      carbs: 22,
      sugar: 9,
      protein: 8,
      fat: 6,
    },
    name: "Greek Yogurt",
    timestamp: now,
  }),
  createMealEntry({
    category: MealCategory.Dinner,
    mealQuality: {
      calorieDensity: 2.4,
      goalFitPercentage: 90,
      mealQualityScore: 4,
    },
    nutritionInfo: {
      calories: 780,
      carbs: 65,
      sugar: 11,
      protein: 42,
      fat: 30,
    },
    name: "Salmon with Potatoes",
    timestamp: now,
  }),
];
