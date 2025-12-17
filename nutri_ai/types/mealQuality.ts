import log from "@/lib/logger";
import { validateNonNegative } from "@/lib/utils/validation";

export interface MealQuality {
  calorieDensity: number;
  goalFitPercentage: number;
  mealQualityScore: number;
}
