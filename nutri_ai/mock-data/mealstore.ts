import { generateYearMeals } from "../lib/utils/generator";
import { MealEntry } from "../types/mealEntry";

let cachedMeals: Record<string, Record<string, MealEntry>> | null = null;

export const getYearMeals = (): Record<string, Record<string, MealEntry>> => {
  if (!cachedMeals) {
    cachedMeals = generateYearMeals();
  }
  return cachedMeals;
};