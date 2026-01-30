import { generateYearMeals } from "../lib/utils/generator";
import { MealEntry, MealCategory } from "../types/mealEntry";

let cachedMeals: Record<
  string,
  Partial<Record<MealCategory, MealEntry>>
> | null = null;

export const getYearMeals = (): Record<
  string,
  Partial<Record<MealCategory, MealEntry>>
> => {
  if (!cachedMeals) {
    cachedMeals = generateYearMeals();
  }
  return cachedMeals;
};
