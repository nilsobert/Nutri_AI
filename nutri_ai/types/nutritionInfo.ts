import { validateNonNegative } from "@/lib/utils/validation";

export interface NutritionInfo {
  calories: number;
  carbs: number;
  sugar: number;
  protein: number;
  fat: number;
}
