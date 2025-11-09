import { MealEntry, MealCategory } from "../types/mealEntry";
import { NutritionInfo } from "../types/nutritionInfo";
import { MealQuality } from "../types/mealQuality";

export const mockMeals: MealEntry[] = [
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
    "Oatmeal with Berries",
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
    "Chicken Salad with Apple",
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
    "Salmon with Quinoa and Veggies",
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
    "Yogurt",
  ),
];
