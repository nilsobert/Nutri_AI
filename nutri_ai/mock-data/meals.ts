import { MealEntry, MealCategory } from "../types/mealEntry";
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
  new MealEntry(
    MealCategory.Breakfast,
    new MealQuality(1.75, 80, 8),
    new NutritionInfo({
      calories: 350,
      carbs: 50,
      sugar: 10,
      protein: 20,
      fat: 15,
    }),
    undefined,
    undefined,
    "Oatmeal with Berries",
    getTimestampForDaysAgo(0),
  ),
  new MealEntry(
    MealCategory.Lunch,
    new MealQuality(2.5, 70, 7),
    new NutritionInfo({
      calories: 600,
      carbs: 80,
      sugar: 20,
      protein: 40,
      fat: 30,
    }),
    undefined,
    undefined,
    "Chicken Salad with Apple",
    getTimestampForDaysAgo(0),
  ),
  new MealEntry(
    MealCategory.Dinner,
    new MealQuality(2.0, 90, 9),
    new NutritionInfo({
      calories: 800,
      carbs: 100,
      sugar: 15,
      protein: 60,
      fat: 40,
    }),
    undefined,
    undefined,
    "Salmon with Quinoa and Veggies",
    getTimestampForDaysAgo(0),
  ),
  new MealEntry(
    MealCategory.Snack,
    new MealQuality(1.33, 60, 6),
    new NutritionInfo({
      calories: 200,
      carbs: 30,
      sugar: 15,
      protein: 10,
      fat: 8,
    }),
    undefined,
    undefined,
    "Yogurt",
    getTimestampForDaysAgo(0),
  ),

  // Yesterday
  new MealEntry(
    MealCategory.Breakfast,
    new MealQuality(1.5, 75, 7),
    new NutritionInfo({
      calories: 400,
      carbs: 60,
      sugar: 15,
      protein: 15,
      fat: 12,
    }),
    undefined,
    undefined,
    "Pancakes with Syrup",
    getTimestampForDaysAgo(1),
  ),
  new MealEntry(
    MealCategory.Lunch,
    new MealQuality(2.2, 85, 8),
    new NutritionInfo({
      calories: 550,
      carbs: 70,
      sugar: 10,
      protein: 35,
      fat: 25,
    }),
    undefined,
    undefined,
    "Turkey Sandwich",
    getTimestampForDaysAgo(1),
  ),
  new MealEntry(
    MealCategory.Dinner,
    new MealQuality(1.8, 65, 6),
    new NutritionInfo({
      calories: 900,
      carbs: 110,
      sugar: 20,
      protein: 50,
      fat: 45,
    }),
    undefined,
    undefined,
    "Pasta Bolognese",
    getTimestampForDaysAgo(1),
  ),

  // 2 Days Ago
  new MealEntry(
    MealCategory.Breakfast,
    new MealQuality(2.0, 90, 9),
    new NutritionInfo({
      calories: 300,
      carbs: 40,
      sugar: 5,
      protein: 25,
      fat: 10,
    }),
    undefined,
    undefined,
    "Scrambled Eggs and Toast",
    getTimestampForDaysAgo(2),
  ),
  new MealEntry(
    MealCategory.Lunch,
    new MealQuality(2.4, 88, 8),
    new NutritionInfo({
      calories: 500,
      carbs: 60,
      sugar: 8,
      protein: 45,
      fat: 20,
    }),
    undefined,
    undefined,
    "Grilled Chicken Breast",
    getTimestampForDaysAgo(2),
  ),
  new MealEntry(
    MealCategory.Dinner,
    new MealQuality(1.9, 78, 7),
    new NutritionInfo({
      calories: 750,
      carbs: 90,
      sugar: 12,
      protein: 55,
      fat: 35,
    }),
    undefined,
    undefined,
    "Steak and Potatoes",
    getTimestampForDaysAgo(2),
  ),

  // 3 Days Ago
  new MealEntry(
    MealCategory.Breakfast,
    new MealQuality(1.6, 70, 6),
    new NutritionInfo({
      calories: 380,
      carbs: 55,
      sugar: 18,
      protein: 12,
      fat: 14,
    }),
    undefined,
    undefined,
    "Cereal with Milk",
    getTimestampForDaysAgo(3),
  ),
  new MealEntry(
    MealCategory.Lunch,
    new MealQuality(2.1, 82, 8),
    new NutritionInfo({
      calories: 580,
      carbs: 75,
      sugar: 12,
      protein: 38,
      fat: 28,
    }),
    undefined,
    undefined,
    "Tuna Salad Wrap",
    getTimestampForDaysAgo(3),
  ),
  new MealEntry(
    MealCategory.Dinner,
    new MealQuality(2.3, 92, 9),
    new NutritionInfo({
      calories: 650,
      carbs: 50,
      sugar: 5,
      protein: 65,
      fat: 30,
    }),
    undefined,
    undefined,
    "Baked Cod with Asparagus",
    getTimestampForDaysAgo(3),
  ),
];
