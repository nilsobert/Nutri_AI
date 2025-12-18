import { MealEntry, MealCategory } from "../types/mealEntry";
import { NutritionInfo } from "../types/nutritionInfo";
import { MealQuality } from "../types/mealQuality";
import { MS_TO_S } from "../constants/values";

const now = Math.floor(Date.now() / MS_TO_S);

export const mockMeals: MealEntry[] = [
  new MealEntry(
    MealCategory.Breakfast,
    new MealQuality(1.8, 82, 7),
    new NutritionInfo({
      calories: 320,
      carbs: 48,
      sugar: 12,
      protein: 18,
      fat: 12,
    }),
    undefined,
    "Oatmeal with Banana",
    now,
  ),
  new MealEntry(
    MealCategory.Lunch,
    new MealQuality(2.2, 88, 6),
    new NutritionInfo({
      calories: 650,
      carbs: 75,
      sugar: 15,
      protein: 35,
      fat: 25,
    }),
    undefined,
    "Grilled Chicken with Rice",
    now,
  ),
  new MealEntry(
    MealCategory.Snack,
    new MealQuality(1.4, 70, 5),
    new NutritionInfo({
      calories: 180,
      carbs: 22,
      sugar: 9,
      protein: 8,
      fat: 6,
    }),
    undefined,
    "Greek Yogurt",
    now,
  ),
  new MealEntry(
    MealCategory.Dinner,
    new MealQuality(2.4, 90, 4),
    new NutritionInfo({
      calories: 780,
      carbs: 65,
      sugar: 11,
      protein: 42,
      fat: 30,
    }),
    undefined,
    "Salmon with Potatoes",
    now,
  ),
];
