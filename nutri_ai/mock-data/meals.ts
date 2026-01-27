import { MealEntry, MealCategory, createMealEntry } from "../types/mealEntry";
import { NutritionInfo } from "../types/nutritionInfo";
import { MealQuality } from "../types/mealQuality";
import { MS_TO_S } from "../constants/values";

const getTimestampForDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return Math.floor(date.getTime() / MS_TO_S);
};

export const mockMeals: MealEntry[] = [
  // Today
  createMealEntry({
    category: MealCategory.Breakfast,
    mealQuality: {
      calorieDensity: 1.75,
      goalFitPercentage: 80,
      mealQualityScore: 8,
    },
    nutritionInfo: {
      calories: 350,
      carbs: 50,
      sugar: 10,
      protein: 20,
      fat: 15,
    },
    transcription: "Oatmeal with Berries",
    timestamp: getTimestampForDaysAgo(0),
  }),
  createMealEntry({
    category: MealCategory.Lunch,
    mealQuality: {
      calorieDensity: 2.5,
      goalFitPercentage: 70,
      mealQualityScore: 7,
    },
    nutritionInfo: {
      calories: 600,
      carbs: 80,
      sugar: 20,
      protein: 40,
      fat: 30,
    },
    transcription: "Chicken Salad with Apple",
    timestamp: getTimestampForDaysAgo(0),
  }),
  createMealEntry({
    category: MealCategory.Dinner,
    mealQuality: {
      calorieDensity: 2.0,
      goalFitPercentage: 90,
      mealQualityScore: 9,
    },
    nutritionInfo: {
      calories: 800,
      carbs: 100,
      sugar: 15,
      protein: 60,
      fat: 40,
    },
    transcription: "Salmon with Quinoa and Veggies",
    timestamp: getTimestampForDaysAgo(0),
  }),
  createMealEntry({
    category: MealCategory.Snack,
    mealQuality: {
      calorieDensity: 1.33,
      goalFitPercentage: 60,
      mealQualityScore: 6,
    },
    nutritionInfo: {
      calories: 200,
      carbs: 30,
      sugar: 15,
      protein: 10,
      fat: 8,
    },
    transcription: "Yogurt",
    timestamp: getTimestampForDaysAgo(0),
  }),

  // Yesterday
  createMealEntry({
    category: MealCategory.Breakfast,
    mealQuality: {
      calorieDensity: 1.5,
      goalFitPercentage: 75,
      mealQualityScore: 7,
    },
    nutritionInfo: {
      calories: 400,
      carbs: 60,
      sugar: 15,
      protein: 15,
      fat: 12,
    },
    transcription: "Pancakes with Syrup",
    timestamp: getTimestampForDaysAgo(1),
  }),
  createMealEntry({
    category: MealCategory.Lunch,
    mealQuality: {
      calorieDensity: 2.2,
      goalFitPercentage: 85,
      mealQualityScore: 8,
    },
    nutritionInfo: {
      calories: 550,
      carbs: 70,
      sugar: 10,
      protein: 35,
      fat: 25,
    },
    transcription: "Turkey Sandwich",
    timestamp: getTimestampForDaysAgo(1),
  }),
  createMealEntry({
    category: MealCategory.Dinner,
    mealQuality: {
      calorieDensity: 1.8,
      goalFitPercentage: 65,
      mealQualityScore: 6,
    },
    nutritionInfo: {
      calories: 900,
      carbs: 110,
      sugar: 20,
      protein: 50,
      fat: 45,
    },
    transcription: "Pasta Bolognese",
    timestamp: getTimestampForDaysAgo(1),
  }),

  // 2 Days Ago
  createMealEntry({
    category: MealCategory.Breakfast,
    mealQuality: {
      calorieDensity: 2.0,
      goalFitPercentage: 90,
      mealQualityScore: 9,
    },
    nutritionInfo: {
      calories: 300,
      carbs: 40,
      sugar: 5,
      protein: 25,
      fat: 10,
    },
    transcription: "Scrambled Eggs and Toast",
    timestamp: getTimestampForDaysAgo(2),
  }),
  createMealEntry({
    category: MealCategory.Lunch,
    mealQuality: {
      calorieDensity: 2.4,
      goalFitPercentage: 88,
      mealQualityScore: 8,
    },
    nutritionInfo: {
      calories: 500,
      carbs: 60,
      sugar: 8,
      protein: 45,
      fat: 20,
    },
    transcription: "Grilled Chicken Breast",
    timestamp: getTimestampForDaysAgo(2),
  }),
  createMealEntry({
    category: MealCategory.Dinner,
    mealQuality: {
      calorieDensity: 1.9,
      goalFitPercentage: 78,
      mealQualityScore: 7,
    },
    nutritionInfo: {
      calories: 750,
      carbs: 90,
      sugar: 12,
      protein: 55,
      fat: 35,
    },
    transcription: "Steak and Potatoes",
    timestamp: getTimestampForDaysAgo(2),
  }),

  // 3 Days Ago
  createMealEntry({
    category: MealCategory.Breakfast,
    mealQuality: {
      calorieDensity: 1.6,
      goalFitPercentage: 70,
      mealQualityScore: 6,
    },
    nutritionInfo: {
      calories: 380,
      carbs: 55,
      sugar: 18,
      protein: 12,
      fat: 14,
    },
    transcription: "Cereal with Milk",
    timestamp: getTimestampForDaysAgo(3),
  }),
  createMealEntry({
    category: MealCategory.Lunch,
    mealQuality: {
      calorieDensity: 2.1,
      goalFitPercentage: 82,
      mealQualityScore: 8,
    },
    nutritionInfo: {
      calories: 580,
      carbs: 75,
      sugar: 12,
      protein: 38,
      fat: 28,
    },
    transcription: "Tuna Salad Wrap",
    timestamp: getTimestampForDaysAgo(3),
  }),
  createMealEntry({
    category: MealCategory.Dinner,
    mealQuality: {
      calorieDensity: 2.3,
      goalFitPercentage: 92,
      mealQualityScore: 9,
    },
    nutritionInfo: {
      calories: 650,
      carbs: 50,
      sugar: 5,
      protein: 65,
      fat: 30,
    },
    transcription: "Baked Cod with Asparagus",
    timestamp: getTimestampForDaysAgo(3),
  }),
];
